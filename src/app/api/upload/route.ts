import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { auth } from '@clerk/nextjs/server'

// Disable the default body parser for this route to handle large files
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Handle large file uploads with streaming
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB for non-video files.' },
        { status: 413 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'image'
    const projectId = formData.get('projectId') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Determine storage bucket and validate file type based on upload type
    let bucket = 'videos'
    let validTypes: string[] = []
    
    if (type === 'thumbnail' || type === 'image') {
      bucket = 'videos' // Using same bucket for images
      validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    } else if (type === 'personal-photo') {
      bucket = 'videos' // Using same bucket for personal photos
      validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    } else {
      // Default to image types for other cases
      bucket = 'videos'
      validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    }

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Please upload ${validTypes.join(', ')} files.` },
        { status: 400 }
      )
    }

    // Validate file size based on type
    const maxSize = type === 'thumbnail' || type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024 // 10MB for images, 50MB for others
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.` },
        { status: 400 }
      )
    }
    
    // Generate a unique file name with sanitization
    const sanitizedName = file.name
      .replace(/[｜|]/g, '-')
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    const finalName = sanitizedName || 'file'
    const timestamp = Date.now()
    const fileName = `${type}/${timestamp}-${uuidv4()}-${finalName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      throw new Error(`Storage error: ${uploadError.message}`)
    }

    // Get the public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    const publicUrl = publicUrlData.publicUrl

    // Return response based on type
    return NextResponse.json({
      id: `${type}_${timestamp}`,
      url: publicUrl,
      type,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      message: `${type} uploaded successfully`,
    })
  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
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
