import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'

/**
 * POST /api/personas/retry
 * Re-triggers portrait generation for a stuck persona (status = 'analyzing' with 0 portraits).
 * Also useful after deploying new Inngest functions for the first time.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { personaId } = await request.json()

    // If no personaId, find the most recent stuck persona
    let persona
    if (personaId) {
      const { data, error } = await supabaseAdmin
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .eq('user_id', userId)
        .single()
      if (error || !data) {
        return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
      }
      persona = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('personas')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['analyzing', 'failed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (error || !data) {
        return NextResponse.json({ error: 'No stuck persona found' }, { status: 404 })
      }
      persona = data
    }

    // Get photo URLs from metadata
    const photoUrls = persona.metadata?.photoUrls
    if (!photoUrls || photoUrls.length === 0) {
      return NextResponse.json({ error: 'No photo URLs found in persona metadata' }, { status: 400 })
    }

    // Delete any existing generated portraits (keep user uploads) so we start fresh
    await supabaseAdmin
      .from('persona_images')
      .delete()
      .eq('persona_id', persona.id)
      .eq('metadata->>type', 'reference_portrait')

    // Reset persona status to analyzing
    await supabaseAdmin
      .from('personas')
      .update({
        status: 'analyzing',
        metadata: {
          ...persona.metadata,
          retryTriggered: new Date().toISOString()
        }
      })
      .eq('id', persona.id)

    // Send Inngest event
    await inngest.send({
      name: 'persona/generate.portraits',
      data: {
        personaId: persona.id,
        userId,
        personName: persona.name,
        photoUrls
      }
    })

    console.log(`[Persona:Retry] Re-sent Inngest event for persona ${persona.id}`)

    return NextResponse.json({
      success: true,
      personaId: persona.id,
      message: 'Portrait generation re-triggered via Inngest'
    })

  } catch (error) {
    console.error('[Persona:Retry] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Retry failed' },
      { status: 500 }
    )
  }
}
