import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoUrl, duration, projectId } = await request.json()

    if (!videoUrl || !duration || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // In a real implementation, you would:
    // 1. Use FFmpeg to convert video to GIF
    // 2. Upload to Supabase storage
    // 3. Return the GIF URL

    // For now, simulate the process
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Create a mock GIF URL (in production, this would be the actual converted GIF)
    const timestamp = Date.now()
    const gifFileName = `gifs/${projectId}/${timestamp}.gif`
    
    // In production, you'd process the video here:
    // const gifBuffer = await convertVideoToGif(videoUrl, { duration, width: 480 })
    // const { data, error } = await supabase.storage
    //   .from('project-media')
    //   .upload(gifFileName, gifBuffer, { contentType: 'image/gif' })

    // For demo purposes, return a simulated response
    const gifUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/project-media/${gifFileName}`

    return NextResponse.json({
      success: true,
      gifUrl,
      size: Math.floor(duration * 1.5 * 1024 * 1024), // Approximate size in bytes
      dimensions: { width: 480, height: 480 }
    })
  } catch (error) {
    console.error('Error converting to GIF:', error)
    return NextResponse.json(
      { error: 'Failed to convert video to GIF' },
      { status: 500 }
    )
  }
} 