import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      personaId,
      images, // Array of { url: string, caption?: string }
      triggerWord = '[trigger]'
    } = body

    if (!personaId || !images || images.length < 3) {
      return NextResponse.json(
        { error: 'Persona ID and at least 3 images are required' },
        { status: 400 }
      )
    }

    // Verify persona belongs to user
    const { data: persona, error: personaError } = await supabaseAdmin
      .from('personas')
      .select('id, name')
      .eq('id', personaId)
      .eq('user_id', userId)
      .single()

    if (personaError || !persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      )
    }

    // Create ZIP file with images and captions
    const zip = new JSZip()
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      
      try {
        // Fetch image data
        const response = await fetch(image.url)
        if (!response.ok) {
          console.error(`Failed to fetch image ${i + 1}: ${image.url}`)
          continue
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Determine file extension from content type or URL
        const contentType = response.headers.get('content-type')
        let extension = 'jpg'
        if (contentType?.includes('png')) extension = 'png'
        else if (contentType?.includes('webp')) extension = 'webp'
        else if (image.url.includes('.png')) extension = 'png'
        else if (image.url.includes('.webp')) extension = 'webp'
        
        // Add image to ZIP
        const fileName = `image_${String(i + 1).padStart(3, '0')}.${extension}`
        zip.file(fileName, buffer)
        
        // Add caption file if provided
        if (image.caption) {
          const captionText = image.caption.replace('[name]', triggerWord).replace('[trigger]', triggerWord)
          const captionFileName = `image_${String(i + 1).padStart(3, '0')}.txt`
          zip.file(captionFileName, captionText)
        } else {
          // Default caption with trigger word
          const defaultCaption = `a photo of ${triggerWord}, professional portrait, high quality`
          const captionFileName = `image_${String(i + 1).padStart(3, '0')}.txt`
          zip.file(captionFileName, defaultCaption)
        }
      } catch (error) {
        console.error(`Error processing image ${i + 1}:`, error)
        continue
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // Upload ZIP to Supabase Storage
    const fileName = `persona_${personaId}_training_${Date.now()}.zip`
    const bucketName = 'training-data'
    
    // Ensure bucket exists (in production, create bucket if needed)
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === bucketName)
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 52428800 // 50MB
      })
    }

    // Upload file
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, zipBuffer, {
        contentType: 'application/zip',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload training data' },
        { status: 500 }
      )
    }

    // Generate public URL (temporary, expires in 1 hour)
    const { data: urlData } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(fileName, 3600) // 1 hour expiry

    if (!urlData?.signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate training data URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trainingDataUrl: urlData.signedUrl,
      imageCount: images.length,
      message: 'Training data prepared successfully'
    })
  } catch (error) {
    console.error('Training data preparation error:', error)
    return NextResponse.json(
      { error: 'Failed to prepare training data' },
      { status: 500 }
    )
  }
}
