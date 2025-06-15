import { createSupabaseBrowserClient } from './supabase/client'
import { uploadVideoInChunks } from './chunked-uploader'

const supabase = createSupabaseBrowserClient()

// Configure file size limit (default 500MB for production)
const MAX_FILE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '524288000') // 500MB default
const CHUNK_UPLOAD_THRESHOLD = 100 * 1024 * 1024 // 100MB

// Store video data in Supabase Storage
export const storeVideo = async (videoId: string, file: File): Promise<boolean> => {
  try {
    const filePath = `${videoId}/video.${file.name.split('.').pop()}`
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
    
    console.log('Attempting to upload video:', {
      filePath,
      fileSize: file.size,
      fileType: file.type,
      fileSizeMB
    })
    
    // Use chunked upload for very large files
    if (file.size > CHUNK_UPLOAD_THRESHOLD) {
      console.log('File is larger than 100MB, using chunked upload.')
      // The onProgress callback can be used to update the UI
      return await uploadVideoInChunks(supabase, filePath, file, (progress) => {
        console.log(`[Upload Progress] ${progress}%`)
      })
    }

    // Regular upload for smaller files
    const { error } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      })
    
    if (error) {
      console.error('Supabase storage error:', error)
      throw new Error(error.message || 'Failed to upload video to storage')
    }
    
    console.log('Video uploaded successfully')
    return true
  } catch (error) {
    console.error('Failed to store video:', error)
    if (error instanceof Error && error.message.includes('exceeded the maximum allowed size')) {
        const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024))
        throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the ${maxSizeMB}MB limit set in your Supabase project settings. Please upgrade your plan or upload a smaller file.`)
    }
    throw error // Re-throw to handle in the UI
  }
}

// Retrieve video URL from Supabase Storage
export const retrieveVideo = async (videoId: string): Promise<string | null> => {
  try {
    const { data } = await supabase.storage
      .from('videos')
      .list(videoId + '/', { limit: 1, search: 'video.' })
    
    if (!data || data.length === 0) {
      console.warn(`No video file found for videoId: ${videoId}`)
      return null
    }

    const videoFile = data[0]
    const filePath = `${videoId}/${videoFile.name}`
    
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath)
    
    return urlData?.publicUrl || null
  } catch (error) {
    console.error('Failed to retrieve video:', error)
    return null
  }
}

// Delete video data from Supabase Storage
export const deleteVideo = async (videoId: string): Promise<void> => {
    try {
        const { data, error } = await supabase.storage.from('videos').list(videoId + '/')
        if (error) throw error

        if (data && data.length > 0) {
            const filesToRemove = data.map(file => `${videoId}/${file.name}`)
            await supabase.storage.from('videos').remove(filesToRemove)
        }
    } catch (error) {
        console.error('Failed to delete video:', error)
    }
}

// Store thumbnail in Supabase Storage
export const storeThumbnail = async (videoId: string, thumbnailBlob: Blob): Promise<string | null> => {
  try {
    const filePath = `${videoId}/thumbnail.jpg`
    
    const { error } = await supabase.storage
      .from('videos')
      .upload(filePath, thumbnailBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg'
      })
    
    if (error) {
      console.error('Failed to store thumbnail:', error)
      return null
    }
    
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath)
    
    return urlData?.publicUrl || null
  } catch (error) {
    console.error('Failed to store thumbnail:', error)
    return null
  }
}

// Create a signed URL for temporary access (useful for large videos)
export const getSignedVideoUrl = async (videoId: string, expiresIn: number = 3600): Promise<string | null> => {
  try {
    // Try different extensions
    const extensions = ['mp4', 'mov', 'avi', 'webm', '']
    
    for (const ext of extensions) {
      const filePath = ext ? `${videoId}/video.${ext}` : `${videoId}/video`
      
      const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(filePath, expiresIn)
      
      if (!error && data?.signedUrl) {
        return data.signedUrl
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to create signed URL:', error)
    return null
  }
}
