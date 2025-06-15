import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { OpenAI } from "openai"
import { UserProfile } from "@/hooks/use-user-profile"

// Type definitions
// interface ContentSuggestion {
//   type: "clip" | "blog" | "social"
//   content: string
//   metadata?: Record<string, unknown>
// }

interface ContentHistory {
  id: string
  content_type: string
  content_data: Record<string, unknown>
  user_feedback?: {
    action: "liked" | "edited" | "rejected" | "viewed"
    edited_version?: Record<string, unknown>
    timestamp: Date
  }
  created_at: string
}

interface StyledContent {
  styling: {
    colors: UserProfile["brand_colors"]
    fonts: UserProfile["brand_fonts"]
    logoUrl: string | null
    watermarkUrl: string | null
  }
  metadata: {
    brand: string
    voice: string
    style: string
  }
  [key: string]: unknown
}

// Lazy initialization of clients
let supabase: SupabaseClient | null = null
let openai: OpenAI | null = null

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!url || !key) {
      throw new Error('Supabase configuration is missing')
    }
    
    supabase = createClient(url, key)
  }
  return supabase
}

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      throw new Error('OpenAI API key is missing')
    }
    
    openai = new OpenAI({ apiKey })
  }
  return openai
}

export class AIProfileService {
  private profile: UserProfile

  constructor(profile: UserProfile) {
    this.profile = profile
  }

  /**
   * Get user context for AI prompts
   */
  async getUserContext(): Promise<string> {
    // Fetch user embeddings and recent history
    // Note: embeddings could be used for more advanced context building in the future
    // const { data: embeddings } = await supabase
    //   .from("user_embeddings")
    //   .select("*")
    //   .eq("user_profile_id", this.profile.id)
    //   .order("created_at", { ascending: false })
    //   .limit(5)

    const { data: recentHistory } = await getSupabase()
      .from("user_content_history")
      .select("*")
      .eq("user_profile_id", this.profile.id)
      .order("created_at", { ascending: false })
      .limit(10)

    // Build context string
    const context = `
User Profile:
- Company: ${this.profile.company_name} (${this.profile.industry})
- Brand Voice: ${this.profile.brand_voice}
- Target Audience: ${this.profile.target_audience.description}
- Content Types: ${this.profile.content_types.join(", ")}
- Goals: ${this.profile.content_goals.join(", ")}
- Platforms: ${this.profile.primary_platforms.join(", ")}
- Video Style: ${this.profile.video_style}
- AI Tone: ${this.profile.ai_tone}

Brand Colors:
- Primary: ${this.profile.brand_colors.primary}
- Secondary: ${this.profile.brand_colors.secondary}
- Accent: ${this.profile.brand_colors.accent}

Recent Interactions:
${recentHistory?.map(h => `- ${h.content_type}: ${h.user_feedback?.action || 'viewed'}`).join("\n") || "No recent history"}
    `.trim()

    return context
  }

  /**
   * Generate personalized content suggestions
   */
  async generateContentSuggestions(
    transcription: string,
    contentType: "clip" | "blog" | "social"
  ): Promise<string> {
    const userContext = await this.getUserContext()

    const prompts = {
      clip: `Based on the user's profile and preferences, suggest engaging video clips from this transcription. Consider their ${this.profile.video_style} style preference and ${this.profile.preferred_clip_length}s duration.`,
      blog: `Create a blog post outline that matches the user's ${this.profile.brand_voice} brand voice and appeals to their target audience: ${this.profile.target_audience.description}.`,
      social: `Generate social media posts for ${this.profile.primary_platforms.join(", ")} that align with the user's content goals: ${this.profile.content_goals.join(", ")}.`
    }

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an AI content assistant for ${this.profile.company_name}. ${userContext}`
        },
        {
          role: "user",
          content: `${prompts[contentType]}\n\nTranscription:\n${transcription}`
        }
      ],
      temperature: this.profile.ai_tone === "creative" ? 0.8 : 
                   this.profile.ai_tone === "conservative" ? 0.3 : 0.5
    })

    return response.choices[0].message.content || ""
  }

  /**
   * Learn from user feedback
   */
  async learnFromFeedback(
    contentType: string,
    contentData: Record<string, unknown>,
    feedback: "liked" | "edited" | "rejected",
    editedVersion?: Record<string, unknown>
  ): Promise<void> {
    // Store the interaction
    await getSupabase()
      .from("user_content_history")
      .insert({
        user_profile_id: this.profile.id,
        content_type: contentType,
        content_data: contentData,
        user_feedback: {
          action: feedback,
          edited_version: editedVersion,
          timestamp: new Date()
        }
      })

    // If edited, analyze the changes to understand preferences better
    if (feedback === "edited" && editedVersion) {
      const analysis = await this.analyzeEdit(contentData, editedVersion)
      
      // Update embeddings based on analysis
      await this.updateUserEmbeddings(analysis)
    }
  }

  /**
   * Analyze edits to understand user preferences
   */
  private async analyzeEdit(original: Record<string, unknown>, edited: Record<string, unknown>): Promise<string> {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Analyze the differences between the original and edited content to understand user preferences. Focus on tone, style, length, and content changes."
        },
        {
          role: "user",
          content: `Original: ${JSON.stringify(original)}\n\nEdited: ${JSON.stringify(edited)}`
        }
      ]
    })

    return response.choices[0].message.content || ""
  }

  /**
   * Update user embeddings based on new insights
   */
  private async updateUserEmbeddings(insights: string) {
    const embeddingResponse = await getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input: insights,
    })

    await getSupabase()
      .from("user_embeddings")
      .insert({
        user_profile_id: this.profile.id,
        embedding_type: "preferences",
        embedding: embeddingResponse.data[0].embedding,
        metadata: {
          insights,
          updated_from: "user_feedback"
        }
      })
  }

  /**
   * Get similar successful content from history
   */
  async getSimilarSuccessfulContent(
    contentType: string,
    currentContent: string
  ): Promise<ContentHistory[]> {
    // Generate embedding for current content
    const embeddingResponse = await getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input: currentContent,
    })

    const embedding = embeddingResponse.data[0].embedding

    // Find similar content from history with good performance
    const { data: similarContent } = await getSupabase()
      .rpc("match_user_content", {
        query_embedding: embedding,
        match_threshold: 0.8,
        match_count: 5,
        filter: {
          user_profile_id: this.profile.id,
          content_type: contentType,
          "user_feedback.action": "liked"
        }
      })

    return similarContent || []
  }

  /**
   * Apply brand styling to content
   */
  applyBrandStyling<T extends Record<string, unknown>>(content: T): T & StyledContent {
    return {
      ...content,
      styling: {
        colors: this.profile.brand_colors,
        fonts: this.profile.brand_fonts,
        logoUrl: this.profile.brand_assets.logo_url || null,
        watermarkUrl: this.profile.brand_assets.watermark_url || null
      },
      metadata: {
        brand: this.profile.company_name || "",
        voice: this.profile.brand_voice || "",
        style: this.profile.video_style || ""
      }
    }
  }
} 
