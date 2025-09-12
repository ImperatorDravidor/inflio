/**
 * Fixed thumbnail generation utilities
 * Properly extracts visible frames from videos
 */

/**
 * Generate a thumbnail from a video file
 * Uses a more robust approach to ensure we get a visible frame
 */
export async function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    if (!context) {
      console.error('Failed to get canvas context')
      resolve('')
      return
    }
    
    // Create object URL for the video
    const videoUrl = URL.createObjectURL(file)
    
    // Cleanup function
    const cleanup = () => {
      URL.revokeObjectURL(videoUrl)
      video.remove()
      canvas.remove()
    }
    
    // Timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('Thumbnail generation timed out')
      cleanup()
      resolve('')
    }, 15000)
    
    // Function to capture frame
    const captureFrame = () => {
      try {
        // Set canvas size to match video
        canvas.width = video.videoWidth || 1920
        canvas.height = video.videoHeight || 1080
        
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Get the data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        
        // Check if we got valid data (not empty or too small)
        if (dataUrl && dataUrl.length > 1000) {
          clearTimeout(timeout)
          cleanup()
          console.log('Thumbnail generated successfully')
          resolve(dataUrl)
        } else {
          console.warn('Generated thumbnail was invalid, retrying...')
          // Try again at a different time
          if (video.currentTime < video.duration - 0.5) {
            video.currentTime += 0.5
          } else {
            clearTimeout(timeout)
            cleanup()
            resolve('')
          }
        }
      } catch (error) {
        console.error('Error capturing frame:', error)
        clearTimeout(timeout)
        cleanup()
        resolve('')
      }
    }
    
    // Set up video element
    video.onloadeddata = () => {
      console.log('Video data loaded, duration:', video.duration)
      
      // Try to seek to 1 second in, or 10% of duration if video is short
      if (video.duration > 10) {
        video.currentTime = 1
      } else if (video.duration > 1) {
        video.currentTime = video.duration * 0.1
      } else {
        // Very short video, just capture first frame
        video.currentTime = 0
        setTimeout(captureFrame, 100)
      }
    }
    
    video.onseeked = () => {
      console.log('Seeked to:', video.currentTime)
      // Wait a moment for the frame to be ready
      setTimeout(captureFrame, 200)
    }
    
    video.onerror = (e) => {
      console.error('Video loading error:', e)
      clearTimeout(timeout)
      cleanup()
      resolve('')
    }
    
    // Configure video element
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = videoUrl
    
    // Start loading
    video.load()
  })
}

/**
 * Generate thumbnail from a video URL
 */
export async function generateVideoThumbnailFromUrl(
  videoUrl: string,
  seekTo: number = 1
): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    if (!context) {
      console.error('Failed to get canvas context')
      resolve('')
      return
    }
    
    console.log('generateVideoThumbnailFromUrl: Starting for', videoUrl, 'at', seekTo, 'seconds')
    
    // Cleanup function
    const cleanup = () => {
      video.remove()
      canvas.remove()
    }
    
    // Timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('Thumbnail generation from URL timed out')
      cleanup()
      resolve('')
    }, 15000)
    
    // Function to capture frame
    const captureFrame = () => {
      try {
        // Set canvas size to match video
        canvas.width = video.videoWidth || 1920
        canvas.height = video.videoHeight || 1080
        
        // Clear canvas with black background
        context.fillStyle = '#000000'
        context.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Get the data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        
        // Check if we got valid data
        if (dataUrl && dataUrl.length > 1000) {
          clearTimeout(timeout)
          cleanup()
          console.log('Thumbnail from URL generated successfully')
          resolve(dataUrl)
        } else {
          console.warn('Generated thumbnail was invalid')
          clearTimeout(timeout)
          cleanup()
          resolve('')
        }
      } catch (error) {
        console.error('Error capturing frame from URL:', error)
        clearTimeout(timeout)
        cleanup()
        resolve('')
      }
    }
    
    // Set up video element
    video.onloadedmetadata = () => {
      console.log('Video metadata loaded, duration:', video.duration, 'dimensions:', video.videoWidth, 'x', video.videoHeight)
      
      // Seek to specified time
      if (video.duration > seekTo) {
        video.currentTime = seekTo
      } else if (video.duration > 0) {
        // If video is shorter than seekTo, use 10% of duration
        video.currentTime = video.duration * 0.1
      } else {
        // Fallback to first frame
        video.currentTime = 0
      }
    }
    
    video.onseeked = () => {
      console.log('Seeked to:', video.currentTime)
      // Wait a moment for the frame to be ready
      setTimeout(captureFrame, 200)
    }
    
    // Also try capturing on loadeddata as a fallback
    video.onloadeddata = () => {
      console.log('Video data loaded')
      if (video.duration && video.duration > 0) {
        const targetTime = Math.min(seekTo, video.duration * 0.1)
        video.currentTime = targetTime > 0 ? targetTime : 0
      }
    }
    
    video.onerror = (e) => {
      console.error('Video URL loading error:', e, 'URL:', videoUrl)
      clearTimeout(timeout)
      cleanup()
      resolve('')
    }
    
    // Try without CORS first for Supabase URLs
    const isSupabaseUrl = videoUrl.includes('supabase') || videoUrl.includes('sbpcdn')
    
    // Configure video element
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    
    // Set crossOrigin only for non-Supabase external URLs
    if (videoUrl.startsWith('http') && !videoUrl.includes('blob:') && !isSupabaseUrl) {
      video.crossOrigin = 'anonymous'
    }
    
    video.src = videoUrl
    
    console.log('Loading video from:', videoUrl, 'CORS:', video.crossOrigin)
    
    // Start loading
    video.load()
  })
}
