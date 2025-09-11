import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import JSZip from 'jszip'
import { fal } from '@fal-ai/client'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for training

// Configure FAL client lazily
function configureFAL() {
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY
  if (!falKey) {
    throw new Error('FAL_KEY is not configured')
  }
  fal.config({ credentials: falKey })
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Configure FAL
    try {
      configureFAL()
    } catch (error) {
      return NextResponse.json({ error: 'FAL API not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const photos = formData.getAll('photos') as File[]
    const triggerPhrase = formData.get('triggerPhrase') as string || `photo of ${name}`
    const autoTrain = formData.get('autoTrain') === 'true'

    if (!name || photos.length < 5) {
      return NextResponse.json(
        { error: 'Name and at least 5 photos are required' },
        { status: 400 }
      )
    }

    if (photos.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 photos allowed' },
        { status: 400 }
      )
    }

    // Create persona record first
    const { data: persona, error: personaError } = await supabaseAdmin
      .from('personas')
      .insert({
        user_id: userId,
        name,
        description,
        status: 'pending',
        metadata: {
          lora_trigger_phrase: triggerPhrase,
          photo_count: 0,
          training_config: {
            learning_rate: 0.00009,
            steps: 2500,
            multiresolution_training: true,
            subject_crop: true
          }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (personaError || !persona) {
      console.error('Failed to create persona:', personaError)
      return NextResponse.json(
        { error: 'Failed to create persona' },
        { status: 500 }
      )
    }

    // Process and store photos
    const photoRecords = []
    const zip = new JSZip()
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      
      try {
        // Read file data
        const arrayBuffer = await photo.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Upload to Supabase Storage (use userId in path for RLS policy)
        const fileName = `${userId}/${persona.id}/photo_${i + 1}.${photo.name.split('.').pop()}`
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('persona-photos')
          .upload(fileName, buffer, {
            contentType: photo.type,
            upsert: true
          })

        if (uploadError) {
          console.error(`Failed to upload photo ${i + 1}:`, uploadError)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('persona-photos')
          .getPublicUrl(fileName)

        // Add to persona_images table
        const { data: imageRecord, error: imageError } = await supabaseAdmin
          .from('persona_images')
          .insert({
            persona_id: persona.id,
            user_id: userId,
            image_url: publicUrl,
            metadata: {
              image_type: 'training',
              order_index: i
            },
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (imageError) {
          console.error(`Failed to save image record ${i + 1}:`, imageError)
        }

        if (imageRecord) {
          photoRecords.push(imageRecord)
        }

        // Add to training ZIP
        const imageFileName = `image_${String(i + 1).padStart(3, '0')}.${photo.name.split('.').pop()}`
        zip.file(imageFileName, buffer)
        
        // Add caption file with trigger phrase
        const captionText = `a photo of ${triggerPhrase}, professional portrait, high quality, clear face`
        const captionFileName = `image_${String(i + 1).padStart(3, '0')}.txt`
        zip.file(captionFileName, captionText)
        
      } catch (error) {
        console.error(`Error processing photo ${i + 1}:`, error)
      }
    }

    console.log(`Processed ${photoRecords.length} photos out of ${photos.length} uploaded`)
    
    if (photoRecords.length < 5) {
      // Clean up if not enough photos were processed
      await supabaseAdmin
        .from('personas')
        .delete()
        .eq('id', persona.id)
      
      console.error(`Only ${photoRecords.length} photos were successfully processed. Minimum 5 required.`)
      
      return NextResponse.json(
        { error: `Only ${photoRecords.length} photos were processed successfully. Please ensure photos are valid images and try again.` },
        { status: 500 }
      )
    }

    // Update persona with photo count
    await supabaseAdmin
      .from('personas')
      .update({
        metadata: {
          ...persona.metadata,
          photo_count: photoRecords.length
        },
        status: autoTrain ? 'preparing' : 'ready_to_train'
      })
      .eq('id', persona.id)

    // If auto-train is enabled, start training immediately
    if (autoTrain) {
      try {
        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

        // Upload ZIP to Supabase Storage
        const zipFileName = `${userId}/${persona.id}_training.zip`
        const { data: zipUpload, error: zipError } = await supabaseAdmin.storage
          .from('persona-training')
          .upload(zipFileName, zipBuffer, {
            contentType: 'application/zip',
            upsert: true
          })

        if (zipError) {
          throw zipError
        }

        // Generate signed URL for FAL (expires in 2 hours)
        const { data: urlData } = await supabaseAdmin.storage
          .from('persona-training')
          .createSignedUrl(zipFileName, 7200)

        if (!urlData?.signedUrl) {
          throw new Error('Failed to generate training data URL')
        }

        // Start training with FAL
        console.log(`Starting LoRA training for persona ${persona.id}`)
        
        // Update status to training
        await supabaseAdmin
          .from('personas')
          .update({ 
            status: 'training',
            metadata: {
              ...persona.metadata,
              photo_count: photoRecords.length,
              lora_training_status: 'in_progress',
              training_started_at: new Date().toISOString()
            }
          })
          .eq('id', persona.id)

        // Start training asynchronously
        trainPersonaAsync(persona.id, urlData.signedUrl, triggerPhrase)

        return NextResponse.json({
          success: true,
          persona: {
            ...persona,
            photos: photoRecords,
            status: 'training',
            message: 'Persona created and training started. This will take 10-30 minutes.'
          }
        })
      } catch (trainError) {
        console.error('Failed to start training:', trainError)
        
        // Update status to ready_to_train on failure
        await supabaseAdmin
          .from('personas')
          .update({ 
            status: 'ready_to_train',
            metadata: {
              ...persona.metadata,
              photo_count: photoRecords.length,
              error_message: 'Auto-training failed. You can manually start training.'
            }
          })
          .eq('id', persona.id)

        return NextResponse.json({
          success: true,
          persona: {
            ...persona,
            photos: photoRecords,
            status: 'ready_to_train',
            message: 'Persona created. Training can be started manually.'
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      persona: {
        ...persona,
        photos: photoRecords,
        message: 'Persona created successfully. You can start training when ready.'
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

// Async training function
async function trainPersonaAsync(
  personaId: string,
  trainingDataUrl: string,
  triggerPhrase: string
) {
  try {
    // Configure FAL
    configureFAL()

    // Call FAL LoRA training API
    const result = await fal.subscribe('fal-ai/flux-lora-portrait-trainer', {
      input: {
        images_data_url: trainingDataUrl,
        trigger_phrase: triggerPhrase,
        learning_rate: 0.00009,
        steps: 2500,
        multiresolution_training: true,
        subject_crop: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log(`Training persona ${personaId}...`)
          if ('logs' in update) {
            (update as any).logs?.forEach((log: any) => {
              console.log(`[${personaId}] ${log.message}`)
            })
          }
        }
      }
    }) as any

    const loraFileUrl = result.data?.diffusers_lora_file?.url || result.diffusers_lora_file?.url
    const configFileUrl = result.data?.config_file?.url || result.config_file?.url

    if (!loraFileUrl) {
      throw new Error('No LoRA file URL in training result')
    }

    // Get current persona to preserve metadata
    const { data: currentPersona } = await supabaseAdmin
      .from('personas')
      .select('metadata')
      .eq('id', personaId)
      .single()

    // Update persona with training results
    await supabaseAdmin
      .from('personas')
      .update({
        status: 'trained',
        model_ref: loraFileUrl,
        metadata: {
          ...(currentPersona?.metadata || {}),
          lora_model_url: loraFileUrl,
          lora_config_url: configFileUrl,
          lora_training_status: 'completed',
          lora_trained_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', personaId)

    // Get user_id to set as default persona if needed
    const { data: personaData } = await supabaseAdmin
      .from('personas')
      .select('user_id')
      .eq('id', personaId)
      .single()

    if (personaData?.user_id) {
      // Check if user has a default persona
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('default_persona_id')
        .eq('clerk_user_id', personaData.user_id)
        .single()

      if (!profile?.default_persona_id) {
        // Set this as the default persona
        await supabaseAdmin
          .from('user_profiles')
          .update({ default_persona_id: personaId })
          .eq('clerk_user_id', personaData.user_id)
      }
    }

    console.log(`LoRA training completed for persona ${personaId}`)
  } catch (error) {
    console.error(`LoRA training failed for persona ${personaId}:`, error)

    // Get current persona to preserve metadata
    const { data: currentPersona } = await supabaseAdmin
      .from('personas')
      .select('metadata')
      .eq('id', personaId)
      .single()

    // Update persona as failed
    await supabaseAdmin
      .from('personas')
      .update({
        status: 'failed',
        metadata: {
          ...(currentPersona?.metadata || {}),
          lora_training_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Training failed'
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', personaId)
  }
}
