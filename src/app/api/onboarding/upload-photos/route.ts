import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 60 // 1 minute for photo processing

// Photo metadata passed from the client after direct-to-Supabase upload
interface PhotoRef {
  storagePath: string
  fileName: string
  fileType: string
  fileSize: number
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Accept JSON body with storage paths (files already uploaded to Supabase)
    const body = await request.json()
    const { photos: photoRefs, personaName, description } = body as {
      photos: PhotoRef[]
      personaName?: string
      description?: string
    }

    if (!photoRefs || !Array.isArray(photoRefs) || photoRefs.length === 0) {
      return NextResponse.json({ error: 'No photos provided' }, { status: 400 })
    }

    const resolvedPersonaName = personaName || 'Main Persona'

    // Create or get persona
    let personaId: string

    // Check if persona exists
    const { data: existingPersona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', userId)
      .eq('name', resolvedPersonaName)
      .single()

    if (existingPersona) {
      personaId = existingPersona.id
    } else {
      // Create new persona
      const { data: newPersona, error: personaError } = await supabase
        .from('personas')
        .insert({
          user_id: userId,
          name: resolvedPersonaName,
          description: description || `Persona for ${resolvedPersonaName}`,
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

    // Process each uploaded photo: get public URL and store metadata
    const uploadedPhotos: Array<{
      id: string
      url: string
      fileName: string
      fileSize: number
      qualityScore: number
    }> = []

    for (const photoRef of photoRefs) {
      try {
        // Get public URL for the already-uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(photoRef.storagePath)

        // Store photo metadata in database
        const { data: photoRecord, error: dbError } = await supabase
          .from('persona_images')
          .insert({
            persona_id: personaId,
            user_id: userId,
            image_url: publicUrl,
            file_size: photoRef.fileSize,
            width: 0, // Will be determined during training
            height: 0,
            quality_score: 0.8, // Default quality score, refined during training
            metadata: {
              original_name: photoRef.fileName,
              mime_type: photoRef.fileType,
              storage_path: photoRef.storagePath,
              uploaded_at: new Date().toISOString()
            }
          })
          .select()
          .single()

        if (!dbError && photoRecord) {
          uploadedPhotos.push({
            id: photoRecord.id,
            url: publicUrl,
            fileName: photoRef.fileName,
            fileSize: photoRef.fileSize,
            qualityScore: 0.8
          })
        } else {
          console.error(`Failed to record photo ${photoRef.fileName}:`, dbError)
        }
      } catch (err) {
        console.error(`Error processing photo ${photoRef.fileName}:`, err)
      }
    }

    if (uploadedPhotos.length === 0) {
      return NextResponse.json(
        { error: 'No valid photos could be processed' },
        { status: 400 }
      )
    }

    // Analyze photo set quality
    const readyForTraining = uploadedPhotos.length >= 5
    const analysis = {
      totalPhotos: uploadedPhotos.length,
      averageQuality: 0.8,
      readyForTraining,
      suggestions: readyForTraining
        ? ['Good photo set! Ready for AI avatar training.']
        : [`Need at least 5 photos (have ${uploadedPhotos.length}). Add more for better results.`]
    }

    // Update persona status
    const newStatus = readyForTraining ? 'ready_for_training' : 'needs_more_photos'
    await supabase
      .from('personas')
      .update({
        status: newStatus,
        metadata: {
          photo_count: uploadedPhotos.length,
          average_quality: analysis.averageQuality,
          ready_for_training: readyForTraining,
          last_updated: new Date().toISOString()
        }
      })
      .eq('id', personaId)

    // Update user profile with default persona if this is their first one
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('default_persona_id')
      .eq('clerk_user_id', userId)
      .single()

    if (!userProfile?.default_persona_id) {
      await supabase
        .from('user_profiles')
        .update({
          default_persona_id: personaId,
          persona_photo_count: uploadedPhotos.length
        })
        .eq('clerk_user_id', userId)
    }

    return NextResponse.json({
      success: true,
      personaId,
      uploadedCount: uploadedPhotos.length,
      photos: uploadedPhotos,
      analysis,
      message: `Successfully processed ${uploadedPhotos.length} photos`
    })

  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process photos', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Build photo list from DB records
    const photos = persona.persona_images?.map((img: any) => ({
      id: img.id,
      url: img.image_url,
      fileName: '',
      fileSize: img.file_size,
      width: img.width,
      height: img.height,
      qualityScore: img.quality_score
    })) || []

    return NextResponse.json({
      persona,
      photos,
      analysis: {
        totalPhotos: photos.length,
        averageQuality: photos.length > 0
          ? photos.reduce((sum: number, p: any) => sum + (p.qualityScore || 0), 0) / photos.length
          : 0,
        readyForTraining: photos.length >= 5,
        suggestions: []
      }
    })

  } catch (error) {
    console.error('Get personas error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch personas' },
      { status: 500 }
    )
  }
}
