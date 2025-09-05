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

      // Set crossOrigin to handle CORS issues
      video.crossOrigin = 'anonymous'
      video.muted = true // Ensure video can be loaded without user interaction
      video.playsInline = true
      
      let hasResolved = false
      const timeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true
          console.warn('Thumbnail generation timed out, returning black frame')
          // Return a black canvas as fallback
          canvas.width = 1920
          canvas.height = 1080
          context.fillStyle = '#000000'
          context.fillRect(0, 0, canvas.width, canvas.height)
          const fallbackThumbnail = canvas.toDataURL('image/jpeg', 0.8)
          resolve(fallbackThumbnail)
        }
      }, 10000) // 10 second timeout

      video.addEventListener('loadedmetadata', () => {
        // Set canvas dimensions
        canvas.width = video.videoWidth || 1920
        canvas.height = video.videoHeight || 1080
        
        // Seek to specific time for thumbnail
        const targetTime = Math.min(seekTo, video.duration * 0.25)
        video.currentTime = targetTime > 0 ? targetTime : 0
      })

      video.addEventListener('seeked', () => {
        if (hasResolved) return
        
        try {
          // Draw video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Check if the canvas is actually painted (not black)
          const imageData = context.getImageData(0, 0, 1, 1).data
          const isBlack = imageData[0] === 0 && imageData[1] === 0 && imageData[2] === 0
          
          if (isBlack && video.currentTime > 0) {
            // Try seeking to a different time
            video.currentTime = 0
            return
          }
          
          // Convert to data URL
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
          
          hasResolved = true
          clearTimeout(timeout)
          
          // Cleanup
          URL.revokeObjectURL(video.src)
          video.src = ''
          resolve(thumbnail)
        } catch (error) {
          console.error('Error drawing video frame:', error)
          if (!hasResolved) {
            hasResolved = true
            clearTimeout(timeout)
            reject(error)
          }
        }
      })

      video.addEventListener('error', (e) => {
        if (!hasResolved) {
          hasResolved = true
          clearTimeout(timeout)
          console.error('Video error:', e)
          reject(new Error('Failed to load video for thumbnail generation'))
        }
      })

      // Create blob URL and set as source
      const videoUrl = URL.createObjectURL(file)
      video.src = videoUrl
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
      
      // Set crossOrigin to handle CORS issues
      video.crossOrigin = 'anonymous'
      video.muted = true
      video.playsInline = true
      
      const videoUrl = URL.createObjectURL(file)
      
      video.addEventListener('loadedmetadata', () => {
        const metadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080,
          fileSize: file.size,
          format: file.type,
          fileName: file.name
        }
        
        // Cleanup
        URL.revokeObjectURL(videoUrl)
        video.src = ''
        resolve(metadata)
      })

      video.addEventListener('error', (e) => {
        URL.revokeObjectURL(videoUrl)
        console.error('Video metadata error:', e)
        reject(new Error('Failed to extract video metadata'))
      })

      video.src = videoUrl
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

// Alternative thumbnail generation method using MediaStream API
export const generateVideoThumbnailAlternative = async (
  file: File
): Promise<string | null> => {
  try {
    // If the main method fails, try using a simple approach with the first frame
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    
    if (!context) {
      return null
    }

    return new Promise<string | null>((resolve) => {
      let resolved = false
      
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          // Return a placeholder image instead of null
          canvas.width = 1920
          canvas.height = 1080
          
          // Create a gradient placeholder
          const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
          gradient.addColorStop(0, '#1e293b')
          gradient.addColorStop(1, '#334155')
          context.fillStyle = gradient
          context.fillRect(0, 0, canvas.width, canvas.height)
          
          // Add text
          context.fillStyle = '#94a3b8'
          context.font = '48px system-ui, -apple-system, sans-serif'
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillText('Video Preview', canvas.width / 2, canvas.height / 2)
          
          const placeholder = canvas.toDataURL('image/jpeg', 0.9)
          resolve(placeholder)
        }
      }, 5000)

      video.onloadeddata = () => {
        if (!resolved) {
          try {
            canvas.width = video.videoWidth || 1920
            canvas.height = video.videoHeight || 1080
            
            // Try to draw the current frame
            context.drawImage(video, 0, 0, canvas.width, canvas.height)
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
            resolved = true
            clearTimeout(timeout)
            
            // Clean up
            URL.revokeObjectURL(video.src)
            video.src = ''
            
            resolve(dataUrl)
          } catch (e) {
            console.warn('Alternative thumbnail generation failed:', e)
            // Let timeout handle fallback
          }
        }
      }

      video.onerror = () => {
        // Let timeout handle fallback
      }

      // Don't set crossOrigin for blob URLs
      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      video.src = URL.createObjectURL(file)
    })
  } catch (error) {
    console.error('Alternative thumbnail generation error:', error)
    return null
  }
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

