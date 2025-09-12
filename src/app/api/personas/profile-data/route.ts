import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's default persona
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('default_persona_id')
      .eq('clerk_user_id', userId)
      .single()

    if (profileError || !profile?.default_persona_id) {
      return NextResponse.json({ persona: null })
    }

    // Get persona with all details
    const { data: persona, error: personaError } = await supabaseAdmin
      .from('personas')
      .select('*')
      .eq('id', profile.default_persona_id)
      .single()

    if (personaError || !persona) {
      return NextResponse.json({ persona: null })
    }

    // Get persona images count
    const { count: imageCount } = await supabaseAdmin
      .from('persona_images')
      .select('id', { count: 'exact', head: true })
      .eq('persona_id', persona.id)

    // Enhance metadata
    const enhancedPersona = {
      ...persona,
      metadata: {
        ...persona.metadata,
        photo_count: imageCount || persona.metadata?.photo_count || 0,
        sample_images: persona.metadata?.sample_images || persona.sample_images || []
      }
    }

    return NextResponse.json({
      persona: enhancedPersona,
      retrainStatus: {
        canRetrain: (persona.retrain_count || 0) < 3,
        remainingAttempts: 3 - (persona.retrain_count || 0),
        lastRetrainedAt: persona.last_retrained_at
      }
    })
  } catch (error) {
    console.error('Error fetching persona profile data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}