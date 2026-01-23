import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('[mark-reviewed] No userId from auth')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { field } = await request.json()
    
    if (!field || !['brand_reviewed', 'persona_reviewed', 'socials_connected'].includes(field)) {
      console.error('[mark-reviewed] Invalid field:', field)
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }

    // Create Supabase client directly with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log(`[mark-reviewed] Setting ${field}=true for user ${userId}`)
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        [field]: true,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', userId)
      .select()

    if (error) {
      console.error('[mark-reviewed] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to update', details: error.message }, { status: 500 })
    }

    console.log(`[mark-reviewed] Successfully set ${field}=true, updated rows:`, data?.length || 0)
    return NextResponse.json({ success: true, updated: data?.length || 0 })
  } catch (error: any) {
    console.error('[mark-reviewed] Exception:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
