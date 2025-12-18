import { google } from 'googleapis'
import { Readable } from 'stream'

/**
 * Google Drive Service for uploading videos
 * Uses service account authentication for background uploads
 */
export class GoogleDriveService {
  private static drive: any

  private static initDrive() {
    if (this.drive) return this.drive

    const serviceAccountEmail = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!serviceAccountEmail || !privateKey) {
      throw new Error('Google Drive service account credentials not configured')
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    this.drive = google.drive({ version: 'v3', auth })
    return this.drive
  }

  /**
   * Upload video to Google Drive and return shareable link
   * @param videoUrl - Supabase storage URL to fetch video from
   * @param filename - Name for the file in Drive
   * @returns Public shareable link for the video
   */
  static async uploadVideo(videoUrl: string, filename: string): Promise<string> {
    const drive = this.initDrive()
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    if (!folderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID not configured')
    }

    console.log('[Google Drive] Fetching video from Supabase:', videoUrl)

    // Fetch video from Supabase
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch video from Supabase: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const stream = Readable.from(buffer)

    console.log('[Google Drive] Uploading video to Drive...')

    // Upload to Google Drive
    const fileMetadata = {
      name: filename,
      parents: [folderId],
    }

    const media = {
      mimeType: 'video/mp4',
      body: stream,
    }

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    })

    const fileId = file.data.id

    console.log('[Google Drive] Video uploaded, file ID:', fileId)

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    console.log('[Google Drive] File made public')

    // Get direct download link
    const directLink = `https://drive.google.com/uc?export=download&id=${fileId}`

    console.log('[Google Drive] Public link created:', directLink)

    return directLink
  }

  /**
   * Delete a file from Google Drive (cleanup after processing)
   * @param fileId - Google Drive file ID
   */
  static async deleteFile(fileId: string): Promise<void> {
    const drive = this.initDrive()

    try {
      await drive.files.delete({ fileId })
      console.log('[Google Drive] File deleted:', fileId)
    } catch (error) {
      console.error('[Google Drive] Failed to delete file:', error)
      // Don't throw - cleanup is non-critical
    }
  }

  /**
   * Extract file ID from Google Drive link
   */
  static extractFileId(driveLink: string): string | null {
    const match = driveLink.match(/[?&]id=([^&]+)/)
    return match ? match[1] : null
  }
}
