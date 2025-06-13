// Video storage utility that handles large video files
// Uses a tiered approach: sessionStorage for smaller files, IndexedDB for larger ones

const DB_NAME = 'inflio-videos'
const DB_VERSION = 1
const STORE_NAME = 'videos'

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

// Store video data
export const storeVideo = async (videoId: string, file: File): Promise<boolean> => {
  try {
    // For smaller files (< 5MB), try sessionStorage first
    if (file.size < 5 * 1024 * 1024) {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      
      try {
        sessionStorage.setItem(`video_file_${videoId}`, dataUrl)
        return true
      } catch {
        console.warn('SessionStorage failed, falling back to IndexedDB')
      }
    }
    
    // For larger files or if sessionStorage fails, use IndexedDB
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    const videoData = {
      id: videoId,
      file: file,
      timestamp: Date.now()
    }
    
    return new Promise((resolve, reject) => {
      const request = store.put(videoData)
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to store video:', error)
    return false
  }
}

// Retrieve video data
export const retrieveVideo = async (videoId: string): Promise<string | null> => {
  try {
    // Try sessionStorage first
    const sessionData = sessionStorage.getItem(`video_file_${videoId}`)
    if (sessionData) {
      return sessionData
    }
    
    // Try IndexedDB
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    
    return new Promise((resolve) => {
      const request = store.get(videoId)
      request.onsuccess = async () => {
        const result = request.result
        if (result && result.file) {
          // Convert File to data URL
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => resolve(null)
          reader.readAsDataURL(result.file)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => resolve(null)
    })
  } catch (error) {
    console.error('Failed to retrieve video:', error)
    return null
  }
}

// Delete video data
export const deleteVideo = async (videoId: string): Promise<void> => {
  try {
    // Remove from sessionStorage
    sessionStorage.removeItem(`video_file_${videoId}`)
    
    // Remove from IndexedDB
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.delete(videoId)
  } catch (error) {
    console.error('Failed to delete video:', error)
  }
}

// Clean up old videos (optional, to prevent storage bloat)
export const cleanupOldVideos = async (maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> => {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    const request = store.getAll()
    request.onsuccess = () => {
      const videos = request.result
      const now = Date.now()
      
      videos.forEach((video) => {
        if (now - video.timestamp > maxAgeMs) {
          store.delete(video.id)
        }
      })
    }
  } catch (error) {
    console.error('Failed to cleanup old videos:', error)
  }
} 