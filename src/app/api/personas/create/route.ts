import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'

export const runtime = 'nodejs'
export const maxDuration = 60

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

    // Step 3: Send Inngest event to generate portraits in the background
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

    // Step 4: Return immediately with persona in "analyzing" status
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
