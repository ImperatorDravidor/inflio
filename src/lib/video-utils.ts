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
  if (!seconds || seconds < 0 || isNaN(seconds)) return '0:00'
  
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

// Store thumbnail in memory cache (temporary storage)
// In production, thumbnails are stored in Supabase Storage
const thumbnailCache = new Map<string, string>()

export const storeThumbnail = (videoId: string, thumbnail: string): void => {
  try {
    // Use in-memory cache instead of localStorage
    // This is temporary storage - actual thumbnails are saved to Supabase
    thumbnailCache.set(`thumbnail_${videoId}`, thumbnail)
  } catch (error) {
    console.warn('Failed to store thumbnail:', error)
  }
}

// Retrieve thumbnail from memory cache
export const retrieveThumbnail = (videoId: string): string | null => {
  try {
    // Check memory cache first
    return thumbnailCache.get(`thumbnail_${videoId}`) || null
  } catch (error) {
    console.warn('Failed to retrieve thumbnail:', error)
    return null
  }
} 

// Generate thumbnail from video URL
export const generateVideoThumbnailFromUrl = async (
  videoUrl: string,
  seekTo: number = 1
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

      // Set crossOrigin to handle CORS
      video.crossOrigin = 'anonymous'

      video.addEventListener('loadedmetadata', () => {
        // Set canvas dimensions for HD thumbnail
        canvas.width = 1280
        canvas.height = 720
        
        // Seek to specific time for thumbnail (avoid black frames at start)
        const targetTime = Math.min(seekTo, video.duration * 0.1)
        video.currentTime = targetTime
      })

      video.addEventListener('seeked', () => {
        try {
          // Draw video frame to canvas with proper scaling
          const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight)
          const x = (canvas.width - video.videoWidth * scale) / 2
          const y = (canvas.height - video.videoHeight * scale) / 2
          
          context.fillStyle = '#000'
          context.fillRect(0, 0, canvas.width, canvas.height)
          context.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale)
          
          // Convert to data URL with high quality
          const thumbnail = canvas.toDataURL('image/jpeg', 0.95)
          
          // Cleanup
          video.src = ''
          resolve(thumbnail)
        } catch (error) {
          reject(error)
        }
      })

      video.addEventListener('error', (e) => {
        reject(new Error(`Failed to load video: ${e}`))
      })

      // Set video source
      video.src = videoUrl
      video.load()
    } catch (error) {
      reject(error)
    }
  })
}

// Extract multiple video frames for thumbnail selection
export const extractVideoFrames = async (
  videoUrl: string,
  frameCount: number = 6
): Promise<{ time: number; dataUrl: string }[]> => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (!context) {
        reject(new Error('Could not get canvas context'))
        return
      }

      video.crossOrigin = 'anonymous'
      const frames: { time: number; dataUrl: string }[] = []

      video.addEventListener('loadedmetadata', async () => {
        // Set canvas dimensions
        canvas.width = 640 // Smaller size for frame selection
        canvas.height = 360
        
        const duration = video.duration
        const interval = duration / (frameCount + 1) // Avoid start and end
        
        for (let i = 1; i <= frameCount; i++) {
          const time = interval * i
          
          try {
            const frame = await extractFrameAtTime(video, canvas, context, time)
            frames.push({ time, dataUrl: frame })
          } catch (error) {
            console.warn(`Failed to extract frame at ${time}:`, error)
          }
        }
        
        // Cleanup
        video.src = ''
        resolve(frames)
      })

      video.addEventListener('error', (e) => {
        reject(new Error(`Failed to load video: ${e}`))
      })

      video.src = videoUrl
      video.load()
    } catch (error) {
      reject(error)
    }
  })
}

// Helper function to extract a single frame
async function extractFrameAtTime(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  time: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const seekHandler = () => {
      try {
        // Draw frame to canvas
        const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight)
        const x = (canvas.width - video.videoWidth * scale) / 2
        const y = (canvas.height - video.videoHeight * scale) / 2
        
        context.fillStyle = '#000'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale)
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        video.removeEventListener('seeked', seekHandler)
        resolve(dataUrl)
      } catch (error) {
        reject(error)
      }
    }
    
    video.addEventListener('seeked', seekHandler)
    video.currentTime = time
  })
} 
