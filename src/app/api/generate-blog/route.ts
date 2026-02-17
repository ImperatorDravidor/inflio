import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import { extractOutputText } from '@/lib/ai-posts-advanced'
import { fetchBrandAndPersonaContext, extractTranscriptText } from '@/lib/ai-context'
import type { BrandContext, PersonaContext } from '@/lib/ai-context'

export const maxDuration = 120

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractSections(markdown: string): Array<{ heading: string; content: string }> {
  const sections: Array<{ heading: string; content: string }> = []
  const lines = markdown.split('\n')
  let currentHeading = ''
  let currentContent: string[] = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentHeading) {
        sections.push({ heading: currentHeading, content: currentContent.join('\n').trim() })
      }
      currentHeading = line.replace('## ', '').trim()
      currentContent = []
    } else if (currentHeading) {
      currentContent.push(line)
    }
  }
  if (currentHeading) {
    sections.push({ heading: currentHeading, content: currentContent.join('\n').trim() })
  }
  return sections
}

function extractTitle(markdown: string): string {
  const titleLine = markdown.split('\n').find(l => l.startsWith('# '))
  return titleLine ? titleLine.replace('# ', '').trim() : 'Untitled'
}

function calculateReadingTime(content: string): number {
  return Math.ceil(content.split(/\s+/).length / 200)
}

function buildBrandBlock(brand?: BrandContext): string {
  if (!brand) return ''
  const parts: string[] = []
  if (brand.companyName) parts.push(`Company: ${brand.companyName}`)
  if (brand.voice) parts.push(`Voice: ${brand.voice}`)
  if (brand.personality?.length) parts.push(`Personality: ${brand.personality.join(', ')}`)
  if (brand.mission) parts.push(`Mission: ${brand.mission}`)
  if (brand.targetAudience?.description) parts.push(`Target audience: ${brand.targetAudience.description}`)
  if (brand.contentGoals?.length) parts.push(`Goals: ${brand.contentGoals.join(', ')}`)
  return parts.length > 0 ? `\nBRAND IDENTITY:\n${parts.join('\n')}` : ''
}