// Generate thumbnail from video URL with proper CORS handling
export const generateVideoThumbnailFromUrl = async (
  videoUrl: string,
  seekTo: number = 1
): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d', { willReadFrequently: true })
      
      if (!context) {
        console.warn('Could not get canvas context, returning placeholder')
        resolve(createPlaceholderThumbnail())
        return
      }

      // Set canvas dimensions for HD thumbnail
      canvas.width = 1920
      canvas.height = 1080
      
      let hasResolved = false
      
      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true
          console.warn('Thumbnail generation timed out, using placeholder')
          resolve(createPlaceholderThumbnail())
        }
      }, 8000) // 8 second timeout

      // Try with CORS first for external URLs
      if (videoUrl.startsWith('http') && !videoUrl.includes('blob:')) {
        video.crossOrigin = 'anonymous'
      }
      
      video.muted = true
      video.playsInline = true
      video.preload = 'metadata'

      video.addEventListener('loadedmetadata', () => {
        if (hasResolved) return
        
        // Seek to specific time for thumbnail (avoid black frames at start)
        const targetTime = Math.min(seekTo, video.duration * 0.1)
        video.currentTime = targetTime > 0 ? targetTime : 0
      })

      video.addEventListener('seeked', () => {
        if (hasResolved) return
        
        try {
          // Draw video frame to canvas with proper scaling
          const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight)
          const x = (canvas.width - video.videoWidth * scale) / 2
          const y = (canvas.height - video.videoHeight * scale) / 2
          
          // Clear canvas first
          context.fillStyle = '#0f172a'
          context.fillRect(0, 0, canvas.width, canvas.height)
          
          // Draw video frame
          context.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale)
          
          // Check if image was drawn successfully (not all black)
          const imageData = context.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data
          const isBlack = imageData[0] < 10 && imageData[1] < 10 && imageData[2] < 10
          
          if (isBlack && video.currentTime > 0.1) {
            // Try at beginning if current frame is black
            video.currentTime = 0
            return
          }
          
          // Convert to data URL with high quality
          const thumbnail = canvas.toDataURL('image/jpeg', 0.9)
          
          hasResolved = true
          clearTimeout(timeout)
          
          // Cleanup
          video.src = ''
          resolve(thumbnail)
        } catch (error) {
          console.error('Error drawing video frame:', error)
          if (!hasResolved) {
            hasResolved = true
            clearTimeout(timeout)
            resolve(createPlaceholderThumbnail())
          }
        }
      })

      video.addEventListener('error', (e) => {
        if (!hasResolved) {
          hasResolved = true
          clearTimeout(timeout)
          console.warn('Video loading error, using placeholder:', e)
          resolve(createPlaceholderThumbnail())
        }
      })

      // Set video source
      video.src = videoUrl
      video.load()
    } catch (error) {
      console.error('Thumbnail generation error:', error)
      resolve(createPlaceholderThumbnail())
    }
  })
}

// Create a visually appealing placeholder thumbnail
export const createPlaceholderThumbnail = (): string => {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    if (!context) {
      return ''
    }
    
    canvas.width = 1920
    canvas.height = 1080
    
    // Create gradient background
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#1e40af') // blue-800
    gradient.addColorStop(0.5, '#7c3aed') // violet-600  
    gradient.addColorStop(1, '#db2777') // pink-600
    
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add subtle pattern overlay
    context.globalAlpha = 0.1
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 12; j++) {
        const x = i * 100
        const y = j * 100
        context.fillStyle = '#ffffff'
        context.beginPath()
        context.arc(x, y, 30, 0, Math.PI * 2)
        context.fill()
      }
    }
    
    context.globalAlpha = 1
    
    // Add play icon in center
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = 80
    
    // Circle background for play button
    context.fillStyle = 'rgba(255, 255, 255, 0.95)'
    context.beginPath()
    context.arc(centerX, centerY, radius, 0, Math.PI * 2)
    context.fill()
    
    // Play triangle
    context.fillStyle = '#1e293b'
    context.beginPath()
    context.moveTo(centerX - 25, centerY - 35)
    context.lineTo(centerX - 25, centerY + 35)
    context.lineTo(centerX + 35, centerY)
    context.closePath()
    context.fill()
    
    // Add text
    context.fillStyle = 'rgba(255, 255, 255, 0.9)'
    context.font = 'bold 48px system-ui, -apple-system, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText('Video Content', centerX, centerY + 180)
    
    context.font = '32px system-ui, -apple-system, sans-serif'
    context.fillStyle = 'rgba(255, 255, 255, 0.7)'
    context.fillText('Click to play', centerX, centerY + 240)
    
    return canvas.toDataURL('image/jpeg', 0.9)
  } catch (error) {
    console.error('Failed to create placeholder:', error)
    return ''
  }
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
