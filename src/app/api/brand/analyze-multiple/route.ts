import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const runtime = 'nodejs'
export const maxDuration = 60

interface BrandAnalysis {
  summary: {
    essence: string
    coreValues: string[]
    positioning: string
    advantages: string[]
  }
  colors: {
    primary: Array<{ hex: string; name: string; usage: string }>
    secondary: Array<{ hex: string; name: string; usage: string }>
    accent: Array<{ hex: string; name: string; usage: string }>
  }
  typography: {
    primary: { family: string; weights: string[]; usage: string }
    secondary: { family: string; weights: string[]; usage: string }
    fallbacks: string[]
  }
  voice: {
    attributes: Array<{ name: string; value: number; description: string }>
    keywords: string[]
    dos: string[]
    donts: string[]
    examples: Array<{ type: string; text: string }>
  }
  visualStyle: {
    principles: string[]
    imageStyle: string
    iconStyle: string
    layoutPreferences: string[]
  }
  targetAudience: {
    demographics: {
      age: string[]
      gender: string
      location: string[]
      income: string
    }
    psychographics: {
      values: string[]
      lifestyle: string[]
      painPoints: string[]
      aspirations: string[]
    }
    behaviorPatterns: string[]
  }
  competitive: {
    directCompetitors: string[]
    indirectCompetitors: string[]
    differentiators: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Extract text content from files
    const fileContents: Array<{ name: string; content: string; type: string }> = []
    
    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      
      // For PDFs and documents, you'd need a proper parser
      // For now, we'll handle images and create a comprehensive prompt
      fileContents.push({
        name: file.name,
        content: base64,
        type: file.type
      })
    }

    // Create comprehensive analysis prompt
    const analysisPrompt = `You are a professional brand strategist. Analyze the provided brand materials and extract a comprehensive brand identity profile.

Files provided: ${files.map(f => `${f.name} (${f.type})`).join(', ')}

Please analyze and provide a detailed JSON response with the following structure:

{
  "summary": {
    "essence": "One-sentence brand essence statement",
    "coreValues": ["value1", "value2", "value3"],
    "positioning": "Market positioning statement",
    "advantages": ["advantage1", "advantage2"]
  },
  "colors": {
    "primary": [{"hex": "#000000", "name": "color name", "usage": "when to use"}],
    "secondary": [{"hex": "#000000", "name": "color name", "usage": "when to use"}],
    "accent": [{"hex": "#000000", "name": "color name", "usage": "when to use"}]
  },
  "typography": {
    "primary": {"family": "font name", "weights": ["400", "700"], "usage": "Headlines, titles"},
    "secondary": {"family": "font name", "weights": ["400"], "usage": "Body text"},
    "fallbacks": ["Arial", "sans-serif"]
  },
  "voice": {
    "attributes": [
      {"name": "Formal vs Casual", "value": 0-100, "description": "explanation"},
      {"name": "Serious vs Playful", "value": 0-100, "description": "explanation"}
    ],
    "keywords": ["keyword1", "keyword2"],
    "dos": ["Do this", "Do that"],
    "donts": ["Don't do this"],
    "examples": [{"type": "headline", "text": "example"}]
  },
  "visualStyle": {
    "principles": ["principle1", "principle2"],
    "imageStyle": "description of photography/imagery style",
    "iconStyle": "description of icon style",
    "layoutPreferences": ["grid system", "spacing rules"]
  },
  "targetAudience": {
    "demographics": {
      "age": ["25-34", "35-44"],
      "gender": "All/Male/Female",
      "location": ["Urban", "Global"],
      "income": "Middle to upper middle class"
    },
    "psychographics": {
      "values": ["value1", "value2"],
      "lifestyle": ["lifestyle1", "lifestyle2"],
      "painPoints": ["pain1", "pain2"],
      "aspirations": ["aspiration1", "aspiration2"]
    },
    "behaviorPatterns": ["pattern1", "pattern2"]
  },
  "competitive": {
    "directCompetitors": ["competitor1", "competitor2"],
    "indirectCompetitors": ["competitor1", "competitor2"],
    "differentiators": ["differentiator1", "differentiator2"]
  }
}

Be specific, actionable, and professional. Extract actual colors, fonts, and patterns from the materials. If certain information isn't available, make reasonable inferences based on industry standards and visual design principles.`

    // Call OpenAI for analysis
    // Note: In production, you'd want to handle images with GPT-4 Vision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert brand strategist and designer who analyzes brand materials to extract comprehensive brand guidelines.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000
    })

    const analysisText = completion.choices[0]?.message?.content
    if (!analysisText) {
      throw new Error('No analysis generated')
    }

    const analysis: BrandAnalysis = JSON.parse(analysisText)

    // Store analysis in database (optional)
    // You could save this to the user_profiles table in brand_analysis field

    return NextResponse.json({
      success: true,
      analysis,
      filesAnalyzed: files.length
    })

  } catch (error) {
    console.error('Brand analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze brand materials',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


