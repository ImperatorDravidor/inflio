import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    
    const checks = {
      clerkAuth: {
        authenticated: !!userId,
        userId: userId || 'none',
        email: sessionClaims?.email || 'none'
      },
      environment: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        clerkPublishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        clerkSecret: !!process.env.CLERK_SECRET_KEY
      },
      supabase: {
        canConnect: false,
        profileExists: false,
        error: null as string | null
      }
    }

    // Test Supabase connection
    if (userId) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('clerk_user_id', userId)
          .single()

        checks.supabase.canConnect = true
        checks.supabase.profileExists = !!profile
        
        if (error) {
          checks.supabase.error = error.message
        }
      } catch (supabaseError) {
        checks.supabase.error = supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
      }
    }

    return NextResponse.json(checks, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


