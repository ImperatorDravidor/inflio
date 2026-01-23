import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Authenticate with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the file name from request
    const { fileName } = await request.json();
    
    if (!fileName) {
      return NextResponse.json({ error: 'Missing fileName' }, { status: 400 });
    }

    // Create Supabase client with service role
    const supabase = createSupabaseServerClient();

    // Generate a signed upload URL
    const { data, error } = await supabase.storage
      .from('videos')
      .createSignedUploadUrl(fileName);

    if (error) {
      console.error('Failed to create signed URL:', error);
      return NextResponse.json({
        error: 'Failed to create upload URL',
        details: error.message
      }, { status: 500 });
    }

    console.log('[Upload URL] Created signed URL for:', fileName);

    // Return the signed URL and path
    return NextResponse.json({
      uploadUrl: data.signedUrl,
      path: data.path,
      token: data.token
    });

  } catch (error) {
    console.error('Get upload URL error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}