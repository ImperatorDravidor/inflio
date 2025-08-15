import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      )
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Create minimal profile with onboarding completed
    const profileData = {
      clerk_user_id: userId,
      onboarding_completed: true,
      onboarding_step: 8,
      onboarding_completed_at: new Date().toISOString(),
      
      // Minimal required data
      full_name: "Dev User",
      bio: "Development bypass user",
      industry: "Technology",
      content_pillars: ["Development", "Testing", "Demo"],
      brand_voice: "professional",
      content_types: ["video", "blog"],
      distribution_mode: "qa",
      
      // AI settings with defaults
      ai_settings: {
        caption_style: "Smart & Insightful",
        cta_preferences: ["subscribe", "like"],
        newsletter_style: "Weekly Digest",
        language_preferences: "en"
      },
      
      // Platform connections (empty for dev)
      connected_platforms: {
        youtube: false,
        instagram: false,
        twitter: false,
        linkedin: false,
        tiktok: false,
        facebook: false
      },
      
      // Legal consents (auto-accepted for dev)
      legal_consents: {
        content_repurpose: true,
        media_release: true,
        privacy_accepted: true,
        consented_at: new Date().toISOString()
      },
      
      updated_at: new Date().toISOString()
    }

    // Upsert user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .upsert(profileData, {
        onConflict: 'clerk_user_id'
      })
      .select()
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json(
        { error: "Failed to bypass onboarding", details: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding bypassed for development",
      profile
    })
  } catch (error) {
    console.error("Dev bypass error:", error)
    return NextResponse.json(
      { error: "Failed to bypass onboarding" },
      { status: 500 }
    )
  }
}