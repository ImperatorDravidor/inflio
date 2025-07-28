import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Configure runtime and limits
export const runtime = 'nodejs'; // Use Node.js runtime instead of Edge
export const maxDuration = 300; // 5 minutes timeout

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

    // Check file size before processing
    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 2GB.' 
      }, { status: 413 });
    }

    // Convert file to buffer
    let buffer: Buffer;
    try {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } catch (bufferError) {
      console.error('Buffer conversion error:', bufferError);
      return NextResponse.json({ 
        error: 'Failed to process file. The file may be too large or corrupted.' 
      }, { status: 400 });
    }

    // Ensure the file path is valid for Supabase
    // Supabase expects paths without leading slashes and with proper formatting
    let storagePath = fileName.replace(/^\/+/, ''); // Remove any leading slashes
    
    // Additional validation for production environment
    if (process.env.NODE_ENV === 'production') {
      // Ensure path only contains allowed characters
      storagePath = storagePath.replace(/[^a-zA-Z0-9\-._]/g, '-');
      
      // Ensure no double dots (security)
      storagePath = storagePath.replace(/\.{2,}/g, '.');
      
      // Ensure valid extension
      if (!storagePath.match(/\.(mp4|mov|avi|mkv|webm|mpeg)$/i)) {
        storagePath = storagePath + '.mp4';
      }
    }
    
    console.log('Supabase upload attempt:', {
      bucket: 'videos',
      path: storagePath,
      originalFileName: fileName,
      contentType: file.type || 'video/mp4',
      environment: process.env.NODE_ENV
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
      console.error('Supabase upload error:', {
        message: uploadError.message,
        error: uploadError,
        statusCode: (uploadError as any).statusCode,
        hint: (uploadError as any).hint,
        details: JSON.stringify(uploadError, null, 2)
      });
      
      // Check for specific error patterns
      if (uploadError.message?.includes('pattern')) {
        console.error('Pattern validation error details:', {
          bucket: 'videos',
          attemptedPath: storagePath,
          pathLength: storagePath.length,
          hasSpecialChars: /[^a-zA-Z0-9\-._]/.test(storagePath),
          environment: process.env.NODE_ENV
        });
      }
      
      return NextResponse.json({ 
        error: uploadError.message || 'Upload failed',
        details: uploadError,
        debug: {
          path: storagePath,
          bucket: 'videos',
          contentType: file.type || 'video/mp4'
        }
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

// Note: For App Router, body size limits are handled differently
// The maxDuration export above handles timeouts
// For large file uploads, we rely on streaming through FormData