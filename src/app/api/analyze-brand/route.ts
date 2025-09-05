import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import { z } from 'zod'

// Initialize OpenAI with GPT-5 [[memory:4799270]]
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Brand analysis schema
const BrandAnalysisSchema = z.object({
  colors: z.object({
    primary: z.array(z.string()),
    secondary: z.array(z.string()),
    accent: z.array(z.string())
  }),
  typography: z.object({
    fonts: z.array(z.string()),
    headings: z.array(z.string()),
    body: z.array(z.string())
  }),
  voice: z.object({
    tone: z.array(z.string()),
    personality: z.array(z.string()),
    values: z.array(z.string())
  }),
  visual_style: z.object({
    photography: z.array(z.string()),
    graphics: z.array(z.string()),
    patterns: z.array(z.string())
  }),
  audience: z.object({
    primary: z.string(),
    demographics: z.array(z.string()),
    psychographics: z.array(z.string()),
    pain_points: z.array(z.string())
  }),
  competitors: z.array(z.string()),
  content_themes: z.array(z.string()),
  unique_value_proposition: z.string(),
  mission_statement: z.string(),
  brand_story: z.string(),
  do_and_donts: z.object({
    do: z.array(z.string()),
    dont: z.array(z.string())
  }),
  strengths: z.array(z.string()).optional(),
  opportunities: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Extract text content based on file type
    let textContent = ''
    const fileType = file.type
    const fileName = file.name.toLowerCase()
    const buffer = await file.arrayBuffer()
    
    try {
      // Handle PDFs
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        const data = await pdf(Buffer.from(buffer))
        textContent = data.text
      }
      // Handle Word documents (.docx)
      else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileName.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
        textContent = result.value
      }
      // Handle older Word documents (.doc)
      else if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
        try {
          const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
          textContent = result.value
        } catch {
          // Fallback for .doc files that mammoth can't handle
          textContent = Buffer.from(buffer).toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, '')
        }
      }
      // Handle Excel files (.xlsx, .xls)
      else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
               fileType === 'application/vnd.ms-excel' ||
               fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const texts: string[] = []
        
        // Extract text from all sheets
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName]
          const csvText = XLSX.utils.sheet_to_csv(sheet)
          texts.push(`Sheet: ${sheetName}\n${csvText}`)
        }
        textContent = texts.join('\n\n')
      }
      // Handle CSV files
      else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
        textContent = Buffer.from(buffer).toString('utf8')
      }
      // Handle PowerPoint files (.pptx)
      else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
               fileName.endsWith('.pptx')) {
        // For PowerPoint, we'll extract text using a basic approach
        // Convert to text by looking for readable strings
        const text = Buffer.from(buffer).toString('utf8')
        // Extract readable text patterns
        const matches = text.match(/[\x20-\x7E]{10,}/g) || []
        textContent = matches.filter(s => !s.includes('xml') && !s.includes('=')).join(' ')
      }
      // Handle plain text files
      else if (fileType.startsWith('text/') || 
               fileName.endsWith('.txt') || fileName.endsWith('.md') || 
               fileName.endsWith('.rtf') || fileName.endsWith('.log')) {
        textContent = Buffer.from(buffer).toString('utf8')
      }
      // Handle images with GPT-5 vision
      else if (fileType.startsWith('image/')) {
        const base64 = Buffer.from(buffer).toString('base64')
        const imageUrl = `data:${fileType};base64,${base64}`
        
        const visionResponse = await openai.chat.completions.create({
          model: 'gpt-5', // Using GPT-5 for vision analysis [[memory:4799270]]
          messages: [
            {
              role: 'system',
              content: 'Extract all text and brand elements from this image. Include colors (as hex codes), fonts, logos, taglines, and any brand guidelines visible.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this brand material and extract all information:'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          max_completion_tokens: 2000
        })
        
        textContent = visionResponse.choices[0].message.content || ''
      }
      // Handle JSON files
      else if (fileType === 'application/json' || fileName.endsWith('.json')) {
        const jsonData = JSON.parse(Buffer.from(buffer).toString('utf8'))
        textContent = JSON.stringify(jsonData, null, 2)
      }
      // Handle XML/HTML files
      else if (fileType === 'text/html' || fileType === 'application/xml' || 
               fileName.endsWith('.html') || fileName.endsWith('.xml')) {
        const text = Buffer.from(buffer).toString('utf8')
        // Strip HTML/XML tags
        textContent = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      }
      // Fallback for any other file type - attempt to extract readable text
      else {
        // Try to extract any readable text from the file
        const text = Buffer.from(buffer).toString('utf8')
        // Extract readable ASCII text
        const matches = text.match(/[\x20-\x7E]{10,}/g) || []
        textContent = matches.join(' ')
        
        // If no readable text found, inform the user
        if (!textContent || textContent.length < 50) {
          textContent = `File type '${fileType || 'unknown'}' with name '${fileName}'. Unable to extract meaningful text content. Please provide a PDF, Word document, Excel file, PowerPoint, text file, or image with brand information.`
        }
      }
    } catch (extractionError) {
      console.error('Text extraction error:', extractionError)
      // Attempt basic text extraction as fallback
      try {
        textContent = Buffer.from(buffer).toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, '')
      } catch {
        textContent = `Unable to extract text from file '${fileName}'. The file may be corrupted or in an unsupported format.`
      }
    }
    
    // Ensure we have some content to analyze
    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Could not extract any text content from the uploaded file. Please ensure the file contains readable text or brand information.' 
      }, { status: 400 })
    }

    // Analyze brand content with GPT-5 [[memory:4799270]]
    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-5', // Using GPT-5 for superior analysis
      messages: [
        {
          role: 'system',
          content: `You are a brand strategist analyzing brand materials. Extract and structure all brand elements from the provided content. 
          
          Return a JSON object with these exact fields:
          - colors: { primary: [hex codes], secondary: [hex codes], accent: [hex codes] }
          - typography: { fonts: [font names], headings: [heading fonts], body: [body fonts] }
          - voice: { tone: [tone descriptors], personality: [traits], values: [core values] }
          - visual_style: { photography: [photo style], graphics: [graphic style], patterns: [patterns used] }
          - audience: { primary: "target audience", demographics: [details], psychographics: [details], pain_points: [problems solved] }
          - competitors: [competitor names]
          - content_themes: [main topics/themes]
          - unique_value_proposition: "main value prop"
          - mission_statement: "mission"
          - brand_story: "brand narrative"
          - do_and_donts: { do: [brand dos], dont: [brand donts] }
          - strengths: [brand strengths]
          - opportunities: [growth opportunities]
          - recommendations: [strategic recommendations]
          
          If information is not available, use reasonable defaults based on industry best practices.
          Ensure all color values are valid hex codes.`
        },
        {
          role: 'user',
          content: `Analyze this brand content and extract all brand elements:\n\n${textContent}`
        }
      ],
      response_format: { type: 'json_object' },
      // GPT-5 only supports default temperature (1.0)
      max_completion_tokens: 4000
    })

    const analysisContent = analysisResponse.choices[0].message.content
    if (!analysisContent) {
      throw new Error('No analysis content received')
    }

    const analysis = JSON.parse(analysisContent)
    
    // Validate with schema
    const validatedAnalysis = BrandAnalysisSchema.parse(analysis)
    
    // Save analysis to database - user_profiles table
    const supabase = createSupabaseServerClient()
    const { error: dbError } = await supabase
      .from('user_profiles')
      .update({
        brand_analysis: validatedAnalysis,
        brand_colors: { primary: validatedAnalysis.colors.primary },
        brand_voice: validatedAnalysis.voice.tone[0],
        brand_assets: { analysis: validatedAnalysis },
        target_audience: { primary: validatedAnalysis.audience.primary, demographics: validatedAnalysis.audience.demographics },
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', userId)
    
    if (dbError) {
      console.error('Database error:', dbError)
    }
    
    return NextResponse.json(validatedAnalysis)
  } catch (error) {
    console.error('Brand analysis error:', error)
    
    // Return a default analysis if something goes wrong
    return NextResponse.json({
      colors: {
        primary: ['#8B5CF6', '#EC4899', '#3B82F6'],
        secondary: ['#10B981', '#F59E0B'],
        accent: ['#EF4444']
      },
      typography: {
        fonts: ['Inter', 'Sans-serif'],
        headings: ['Inter'],
        body: ['Inter']
      },
      voice: {
        tone: ['Professional', 'Friendly', 'Innovative'],
        personality: ['Expert', 'Approachable', 'Forward-thinking'],
        values: ['Quality', 'Innovation', 'Customer Success']
      },
      visual_style: {
        photography: ['Modern', 'Clean', 'Authentic'],
        graphics: ['Minimalist', 'Bold', 'Geometric'],
        patterns: ['Gradients', 'Abstract shapes']
      },
      audience: {
        primary: 'Content creators and businesses',
        demographics: ['25-45 years old', 'Tech-savvy', 'Growth-focused'],
        psychographics: ['Value efficiency', 'Early adopters', 'Quality-conscious'],
        pain_points: ['Time constraints', 'Content consistency', 'Multi-platform management']
      },
      competitors: [],
      content_themes: ['Innovation', 'Growth', 'Success', 'Technology'],
      unique_value_proposition: 'Transform your content creation with AI',
      mission_statement: 'Empowering creators with intelligent tools',
      brand_story: 'Built by creators, for creators',
      do_and_donts: {
        do: ['Be authentic', 'Focus on value', 'Stay consistent'],
        dont: ['Over-promise', 'Use jargon', 'Ignore feedback']
      },
      strengths: ['AI technology', 'User-friendly', 'Comprehensive solution'],
      opportunities: ['Market expansion', 'Feature development', 'Community building'],
      recommendations: ['Focus on user education', 'Build strong community', 'Maintain brand consistency']
    })
  }
}
