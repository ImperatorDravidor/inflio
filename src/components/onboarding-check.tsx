"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useProfile } from "@/hooks/use-user-profile"
import { useAuth } from "@clerk/nextjs"

export function OnboardingCheck() {
  const router = useRouter()
  const pathname = usePathname()
  const { userId, isLoaded: isAuthLoaded } = useAuth()
  const { profile, needsOnboarding, isLoading } = useProfile()

  useEffect(() => {
    // Don't do anything while auth or profile is loading
    if (!isAuthLoaded || isLoading) return
    
    // If not authenticated, do nothing (middleware handles this)
    if (!userId) return
    
    // Skip check for public pages and API routes
    const publicPaths = ["/", "/sign-in", "/sign-up", "/login", "/api"]
    if (publicPaths.some(path => pathname.startsWith(path))) return
    
    // If already on onboarding page
    if (pathname.startsWith("/onboarding")) {
      // If onboarding is already completed, redirect to dashboard
      if (profile?.onboarding_completed === true) {
        console.log("Onboarding already completed, redirecting to dashboard")
        router.push("/dashboard")
      }
      // Otherwise stay on onboarding page
      return
    }
    
    // For all other pages (dashboard, projects, etc.)
    // If user needs onboarding (no profile or onboarding not completed)
    if (needsOnboarding || profile?.onboarding_completed === false) {
      console.log("User needs onboarding, redirecting...")
      router.push("/onboarding")
    }
  }, [userId, isAuthLoaded, profile, needsOnboarding, isLoading, pathname, router])

  return null
} 
