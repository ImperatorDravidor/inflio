/**
 * Shared AI context utilities
 *
 * Centralizes fetching of brand identity and persona data so that
 * every AI generation endpoint (posts, blog, captions, thumbnails)
 * works from the same rich context.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import type { BrandContext, PersonaContext } from '@/lib/ai-posts-advanced'

export type { BrandContext, PersonaContext }

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract the full transcript text from a project's transcription field.
 * Handles both string and object (with .text or .segments) formats.
 */
export function extractTranscriptText(transcription: any): string {
  if (!transcription) return ''
  if (typeof transcription === 'string') return transcription
  if (transcription.text) return transcription.text
  if (transcription.segments && Array.isArray(transcription.segments)) {
    return transcription.segments.map((s: any) => s.text).join(' ')
  }
  return ''
}

// ─── Brand context ───────────────────────────────────────────────────────────

/**
 * Fetch the full brand identity from user_profiles.
 * Supports both the new brand_identity JSONB structure (from onboarding)
 * and the legacy flat fields (brand_voice, brand_colors, etc.).
 */
export async function fetchBrandContext(userId: string): Promise<BrandContext | undefined> {
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('company_name, brand_voice, brand_colors, brand_fonts, target_audience, content_goals, primary_platforms, brand_identity, brand_analysis')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) return undefined

  const bi = profile.brand_identity || profile.brand_analysis

  return {
    companyName: profile.company_name || undefined,
    voice: profile.brand_voice || (bi?.voice?.tone
      ? (Array.isArray(bi.voice.tone) ? bi.voice.tone.join(', ') : bi.voice.tone)
      : undefined),
    personality: bi?.voice?.personality || undefined,
    mission: bi?.brandStrategy?.mission || undefined,
    values: bi?.brandStrategy?.values || undefined,
    colors: {
      primary: bi?.colors?.primary?.hex || (profile.brand_colors?.primary ? [profile.brand_colors.primary] : undefined),
      secondary: bi?.colors?.secondary?.hex || (profile.brand_colors?.secondary ? [profile.brand_colors.secondary] : undefined),
      accent: bi?.colors?.accent?.hex || (profile.brand_colors?.accent ? [profile.brand_colors.accent] : undefined),
    },
    targetAudience: {
      description: profile.target_audience?.description || undefined,
      demographics: bi?.targetAudience?.demographics || undefined,
      psychographics: bi?.targetAudience?.psychographics || undefined,
      needs: bi?.targetAudience?.needs || undefined,
    },
    contentGoals: profile.content_goals || undefined,
    primaryPlatforms: profile.primary_platforms || undefined,
  }
}

// ─── Persona context ─────────────────────────────────────────────────────────

/**
 * Fetch persona details including portrait availability.
 */
export async function fetchPersonaContext(personaId: string): Promise<PersonaContext | null> {
  const { data: personaRecord } = await supabaseAdmin
    .from('personas')
    .select('id, name, description, status, metadata')
    .eq('id', personaId)
    .single()

  if (!personaRecord) return null

  const portraitCount =
    personaRecord.metadata?.portraits?.length ||
    personaRecord.metadata?.generalPortraitUrls?.length ||
    personaRecord.metadata?.portraitUrls?.length || 0

  return {
    id: personaRecord.id,
    name: personaRecord.name,
    description: personaRecord.description || undefined,
    brandVoice: personaRecord.metadata?.brandVoice || undefined,
    hasPortraits: portraitCount > 0,
    portraitCount,
  }
}

// ─── Combined fetch ──────────────────────────────────────────────────────────

/**
 * Fetch both brand and persona context in parallel.
 * This is the main entry point for AI generation routes.
 */
export async function fetchBrandAndPersonaContext(
  userId: string,
  personaId?: string | null
): Promise<{ brand: BrandContext | undefined; persona: PersonaContext | null }> {
  const [brand, persona] = await Promise.all([
    fetchBrandContext(userId),
    personaId ? fetchPersonaContext(personaId) : Promise.resolve(null),
  ])

  return { brand, persona }
}

/**
 * Fetch the user's default persona ID from their profile.
 */
export async function fetchDefaultPersonaId(userId: string): Promise<string | null> {
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('default_persona_id')
    .eq('clerk_user_id', userId)
    .single()

  return profile?.default_persona_id || null
}
