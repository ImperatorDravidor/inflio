import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    
    // Generate a unique file name
    const fileName = `${uuidv4()}-${file.name}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      throw new Error(`Supabase Storage error: ${uploadError.message}`)
    }

    // Get the public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName)

    const publicUrl = publicUrlData.publicUrl

    // Extract basic file metadata
    const metadata = {
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      format: file.type.split('/')[1].toUpperCase(),
    }

    return NextResponse.json({
      id: `video_${Date.now()}`,
      ...metadata,
      url: publicUrl,
      message: 'Video uploaded successfully',
    })
  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload video'
    return NextResponse.json(
      { error: errorMessage },
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
