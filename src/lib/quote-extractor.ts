import { openai } from '@/lib/openai'

export interface ExtractedQuote {
  id: string
  text: string
  context: string
  speaker?: string
  timestamp?: number
  sentiment: 'inspiring' | 'informative' | 'thought-provoking' | 'motivational' | 'educational'
  keywords: string[]
  impactScore: number // 0-1 score for how impactful/shareable the quote is
}

export interface QuoteCard {
  id: string
  quote: ExtractedQuote
  design: QuoteCardDesign
  imageUrl?: string
  createdAt: Date
}

export interface QuoteCardDesign {
  id: string
  name: string
  backgroundColor: string
  backgroundGradient?: string
  textColor: string
  accentColor: string
  fontFamily: string
  fontSize: number
  layout: 'centered' | 'left-aligned' | 'right-aligned' | 'split'
  includeAttribution: boolean
  includeLogo: boolean
  borderStyle?: 'none' | 'solid' | 'gradient'
  overlayOpacity?: number
  quotationStyle: 'marks' | 'bar' | 'none'
}

export interface QuoteExtractionOptions {
  maxQuotes?: number
  minLength?: number
  maxLength?: number
  sentimentFilter?: ExtractedQuote['sentiment'][]
  includeContext?: boolean
  targetAudience?: string
}

interface TranscriptSegment {
  text: string
  start: number
  end: number
  speaker?: string
}

export class QuoteExtractor {
  static readonly DEFAULT_DESIGNS: QuoteCardDesign[] = [
    {
      id: 'modern-gradient',
      name: 'Modern Gradient',
      backgroundColor: '#667EEA',
      backgroundGradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      textColor: '#FFFFFF',
      accentColor: '#F7FAFC',
      fontFamily: 'Inter',
      fontSize: 32,
      layout: 'centered',
      includeAttribution: true,
      includeLogo: true,
      quotationStyle: 'marks',
      overlayOpacity: 0.1
    },
    {
      id: 'minimalist',
      name: 'Minimalist',
      backgroundColor: '#FFFFFF',
      textColor: '#1A202C',
      accentColor: '#3182CE',
      fontFamily: 'Helvetica',
      fontSize: 28,
      layout: 'left-aligned',
      includeAttribution: true,
      includeLogo: false,
      quotationStyle: 'bar',
      borderStyle: 'solid'
    },
    {
      id: 'bold-dark',
      name: 'Bold Dark',
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      accentColor: '#FFD700',
      fontFamily: 'Montserrat',
      fontSize: 36,
      layout: 'centered',
      includeAttribution: true,
      includeLogo: true,
      quotationStyle: 'none',
      overlayOpacity: 0.2
    },
    {
      id: 'nature-inspired',
      name: 'Nature Inspired',
      backgroundColor: '#F0FDF4',
      backgroundGradient: 'linear-gradient(180deg, #F0FDF4 0%, #DCFCE7 100%)',
      textColor: '#166534',
      accentColor: '#22C55E',
      fontFamily: 'Georgia',
      fontSize: 30,
      layout: 'centered',
      includeAttribution: true,
      includeLogo: false,
      quotationStyle: 'marks'
    },
    {
      id: 'corporate-professional',
      name: 'Corporate Professional',
      backgroundColor: '#F8FAFC',
      textColor: '#334155',
      accentColor: '#0EA5E9',
      fontFamily: 'Arial',
      fontSize: 26,
      layout: 'split',
      includeAttribution: true,
      includeLogo: true,
      quotationStyle: 'bar',
      borderStyle: 'gradient'
    }
  ]

