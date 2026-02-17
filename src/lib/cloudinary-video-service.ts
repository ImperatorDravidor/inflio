import { v2 as cloudinary } from 'cloudinary'

/**
 * Cloudinary Video Service for uploading videos for Submagic processing
 */
export class CloudinaryVideoService {
  private static initialized = false

  private static init() {
    if (this.initialized) return

    const cloudinaryUrl = process.env.CLOUDINARY_URL
    if (!cloudinaryUrl) {
      throw new Error('CLOUDINARY_URL not configured')
    }

    // Cloudinary SDK auto-configures from CLOUDINARY_URL
    this.initialized = true
  }

  /**
   * Upload video to Cloudinary and return public URL
   * @param videoUrl - Supabase storage URL to fetch video from
   * @param filename - Name for the file (without extension)
   * @returns Public Cloudinary URL for the video
   */
  static async uploadVideo(videoUrl: string, filename: string): Promise<string> {
    this.init()

    console.log('[Cloudinary] Fetching video from Supabase:', videoUrl)

    try {
      // Upload video from URL to Cloudinary
      const result = await cloudinary.uploader.upload(videoUrl, {
        resource_type: 'video',
        public_id: `inflio-clips/${filename}`,
        overwrite: true,
        folder: 'inflio-clips',
        // Optimization settings
        eager: [
          { format: 'mp4', quality: 'auto' }
        ],
        // Ensure we get a public URL
        type: 'upload',
      })

      console.log('[Cloudinary] Video uploaded successfully')
      console.log('[Cloudinary] Public URL:', result.secure_url)
      console.log('[Cloudinary] Asset ID:', result.public_id)

      return result.secure_url
    } catch (error) {
      console.error('[Cloudinary] Upload failed:', error)
      throw error
    }
  }

  /**
   * Delete a video from Cloudinary (cleanup after processing)
   * @param publicId - Cloudinary public ID
   */
  static async deleteVideo(publicId: string): Promise<void> {
    this.init()

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' })
      console.log('[Cloudinary] Video deleted:', publicId)
    } catch (error) {
      console.error('[Cloudinary] Failed to delete video:', error)
      // Don't throw - cleanup is non-critical
    }
  }
}