function buildPersonaBlock(persona?: PersonaContext | null): string {
  if (!persona) return ''
  const parts = [
    `Write as: ${persona.name}`,
    persona.description ? `About: ${persona.description}` : '',
    persona.brandVoice ? `Voice: ${persona.brandVoice}` : '',
  ].filter(Boolean)
  return `\nPERSONA:\n${parts.join('\n')}`
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, enhancedContext, options } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // ── Fetch project data ──────────────────────────────────────────────────
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, title, content_analysis, transcription, folders, content_brief, metadata')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const contentAnalysis = project.content_analysis
    if (!contentAnalysis) {
      return NextResponse.json(
        { error: 'Content analysis not available. Please analyze the video first.' },
        { status: 400 }
      )
    }

    // ── Fetch brand + persona ───────────────────────────────────────────────
    const personaId = project.metadata?.enhancedGeneration?.personaId || null
    const { brand, persona } = await fetchBrandAndPersonaContext(userId, personaId)

    // ── Extract full transcript ─────────────────────────────────────────────
    const fullTranscript = extractTranscriptText(project.transcription)
    const transcriptBlock = fullTranscript.substring(0, 12000)

    // ── Extract content brief if available ──────────────────────────────────
    const contentBrief = project.content_brief || null

    // ── Build options ───────────────────────────────────────────────────────
    const voice = options?.voice || 'first-person'
    const style = options?.style || 'professional'
    const guestName = options?.guestName || ''
    const unifiedPrompt = enhancedContext?.unifiedPrompt || ''
    const includeVideoMoments = enhancedContext?.includeVideoMoments || false
    const selectedMoments = enhancedContext?.selectedMoments || []

    // ── Build system instructions ───────────────────────────────────────────
    const styleGuidance: Record<string, string> = {
      professional: 'Maintain a professional yet personable tone.',
      casual: 'Keep it conversational and friendly, like talking to a colleague.',
      technical: 'Dive deep into technical details while remaining accessible.',
      storytelling: 'Weave personal stories and narratives throughout.',
    }

    const voiceInstruction = voice === 'first-person'
      ? `Write AS the content creator in FIRST PERSON. Use "I", "my", "we". Be authentic, authoritative, engaging.
WRONG: "The speaker discusses..." CORRECT: "I've discovered..." or "Let me share..."`
      : `Write an interview-style blog post featuring a conversation with ${guestName || 'the guest expert'}.
Structure as Q&A with clear Interviewer/Guest labels.`

    const instructions = `You are an expert content writer transforming video content into a compelling blog post.

${voiceInstruction}
${styleGuidance[style] || styleGuidance.professional}
${buildBrandBlock(brand)}
${buildPersonaBlock(persona)}
${contentBrief ? `
CONTENT BRIEF (ensure alignment with the strategic narrative):
- Core narrative: ${contentBrief.coreNarrative || ''}
- Key takeaways: ${contentBrief.keyTakeaways?.join(', ') || ''}
- Target audience: ${contentBrief.targetAudience || ''}
- Tone guidance: ${contentBrief.toneGuidance || ''}
- CTA: ${contentBrief.cta || ''}` : ''}
${unifiedPrompt ? `\nAdditional context: ${unifiedPrompt}` : ''}

OUTPUT FORMAT: Return a single JSON object with these keys:
- "content": Full blog post in markdown (use # for title, ## for sections, **bold**, *italic*, > blockquotes, timestamps as [MM:SS])
- "seoTitle": SEO-optimized title (50-60 chars)
- "seoDescription": Meta description (150-160 chars)
- "slug": URL slug (lowercase, hyphens)
- "tags": Array of 5-8 relevant tags`

    // ── Build user prompt ───────────────────────────────────────────────────
    const keyMomentsText = contentAnalysis.keyMoments?.map((m: any, i: number) => {
      const min = Math.floor((m.timestamp || 0) / 60)
      const sec = String(Math.floor((m.timestamp || 0) % 60)).padStart(2, '0')
      return `${i + 1}. [${min}:${sec}] ${m.description}`
    }).join('\n') || '(none)'

    const videoMomentsText = includeVideoMoments && selectedMoments.length > 0
      ? `\n\nHIGHLIGHTED MOMENTS:\n${selectedMoments.map((m: any, i: number) => {
          const min = Math.floor((m.timestamp || 0) / 60)
          const sec = String(Math.floor((m.timestamp || 0) % 60)).padStart(2, '0')
          return `${i + 1}. [${min}:${sec}] ${m.description}`
        }).join('\n')}`
      : ''

    const userPrompt = `Create a comprehensive blog post from this video content.

VIDEO: "${project.title}"
TOPICS: ${contentAnalysis.topics?.join(', ') || 'N/A'}
KEYWORDS: ${contentAnalysis.keywords?.join(', ') || 'N/A'}
SENTIMENT: ${contentAnalysis.sentiment || 'neutral'}
SUMMARY: ${contentAnalysis.summary || ''}

KEY MOMENTS:
${keyMomentsText}
${videoMomentsText}

FULL TRANSCRIPT:
${transcriptBlock}

Requirements:
1. Create an engaging title positioning ${voice === 'first-person' ? 'the creator as expert' : `the interview with ${guestName || 'the guest'}`}
2. Start with a compelling hook
3. Use actual quotes and specific details from the transcript
4. Include timestamp references [MM:SS] naturally
5. Structure with clear ## sections
6. End with a strong call-to-action${contentBrief?.cta ? ` aligned with: "${contentBrief.cta}"` : ''}
7. Target 1200-2000 words
8. Include SEO metadata in the JSON output`

    // ── Call GPT-5.2 ────────────────────────────────────────────────────────
    const openai = getOpenAI()

    const response = await openai.responses.create({
      model: 'gpt-5.2',
      input: userPrompt,
      instructions,
      reasoning: { effort: 'medium' },
      text: { format: { type: 'json_object' } },
      max_output_tokens: 6000,
    })

    const outputText = extractOutputText(response)
    const result = JSON.parse(outputText)

    const blogContent = result.content
    if (!blogContent) {
      throw new Error('No blog content in AI response')
    }

    const title = extractTitle(blogContent)
    const readingTime = calculateReadingTime(blogContent)

    // ── Build blog post object ──────────────────────────────────────────────
    const blogPost = {
      id: `blog_${Date.now()}`,
      title,
      content: blogContent,
      excerpt: (contentAnalysis.summary || '').substring(0, 200) + '...',
      tags: result.tags || contentAnalysis.keywords?.slice(0, 5) || [],
      seoTitle: result.seoTitle || title,
      seoDescription: result.seoDescription || (contentAnalysis.summary || '').substring(0, 160),
      slug: result.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      readingTime,
      wordCount: blogContent.split(/\s+/).length,
      sections: extractSections(blogContent),
      createdAt: new Date().toISOString(),
      metadata: {
        model: 'gpt-5.2',
        videoId: projectId,
        includesVideoMoments: includeVideoMoments,
        sentiment: contentAnalysis.sentiment,
        personaUsed: !!persona,
        brandApplied: !!brand,
      },
    }

    // ── Save to project ─────────────────────────────────────────────────────
    const updatedFolders = {
      ...project.folders,
      blog: [...(project.folders?.blog || []), blogPost],
    }

    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ folders: updatedFolders })
      .eq('id', projectId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      blog: blogPost,
      message: 'Blog post generated successfully',
    })
  } catch (error: any) {
    console.error('Error generating blog:', error)
    return NextResponse.json(
      { error: 'Failed to generate blog', details: error.message },
      { status: 500 }
    )
  }
}
