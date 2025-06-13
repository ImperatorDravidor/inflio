import { createSupabaseBrowserClient } from './supabase/client'

// Store video data in Supabase Storage
export const storeVideo = async (videoId: string, file: File): Promise<boolean> => {
  const supabase = createSupabaseBrowserClient()
  try {
    const filePath = `${videoId}/video`
    
    const { error } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (error) {
      console.error('Failed to store video:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Failed to store video:', error)
    return false
  }
}

// Retrieve video URL from Supabase Storage
export const retrieveVideo = async (videoId: string): Promise<string | null> => {
  const supabase = createSupabaseBrowserClient()
  try {
    const filePath = `${videoId}/video`
    
    const { data } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath)
    
    if (!data || !data.publicUrl) {
      return null
    }
    
    return data.publicUrl
  } catch (error) {
    console.error('Failed to retrieve video:', error)
    return null
  }
}

// Delete video data from Supabase Storage
export const deleteVideo = async (videoId: string): Promise<void> => {
  const supabase = createSupabaseBrowserClient()
  try {
    const filePath = `${videoId}/video`
    
    const { error } = await supabase.storage
      .from('videos')
      .remove([filePath])
    
    if (error) {
      console.error('Failed to delete video:', error)
    }
  } catch (error) {
    console.error('Failed to delete video:', error)
  }
}

// Store thumbnail in Supabase Storage
export const storeThumbnail = async (videoId: string, thumbnailBlob: Blob): Promise<string | null> => {
  const supabase = createSupabaseBrowserClient()
  try {
    const filePath = `${videoId}/thumbnail`
    
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
    
    // Get public URL
    const { data } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath)
    
    return data.publicUrl
  } catch (error) {
    console.error('Failed to store thumbnail:', error)
    return null
  }
}

// Create a signed URL for temporary access (useful for large videos)
export const getSignedVideoUrl = async (videoId: string, expiresIn: number = 3600): Promise<string | null> => {
  const supabase = createSupabaseBrowserClient()
  try {
    const filePath = `${videoId}/video`
    
    const { data, error } = await supabase.storage
      .from('videos')
      .createSignedUrl(filePath, expiresIn)
    
    if (error) {
      console.error('Failed to create signed URL:', error)
      return null
    }
    
    return data.signedUrl
  } catch (error) {
    console.error('Failed to create signed URL:', error)
    return null
  }
} 