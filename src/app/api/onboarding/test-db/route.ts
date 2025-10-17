import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseBrowserClient()
    
    // Test 1: Check if user_profiles table exists
    const { data: tables, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(0)
    
    if (tableError) {
      return NextResponse.json({
        error: 'Table check failed',
        details: {
          code: tableError.code,
          message: tableError.message,
          hint: tableError.hint
        }
      }, { status: 500 })
    }
    
    // Test 2: Check columns exist
    const { data: profile, error: selectError } = await supabase
      .from('user_profiles')
      .select('clerk_user_id, onboarding_completed, brand_reviewed, persona_reviewed, socials_connected, onboarding_skipped, onboarding_reminder_dismissed')
      .eq('clerk_user_id', userId)
      .single()
    
    if (selectError && selectError.code !== 'PGRST116') {
      return NextResponse.json({
        error: 'Column check failed',
        details: {
          code: selectError.code,
          message: selectError.message,
          hint: selectError.hint,
          suggestion: 'Run the migration: supabase db push migrations/add-onboarding-tracking-fields.sql'
        }
      }, { status: 500 })
    }
    
    // Test 3: Try to insert/update
    const testData = {
      clerk_user_id: userId,
      email: 'test@example.com',
      updated_at: new Date().toISOString()
    }
    
    const { error: upsertError } = await supabase
      .from('user_profiles')
      .upsert(testData, {
        onConflict: 'clerk_user_id'
      })
    
    if (upsertError) {
      return NextResponse.json({
        error: 'Upsert test failed',
        details: {
          code: upsertError.code,
          message: upsertError.message,
          hint: upsertError.hint
        }
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database is properly configured',
      profile: profile || 'No profile found (will be created on save)',
      tests: {
        tableExists: true,
        columnsExist: true,
        canWrite: true
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      details: error?.message || error
    }, { status: 500 })
  }
}
