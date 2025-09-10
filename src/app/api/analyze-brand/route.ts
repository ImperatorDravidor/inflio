import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Process files and extract content
    const processedContent: any[] = []
    let textContent = ''
    
    for (const file of files) {
      const buffer = await file.arrayBuffer()
      
      if (file.type === 'application/pdf') {
        // Extract text from PDF
        try {
          const pdf = (await import('pdf-parse' as any)).default as any
          const data = await pdf(Buffer.from(buffer))
          const pdfText = data.text.substring(0, 10000) // Limit to first 10k chars
          textContent += `\n\nContent from ${file.name}:\n${pdfText}`
          
          // Also include metadata if available
          if (data.info) {
            textContent += `\nPDF Metadata: Title: ${data.info.Title || 'N/A'}, Author: ${data.info.Author || 'N/A'}`
          }
        } catch (error) {
          console.error('Error processing PDF:', error)
          textContent += `\n\nPDF File: ${file.name} (unable to extract text)`
        }
      } else if (file.type.startsWith('image/')) {
        // For images, we'll use vision API
        const base64 = Buffer.from(buffer).toString('base64')
        processedContent.push({
          type: 'image_url' as const,
          image_url: {
            url: `data:${file.type};base64,${base64}`,
            detail: 'high' as const
          }
        })
      } else if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        // SVG files can be read as text
        try {
          const svgText = new TextDecoder().decode(buffer)
          textContent += `\n\nSVG from ${file.name} (first 2000 chars):\n${svgText.substring(0, 2000)}`
        } catch (error) {
          console.error('Error processing SVG:', error)
        }
      } else if (file.type.includes('presentation') || file.name.match(/\.(ppt|pptx)$/i)) {
        // PowerPoint files - note them for context
        textContent += `\n\nPresentation file: ${file.name} - Contains brand presentation materials`
      } else if (file.type.includes('document') || file.type.includes('msword') || file.name.match(/\.(doc|docx)$/i)) {
        // Word documents - note them for context
        textContent += `\n\nDocument file: ${file.name} - Contains brand documentation`
      } else if (file.type === 'text/plain' || file.name.match(/\.(txt|md)$/i)) {
        // Plain text files
        try {
          const text = new TextDecoder().decode(buffer)
          textContent += `\n\nContent from ${file.name}:\n${text.substring(0, 5000)}` // Limit text length
        } catch (error) {
          console.error('Error processing text file:', error)
        }
      } else {
        // Unknown file type
        textContent += `\n\nFile: ${file.name} (type: ${file.type || 'unknown'})`
      }
    }

    // Prepare the prompt for analysis
    const prompt = `You are a brand identity expert. Analyze the following brand materials (images, documents, and text) and extract comprehensive brand identity information. 
    Return a detailed JSON object with the following structure:
    
    {
      "colors": {
        "primary": ["#hex1", "#hex2", "#hex3"],
        "secondary": ["#hex4", "#hex5"],
        "accent": ["#hex6"],
        "descriptions": {
          "#hex1": "Description of how this color is used",
          ...
        }
      },
      "typography": {
        "primaryFont": "Font name",
        "secondaryFont": "Font name",
        "headingStyle": "Style description",
        "bodyStyle": "Style description",
        "recommendations": ["Font pairing suggestion 1", "Font pairing suggestion 2"]
      },
      "voice": {
        "tone": ["Professional", "Friendly", etc.],
        "personality": ["Innovative", "Trustworthy", etc.],
        "emotions": ["Confident", "Inspiring", etc.],
        "keywords": ["Key phrase 1", "Key phrase 2"],
        "examples": ["Example sentence 1", "Example sentence 2"]
      },
      "visualStyle": {
        "aesthetic": ["Modern", "Minimalist", etc.],
        "imagery": ["Photography style", "Illustration style"],
        "composition": ["Layout principles"],
        "mood": ["Visual mood descriptors"]
      },
      "targetAudience": {
        "demographics": ["Age range", "Profession", "Location"],
        "psychographics": ["Values", "Interests", "Lifestyle"],
        "painPoints": ["Problem 1", "Problem 2"],
        "aspirations": ["Goal 1", "Goal 2"]
      },
      "competitors": {
        "direct": ["Competitor 1", "Competitor 2"],
        "indirect": ["Alternative 1", "Alternative 2"],
        "positioning": "How the brand differentiates",
        "differentiators": ["Unique value 1", "Unique value 2"]
      },
      "mission": {
        "statement": "Core mission statement",
        "values": ["Value 1", "Value 2", "Value 3"],
        "vision": "Long-term vision",
        "purpose": "Why the brand exists"
      }
    }
    
    Be as detailed and specific as possible. Extract actual hex color codes from images, identify font families if visible, and extract specific brand information from any text or visual elements.
    
    ${textContent ? `Additional text content from documents:\n${textContent}` : ''}`

    // Build the message content
    const messageContent: any[] = [
      { type: 'text', text: prompt },
      ...processedContent
    ]

    // Call GPT-5 API for analysis [[memory:4799270]]
    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: 'You are a brand identity expert analyzing brand materials to extract comprehensive brand information. Always return valid JSON.'
        },
        {
          role: 'user',
          content: messageContent
        }
      ],
      max_completion_tokens: 3000, // GPT-5 uses max_completion_tokens instead of max_tokens
      temperature: 1.0, // GPT-5 only supports default temperature
      response_format: { type: 'json_object' }
    })

    const rawContent = response.choices[0]?.message?.content
    if (!rawContent) {
      throw new Error('No analysis content returned from AI')
    }
    
    let analysis
    try {
      analysis = JSON.parse(rawContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      throw new Error('Invalid response format from AI')
    }
    
    // Ensure all required fields exist with defaults
    const completeAnalysis = {
      colors: {
        primary: analysis.colors?.primary || ['#8B5CF6', '#EC4899', '#3B82F6'],
        secondary: analysis.colors?.secondary || ['#64748B', '#94A3B8'],
        accent: analysis.colors?.accent || ['#F59E0B'],
        descriptions: analysis.colors?.descriptions || {}
      },
      typography: {
        primaryFont: analysis.typography?.primaryFont || 'Inter',
        secondaryFont: analysis.typography?.secondaryFont || 'System UI',
        headingStyle: analysis.typography?.headingStyle || 'Bold and modern',
        bodyStyle: analysis.typography?.bodyStyle || 'Clean and readable',
        recommendations: analysis.typography?.recommendations || []
      },
      voice: {
        tone: analysis.voice?.tone || ['Professional', 'Friendly'],
        personality: analysis.voice?.personality || ['Innovative', 'Trustworthy'],
        emotions: analysis.voice?.emotions || ['Confident', 'Inspiring'],
        keywords: analysis.voice?.keywords || [],
        examples: analysis.voice?.examples || []
      },
      visualStyle: {
        aesthetic: analysis.visualStyle?.aesthetic || ['Modern', 'Clean'],
        imagery: analysis.visualStyle?.imagery || ['Photography'],
        composition: analysis.visualStyle?.composition || ['Balanced'],
        mood: analysis.visualStyle?.mood || ['Professional']
      },
      targetAudience: {
        demographics: analysis.targetAudience?.demographics || ['25-45 years', 'Professionals'],
        psychographics: analysis.targetAudience?.psychographics || ['Growth-minded'],
        painPoints: analysis.targetAudience?.painPoints || [],
        aspirations: analysis.targetAudience?.aspirations || []
      },
      competitors: {
        direct: analysis.competitors?.direct || [],
        indirect: analysis.competitors?.indirect || [],
        positioning: analysis.competitors?.positioning || 'Unique value proposition',
        differentiators: analysis.competitors?.differentiators || []
      },
      mission: {
        statement: analysis.mission?.statement || 'To empower creators',
        values: analysis.mission?.values || ['Innovation', 'Quality', 'Community'],
        vision: analysis.mission?.vision || 'A world where creativity thrives',
        purpose: analysis.mission?.purpose || 'Making creation accessible'
      }
    }

    return NextResponse.json(completeAnalysis)
  } catch (error: any) {
    console.error('Brand analysis error:', error)
    
    // Provide specific error messages
    let errorMessage = 'Failed to analyze brand materials'
    let statusCode = 500
    
    if (error.message?.includes('Unauthorized')) {
      errorMessage = 'Authentication failed'
      statusCode = 401
    } else if (error.message?.includes('rate limit')) {
      errorMessage = 'Too many requests. Please try again later.'
      statusCode = 429
    } else if (error.message?.includes('Invalid response')) {
      errorMessage = 'Failed to process analysis results'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}