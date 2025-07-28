import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { QuoteExtractor, type QuoteExtractionOptions, type QuoteCardDesign } from '@/lib/quote-extractor'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
// We'll store SVG directly for now, can convert to PNG later if needed

// Request validation schema
const generateQuoteCardsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  maxQuotes: z.number().min(1).max(20).optional(),
  minLength: z.number().min(10).max(100).optional(),
  maxLength: z.number().min(50).max(500).optional(),
  sentimentFilter: z.array(z.enum(['inspiring', 'informative', 'thought-provoking', 'motivational', 'educational'])).optional(),
  includeContext: z.boolean().optional(),
  targetAudience: z.string().optional(),
  designId: z.string().optional(),
  attribution: z.string().optional(),
  logoUrl: z.string().url().optional()
})

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = generateQuoteCardsSchema.parse(body)

    // Get project data
    const supabase = createSupabaseServerClient()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, transcription_data')
      .eq('id', validatedData.projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project belongs to user
    if (project.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if transcription exists
    if (!project.transcription_data || !project.transcription_data.segments) {
      return NextResponse.json(
        { error: 'No transcription found. Please generate a transcript first.' },
        { status: 400 }
      )
    }

    // Extract quotes
    const quotes = await QuoteExtractor.extractQuotes(
      project.transcription_data.segments,
      project.title,
      {
        maxQuotes: validatedData.maxQuotes,
        minLength: validatedData.minLength,
        maxLength: validatedData.maxLength,
        sentimentFilter: validatedData.sentimentFilter,
        includeContext: validatedData.includeContext,
        targetAudience: validatedData.targetAudience
      } as QuoteExtractionOptions
    )

    if (quotes.length === 0) {
      return NextResponse.json(
        { error: 'No suitable quotes found in the transcript' },
        { status: 404 }
      )
    }

    // Get design
    const design = validatedData.designId
      ? QuoteExtractor.DEFAULT_DESIGNS.find(d => d.id === validatedData.designId)
      : QuoteExtractor.DEFAULT_DESIGNS[0]

    if (!design) {
      return NextResponse.json(
        { error: 'Invalid design ID' },
        { status: 400 }
      )
    }

    // Generate quote cards
    const quoteCards = []

    for (const quote of quotes) {
      // Generate SVG for the quote card
      const svg = QuoteExtractor.generateQuoteCardSVG(
        quote,
        design,
        validatedData.attribution || project.title,
        validatedData.logoUrl
      )

      // Convert SVG to buffer
      const svgBuffer = Buffer.from(svg, 'utf-8')

      // Upload to Supabase storage as SVG
      const fileName = `${project.id}/quotes/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.svg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, svgBuffer, {
          contentType: 'image/svg+xml',
          upsert: true
        })

      if (uploadError) {
        console.error('Failed to upload quote card:', uploadError)
        continue
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName)

      // Suggest hashtags
      const hashtags = QuoteExtractor.suggestHashtags(quote)

      quoteCards.push({
        id: `card_${Date.now()}_${quoteCards.length}`,
        quote,
        design,
        imageUrl: publicUrl,
        hashtags,
        createdAt: new Date()
      })
    }

    // Store quote cards in the database
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        quote_cards: quoteCards,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.projectId)

    if (updateError) {
      console.error('Failed to save quote cards:', updateError)
    }

    // Find similar quotes for deduplication info
    const similarGroups = QuoteExtractor.findSimilarQuotes(quotes)

    return NextResponse.json({
      success: true,
      quotes,
      quoteCards,
      similarGroups,
      totalQuotes: quotes.length
    })
  } catch (error) {
    console.error('Quote card generation API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate quote cards' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve designs
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      designs: QuoteExtractor.DEFAULT_DESIGNS
    })
  } catch (error) {
    console.error('Get designs error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve designs' },
      { status: 500 }
    )
  }
} 