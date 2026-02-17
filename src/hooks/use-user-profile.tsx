"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export interface UserProfile {
  id: string
  clerk_user_id: string
  email: string
  full_name?: string
  company_name?: string
  industry?: string
  company_size?: string
  role?: string
  content_types: string[]
  target_audience: {
    age_groups: string[]
    interests: string[]
    description: string
  }
  content_goals: string[]
  brand_colors: {
    primary: string
    secondary: string
    accent: string
  }
  brand_fonts: {
    heading: string
    body: string
  }
  brand_voice?: string
  brand_assets: {
    logo_url?: string
    watermark_url?: string
  }
  video_style?: string
  transition_style?: string
  music_preference?: string
  primary_platforms: string[]
  posting_schedule: {
    frequency: string
    preferred_times: string[]
  }
  ai_tone: string
  auto_suggestions: boolean
  preferred_clip_length: number
  onboarding_completed: boolean
  onboarding_step: number
}

export type ContentData = Record<string, unknown>

export function useUserProfile() {
  const { user, isLoaded: isClerkLoaded } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/onboarding?clerkUserId=${user.id}`)
      
      // Check if response is OK before parsing
      if (!response.ok) {
        console.error(`Profile fetch failed: ${response.status} ${response.statusText}`)
        setError(`Failed to load profile: ${response.status}`)
        setIsLoading(false)
        return
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Profile fetch returned non-JSON response:", contentType)
        setError("Server returned invalid response")
        setIsLoading(false)
        return
      }

      const data = await response.json()
      
      if (data.profile) {
        setProfile(data.profile)
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError(err instanceof Error ? err.message : "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isClerkLoaded) {
      fetchProfile()
    }
  }, [isClerkLoaded, fetchProfile])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id || !profile) return

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("clerk_user_id", user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      
      // Track preference changes
      if (updates.brand_colors || updates.brand_voice || updates.video_style) {
        await trackPreferenceChange(profile.id, updates)
      }

      return data
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile")
      throw err
    }
  }

  const trackContentInteraction = async (
    contentType: string,
    contentData: ContentData,
    feedback: "liked" | "edited" | "rejected"
  ) => {
    if (!profile) return

    try {
      await supabase
        .from("user_content_history")
        .insert({
          user_profile_id: profile.id,
          content_type: contentType,
          content_data: contentData,
          user_feedback: { action: feedback, timestamp: new Date() }
        })
    } catch (err) {
      console.error("Error tracking interaction:", err)
    }
  }

  const trackPreferenceChange = async (
    profileId: string,
    changes: Partial<UserProfile>
  ) => {
    const entries = Object.entries(changes).map(([key, value]) => ({
      user_profile_id: profileId,
      preference_type: key,
      new_value: value,
      old_value: profile?.[key as keyof UserProfile]
    }))

    try {
      await supabase
        .from("user_preferences_history")
        .insert(entries)
    } catch (err) {
      console.error("Error tracking preference changes:", err)
    }
  }

  const needsOnboarding = Boolean(isClerkLoaded && user && !isLoading && !profile?.onboarding_completed)

  return {
    profile,
    isLoading,
    error,
    needsOnboarding,
    updateProfile,
    trackContentInteraction,
    refetch: fetchProfile
  }
}

// Context provider for user profile
import { createContext, useContext, ReactNode } from "react"

interface UserProfileContextType {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  needsOnboarding: boolean
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | undefined>
  trackContentInteraction: (
    contentType: string,
    contentData: ContentData,
    feedback: "liked" | "edited" | "rejected"
  ) => Promise<void>
  refetch: () => Promise<void>
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined)

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const profileData = useUserProfile()

  return (
    <UserProfileContext.Provider value={profileData}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(UserProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within a UserProfileProvider")
  }
  return context
} 
