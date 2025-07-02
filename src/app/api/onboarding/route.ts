import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Create or update user profile with provided data and defaults
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        clerk_user_id: clerkUserId,
        email: email || "",
        full_name: fullName || "",
        company_name: companyName || "",
        industry: industry || "Other",
        company_size: companySize || "1-10",
        role: role || "Content Creator",
        content_types: contentTypes || ["video"],
        target_audience: {
          age_groups: targetAge || ["25-34"],
          interests: typeof targetInterests === 'string' 
            ? targetInterests.split(",").map((i: string) => i.trim()) 
            : ["General"],
          description: audienceDescription || "General audience"
        },
        content_goals: contentGoals || ["Brand Awareness"],
        brand_colors: brandColors || { primary: "#6366F1", accent: "#EC4899" },
        brand_fonts: brandFonts || { heading: "Inter", body: "Roboto" },
        brand_voice: brandVoice || "Professional",
        brand_assets: { logo_url: logoUrl || "" },
        video_style: videoStyle || "modern",
        transition_style: transitionStyle || "smooth",
        music_preference: musicPreference || "upbeat",
        primary_platforms: primaryPlatforms || ["youtube"],
        posting_schedule: {
          frequency: postingFrequency || "weekly",
          preferred_times: preferredTimes || ["morning"]
        },
        onboarding_completed: true,
        onboarding_step: 8,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json(
        { error: "Failed to create user profile", details: profileError.message },
        { status: 500 }
      )
    }

    // Skip embeddings for now - they can be generated later
    // This removes the OpenAI dependency from onboarding

    return NextResponse.json({
      success: true,
      profile: profile,
      message: "Onboarding completed successfully"
    })

  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
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
