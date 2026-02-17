import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      projectId,
      currentImageUrl,
      iterationPrompt,
      personalPhotos = [],
      personaName,
      quality = 'high',
      inputFidelity = 'high'
    } = body

    // Validate project ownership
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const openai = getOpenAI()
    
    // Build iteration prompt
    let enhancedPrompt = `Based on the current thumbnail, ${iterationPrompt}`
    if (personaName && personalPhotos.length > 0) {
      enhancedPrompt += `. Maintain ${personaName}'s likeness and professional appearance.`
    }

    // Generate with high input fidelity to preserve the base image
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: enhancedPrompt,
      n: 1,
      size: "1536x1024",
      quality: quality as any,
      background: "auto"
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) {
      throw new Error('No image URL returned')
    }

    // Download and save the new iteration
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    
    const fileName = `thumbnail-iteration-${crypto.randomUUID()}.png`
    const filePath = `${projectId}/thumbnails/${fileName}`
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('ai-generated-images')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('ai-generated-images')
      .getPublicUrl(filePath)

    // Update project with new thumbnail
    await supabaseAdmin
      .from('projects')
      .update({
        thumbnail_url: publicUrl,
        metadata: {
          ...project.metadata,
          thumbnailIterations: (project.metadata?.thumbnailIterations || 0) + 1,
          lastIterationPrompt: iterationPrompt,
          iteratedAt: new Date().toISOString()
        }
      })
      .eq('id', projectId)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      iterationCount: (project.metadata?.thumbnailIterations || 0) + 1
    })

  } catch (error) {
    console.error('Thumbnail iteration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to iterate thumbnail' },
      { status: 500 }
    )
  }
} 