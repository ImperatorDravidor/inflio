import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get video path from query params
    const { searchParams } = new URL(request.url);
    const videoPath = searchParams.get('path');
    
    if (!videoPath) {
      return NextResponse.json({ error: 'Missing video path' }, { status: 400 });
    }

    // Create Supabase client with service role
    const supabase = createSupabaseServerClient();
    
    // Download the video file from Supabase storage
    const { data, error } = await supabase.storage
      .from('videos')
      .download(videoPath);
    
    if (error) {
      console.error('Error downloading video:', error);
      return NextResponse.json({ error: 'Failed to download video' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Convert blob to array buffer
    const arrayBuffer = await data.arrayBuffer();
    
    // Return the video with appropriate headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Video proxy error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}