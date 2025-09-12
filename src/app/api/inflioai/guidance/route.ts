import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GPT5Service } from '@/lib/gpt5-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userName, currentStep, completedSteps, totalSteps } = await request.json()

    // Get contextual guidance from InflioAI
    const guidance = await GPT5Service.getInflioAIGuidance({
      userName,
      currentStep,
      completedSteps,
      totalSteps
    })

    return NextResponse.json({ 
      message: guidance,
      success: true
    })
  } catch (error) {
    console.error('InflioAI guidance error:', error)
    
    // Fallback messages for each step
    const fallbacks: Record<string, string> = {
      profile: "Setting up your profile helps me understand your unique style - I'll use this to create content that sounds exactly like you.",
      brand: "Your brand guide ensures every piece of content matches your visual identity perfectly - no more inconsistent designs.",
      avatar: "Training your AI avatar means professional thumbnails in seconds - no more hiring designers or spending hours in Photoshop.",
      connect: "Connecting your platforms lets you publish everywhere with one click - each post optimized for each platform automatically.",
      upload: "Upload any video and watch me transform it into 30+ pieces of content - this is where the magic really happens!",
      completed: "You're all set! From now on, just upload videos and I'll handle everything else - let's create something amazing together!"
    }
    
    const { currentStep } = await request.json()
    const fallbackMessage = fallbacks[currentStep] || fallbacks.profile
    
    return NextResponse.json({ 
      message: fallbackMessage,
      success: true,
      fallback: true
    })
  }
}
