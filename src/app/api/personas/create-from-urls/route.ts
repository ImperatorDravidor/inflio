import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 300

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

    // Kick off background processing (fire-and-forget)
    processPersonaInBackground(persona.id, userId, name, photoUrls).catch(err => {
      console.error('Background processing error:', err)
    })

    // Return immediately with persona in "analyzing" status
    return NextResponse.json({
      success: true,
      persona: {
        id: persona.id,
        name: persona.name,
        status: 'analyzing',
        message: 'Your AI Avatar is being created! This takes 3-5 minutes. You can continue and check back later.'
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

/**
 * Process persona portraits in the background
 * This runs after the response is sent to the client
 */
async function processPersonaInBackground(
  personaId: string,
  userId: string,
  personName: string,
  photoUrls: string[]
) {
  try {
    console.log(`[Background] Starting portrait generation for persona ${personaId}`)

    // Dynamic import to avoid loading heavy modules during response
    const { createNanoBananaService } = await import('@/lib/services/nano-banana-service')
    const nanoBanana = createNanoBananaService()

    // Analyze photos and get best ones
    console.log(`[Background] Analyzing ${photoUrls.length} photos...`)
    const analysis = await nanoBanana.analyzePhotos(photoUrls)
    console.log(`[Background] Selected ${analysis.bestPhotos.length} best photos`)

    // Generate portraits one by one, saving each immediately for real-time updates
    console.log(`[Background] Generating 10 portraits (saving each immediately)...`)
    const portraits = await nanoBanana.generateAllPortraits({
      referencePhotos: analysis.bestPhotos,
      personName,
      onProgress: (completed, total, current) => {
        console.log(`[Background] [${completed + 1}/${total}] ${current}`)
      },
      // Save each portrait immediately after it's generated
      // This allows the UI to show portraits one by one as they're ready
      onPortraitGenerated: async (portrait) => {
        console.log(`[Background] Saving portrait: ${portrait.title}`)
        await supabaseAdmin
          .from('persona_images')
          .insert({
            persona_id: personaId,
            user_id: userId,
            image_url: portrait.url,
            metadata: {
              type: 'reference_portrait',
              portraitType: portrait.type,
              category: portrait.category,
              title: portrait.title,
              generatedBy: 'nano-banana-pro'
            }
          })
        console.log(`[Background] ✓ Saved: ${portrait.title}`)
      }
    })
    console.log(`[Background] Generated and saved ${portraits.length} portraits`)

    // Separate by category
    const generalPortraits = portraits.filter(p => p.category === 'general')
    const useCasePortraits = portraits.filter(p => p.category === 'use_case')

    // Update persona to "ready"
    await supabaseAdmin
      .from('personas')
      .update({
        status: 'ready',
        metadata: {
          photoCount: photoUrls.length,
          photoUrls: photoUrls,
          referencePhotoUrls: analysis.bestPhotos,
          portraits: portraits.map(p => ({
            type: p.type,
            category: p.category,
            url: p.url,
            title: p.title
          })),
          generalPortraitUrls: generalPortraits.map(p => p.url),
          useCasePortraitUrls: useCasePortraits.map(p => p.url),
          portraitUrls: portraits.map(p => p.url),
          analysisQuality: analysis.quality,
          consistencyScore: analysis.consistencyScore,
          processingCompleted: new Date().toISOString()
        }
      })
      .eq('id', personaId)

    console.log(`[Background] Persona ${personaId} ready with ${portraits.length} portraits!`)

  } catch (error) {
    console.error(`[Background] Error processing persona ${personaId}:`, error)

    // Mark as failed
    await supabaseAdmin
      .from('personas')
      .update({
        status: 'failed',
        metadata: {
          error: error instanceof Error ? error.message : 'Processing failed',
          processingFailed: new Date().toISOString()
        }
      })
      .eq('id', personaId)
  }
}
