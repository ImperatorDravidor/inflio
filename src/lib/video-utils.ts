// Video utility functions for thumbnail generation and metadata extraction

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fileSize: number
  format: string
  fileName: string
}

// Generate thumbnail from video file
export const generateVideoThumbnail = async (
  file: File, 
  seekTo: number = 5
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (!context) {
        reject(new Error('Could not get canvas context'))
        return
      }

      video.addEventListener('loadedmetadata', () => {
        // Set canvas dimensions
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Seek to specific time for thumbnail
        video.currentTime = Math.min(seekTo, video.duration * 0.25)
      })

      video.addEventListener('seeked', () => {
        try {
          // Draw video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Convert to data URL
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
          
          // Cleanup
          video.src = ''
          resolve(thumbnail)
        } catch (error) {
          reject(error)
        }
      })

      video.addEventListener('error', () => {
        reject(new Error('Failed to load video for thumbnail generation'))
      })

      // Set video source
      video.src = URL.createObjectURL(file)
      video.load()
    } catch (error) {
      reject(error)
    }
  })
}

// Extract video metadata
export const extractVideoMetadata = async (file: File): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video')
      
      video.addEventListener('loadedmetadata', () => {
        const metadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fileSize: file.size,
          format: file.type,
          fileName: file.name
        }
        
        // Cleanup
        video.src = ''
        resolve(metadata)
      })

      video.addEventListener('error', () => {
        reject(new Error('Failed to extract video metadata'))
      })

      video.src = URL.createObjectURL(file)
      video.load()
    } catch (error) {
      reject(error)
    }
  })
}

// Format duration in seconds to MM:SS format
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Generate multiple thumbnails at different time points
export const generateMultipleThumbnails = async (
  file: File, 
  count: number = 3
): Promise<string[]> => {
  const metadata = await extractVideoMetadata(file)
  const thumbnails: string[] = []
  
  for (let i = 0; i < count; i++) {
    const seekTime = (metadata.duration / count) * i + 5 // Add 5s offset
    try {
      const thumbnail = await generateVideoThumbnail(file, seekTime)
      thumbnails.push(thumbnail)
    } catch (error) {
      console.warn(`Failed to generate thumbnail ${i + 1}:`, error)
    }
  }
  
  return thumbnails
}

// Store thumbnail in localStorage with compression
export const storeThumbnail = (videoId: string, thumbnail: string): void => {
  try {
    localStorage.setItem(`thumbnail_${videoId}`, thumbnail)
  } catch (error) {
    console.warn('Failed to store thumbnail:', error)
  }
}

// Retrieve thumbnail from localStorage
export const retrieveThumbnail = (videoId: string): string | null => {
  try {
    return localStorage.getItem(`thumbnail_${videoId}`)
  } catch (error) {
    console.warn('Failed to retrieve thumbnail:', error)
    return null
  }
} 