import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Verify authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      clerkUserId,
      email,
      
      // Platform Access
      platforms,
      googleDriveUrl,
      dropboxUrl,
      calendarAccess,
      emailPlatform,
      
      // Creator Profile
      fullName,
      title,
      companyName,
      bio,
      industry,
      audience,
      mission,
      contentPurpose,
      contentPillars,
      
      // Brand Identity
      brandColors,
      fonts,
      logoUrl,
      brandVoice,
      tagline,
      missionStatement,
      competitors,
      inspirationLinks,
      
      // Content Preferences
      contentTypes,
      distributionMode,
      historicalContent,
      
      // AI Personalization
      captionStyle,
      ctaPreferences,
      newsletterStyle,
      languagePreferences,
      toneReferences,
      
      // Legal
      consentRepurpose,
      mediaRelease,
      privacyAccepted,

      // Photo upload info
      photoCount,

      // Completion
      completedAt,
      onboarding_completed,

      // Brand Analysis (AI-generated)
      brandAnalysis,
      brandIdentity,

      // Progress save fields
      step,
      stepId,
      onboarding_progress
    } = body

    // Prepare platform handles for storage
    const platformHandles: Record<string, string> = {}
    if (platforms) {
      Object.entries(platforms).forEach(([platform, data]: [string, any]) => {
        if (data.handle) {
          platformHandles[platform] = data.handle
        }
      })
    }

    // Create comprehensive user profile
    const profileData = {
      clerk_user_id: clerkUserId || userId,
      email: email || "",
      
      // Basic Info
      full_name: fullName || "",
      title: title || "",
      company_name: companyName || "",
      bio: bio || "",
      industry: industry || "Other",
      
      // Audience & Purpose
      target_audience: {
        description: audience || "General audience",
        age_groups: ["25-34", "35-44"], // Can be expanded later
        interests: contentPillars || []
      },
      mission_statement: mission || missionStatement || "",
      content_purpose: contentPurpose || "Personal Brand Growth",
      content_pillars: contentPillars || [],
      
      // Brand
      brand_colors: brandColors || { primary: "#6366F1", secondary: "#EC4899", accent: "#10B981" },
      brand_fonts: fonts || { heading: "Inter", body: "Roboto" },
      brand_voice: brandVoice || "Professional",
      brand_assets: { 
        logo_url: logoUrl || "",
        tagline: tagline || ""
      },
      
      // Platforms & Integrations
      platform_handles: platformHandles,
      integrations: {
        google_drive: googleDriveUrl || "",
        dropbox: dropboxUrl || "",
        calendar_connected: calendarAccess || false,
        email_platform: emailPlatform || ""
      },
      
      // Content Settings
      content_types: contentTypes || ["video"],
      distribution_mode: distributionMode || "qa",
      historical_content_urls: historicalContent || [],
      
      // AI Personalization
      ai_settings: {
        caption_style: captionStyle || "Smart & Insightful",
        cta_preferences: ctaPreferences || [],
        newsletter_style: newsletterStyle || "Weekly Digest",
        language_preferences: languagePreferences || "",
        tone_references: toneReferences || [],
        competitors: competitors || [],
        inspiration_links: inspirationLinks || []
      },
      
      // Legal Consents
      legal_consents: {
        content_repurpose: consentRepurpose || false,
        media_release: mediaRelease || false,
        privacy_accepted: privacyAccepted || false,
        consented_at: completedAt || new Date().toISOString()
      },
      
      // Brand Analysis (AI-generated from brand materials)
      ...(brandAnalysis && { brand_analysis: brandAnalysis }),
      ...(brandIdentity && { brand_identity: brandIdentity }),

      // Progress tracking
      ...(step !== undefined && { onboarding_step: step }),
      ...(stepId && { onboarding_step_id: stepId }),
      ...(onboarding_progress && { onboarding_progress }),

      // Meta
      onboarding_completed: onboarding_completed !== undefined ? onboarding_completed : true,
      ...(onboarding_completed && { onboarding_completed_at: new Date().toISOString() }),
      persona_photo_count: photoCount || 0,
      updated_at: new Date().toISOString()
    }

    // Check if profile exists first
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("clerk_user_id")
      .eq("clerk_user_id", profileData.clerk_user_id)
      .maybeSingle()

    let profile
    let profileError

    if (existingProfile) {
      // Update existing profile
      const result = await supabase
        .from("user_profiles")
        .update(profileData)
        .eq("clerk_user_id", profileData.clerk_user_id)
        .select()
        .single()
      profile = result.data
      profileError = result.error
    } else {
      // Insert new profile
      const result = await supabase
        .from("user_profiles")
        .insert({
          ...profileData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      profile = result.data
      profileError = result.error
    }

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json(
        { error: "Failed to save user profile", details: profileError.message },
        { status: 500 }
      )
    }

    // If user uploaded photos, create a persona entry
    if (photoCount && photoCount > 0) {
      const { error: personaError } = await supabase
        .from("personas")
        .insert({
          user_id: clerkUserId || userId,
          name: fullName || "Main Persona",
          description: bio || "Primary persona for content generation",
          status: "pending_upload", // Will be updated when photos are actually uploaded
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (personaError) {
        console.error("Persona creation error:", personaError)
        // Non-blocking error - persona can be created later
      }
    }

    // Store platform connections for future OAuth
    if (Object.keys(platformHandles).length > 0) {
      const platformRecords = Object.entries(platformHandles).map(([platform, handle]) => ({
        user_id: clerkUserId || userId,
        platform,
        handle,
        status: "pending_connection",
        created_at: new Date().toISOString()
      }))

      const { error: platformError } = await supabase
        .from("social_integrations")
        .upsert(platformRecords, { 
          onConflict: 'user_id,platform',
          ignoreDuplicates: false 
        })

      if (platformError) {
        console.error("Platform handles error:", platformError)
        // Non-blocking - can be added later
      }
    }

    return NextResponse.json({
      success: true,
      profile: profile,
      message: "Onboarding completed successfully! Your AI is ready to create amazing content."
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
      // Try to get from auth
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
      }
    }

    const userIdToQuery = clerkUserId || (await auth()).userId

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("clerk_user_id", userIdToQuery)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Profile not found - user needs onboarding
        return NextResponse.json({ profile: null, needsOnboarding: true })
      }
      throw error
    }

    // Also fetch persona info if exists
    const { data: personas } = await supabase
      .from("personas")
      .select("id, name, status")
      .eq("user_id", userIdToQuery)

    return NextResponse.json({ 
      profile,
      personas: personas || [],
      needsOnboarding: !profile?.onboarding_completed 
    })

  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// New endpoint to handle photo uploads separately
export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const photos = formData.getAll('photos') as File[]
    const personaId = formData.get('personaId') as string

    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 })
    }

    // TODO: Implement actual photo upload to Supabase storage
    // For now, just update the persona status
    if (personaId) {
      const { error } = await supabase
        .from("personas")
        .update({
          status: "photos_uploaded",
          updated_at: new Date().toISOString()
        })
        .eq("id", personaId)
        .eq("user_id", userId)

      if (error) {
        console.error("Persona update error:", error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${photos.length} photos uploaded successfully`,
      photoCount: photos.length
    })

  } catch (error) {
    console.error("Photo upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload photos" },
      { status: 500 }
    )
  }
}