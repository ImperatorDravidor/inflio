import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Valid upload purposes and their bucket/path configurations
const UPLOAD_CONFIGS: Record<string, { bucket: string; pathPrefix: string; maxSizeMB: number; allowedTypes: string[] }> = {
  'brand-material': {
    bucket: 'videos',
    pathPrefix: 'brand-materials',
    maxSizeMB: 25,
    allowedTypes: [
      'application/pdf',
      'image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain', 'text/markdown'
    ]
  },
  'persona-photo': {
    bucket: 'videos',
    pathPrefix: 'persona-photos',
    maxSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  },
  'thumbnail': {
    bucket: 'videos',
    pathPrefix: 'thumbnail',
    maxSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  },
  'image': {
    bucket: 'videos',
    pathPrefix: 'image',
    maxSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { files, purpose } = body as {
      files: Array<{ fileName: string; fileType: string; fileSize: number }>
      purpose: string
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files specified' }, { status: 400 })
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 files per request' }, { status: 400 })
    }

    const config = UPLOAD_CONFIGS[purpose]
    if (!config) {
      return NextResponse.json({ error: `Invalid upload purpose: ${purpose}` }, { status: 400 })
    }

    // Validate all files before generating URLs
    for (const file of files) {
      if (file.fileSize > config.maxSizeMB * 1024 * 1024) {
        return NextResponse.json({
          error: `File "${file.fileName}" exceeds ${config.maxSizeMB}MB limit`
        }, { status: 400 })
      }

      // Allow application/octet-stream as fallback for valid extensions
      if (file.fileType && file.fileType !== 'application/octet-stream' && !config.allowedTypes.includes(file.fileType)) {
        return NextResponse.json({
          error: `File type "${file.fileType}" not allowed for ${purpose} uploads`
        }, { status: 400 })
      }
    }

    // Generate signed upload URLs for each file
    const results = []
    for (const file of files) {
      const ext = file.fileName.split('.').pop()?.toLowerCase() || 'bin'
      const sanitizedName = file.fileName
        .replace(/[^\w\s.-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')

      const storagePath = `${config.pathPrefix}/${userId}/${Date.now()}-${uuidv4()}.${ext}`

      const { data, error } = await supabase.storage
        .from(config.bucket)
        .createSignedUploadUrl(storagePath)

      if (error) {
        console.error(`[Signed URL] Failed for ${file.fileName}:`, error)
        return NextResponse.json({
          error: `Failed to create upload URL for ${file.fileName}`,
          details: error.message
        }, { status: 500 })
      }

      results.push({
        fileName: file.fileName,
        fileType: file.fileType,
        storagePath,
        signedUrl: data.signedUrl,
        token: data.token
      })
    }

    return NextResponse.json({ uploads: results })
  } catch (error) {
    console.error('[Signed URL] Error:', error)
    return NextResponse.json({
      error: 'Failed to generate upload URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
