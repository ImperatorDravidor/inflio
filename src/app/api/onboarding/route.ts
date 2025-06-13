import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { OpenAI } from "openai"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      clerkUserId,
      email,
      fullName,
      companyName,
      industry,
      companySize,
      role,
      targetAge,
      targetInterests,
      audienceDescription,
      brandColors,
      brandFonts,
      brandVoice,
      logoUrl,
      contentTypes,
      videoStyle,
      transitionStyle,
      musicPreference,
      contentGoals,
      primaryPlatforms,
      postingFrequency,
      preferredTimes
    } = body

    // Create or update user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        clerk_user_id: clerkUserId,
        email,
        full_name: fullName,
        company_name: companyName,
        industry,
        company_size: companySize,
        role,
        content_types: contentTypes,
        target_audience: {
          age_groups: targetAge,
          interests: targetInterests.split(",").map((i: string) => i.trim()),
          description: audienceDescription
        },
        content_goals: contentGoals,
        brand_colors: brandColors,
        brand_fonts: brandFonts,
        brand_voice: brandVoice,
        brand_assets: { logo_url: logoUrl },
        video_style: videoStyle,
        transition_style: transitionStyle,
        music_preference: musicPreference,
        primary_platforms: primaryPlatforms,
        posting_schedule: {
          frequency: postingFrequency,
          preferred_times: preferredTimes
        },
        onboarding_completed: true,
        onboarding_step: 8
      })
      .select()
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      )
    }

    // Generate embeddings for the user profile
    const profileSummary = `
      ${fullName} works as ${role} at ${companyName} in the ${industry} industry.
      Company size: ${companySize}.
      Target audience: ${audienceDescription}. Age groups: ${targetAge.join(", ")}.
      Interests: ${targetInterests}.
      Content types: ${contentTypes.join(", ")}.
      Brand voice: ${brandVoice}.
      Video style: ${videoStyle}.
      Platforms: ${primaryPlatforms.join(", ")}.
      Goals: ${contentGoals.join(", ")}.
    `

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: profileSummary,
    })

    const embedding = embeddingResponse.data[0].embedding

    // Store the embedding
    const { error: embeddingError } = await supabase
      .from("user_embeddings")
      .insert({
        user_profile_id: profile.id,
        embedding_type: "profile",
        embedding: embedding,
        metadata: {
          summary: profileSummary,
          created_from: "onboarding"
        }
      })

    if (embeddingError) {
      console.error("Embedding error:", embeddingError)
      // Don't fail the onboarding if embedding fails
    }

    // Generate brand voice embedding
    const brandVoiceText = `
      Brand: ${companyName}
      Voice: ${brandVoice}
      Industry: ${industry}
      Style: ${videoStyle}
      Content types: ${contentTypes.join(", ")}
    `

    const brandEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: brandVoiceText,
    })

    const brandEmbedding = brandEmbeddingResponse.data[0].embedding

    // Store brand voice embedding
    await supabase
      .from("user_embeddings")
      .insert({
        user_profile_id: profile.id,
        embedding_type: "brand_voice",
        embedding: brandEmbedding,
        metadata: {
          brand_voice: brandVoice,
          video_style: videoStyle
        }
      })

    return NextResponse.json({
      success: true,
      profile: profile
    })

  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clerkUserId = searchParams.get("clerkUserId")

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Missing clerkUserId" },
        { status: 400 }
      )
    }

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("clerk_user_id", clerkUserId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Profile not found
        return NextResponse.json({ profile: null })
      }
      throw error
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 