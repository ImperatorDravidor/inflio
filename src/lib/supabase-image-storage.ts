import { supabaseAdmin } from './supabase/admin'

export class SupabaseImageStorage {
  private static BUCKET_NAME = 'ai-generated-images'

  /**
   * Initialize the storage bucket if it doesn't exist
   */
  static async initializeBucket() {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    
    const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME)
    
    if (!bucketExists) {
      const { error } = await supabaseAdmin.storage.createBucket(this.BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
      })
      
      if (error) {
        console.error('Error creating bucket:', error)
        throw error
      }
    }
  }

  /**
   * Upload base64 image to Supabase Storage
   */
  static async uploadImage(
    base64Data: string,
    projectId: string,
    imageId: string,
    format: string = 'png'
  ): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '')
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64, 'base64')
      
      // Create file path
      const filePath = `${projectId}/${imageId}.${format}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: `image/${format}`,
          upsert: true
        })
      
      if (error) {
        console.error('Upload error:', error)
        throw error
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath)
      
      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  /**
   * Delete image from storage
   */
  static async deleteImage(projectId: string, imageId: string, format: string = 'png'): Promise<void> {
    const filePath = `${projectId}/${imageId}.${format}`
    
    const { error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .remove([filePath])
    
    if (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  }

  /**
   * Delete all images for a project
   */
  static async deleteProjectImages(projectId: string): Promise<void> {
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .list(projectId)
    
    if (listError) {
      console.error('Error listing files:', listError)
      throw listError
    }
    
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${projectId}/${file.name}`)
      
      const { error: deleteError } = await supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths)
      
      if (deleteError) {
        console.error('Error deleting files:', deleteError)
        throw deleteError
      }
    }
  }
} 