  /**
   * Extract meaningful quotes from transcript
   */
  static async extractQuotes(
    transcript: TranscriptSegment[] | string,
    projectTitle: string,
    options: QuoteExtractionOptions = {}
  ): Promise<ExtractedQuote[]> {
    const {
      maxQuotes = 10,
      minLength = 20,
      maxLength = 280, // Twitter-friendly
      sentimentFilter,
      includeContext = true,
      targetAudience = 'general'
    } = options

    try {
      // Prepare transcript text
      const transcriptText = Array.isArray(transcript)
        ? this.prepareTranscript(transcript)
        : transcript

      // Extract quotes using AI
      const systemPrompt = this.buildSystemPrompt(targetAudience)
      const userPrompt = this.buildUserPrompt(
        transcriptText,
        projectTitle,
        maxQuotes,
        minLength,
        maxLength,
        includeContext,
        sentimentFilter
      )

      if (!openai) {
        throw new Error('OpenAI client not initialized')
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })

      const response = JSON.parse(completion.choices[0].message.content || '{}')
      
      // Process and validate quotes
      return this.processQuotes(response.quotes || [], transcript)
    } catch (error) {
      console.error('Quote extraction error:', error)
      throw new Error('Failed to extract quotes. Please try again.')
    }
  }

  /**
   * Prepare transcript for processing
   */
  private static prepareTranscript(segments: TranscriptSegment[]): string {
    return segments.map(segment => {
      const speaker = segment.speaker ? `[${segment.speaker}]: ` : ''
      return `${speaker}${segment.text}`
    }).join('\n\n')
  }

  /**
   * Build system prompt for quote extraction
   */
  private static buildSystemPrompt(targetAudience: string): string {
    return `You are an expert content curator specializing in extracting powerful, shareable quotes from video transcripts.

Your task is to identify quotes that are:
- Memorable and impactful
- Self-contained (make sense without additional context)
- Authentic and genuine
- Relevant to ${targetAudience}
- Suitable for social media sharing

Focus on finding quotes that are:
1. Inspiring or motivational
2. Educational or informative
3. Thought-provoking or philosophical
4. Practical advice or tips
5. Memorable one-liners or statements

Always return a JSON object with this structure:
{
  "quotes": [
    {
      "text": "The exact quote text",
      "context": "Brief context about what this quote refers to",
      "speaker": "Speaker name if available",
      "timestamp": seconds_if_available,
      "sentiment": "inspiring|informative|thought-provoking|motivational|educational",
      "keywords": ["relevant", "keywords"],
      "impactScore": 0.0-1.0
    }
  ]
}`
  }

  /**
   * Build user prompt with transcript and requirements
   */
  private static buildUserPrompt(
    transcript: string,
    title: string,
    maxQuotes: number,
    minLength: number,
    maxLength: number,
    includeContext: boolean,
    sentimentFilter?: string[]
  ): string {
    let prompt = `Extract the most powerful and shareable quotes from this content:

Title: ${title}

Transcript:
${transcript}

Requirements:
- Extract up to ${maxQuotes} quotes
- Each quote should be between ${minLength} and ${maxLength} characters
- Quotes must be exact text from the transcript (no paraphrasing)
- ${includeContext ? 'Include brief context for each quote' : 'No context needed'}
- Prioritize quotes that stand alone and make sense without explanation
- Assign an impact score (0-1) based on shareability and memorability`

    if (sentimentFilter && sentimentFilter.length > 0) {
      prompt += `\n- Focus on quotes with these sentiments: ${sentimentFilter.join(', ')}`
    }

    prompt += `\n- Include 2-3 relevant keywords for each quote
- If the transcript has speaker labels, include the speaker name`

    return prompt
  }

  /**
   * Process and validate extracted quotes
   */
  private static processQuotes(
    rawQuotes: any[],
    originalTranscript: TranscriptSegment[] | string
  ): ExtractedQuote[] {
    return rawQuotes
      .filter(quote => 
        quote.text && 
        quote.text.length >= 20 && 
        quote.text.length <= 500
      )
      .map((quote, index) => ({
        id: `quote_${Date.now()}_${index}`,
        text: this.cleanQuoteText(quote.text),
        context: quote.context || '',
        speaker: quote.speaker,
        timestamp: typeof quote.timestamp === 'number' ? quote.timestamp : undefined,
        sentiment: this.validateSentiment(quote.sentiment),
        keywords: Array.isArray(quote.keywords) ? quote.keywords : [],
        impactScore: typeof quote.impactScore === 'number' 
          ? Math.min(Math.max(quote.impactScore, 0), 1) 
          : 0.5
      }))
      .sort((a, b) => b.impactScore - a.impactScore)
  }

  /**
   * Clean and format quote text
   */
  private static cleanQuoteText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\.{3,}/g, '...') // Normalize ellipsis
  }

  /**
   * Validate sentiment value
   */
  private static validateSentiment(sentiment: any): ExtractedQuote['sentiment'] {
    const validSentiments: ExtractedQuote['sentiment'][] = [
      'inspiring', 'informative', 'thought-provoking', 'motivational', 'educational'
    ]
    
    return validSentiments.includes(sentiment) ? sentiment : 'thought-provoking'
  }

  /**
   * Generate HTML for quote card
   */
  static generateQuoteCardHTML(
    quote: ExtractedQuote,
    design: QuoteCardDesign,
    attribution?: string,
    logoUrl?: string
  ): string {
    const { 
      backgroundColor, 
      backgroundGradient, 
      textColor, 
      accentColor, 
      fontFamily, 
      fontSize,
      layout,
      includeAttribution,
      includeLogo,
      quotationStyle,
      borderStyle,
      overlayOpacity
    } = design

    const background = backgroundGradient || backgroundColor
    const quotationMark = quotationStyle === 'marks' ? '"' : ''
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@400;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      width: 1080px;
      height: 1080px;
      background: ${background};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: '${fontFamily}', sans-serif;
      position: relative;
      overflow: hidden;
    }
    
    ${borderStyle === 'solid' ? `
    body::before {
      content: '';
      position: absolute;
      inset: 20px;
      border: 3px solid ${accentColor};
      border-radius: 20px;
      pointer-events: none;
    }
    ` : ''}
    
    ${borderStyle === 'gradient' ? `
    body::before {
      content: '';
      position: absolute;
      inset: 20px;
      background: linear-gradient(45deg, ${accentColor}, ${textColor});
      border-radius: 20px;
      padding: 3px;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
    ` : ''}
    
    ${overlayOpacity ? `
    body::after {
      content: '';
      position: absolute;
      inset: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${textColor}" opacity="${overlayOpacity}"/></svg>');
      mix-blend-mode: overlay;
      pointer-events: none;
    }
    ` : ''}
    
    .container {
      width: 90%;
      max-width: 900px;
      text-align: ${layout === 'centered' ? 'center' : layout === 'right-aligned' ? 'right' : 'left'};
      z-index: 1;
    }
    
    ${quotationStyle === 'bar' ? `
    .quote-bar {
      width: 60px;
      height: 6px;
      background: ${accentColor};
      margin: 0 ${layout === 'right-aligned' ? '0 0 auto' : layout === 'centered' ? 'auto' : '0'};
      margin-bottom: 30px;
      border-radius: 3px;
    }
    ` : ''}
    
    .quote-text {
      font-size: ${fontSize}px;
      line-height: 1.4;
      color: ${textColor};
      font-weight: 700;
      margin-bottom: 40px;
      ${quotationStyle === 'marks' ? `
      &::before { content: '"'; color: ${accentColor}; font-size: 1.3em; }
      &::after { content: '"'; color: ${accentColor}; font-size: 1.3em; }
      ` : ''}
    }
    
    .attribution {
      font-size: ${Math.round(fontSize * 0.5)}px;
      color: ${textColor};
      opacity: 0.8;
      font-weight: 400;
    }
    
    .attribution::before {
      content: '— ';
      color: ${accentColor};
    }
    
    ${includeLogo && logoUrl ? `
    .logo {
      position: absolute;
      bottom: 40px;
      ${layout === 'right-aligned' ? 'left: 40px;' : 'right: 40px;'}
      width: 120px;
      height: auto;
      opacity: 0.8;
    }
    ` : ''}
  </style>
