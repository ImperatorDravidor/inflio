import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PersonaUploadService } from '@/lib/services/persona-upload-service'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 60 // 1 minute for photo uploads

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const photos = formData.getAll('photos') as File[]
    const personaName = formData.get('personaName') as string || 'Main Persona'
    const personaDescription = formData.get('description') as string

    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: 'No photos provided' }, { status: 400 })
    }

    // Create or get persona
    let personaId: string
    
    // Check if persona exists
    const { data: existingPersona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', userId)
      .eq('name', personaName)
      .single()
    
    if (existingPersona) {
      personaId = existingPersona.id
    } else {
      // Create new persona
      const { data: newPersona, error: personaError } = await supabase
        .from('personas')
        .insert({
          user_id: userId,
          name: personaName,
          description: personaDescription || `Persona for ${personaName}`,
          status: 'uploading',
          metadata: {
            created_from: 'onboarding',
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single()
      
      if (personaError || !newPersona) {
        console.error('Error creating persona:', personaError)
        return NextResponse.json(
          { error: 'Failed to create persona' },
          { status: 500 }
        )
      }
      
      personaId = newPersona.id
    }

    // Upload photos with progress tracking
    const uploadedPhotos = await PersonaUploadService.uploadPersonaPhotos(
      userId,
      personaId,
      photos
    )

    if (uploadedPhotos.length === 0) {
      return NextResponse.json(
        { error: 'No valid photos could be uploaded' },
        { status: 400 }
      )
    }

    // Analyze photo set quality
    const analysis = PersonaUploadService.analyzePhotoSet(uploadedPhotos)

    // Update persona status
    const newStatus = analysis.readyForTraining ? 'ready_for_training' : 'needs_more_photos'
    await supabase
      .from('personas')
      .update({
        status: newStatus,
        metadata: {
          photo_count: uploadedPhotos.length,
          average_quality: analysis.averageQuality,
          ready_for_training: analysis.readyForTraining,
          last_updated: new Date().toISOString()
        }
      })
      .eq('id', personaId)

    return NextResponse.json({
      success: true,
      personaId,
      uploadedCount: uploadedPhotos.length,
      photos: uploadedPhotos,
      analysis,
      message: `Successfully uploaded ${uploadedPhotos.length} photos`
    })

  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload photos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check upload status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const personaId = searchParams.get('personaId')

    if (!personaId) {
      // Get all personas for user
      const { data: personas, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }

      return NextResponse.json({ personas: personas || [] })
    }

    // Get specific persona with photos
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select(`
        *,
        persona_images (
          id,
          image_url,
          file_size,
          width,
          height,
          quality_score,
          created_at
        )
      `)
      .eq('id', personaId)
      .eq('user_id', userId)
      .single()
    
    if (personaError) {
      if (personaError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
      }
      throw personaError
    }

    // Analyze current photo set
    const photos = persona.persona_images?.map((img: any) => ({
      id: img.id,
      url: img.image_url,
      fileName: '',
      fileSize: img.file_size,
      width: img.width,
      height: img.height,
      qualityScore: img.quality_score
    })) || []

    const analysis = PersonaUploadService.analyzePhotoSet(photos)

    return NextResponse.json({
      persona,
      photos,
      analysis
    })

  } catch (error) {
    console.error('Get personas error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch personas' },
      { status: 500 }
    )
  }
}