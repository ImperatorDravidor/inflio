import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId: requestUserId } = body

    // Verify the user is skipping their own onboarding
    if (userId !== requestUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create or update user profile with onboarding completed
    const supabase = await createSupabaseServerClient()
    
    // First, try to get existing profile
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_completed: true,
          onboarding_skipped: true,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', userId)

      if (error) {
        console.error('Error updating profile:', error)
        // Don't fail the request - allow navigation anyway
      }
    } else {
      // Create new profile with onboarding marked as completed
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          clerk_user_id: userId,
          onboarding_completed: true,
          onboarding_skipped: true,
          onboarding_step: 8, // Mark as final step
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating profile:', error)
        // Don't fail the request - allow navigation anyway
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Skip onboarding error:', error)
    // Return success anyway to allow navigation
    return NextResponse.json({ success: true, warning: 'Failed to save but allowing skip' })
  }
}