</head>
<body>
  <div class="container">
    ${quotationStyle === 'bar' ? '<div class="quote-bar"></div>' : ''}
    <div class="quote-text">${quotationMark}${quote.text}${quotationMark}</div>
    ${includeAttribution && attribution ? `<div class="attribution">${attribution}</div>` : ''}
  </div>
  ${includeLogo && logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : ''}
</body>
</html>`
  }

  /**
   * Find similar quotes (for deduplication)
   */
  static findSimilarQuotes(quotes: ExtractedQuote[], threshold: number = 0.8): ExtractedQuote[][] {
    const groups: ExtractedQuote[][] = []
    const processed = new Set<string>()

    for (const quote of quotes) {
      if (processed.has(quote.id)) continue

      const similarGroup = [quote]
      processed.add(quote.id)

      for (const otherQuote of quotes) {
        if (otherQuote.id === quote.id || processed.has(otherQuote.id)) continue

        const similarity = this.calculateSimilarity(quote.text, otherQuote.text)
        if (similarity >= threshold) {
          similarGroup.push(otherQuote)
          processed.add(otherQuote.id)
        }
      }

      if (similarGroup.length > 1) {
        groups.push(similarGroup)
      }
    }

    return groups
  }

  /**
   * Calculate text similarity (simple implementation)
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  /**
   * Suggest hashtags for a quote
   */
  static suggestHashtags(quote: ExtractedQuote): string[] {
    const hashtags: string[] = []
    
    // Add sentiment-based hashtags
    const sentimentHashtags: Record<ExtractedQuote['sentiment'], string[]> = {
      'inspiring': ['inspiration', 'motivated', 'inspire'],
      'informative': ['didyouknow', 'facts', 'learning'],
      'thought-provoking': ['thoughtoftheday', 'mindset', 'perspective'],
      'motivational': ['motivation', 'success', 'goals'],
      'educational': ['education', 'knowledge', 'learn']
    }
    
    hashtags.push(...(sentimentHashtags[quote.sentiment] || []))
    
    // Add keyword-based hashtags
    if (quote.keywords.length > 0) {
      hashtags.push(...quote.keywords.slice(0, 3).map(k => k.toLowerCase().replace(/\s+/g, '')))
    }
    
    // Add generic hashtags
    hashtags.push('quotes', 'quoteoftheday', 'wisdom')
    
    // Return unique hashtags
    return [...new Set(hashtags)].slice(0, 10).map(tag => `#${tag}`)
  }

  /**
   * Generate SVG for quote card
   */
  static generateQuoteCardSVG(
    quote: ExtractedQuote,
    design: QuoteCardDesign,
    attribution?: string,
    logoUrl?: string
  ): string {
    const { 
      backgroundColor, 
      backgroundGradient, 
      textColor, 
      accentColor, 
      fontFamily, 
      fontSize,
      layout,
      includeAttribution,
      includeLogo,
      quotationStyle,
      borderStyle,
      overlayOpacity
    } = design

    const width = 1080
    const height = 1080
    const padding = 100
    const maxTextWidth = width - (padding * 2)
    
    // Estimate text height based on character count
    const lineHeight = fontSize * 1.4
    const charsPerLine = Math.floor(maxTextWidth / (fontSize * 0.6))
    const lines = Math.ceil(quote.text.length / charsPerLine)
    const textHeight = lines * lineHeight

    // Calculate positions based on layout
    let textX = padding
    const textY = (height - textHeight) / 2
    let textAnchor = 'start'
    
    if (layout === 'centered') {
      textX = width / 2
      textAnchor = 'middle'
    } else if (layout === 'right-aligned') {
      textX = width - padding
      textAnchor = 'end'
    }

    // Create gradient if needed
    const gradientId = 'gradient-' + Date.now()
    const fillUrl = backgroundGradient ? `url(#${gradientId})` : backgroundColor

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${backgroundGradient ? `
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${design.textColor === '#FFFFFF' ? '#764BA2' : '#DCFCE7'};stop-opacity:1" />
    </linearGradient>
    ` : ''}
    <style>
      @import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@400;700');
      .quote-text { 
        font-family: '${fontFamily}', sans-serif; 
        font-size: ${fontSize}px; 
        font-weight: 700; 
        fill: ${textColor};
      }
      .attribution { 
        font-family: '${fontFamily}', sans-serif; 
        font-size: ${fontSize * 0.5}px; 
        font-weight: 400; 
        fill: ${textColor};
        opacity: 0.8;
      }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${fillUrl}" />
  
  ${overlayOpacity ? `
  <!-- Overlay -->
  <rect width="${width}" height="${height}" fill="${textColor}" opacity="${overlayOpacity}" style="mix-blend-mode: overlay;" />
  ` : ''}
  
  ${borderStyle === 'solid' ? `
  <!-- Border -->
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="${accentColor}" stroke-width="3" rx="20" />
  ` : ''}
  
  ${quotationStyle === 'bar' ? `
  <!-- Quote Bar -->
  <rect x="${layout === 'right-aligned' ? width - padding - 60 : layout === 'centered' ? (width - 60) / 2 : padding}" 
        y="${textY - 50}" 
        width="60" 
        height="6" 
        fill="${accentColor}" 
        rx="3" />
  ` : ''}
  
  <!-- Quote Text -->
  <text x="${textX}" y="${textY}" text-anchor="${textAnchor}" class="quote-text">
    ${quotationStyle === 'marks' ? `<tspan fill="${accentColor}" font-size="${fontSize * 1.3}px">"</tspan>` : ''}
    <tspan>${this.wrapText(quote.text, maxTextWidth, fontSize).map((line, i) => 
      `<tspan x="${textX}" dy="${i === 0 ? 0 : lineHeight}">${this.escapeXml(line)}</tspan>`
    ).join('')}</tspan>
    ${quotationStyle === 'marks' ? `<tspan fill="${accentColor}" font-size="${fontSize * 1.3}px">"</tspan>` : ''}
  </text>
  
  ${includeAttribution && attribution ? `
  <!-- Attribution -->
  <text x="${textX}" y="${textY + textHeight + 60}" text-anchor="${textAnchor}" class="attribution">
    <tspan fill="${accentColor}">— </tspan>${this.escapeXml(attribution)}
  </text>
  ` : ''}
  
  ${includeLogo && logoUrl ? `
  <!-- Logo -->
  <image x="${layout === 'right-aligned' ? 40 : width - 160}" 
         y="${height - 100}" 
         width="120" 
         height="60" 
         href="${logoUrl}" 
         opacity="0.8" 
         preserveAspectRatio="xMidYMid meet" />
  ` : ''}
</svg>`
  }

  /**
   * Wrap text to fit within maximum width
   */
  private static wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    const avgCharWidth = fontSize * 0.6 // Rough estimate
    const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth)
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        currentLine = word
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
} 