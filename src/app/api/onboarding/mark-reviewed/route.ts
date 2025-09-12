import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { field } = await request.json()
    
    if (!field || !['brand_reviewed', 'persona_reviewed', 'socials_connected'].includes(field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }

    const supabase = createSupabaseBrowserClient()
    
    // Update the specific field
    const updateData: any = {
      [field]: true,
      updated_at: new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('clerk_user_id', userId)

    if (error) {
      console.error('Error marking field as reviewed:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark reviewed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
