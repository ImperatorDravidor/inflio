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

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file || !fileName) {
      return NextResponse.json({ error: 'Missing file or fileName' }, { status: 400 });
    }

    // Log received data for debugging
    console.log('Upload API Debug:', {
      fileName: fileName,
      fileType: file.type,
      fileSize: file.size,
      fileNameLength: fileName.length,
      fileNamePattern: /^[\w\d\-_.]+$/.test(fileName) ? 'valid' : 'invalid'
    });

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createSupabaseServerClient();

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the file path is valid for Supabase
    // Supabase expects paths without leading slashes and with proper formatting
    const storagePath = fileName.replace(/^\/+/, ''); // Remove any leading slashes
    
    console.log('Supabase upload attempt:', {
      bucket: 'videos',
      path: storagePath,
      contentType: file.type || 'video/mp4'
    });

    // Upload to Supabase storage using service role
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(storagePath, buffer, {
        contentType: file.type || 'video/mp4',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ 
        error: uploadError.message || 'Upload failed',
        details: uploadError 
      }, { status: 500 });
    }

    // Get public URL using the same path we uploaded to
    const { data: publicUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(uploadData.path);

    return NextResponse.json({ 
      success: true,
      path: uploadData.path,
      url: publicUrlData.publicUrl 
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2gb',
    },
  },
};