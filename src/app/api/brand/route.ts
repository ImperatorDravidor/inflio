import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Update brand identity
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { brand_identity, section, updates } = body

    // If section and updates provided, merge into existing brand_identity
    let finalBrandIdentity = brand_identity
    if (section && updates && !brand_identity) {
      // Get current brand identity
      const { data: current } = await supabase
        .from("user_profiles")
        .select("brand_identity")
        .eq("clerk_user_id", userId)
        .single()

      finalBrandIdentity = {
        ...current?.brand_identity,
        [section]: updates
      }
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        brand_identity: finalBrandIdentity,
        updated_at: new Date().toISOString()
      })
      .eq("clerk_user_id", userId)
      .select("brand_identity")
      .single()

    if (error) {
      console.error("Brand update error:", error)
      return NextResponse.json(
        { error: "Failed to update brand", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      brand_identity: data.brand_identity
    })
  } catch (error) {
    console.error("Brand API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Get brand data
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("brand_identity, brand_analysis, full_name, company_name, onboarding_progress")
      .eq("clerk_user_id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ brand_identity: null })
      }
      throw error
    }

    // Use brand_identity if available, otherwise fall back to brand_analysis
    let brandProfile = data.brand_identity || data.brand_analysis

    // Fallback: check onboarding_progress.formData
    if (!brandProfile && data.onboarding_progress?.formData) {
      brandProfile = data.onboarding_progress.formData.brandIdentity ||
                     data.onboarding_progress.formData.brandAnalysis
    }

    return NextResponse.json({
      brand_identity: brandProfile,
      full_name: data.full_name,
      company_name: data.company_name
    })
  } catch (error) {
    console.error("Brand GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
