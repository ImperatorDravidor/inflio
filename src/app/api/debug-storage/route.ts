import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Get Clerk auth
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Create Supabase client
    const supabase = await createSupabaseServerClient();
    
    // Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    // Try to list files in videos bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('videos')
      .list();
    
    // Get current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    return NextResponse.json({
      clerkUserId: userId,
      supabaseUser: user,
      supabaseAuthError: authError?.message,
      buckets: buckets,
      bucketsError: bucketsError?.message,
      filesInVideos: files,
      filesError: filesError?.message,
      hasSession: !!session,
      sessionError: sessionError?.message,
      sessionDetails: session ? {
        accessToken: session.access_token ? 'exists' : 'missing',
        expiresAt: session.expires_at,
        user: session.user?.id
      } : null
    }, { status: 200 });
  } catch (error) {
    console.error('Debug storage error:', error);
    return NextResponse.json({ 
      error: 'Internal error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}