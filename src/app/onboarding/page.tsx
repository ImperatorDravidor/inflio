"use client"

import { useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { SeamlessOnboarding } from '@/components/onboarding/seamless-onboarding'

export default function OnboardingPage() {
  const { userId } = useAuth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  return <SeamlessOnboarding userId={userId} />
}