import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { fal } from "@fal-ai/client"
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { getOpenAI } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Configure FAL AI client
fal.config({
  credentials: process.env.FAL_KEY!
})

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseBrowserClient()

    const body = await req.json()
    const { 
      projectId, 
      prompt, 
      mode = 'generate', // 'generate' or 'edit'
      videoSnippets = [],
      personalPhotos = [],
      referenceImageUrl,
      style = 'modern',
      quality = 'hd',
      projectContext,
      mergeVideoWithPersona = false
    } = body

    // Validate inputs
    if (!projectId || !prompt) {
      return NextResponse.json({ 
        error: 'Missing required fields: projectId and prompt' 
      }, { status: 400 })
    }

    // Log request details for debugging
    console.log('Thumbnail generation request:', {
      mode,
      hasVideoSnippets: videoSnippets.length > 0,
      hasPersonalPhotos: personalPhotos.length > 0,
      mergeVideoWithPersona,
      style,
      quality,
      promptLength: prompt.length
    })

    // Fetch project for additional context
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
      
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const openai = getOpenAI()
    
    // Enhanced prompt generation based on video content
    let enhancedPrompt = prompt || ''
    
    // If no custom prompt provided, generate an intelligent one
    if (!prompt) {
      const contentAnalysis = project.content_analysis || projectContext
      const videoTitle = project.title || ''
      const topics = contentAnalysis.topics || []
      const keywords = contentAnalysis.keywords || []
      const sentiment = contentAnalysis.sentiment || 'neutral'
      const keyMoments = contentAnalysis.keyMoments || []
      
      // Build context-aware prompt
      enhancedPrompt = `YouTube thumbnail for video titled "${videoTitle}". `
      
      // Add topic context
      if (topics.length > 0) {
        enhancedPrompt += `Main topic: ${topics[0]}. `
      }
      
      // Add visual style based on content
      if (sentiment === 'positive') {
        enhancedPrompt += 'Bright, energetic, uplifting visual style. '
      } else if (sentiment === 'negative') {
        enhancedPrompt += 'Serious, dramatic, attention-grabbing visual style. '
      } else {
        enhancedPrompt += 'Professional, clean, engaging visual style. '
      }
      
      // Add key visual elements
      if (keywords.length > 0) {
        enhancedPrompt += `Key elements to visualize: ${keywords.slice(0, 3).join(', ')}. `
      }
    }
    
    // Optimize for YouTube thumbnails
    const thumbnailPrompt = `Create a high-impact YouTube thumbnail. ${enhancedPrompt} 
    
    CRITICAL Requirements:
    - 1280x720 resolution, 16:9 aspect ratio
    - Bold, readable text overlay (if applicable)
    - High contrast and vibrant colors
    - Clear focal point that draws the eye
    - Emotion-evoking imagery
    - Professional quality, no blur or artifacts
    - ${style === 'modern' ? 'Clean, minimalist design with strong visual hierarchy' : ''}
    - ${style === 'vibrant' ? 'Bright, saturated colors with dynamic composition' : ''}
    - ${style === 'professional' ? 'Polished, trustworthy appearance with subtle branding' : ''}
    - ${style === 'dramatic' ? 'High contrast, cinematic lighting, intense mood' : ''}
    
    ${mergeVideoWithPersona ? 'Seamlessly blend the person with video background elements. ' : ''}
    ${personalPhotos.length > 0 ? 'Feature the person prominently with engaging expression. ' : ''}
    
    Style: ${style}, photorealistic, ultra HD quality, professional YouTube thumbnail`
    
    // Determine the best model based on requirements
    const useDALLE3 = quality === 'hd' || personalPhotos.length > 0 || mode === 'edit'
    
    let imageUrl: string
    
    if (useDALLE3) {
      // DALL-E 3 for highest quality
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: thumbnailPrompt,
        n: 1,
        size: "1792x1024", // Closest to 16:9 for DALL-E 3
        quality: quality === 'hd' ? 'hd' : 'standard',
        style: style === 'vibrant' ? 'vivid' : 'natural'
      })
      
      imageUrl = response.data?.[0]?.url || ''
    } else {
      // DALL-E 2 for faster generation
      const response = await openai.images.generate({
        model: "dall-e-2",
        prompt: thumbnailPrompt,
        n: 1,
        size: "1024x1024"
      })
      
      imageUrl = response.data?.[0]?.url || ''
    }
    
    // Download and optimize the image
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    
    // Generate unique filename
    const fileName = `thumbnail-${crypto.randomUUID()}.png`
    const filePath = `${projectId}/thumbnails/${fileName}`
    
    // Upload to Supabase storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: false
      })
      
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload thumbnail' }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(filePath)

    // Update project with new thumbnail
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        thumbnail_url: publicUrl,
        metadata: {
          ...project.metadata,
          thumbnailGenerated: true,
          thumbnailStyle: style,
          thumbnailPrompt: thumbnailPrompt
        }
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('Update error:', updateError)
    }
    
    // Generate text overlay suggestions based on content
    let textSuggestions: string[] = []
    if (project.content_analysis) {
      const suggestions = await generateTextOverlaySuggestions(
        project.title,
        project.content_analysis,
        style
      )
      textSuggestions = suggestions
    }
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      prompt: thumbnailPrompt,
      textSuggestions,
      metadata: {
        style,
        quality,
        model: useDALLE3 ? 'dall-e-3' : 'dall-e-2',
        dimensions: useDALLE3 ? '1792x1024' : '1024x1024'
      }
    })

  } catch (error) {
    console.error('Thumbnail generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate thumbnail' },
      { status: 500 }
    )
  }
}

// Helper function to generate text overlay suggestions
async function generateTextOverlaySuggestions(
  title: string,
  contentAnalysis: any,
  style: string
): Promise<string[]> {
  const suggestions = []
  
  // Hook-based suggestions
  if (contentAnalysis.contentSuggestions?.socialMediaHooks) {
    suggestions.push(...contentAnalysis.contentSuggestions.socialMediaHooks
      .map((hook: string) => hook.substring(0, 30) + (hook.length > 30 ? '...' : ''))
      .slice(0, 2)
    )
  }
  
  // Question-based suggestions
  if (contentAnalysis.topics && contentAnalysis.topics.length > 0) {
    suggestions.push(`What is ${contentAnalysis.topics[0]}?`)
    suggestions.push(`${contentAnalysis.topics[0]} Explained`)
  }
  
  // Benefit-based suggestions
  if (contentAnalysis.keywords && contentAnalysis.keywords.length > 1) {
    suggestions.push(`Master ${contentAnalysis.keywords[0]}`)
    suggestions.push(`${contentAnalysis.keywords[0]} Secrets`)
  }
  
  // Shortened title
  if (title.length > 40) {
    suggestions.push(title.substring(0, 35) + '...')
  } else {
    suggestions.push(title)
  }
  
  return suggestions.slice(0, 5)
}

// Get thumbnail generation history
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseBrowserClient()

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('folders')
      .eq('id', projectId)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const thumbnailHistory = project.folders?.thumbnails || []

    return NextResponse.json({
      history: thumbnailHistory,
      count: thumbnailHistory.length
    })

  } catch (error) {
    console.error('Error fetching thumbnail history:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch thumbnail history' 
    }, { status: 500 })
  }
} 