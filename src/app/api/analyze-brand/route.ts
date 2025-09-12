import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic, { toFile } from '@anthropic-ai/sdk'
import { Readable } from 'stream'
import { createClient } from '@supabase/supabase-js'

// Configure for large file uploads - Files API supports up to 500MB per file!
export const runtime = 'nodejs'
export const maxDuration = 300 // Allow up to 5 minutes for large documents

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// Supabase admin client for URL fallback uploads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('[Brand Analysis] Request received')
  try {
    const { userId } = await auth()
    if (!userId) {
      console.log('[Brand Analysis] Unauthorized - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[Brand Analysis] User authenticated:', userId)

    const formData = await request.formData()
    let files = formData.getAll('files') as File[]
    // Backward compatibility: accept single 'file' field too
    const singleFile = formData.get('file') as File | null
    if (files.length === 0 && singleFile) {
      files = [singleFile]
    }
    console.log('[Brand Analysis] Files received:', files.length, files.map(f => ({ name: f.name, type: f.type, size: f.size })))
    
    if (files.length === 0) {
      console.log('[Brand Analysis] No files provided')
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Upload files to Claude's Files API first (supports up to 500MB per file!)
    const messageContent: any[] = []
    const uploadedFileIds: string[] = []
    const uploadedIdByKey = new Map<string, string>()
    
    try {
      for (const file of files) {
        console.log(`[Brand Analysis] Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) to Files API`)

        // Stream upload to Files API to avoid loading entire file into memory
        const nodeStream = Readable.fromWeb(file.stream() as any)
        const uploadedFile = await (anthropic.beta.files.upload as any)(
          { file: await toFile(nodeStream, file.name, { type: file.type || 'application/octet-stream' }) },
          { betas: ['files-api-2025-04-14'] }
        )
        
        console.log(`[Brand Analysis] Uploaded ${file.name} with file_id: ${uploadedFile.id}`)
        uploadedFileIds.push(uploadedFile.id)
        uploadedIdByKey.set(`${file.name}:${file.size}`, uploadedFile.id)
        
        // Add appropriate content block based on file type
        if (file.type === 'application/pdf') {
          messageContent.push({
            type: 'document',
            source: {
              type: 'file',
              file_id: uploadedFile.id
            }
          })
        } else if (file.type && file.type.startsWith('image/')) {
          messageContent.push({
            type: 'image',
            source: {
              type: 'file',
              file_id: uploadedFile.id
            }
          })
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          // Text files also use document blocks
          messageContent.push({
            type: 'document',
            source: {
              type: 'file',
              file_id: uploadedFile.id
            }
          })
        } else {
          // For unsupported file types, we could convert to text and include directly
          console.log('[Brand Analysis] File type not directly supported, will include as document:', file.type)
          messageContent.push({
            type: 'document',
            source: {
              type: 'file',
              file_id: uploadedFile.id
            }
          })
        }
      }
    } catch (uploadError: any) {
      console.error('[Brand Analysis] File upload error:', uploadError)
      // Clean up any uploaded files on error
      for (const fileId of uploadedFileIds) {
        try {
          await (anthropic.beta.files.delete as any)(fileId, { betas: ['files-api-2025-04-14'] })
        } catch (deleteError) {
          console.error(`[Brand Analysis] Failed to cleanup file ${fileId}:`, deleteError)
        }
      }
      throw uploadError
    }

    console.log('[Brand Analysis] Processed files:', messageContent.length)
    if (messageContent.length === 0) {
      console.log('[Brand Analysis] No content to analyze after processing')
      return NextResponse.json({ error: 'No content to analyze' }, { status: 400 })
    }

    // Add the text prompt for analysis
    messageContent.push({
      type: 'text',
      text: `Analyze this brand guideline document comprehensively and extract ALL brand identity information in extreme detail.

CRITICAL: Be thorough and extract EVERYTHING. Look for:

1. COLORS - ALL colors with exact hex codes, RGB values, color names. Include primary, secondary, accent, neutral colors with usage guidelines.

2. TYPOGRAPHY - Extract exact font family names, weights, sizes. Include all font types and their specific use cases.

3. BRAND VOICE - Extract tone attributes, personality traits, communication guidelines, example phrases.

4. VISUAL STYLE - Design principles, photography style, imagery guidelines, composition rules.

5. TARGET AUDIENCE - Demographics, psychographics, personas, needs, pain points.

6. BRAND STRATEGY - Mission, vision, values, positioning, brand story.

Return a comprehensive JSON object. Be extremely detailed. Output must be valid minified JSON only:
{
  "colors": {
    "primary": {
      "hex": ["#000000"],
      "name": ["Brand Blue"],
      "usage": "Main brand color for headers and CTAs"
    },
    "secondary": {
      "hex": [],
      "name": [],
      "usage": ""
    },
    "accent": {
      "hex": [],
      "name": [],
      "usage": ""
    },
    "neutral": {
      "hex": [],
      "name": [],
      "usage": ""
    },
    "guidelines": []
  },
  "typography": {
    "primary": {
      "family": "Font Name",
      "weights": ["400", "600", "700"],
      "fallback": "Arial, sans-serif",
      "usage": "Headlines and primary text"
    },
    "secondary": {
      "family": "",
      "weights": [],
      "fallback": "",
      "usage": ""
    },
    "body": {
      "family": "",
      "size": "16px",
      "lineHeight": "1.5"
    },
    "headings": {
      "h1": {"size": "", "weight": ""},
      "h2": {"size": "", "weight": ""},
      "h3": {"size": "", "weight": ""}
    }
  },
  "voice": {
    "tone": [],
    "personality": [],
    "attributes": [],
    "phrases": [],
    "dos": [],
    "donts": [],
    "guidelines": []
  },
  "visualStyle": {
    "principles": [],
    "photography": {
      "style": [],
      "mood": [],
      "composition": []
    },
    "imagery": [],
    "iconography": "",
    "patterns": []
  },
  "targetAudience": {
    "demographics": {
      "age": "",
      "location": "",
      "interests": []
    },
    "psychographics": [],
    "painPoints": [],
    "needs": [],
    "personas": []
  },
  "brandStrategy": {
    "mission": "",
    "vision": "",
    "values": [],
    "positioning": "",
    "pillars": [],
    "story": ""
  },
  "competitors": {
    "direct": [],
    "indirect": [],
    "positioning": "",
    "differentiators": []
  },
  "logoUsage": {
    "guidelines": [],
    "clearSpace": "",
    "minimumSize": "",
    "variations": []
  }
}`
    })

    // Call Claude API with file references
    console.log('[Brand Analysis] Calling Claude API with', messageContent.length, 'files')
    
    let message
    try {
      message = await (anthropic.beta.messages.create as any)({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0,
      system: 'You are a brand expert extracting comprehensive brand identity data. Analyze thoroughly and extract ALL available information. Include colors with hex codes and names, exact font family names, detailed brand voice, visual guidelines, audience insights, and brand strategy. Respond with minified JSON only. No markdown, no backticks, no prose. Be extremely detailed and comprehensive.',
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ],
      betas: ['files-api-2025-04-14']
    })
    } catch (apiErr: any) {
      // Surface clear message for common PDF processing errors
      const msg = apiErr?.error?.message || apiErr?.message || ''
      if (msg.includes('Could not process PDF')) {
        console.log('[Brand Analysis] Claude could not process PDF via file_id. Retrying with base64 document...')
        // Fallback: rebuild content with base64 for PDFs, keep images via file_id
        const fallbackContent: any[] = []
        for (const file of files) {
          if (file.type === 'application/pdf') {
            const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
            fallbackContent.push({
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64
              }
            })
          } else if (file.type && file.type.startsWith('image/')) {
            const id = uploadedIdByKey.get(`${file.name}:${file.size}`)
            if (id) {
              fallbackContent.push({
                type: 'image',
                source: { type: 'file', file_id: id }
              })
            }
          }
        }
        // Append the same instruction text
        fallbackContent.push(messageContent.find((b: any) => b.type === 'text'))

        try {
          message = await (anthropic.beta.messages.create as any)({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            temperature: 0,
            system: 'You extract brand identity data. Respond with minified JSON only. No markdown, no backticks, no prose. Omit unknown fields.',
            messages: [
              {
                role: 'user',
                content: fallbackContent
              }
            ],
            betas: ['files-api-2025-04-14']
          })
        } catch (secondErr: any) {
          const msg2 = secondErr?.error?.message || secondErr?.message || ''
          console.error('[Brand Analysis] Fallback also failed:', msg2)
          return NextResponse.json({
            error: 'The PDF could not be processed. Try exporting to a standard, non-encrypted PDF, or upload key pages as images.'
          }, { status: 400 })
        }
      } else {
        throw apiErr
      }
    }
    
    console.log('[Brand Analysis] Claude API response received')

    // Extract the text content from Claude's response (join all text blocks)
    const rawText = (message.content || [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')
      .trim()

    if (!rawText) {
      throw new Error('No analysis content returned from Claude')
    }

    // Robust JSON parsing: strip code fences and extract first valid JSON object
    function stripCodeFences(input: string): string {
      const fenceMatch = input.match(/```(?:json)?\n([\s\S]*?)```/i)
      if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim()
      return input
    }

    function extractFirstJsonObject(input: string): string | null {
      const start = input.indexOf('{')
      if (start === -1) return null
      let depth = 0
      let inString = false
      let escaped = false
      for (let i = start; i < input.length; i++) {
        const ch = input[i]
        if (inString) {
          if (!escaped && ch === '"') inString = false
          escaped = ch === '\\' ? !escaped : false
          continue
        }
        if (ch === '"') {
          inString = true
          continue
        }
        if (ch === '{') depth++
        if (ch === '}') {
          depth--
          if (depth === 0) {
            return input.slice(start, i + 1)
          }
        }
      }
      return null
    }

    const textNoFences = stripCodeFences(rawText)
    let jsonCandidate = textNoFences
    if (textNoFences.trim()[0] !== '{') {
      const extracted = extractFirstJsonObject(textNoFences)
      if (extracted) jsonCandidate = extracted
    }

    let analysis
    try {
      analysis = JSON.parse(jsonCandidate)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      throw new Error('Invalid response format from AI')
    }

    // Clean up uploaded files after successful analysis
    console.log('[Brand Analysis] Cleaning up uploaded files')
    for (const fileId of uploadedFileIds) {
      try {
        await (anthropic.beta.files.delete as any)(fileId, { betas: ['files-api-2025-04-14'] })
        console.log(`[Brand Analysis] Deleted file ${fileId}`)
      } catch (deleteError) {
        console.error(`[Brand Analysis] Failed to delete file ${fileId}:`, deleteError)
      }
    }
    
    // Return exactly what AI extracted; UI handles conditional rendering
    console.log('[Brand Analysis] Returning analysis with keys:', Object.keys(analysis))
    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('Brand analysis error:', error)
    
    // Provide specific error messages
    let errorMessage = 'Failed to analyze brand materials'
    let statusCode = 500
    
    if (error.status === 413 || error.message?.includes('request_too_large')) {
      errorMessage = 'File exceeds the 500MB limit per file'
      statusCode = 413
    } else if (error.message?.includes('storage_limit')) {
      errorMessage = 'Organization storage limit exceeded (100GB total)'
      statusCode = 403
    } else if (error.message?.includes('Unauthorized')) {
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