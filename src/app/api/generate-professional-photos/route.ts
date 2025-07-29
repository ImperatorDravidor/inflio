import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      personaName,
      personaRole,
      originalPhoto,
      variations = [
        "professional headshot, business attire, neutral background, confident expression",
        "friendly professional portrait, warm smile, modern office background, approachable",
        "creative professional photo, artistic lighting, contemporary style, engaging expression"
      ]
    } = body

    // Validate inputs
    if (!personaName || !originalPhoto) {
      return NextResponse.json({ 
        error: 'Missing required fields: personaName and originalPhoto' 
      }, { status: 400 })
    }

    const openai = getOpenAI()
    const generatedImages: string[] = []

    // Generate professional variations using DALL-E 3
    for (let i = 0; i < variations.length; i++) {
      try {
        const prompt = `Professional photo of ${personaName}${personaRole ? `, ${personaRole}` : ''}, ${variations[i]}. 
        Ultra-realistic, high quality professional photography, natural lighting, sharp focus.
        Based on the person's appearance, maintain their facial features, skin tone, and distinctive characteristics.
        Professional setting appropriate for business use.`

        const response = await openai.images.generate({
          model: "gpt-image-1", // Using OpenAI's latest and most advanced image generation model
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "high",
          background: "auto"
        })

        const imageUrl = response.data?.[0]?.url
        
        if (imageUrl) {
          // Download the generated image
          const imageResponse = await fetch(imageUrl)
          const imageBlob = await imageResponse.blob()
          
          // Upload to Supabase storage
          const fileName = `persona-${uuidv4()}-${i + 1}.png`
          const filePath = `personas/${userId}/${fileName}`
          
          const { error: uploadError } = await supabaseAdmin.storage
            .from('images')
            .upload(filePath, imageBlob, {
              contentType: 'image/png',
              upsert: false
            })
            
          if (uploadError) {
            console.error(`Upload error for variation ${i + 1}:`, uploadError)
            continue
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('images')
            .getPublicUrl(filePath)
          
          generatedImages.push(publicUrl)
        }
      } catch (error) {
        console.error(`Failed to generate variation ${i + 1}:`, error)
      }
    }

    if (generatedImages.length === 0) {
      throw new Error('Failed to generate any professional photos')
    }

    return NextResponse.json({
      success: true,
      images: generatedImages,
      count: generatedImages.length
    })

  } catch (error) {
    console.error('Professional photo generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate professional photos' },
      { status: 500 }
    )
  }
} 