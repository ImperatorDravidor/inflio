import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const photos = formData.getAll('photos') as File[]

    if (!name || photos.length < 5) {
      return NextResponse.json(
        { error: 'Name and at least 5 photos are required' },
        { status: 400 }
      )
    }

    if (photos.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 photos allowed' },
        { status: 400 }
      )
    }

    // Step 1: Upload photos to storage (fast operation)
    const photoUrls: string[] = []

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      try {
        const arrayBuffer = await photo.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const ext = photo.name.split('.').pop() || 'jpg'
        const tempFileName = `temp/${userId}/persona_${Date.now()}_${i}.${ext}`

        const { error: uploadError } = await supabaseAdmin.storage
          .from('persona-photos')
          .upload(tempFileName, buffer, {
            contentType: photo.type,
            upsert: true
          })

        if (uploadError) {
          console.error(`Failed to upload photo ${i + 1}:`, uploadError)
          continue
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('persona-photos')
          .getPublicUrl(tempFileName)

        photoUrls.push(publicUrl)
      } catch (error) {
        console.error(`Error processing photo ${i + 1}:`, error)
      }
    }

    if (photoUrls.length < 5) {
      return NextResponse.json(
        { error: `Only ${photoUrls.length} photos uploaded. Minimum 5 required.` },
        { status: 500 }
      )
    }

    // Step 2: Create persona record with "analyzing" status
    const { data: persona, error: personaError } = await supabaseAdmin
      .from('personas')
      .insert({
        user_id: userId,
        name,
        description,
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

    // Step 3: Kick off background processing (fire-and-forget)
    // This doesn't block the response
    processPersonaInBackground(persona.id, userId, name, photoUrls).catch(err => {
      console.error('Background processing error:', err)
    })

    // Step 4: Return immediately with persona in "analyzing" status
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

    // Generate all 10 portraits
    console.log(`[Background] Generating 10 portraits...`)
    const portraits = await nanoBanana.generateAllPortraits({
      referencePhotos: analysis.bestPhotos,
      personName,
      onProgress: (completed, total, current) => {
        console.log(`[Background] [${completed + 1}/${total}] ${current}`)
      }
    })
    console.log(`[Background] Generated ${portraits.length} portraits`)

    // Store portraits in persona_images
    for (const portrait of portraits) {
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
            generatedBy: 'gemini-3-pro-image-preview'
          }
        })
    }

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
