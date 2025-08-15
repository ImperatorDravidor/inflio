import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { url, platform = 'youtube' } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Extract thumbnail URL based on platform
    const thumbnailUrl = await extractThumbnailUrl(url, platform)
    
    if (!thumbnailUrl) {
      return NextResponse.json(
        { error: 'Could not extract thumbnail from URL' },
        { status: 400 }
      )
    }

    // Download and analyze thumbnail
    const analysis = await analyzeThumbnail(thumbnailUrl, platform)

    // Generate insights with AI
    const openai = getOpenAI()
    const insights = await generateInsights(analysis, platform, openai)

    // Store analysis
    const { data: storedAnalysis, error: storeError } = await supabaseAdmin
      .from('thumbnail_competitor_analysis')
      .insert({
        user_id: userId,
        competitor_url: url,
        platform,
        dominant_colors: analysis.colors,
        text_style: analysis.textStyle,
        composition_type: analysis.composition,
        estimated_ctr: insights.estimatedCTR,
        style_tags: insights.styleTags,
        effectiveness_score: insights.effectivenessScore,
        notes: insights.summary
      })
      .select()
      .single()

    if (storeError) {
      console.error('Store analysis error:', storeError)
    }

    // Generate prompt suggestions based on analysis
    const promptSuggestions = await generatePromptSuggestions(
      analysis,
      insights,
      platform,
      openai
    )

    return NextResponse.json({
      success: true,
      analysis,
      insights,
      promptSuggestions,
      id: storedAnalysis?.id
    })

  } catch (error) {
    console.error('Competitor analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve past analyses
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = supabaseAdmin
      .from('thumbnail_competitor_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data: analyses, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      analyses: analyses || [],
      total: analyses?.length || 0
    })

  } catch (error) {
    console.error('Get analyses error:', error)
    return NextResponse.json(
      { error: 'Failed to get analyses' },
      { status: 500 }
    )
  }
}

async function extractThumbnailUrl(url: string, platform: string): Promise<string | null> {
  try {
    if (platform === 'youtube') {
      // Extract video ID from YouTube URL
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
      if (videoIdMatch) {
        const videoId = videoIdMatch[1]
        // Return highest quality thumbnail
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    } else if (platform === 'instagram') {
      // For Instagram, would need to use their API or scraping
      // Simplified for this example
      return url
    } else if (platform === 'linkedin') {
      // For LinkedIn, would need to extract from post
      // Simplified for this example
      return url
    }
    
    return url
  } catch (error) {
    console.error('Extract thumbnail error:', error)
    return null
  }
}

async function analyzeThumbnail(thumbnailUrl: string, platform: string) {
  try {
    // Download image
    const response = await fetch(thumbnailUrl)
    const buffer = Buffer.from(await response.arrayBuffer())

    // Analyze with sharp
    const image = sharp(buffer)
    const metadata = await image.metadata()
    const stats = await image.stats()

    // Extract dominant colors
    const { dominant } = await image.stats()
    const colors = stats.channels.map((channel, index) => ({
      channel: ['red', 'green', 'blue', 'alpha'][index],
      mean: Math.round(channel.mean),
      min: channel.min,
      max: channel.max
    }))

    // Analyze composition (simplified)
    const composition = analyzeComposition(metadata.width || 0, metadata.height || 0)

    // Detect if text is likely present (high contrast areas)
    const hasText = detectTextPresence(stats)

    return {
      dimensions: {
        width: metadata.width,
        height: metadata.height
      },
      format: metadata.format,
      colors,
      composition,
      hasText,
      textStyle: hasText ? 'detected' : 'none',
      brightness: calculateBrightness(stats),
      contrast: calculateContrast(stats)
    }

  } catch (error) {
    console.error('Thumbnail analysis error:', error)
    return {
      dimensions: { width: 0, height: 0 },
      colors: [],
      composition: 'unknown',
      hasText: false,
      textStyle: 'none',
      brightness: 0,
      contrast: 0
    }
  }
}

function analyzeComposition(width: number, height: number): string {
  const aspectRatio = width / height
  
  if (Math.abs(aspectRatio - 16/9) < 0.1) return 'widescreen'
  if (Math.abs(aspectRatio - 1) < 0.1) return 'square'
  if (Math.abs(aspectRatio - 4/3) < 0.1) return 'standard'
  if (aspectRatio > 2) return 'ultra-wide'
  
  return 'custom'
}

function detectTextPresence(stats: any): boolean {
  // Simple heuristic: high standard deviation suggests text or sharp edges
  const avgStdDev = stats.channels.reduce((sum: number, channel: any) => 
    sum + channel.stdev, 0) / stats.channels.length
  
  return avgStdDev > 50
}

function calculateBrightness(stats: any): number {
  // Average of RGB channel means
  const rgbMeans = stats.channels.slice(0, 3).map((c: any) => c.mean)
  return Math.round(rgbMeans.reduce((a: number, b: number) => a + b, 0) / 3)
}

function calculateContrast(stats: any): number {
  // Simplified contrast calculation
  const ranges = stats.channels.slice(0, 3).map((c: any) => c.max - c.min)
  return Math.round(ranges.reduce((a: number, b: number) => a + b, 0) / 3)
}

async function generateInsights(analysis: any, platform: string, openai: any) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Analyze thumbnail data for ${platform} and provide insights on effectiveness.`
        },
        {
          role: 'user',
          content: `Analysis data: ${JSON.stringify(analysis)}
          
          Provide:
          1. Estimated CTR percentage (0-100)
          2. Style tags (5-7 descriptive tags)
          3. Effectiveness score (0-100)
          4. Brief summary of what makes it effective/ineffective
          
          Output as JSON.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      estimatedCTR: result.estimatedCTR || 5,
      styleTags: result.styleTags || [],
      effectivenessScore: result.effectivenessScore || 50,
      summary: result.summary || 'Analysis complete'
    }

  } catch (error) {
    console.error('Generate insights error:', error)
    return {
      estimatedCTR: 5,
      styleTags: [],
      effectivenessScore: 50,
      summary: 'Analysis failed'
    }
  }
}

async function generatePromptSuggestions(
  analysis: any,
  insights: any,
  platform: string,
  openai: any
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Generate thumbnail prompts inspired by the analyzed competitor thumbnail.'
        },
        {
          role: 'user',
          content: `Platform: ${platform}
          Analysis: ${JSON.stringify(analysis)}
          Insights: ${JSON.stringify(insights)}
          
          Generate 3 detailed prompts for creating similar but unique thumbnails.
          Make them specific and actionable for AI image generation.
          
          Output as JSON array of strings.`
        }
      ],
      temperature: 0.8,
      max_tokens: 400,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result.prompts || []

  } catch (error) {
    console.error('Generate prompt suggestions error:', error)
    return []
  }
}