/**
 * Simplified video utilities - focused on reliability and consistency
 * Removes unnecessary complexity and provides predictable results
 */

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fileSize: number
  format: string
}

/**
 * Extract video metadata in a simple, reliable way
 */
export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const videoUrl = URL.createObjectURL(file)
    
    const cleanup = () => {
      URL.revokeObjectURL(videoUrl)
      video.remove()
    }
    
    // Set a reasonable timeout
    const timeout = setTimeout(() => {
      cleanup()
      // Return sensible defaults if metadata extraction fails
      resolve({
        duration: 0,
        width: 1920,
        height: 1080,
        fileSize: file.size,
        format: file.type.split('/')[1] || 'mp4'
      })
    }, 5000)
    
    video.onloadedmetadata = () => {
      clearTimeout(timeout)
      const metadata: VideoMetadata = {
        duration: video.duration || 0,
        width: video.videoWidth || 1920,
        height: video.videoHeight || 1080,
        fileSize: file.size,
        format: file.type.split('/')[1] || 'mp4'
      }
      cleanup()
      resolve(metadata)
    }
    
    video.onerror = () => {
      clearTimeout(timeout)
      cleanup()
      // Return defaults on error
      resolve({
        duration: 0,
        width: 1920,
        height: 1080,
        fileSize: file.size,
        format: file.type.split('/')[1] || 'mp4'
      })
    }
    
    video.src = videoUrl
    video.load()
  })
}

/**
 * Generate a single, reliable thumbnail from a video file
 * Focuses on getting ONE good frame, not multiple attempts
 */
export async function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const videoUrl = URL.createObjectURL(file)
    
    if (!context) {
      resolve('')
      return
    }
    
    const cleanup = () => {
      URL.revokeObjectURL(videoUrl)
      video.remove()
      canvas.remove()
    }
    
    // Set a timeout to ensure we don't hang
    const timeout = setTimeout(() => {
      cleanup()
      resolve('') // Return empty string to indicate no thumbnail
    }, 10000)
    
    video.onloadeddata = () => {
      // Video data is loaded, we can now safely seek
      // Set canvas to video dimensions
      canvas.width = video.videoWidth || 1920
      canvas.height = video.videoHeight || 1080
      
      // Seek to 1 second or 10% into the video (whichever is smaller)
      const seekTime = Math.min(1, video.duration * 0.1)
      video.currentTime = seekTime > 0 ? seekTime : 0.5
    }
    
    video.onseeked = () => {
      // Add a small delay to ensure frame is rendered
      setTimeout(() => {
        try {
          // Draw the current frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Check if we actually captured something (not black)
          const imageData = context.getImageData(0, 0, 10, 10)
          const pixels = imageData.data
          let isBlack = true
          
          for (let i = 0; i < pixels.length; i += 4) {
            // Check if any pixel is not black
            if (pixels[i] > 10 || pixels[i + 1] > 10 || pixels[i + 2] > 10) {
              isBlack = false
              break
            }
          }
          
          // If the frame is black, try the first frame instead
          if (isBlack && video.currentTime > 0) {
            video.currentTime = 0
            return
          }
          
          // Convert to JPEG with good quality
          const thumbnail = canvas.toDataURL('image/jpeg', 0.95)
          
          clearTimeout(timeout)
          cleanup()
          resolve(thumbnail)
        } catch (error) {
          console.error('Error generating thumbnail:', error)
          clearTimeout(timeout)
          cleanup()
          resolve('')
        }
      }, 100) // Small delay to ensure frame is ready
    }
    
    video.onerror = () => {
      clearTimeout(timeout)
      cleanup()
      resolve('')
    }
    
    // Video setup - ensure it can play
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    // Don't set crossOrigin for blob URLs
    video.src = videoUrl
    video.load()
  })
}

/**
 * Format duration from seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0 || isNaN(seconds)) return '0:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
