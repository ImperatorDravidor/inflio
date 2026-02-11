import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'

export const runtime = 'nodejs'

interface CreateFromUrlsRequest {
  name: string
  description?: string
  photoUrls: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateFromUrlsRequest = await request.json()
    const { name, description, photoUrls } = body

    if (!name || !photoUrls || photoUrls.length < 5) {
      return NextResponse.json(
        { error: 'Name and at least 5 photo URLs are required' },
        { status: 400 }
      )
    }

    if (photoUrls.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 photos allowed' },
        { status: 400 }
      )
    }

    console.log(`[Persona] Creating persona for user ${userId} with ${photoUrls.length} photos`)

    // Create persona record with "analyzing" status
    const { data: persona, error: personaError } = await supabaseAdmin
      .from('personas')
      .insert({
        user_id: userId,
        name,
        description: description || 'AI Avatar for content creation',
        status: 'analyzing',
        metadata: {
          photoCount: photoUrls.length,
          photoUrls: photoUrls,
          processingStarted: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (personaError || !persona) {
      console.error('Error creating persona:', personaError)
      return NextResponse.json(
        { error: 'Failed to create persona record' },
        { status: 500 }
      )
    }

    // Save user's original photos to persona_images table
    // This allows the Reference Photos tab to display them
    console.log(`[Persona] Saving ${photoUrls.length} user-uploaded photos to persona_images`)
    const photoRecords = photoUrls.map((url, index) => ({
      persona_id: persona.id,
      user_id: userId,
      image_url: url,
      metadata: {
        type: 'user_upload',
        uploadOrder: index + 1,
        uploadedAt: new Date().toISOString()
      }
    }))

    const { error: photosError } = await supabaseAdmin
      .from('persona_images')
      .insert(photoRecords)

    if (photosError) {
      console.warn('[Persona] Warning: Could not save photo records:', photosError.message)
      // Don't fail - continue with persona creation
    }

    // Send Inngest event to generate portraits in the background
    // Each portrait runs as its own step — no timeout issues even for 10+ minutes
    await inngest.send({
      name: 'persona/generate.portraits',
      data: {
        personaId: persona.id,
        userId,
        personName: name,
        photoUrls
      }
    })

    console.log(`[Persona] Inngest event sent for persona ${persona.id}`)

    // Return immediately with persona in "analyzing" status
    return NextResponse.json({
      success: true,
      persona: {
        id: persona.id,
        name: persona.name,
        status: 'analyzing',
        message: 'Your AI Avatar is being created! This takes a few minutes. You can continue and check back later.'
      }
    })

  } catch (error) {
    console.error('Persona creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create persona',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
