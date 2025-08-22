import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export interface OnboardingProgress {
  currentStep: number
  completedSteps: string[]
  formData: any
  lastSaved: string
  isComplete: boolean
}

export interface OnboardingValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class OnboardingService {
  /**
   * Save onboarding progress to database
   */
  static async saveProgress(
    userId: string,
    step: number,
    formData: any,
    stepId?: string
  ): Promise<boolean> {
    try {
      // Use browser client for client-side operations
      const supabase = createSupabaseBrowserClient()
      
      // Get existing profile
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('onboarding_progress')
        .eq('clerk_user_id', userId)
        .single()
      
      const currentProgress = existingProfile?.onboarding_progress || {
        completedSteps: [],
        formData: {}
      }
      
      // Update progress
      const updatedProgress = {
        currentStep: step,
        completedSteps: stepId && !currentProgress.completedSteps.includes(stepId) 
          ? [...currentProgress.completedSteps, stepId]
          : currentProgress.completedSteps,
        formData: { ...currentProgress.formData, ...formData },
        lastSaved: new Date().toISOString()
      }
      
      // Save to database
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          clerk_user_id: userId,
          onboarding_progress: updatedProgress,
          onboarding_step: step,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'clerk_user_id'
        })
      
      if (error) {
        console.error('Error saving progress:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return false
      }
      
      return true
    } catch (error) {
      console.error('Save progress error:', {
        error,
        userId,
        step,
        stepId
      })
      return false
    }
  }

  /**
   * Load saved onboarding progress
   */
  static async loadProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('onboarding_progress, onboarding_step, onboarding_completed')
        .eq('clerk_user_id', userId)
        .single()
      
      if (error || !data) {
        return null
      }
      
      return {
        currentStep: data.onboarding_step || 0,
        completedSteps: data.onboarding_progress?.completedSteps || [],
        formData: data.onboarding_progress?.formData || {},
        lastSaved: data.onboarding_progress?.lastSaved || '',
        isComplete: data.onboarding_completed || false
      }
    } catch (error) {
      console.error('Load progress error:', error)
      return null
    }
  }

  /**
   * Validate step data
   */
  static validateStep(stepId: string, data: any): OnboardingValidation {
    const errors: string[] = []
    const warnings: string[] = []
    
    switch (stepId) {
      case 'platforms':
        // At least one platform required
        const hasPlatform = Object.values(data.platforms || {}).some((p: any) => p.handle)
        if (!hasPlatform) {
          errors.push('Please add at least one social media handle')
        }
        break
        
      case 'profile':
        if (!data.fullName?.trim()) {
          errors.push('Full name is required')
        }
        if (!data.bio?.trim()) {
          errors.push('Bio is required to personalize your AI')
        }
        if (!data.contentPillars || data.contentPillars.length < 3) {
          errors.push('Please add at least 3 content pillars')
        }
        if (data.contentPillars?.length > 5) {
          warnings.push('Consider focusing on 3-5 main content pillars')
        }
        break
        
      case 'brand':
        if (!data.brandVoice) {
          errors.push('Please select a brand voice')
        }
        if (!data.brandColors?.primary) {
          warnings.push('Adding brand colors helps maintain consistency')
        }
        break
        
      case 'visuals':
        // Photos are handled separately
        if (!data.photoCount || data.photoCount < 5) {
          warnings.push('Upload at least 5 photos for best AI results')
        }
        if (data.photoCount && data.photoCount < 10) {
          warnings.push('10+ photos recommended for optimal persona training')
        }
        break
        
      case 'preferences':
        if (!data.contentTypes || data.contentTypes.length === 0) {
          errors.push('Select at least one content type')
        }
        if (!data.distributionMode) {
          errors.push('Please select a distribution mode')
        }
        break
        
      case 'ai':
        if (!data.captionStyle) {
          warnings.push('Selecting a caption style helps personalize your content')
        }
        if (!data.ctaPreferences || data.ctaPreferences.length === 0) {
          warnings.push('Adding CTAs improves engagement')
        }
        break
        
      case 'legal':
        if (!data.consentRepurpose) {
          errors.push('Content repurposing consent is required')
        }
        if (!data.mediaRelease) {
          errors.push('Media release is required for AI-generated content')
        }
        if (!data.privacyAccepted) {
          errors.push('You must accept the privacy policy to continue')
        }
        break
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Calculate overall onboarding completion percentage
   */
  static calculateCompletion(progress: OnboardingProgress): number {
    const totalSteps = 8 // Including welcome
    const requiredFields = [
      'platforms',
      'fullName',
      'bio',
      'contentPillars',
      'brandVoice',
      'contentTypes',
      'distributionMode',
      'consentRepurpose',
      'mediaRelease',
      'privacyAccepted'
    ]
    
    let completedFields = 0
    const data = progress.formData
    
    // Check platforms
    if (data.platforms && Object.values(data.platforms).some((p: any) => p.handle)) {
      completedFields++
    }
    
    // Check other fields
    if (data.fullName?.trim()) completedFields++
    if (data.bio?.trim()) completedFields++
    if (data.contentPillars?.length >= 3) completedFields++
    if (data.brandVoice) completedFields++
    if (data.contentTypes?.length > 0) completedFields++
    if (data.distributionMode) completedFields++
    if (data.consentRepurpose) completedFields++
    if (data.mediaRelease) completedFields++
    if (data.privacyAccepted) completedFields++
    
    return Math.round((completedFields / requiredFields.length) * 100)
  }

  /**
   * Get personalized recommendations based on profile
   */
  static getRecommendations(formData: any): string[] {
    const recommendations: string[] = []
    
    // Platform-specific recommendations
    if (formData.platforms?.youtube?.handle) {
      recommendations.push('Set up YouTube chapters for better engagement')
    }
    if (formData.platforms?.instagram?.handle) {
      recommendations.push('Create Instagram Reels from your long-form content')
    }
    if (formData.platforms?.linkedin?.handle) {
      recommendations.push('Repurpose content into LinkedIn articles')
    }
    
    // Content type recommendations
    if (formData.contentTypes?.includes('Podcasts')) {
      recommendations.push('Generate show notes and timestamps automatically')
    }
    if (formData.contentTypes?.includes('Long-form')) {
      recommendations.push('Create clips and highlights for social media')
    }
    
    // Industry-specific recommendations
    if (formData.industry === 'Education') {
      recommendations.push('Create educational carousels and infographics')
    }
    if (formData.industry === 'Technology') {
      recommendations.push('Generate technical blog posts from videos')
    }
    
    return recommendations
  }

  /**
   * Check if user needs onboarding
   */
  static async needsOnboarding(userId: string): Promise<boolean> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('clerk_user_id', userId)
        .single()
      
      if (error || !data) {
        return true // New user needs onboarding
      }
      
      return !data.onboarding_completed
    } catch (error) {
      console.error('Check onboarding error:', error)
      return true // Default to requiring onboarding
    }
  }

  /**
   * Complete onboarding
   */
  static async completeOnboarding(userId: string, finalData: any): Promise<boolean> {
    try {
      // Call the API endpoint instead of direct DB update
      // This ensures all the proper setup is done (personas, social integrations, etc.)
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: userId,
          email: finalData.email,
          
          // Platform Access
          platforms: finalData.platforms || {},
          googleDriveUrl: finalData.googleDriveUrl,
          dropboxUrl: finalData.dropboxUrl,
          calendarAccess: finalData.calendarAccess,
          emailPlatform: finalData.emailPlatform,
          
          // Creator Profile
          fullName: finalData.fullName,
          title: finalData.title,
          companyName: finalData.companyName,
          bio: finalData.bio,
          industry: finalData.industry,
          audience: finalData.audience,
          mission: finalData.mission,
          contentPurpose: finalData.contentPurpose,
          contentPillars: finalData.contentPillars,
          
          // Brand Identity
          brandColors: finalData.brandColors,
          fonts: finalData.fonts,
          logoUrl: finalData.logoUrl,
          brandVoice: finalData.brandVoice,
          tagline: finalData.tagline,
          missionStatement: finalData.missionStatement,
          competitors: finalData.competitors,
          inspirationLinks: finalData.inspirationLinks,
          
          // Content Preferences
          contentTypes: finalData.contentTypes,
          distributionMode: finalData.distributionMode,
          historicalContent: finalData.historicalContent,
          
          // AI Personalization
          captionStyle: finalData.captionStyle,
          ctaPreferences: finalData.ctaPreferences,
          newsletterStyle: finalData.newsletterStyle,
          languagePreferences: finalData.languagePreferences,
          toneReferences: finalData.toneReferences,
          
          // Legal
          consentRepurpose: finalData.consentRepurpose,
          mediaRelease: finalData.mediaRelease,
          privacyAccepted: finalData.privacyAccepted,
          
          // Photo upload info
          photoCount: finalData.photoCount || 0,
          
          // Completion
          completedAt: new Date().toISOString(),
          onboarding_completed: true
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Complete onboarding error:', error)
        return false
      }
      
      const result = await response.json()
      
      // Clear local progress after successful completion
      const supabase = createSupabaseBrowserClient()
      await supabase
        .from('user_profiles')
        .update({
          onboarding_progress: null,
          onboarding_step: 8
        })
        .eq('clerk_user_id', userId)
      
      return result.success === true
    } catch (error) {
      console.error('Complete onboarding error:', error)
      return false
    }
  }
}