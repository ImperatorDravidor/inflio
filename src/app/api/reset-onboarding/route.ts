import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[Reset Onboarding] Resetting onboarding for user: ${userId}`)

    // Reset onboarding status for the current user
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        onboarding_completed: false,
        onboarding_step: 1
      })
      .eq('clerk_user_id', userId)
      .select()

    if (error) {
      console.error('Error resetting onboarding:', error)
      return NextResponse.json({ error: 'Failed to reset onboarding' }, { status: 500 })
    }

    console.log(`[Reset Onboarding] Successfully reset onboarding for user: ${userId}`, data)

    return NextResponse.json({ 
      success: true, 
      message: 'Onboarding reset successfully. You will be redirected to onboarding.',
      updatedProfile: data?.[0]
    })
  } catch (error) {
    console.error('Reset onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}