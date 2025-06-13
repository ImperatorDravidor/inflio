import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload MP4, MOV, AVI, or WebM files.' },
        { status: 400 }
      )
    }

    // Validate file size (2GB limit)
    const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2GB.' },
        { status: 400 }
      )
    }
    
    // Extract basic file metadata
    const metadata = {
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      format: file.type.split('/')[1].toUpperCase(),
      resolution: 'Unknown', // Will be extracted on client side
      duration: '0:00', // Will be extracted on client side
    }

    // In a real implementation, you would:
    // 1. Save the file to cloud storage (S3, Cloudinary, etc.)
    // 2. Extract actual video metadata (duration, resolution, codec, etc.)
    // 3. Store the metadata in your preferred database

    // For demo purposes, we return the metadata
    // The actual video file will be handled on the client side
    return NextResponse.json({
      id: `video_${Date.now()}`, // Generate a temporary ID
      ...metadata,
      message: 'Video uploaded successfully',
      // In production, this would include a cloud storage URL
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 