import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { personaId } = await request.json()
    
    if (!personaId) {
      return NextResponse.json({ error: 'Persona ID required' }, { status: 400 })
    }

    // Verify persona belongs to user
    const { data: persona, error: personaError } = await supabaseAdmin
      .from('personas')
      .select('id')
      .eq('id', personaId)
      .eq('user_id', userId)
      .single()

    if (personaError || !persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Update user profile with default persona
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ default_persona_id: personaId })
      .eq('clerk_user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating default persona:', error)
      return NextResponse.json({ error: 'Failed to update default persona' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      defaultPersonaId: personaId,
      profile: data
    })
  } catch (error) {
    console.error('Error in set-default persona:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}