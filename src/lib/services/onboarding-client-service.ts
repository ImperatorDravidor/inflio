/**
 * Client-side onboarding service for browser use
 * This service is specifically designed for client components
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export interface OnboardingFormData {
  [key: string]: any
}

export class OnboardingClientService {
  /**
   * Initialize or ensure user profile exists
   */
  static async ensureProfile(userId: string, email?: string): Promise<boolean> {
    try {
      console.log('[Onboarding] ensureProfile called for:', userId)
      const supabase = createSupabaseBrowserClient()

      // Check if profile exists
      const { data: existing, error: selectError } = await supabase
        .from('user_profiles')
        .select('clerk_user_id')
        .eq('clerk_user_id', userId)
        .maybeSingle()

      console.log('[Onboarding] ensureProfile check:', {
        exists: !!existing,
        selectError: selectError ? JSON.stringify(selectError) : null
      })

      if (!existing) {
        console.log('[Onboarding] Creating new profile...')
        // Create minimal profile
        const { data: insertData, error } = await supabase
          .from('user_profiles')
          .insert({
            clerk_user_id: userId,
            email: email || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()

        if (error) {
          console.error('[Onboarding] Error creating profile:', error)
          console.error('[Onboarding] Error details:', JSON.stringify(error, null, 2))
          return false
        }
        console.log('[Onboarding] Profile created:', !!insertData)
      }

      return true
    } catch (error) {
      console.error('[Onboarding] Error ensuring profile:', error)
      return false
    }
  }
  
  /**
   * Save onboarding progress - uses API route to bypass RLS
   */
  static async saveProgress(
    userId: string,
    step: number,
    stepId: string,
    formData: OnboardingFormData
  ): Promise<boolean> {
    try {
      console.log('[Onboarding] saveProgress called:', {
        userId,
        step,
        stepId,
        hasBrandAnalysis: !!formData.brandAnalysis,
        hasBrandIdentity: !!formData.brandIdentity,
        formDataKeys: Object.keys(formData)
      })

      // Build the request body for the API
      const requestBody: any = {
        clerkUserId: userId,
        step,
        stepId,
        onboarding_completed: step === 4 && stepId === 'review',

        // Map key form fields
        fullName: formData.fullName,
        companyName: formData.companyName,
        bio: formData.bio,
        title: formData.title,
        industry: formData.industry,
        audience: formData.audience,
        email: formData.email,

        // Brand data - send to both fields
        brandAnalysis: formData.brandAnalysis || formData.brandIdentity,
        brandIdentity: formData.brandIdentity || formData.brandAnalysis,

        // Progress tracking
        onboarding_progress: {
          step,
          stepId,
          formData,
          savedAt: new Date().toISOString()
        }
      }

      console.log('[Onboarding] Calling API with brand data:', {
        hasBrandAnalysis: !!requestBody.brandAnalysis,
        hasBrandIdentity: !!requestBody.brandIdentity,
        brandKeys: requestBody.brandAnalysis ? Object.keys(requestBody.brandAnalysis) : []
      })

      // Call the API route which uses service role key (bypasses RLS)
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('[Onboarding] API SAVE FAILED:', {
          status: response.status,
          error: result.error,
          details: result.details
        })
        return false
      }

      console.log('[Onboarding] API SAVE SUCCESS:', {
        success: result.success,
        hasBrandIdentity: !!result.profile?.brand_identity,
        hasBrandAnalysis: !!result.profile?.brand_analysis
      })

      return true
    } catch (error) {
      console.error('[Onboarding] Client save error:', error)
      // Don't block user progress
      return true
    }
  }
  
  /**
   * Load saved progress with retry logic
   */
  static async loadProgress(userId: string, retries = 3): Promise<any> {
    let lastError: any = null

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('clerk_user_id', userId)
          .maybeSingle()

        if (error) {
          throw error
        }

        // Success - process the data
        return this.processLoadedProgress(data)
      } catch (error) {
        lastError = error
        console.warn(`[Onboarding] Load attempt ${attempt + 1}/${retries} failed:`, error)

        if (attempt < retries - 1) {
          // Wait before retrying (100ms, 200ms, 400ms)
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)))
        }
      }
    }

    // All retries failed
    console.error('[Onboarding] All load attempts failed:', lastError)
    return {
      step: 0,
      stepId: 'welcome',
      formData: {}
    }
  }

  /**
   * Process loaded progress data
   */
  private static processLoadedProgress(data: any): any {
    if (!data) {
      return {
        step: 0,
        stepId: 'welcome',
        formData: {}
      }
    }

    // Get saved progress or default
    const savedProgress = data.onboarding_progress || {
      step: 0,
      stepId: 'welcome',
      formData: {}
    }

    // Merge individual profile fields into formData for pre-filling
    // This ensures data is restored even if onboarding_progress JSON is incomplete
    const mergedFormData = {
      ...savedProgress.formData,
      // Restore from direct profile columns
      fullName: savedProgress.formData?.fullName || data.full_name || '',
      companyName: savedProgress.formData?.companyName || data.company_name || '',
      bio: savedProgress.formData?.bio || data.bio || '',
      title: savedProgress.formData?.title || data.title || '',
      industry: savedProgress.formData?.industry || data.industry || '',
      audience: savedProgress.formData?.audience || data.target_audience || '',
      brandAnalysis: savedProgress.formData?.brandAnalysis || data.brand_analysis || null,
      brandIdentity: savedProgress.formData?.brandIdentity || data.brand_identity || null,
      personaId: savedProgress.formData?.personaId || data.persona_id || null,
      personaSkipped: savedProgress.formData?.personaSkipped || data.persona_skipped || false,
      brandAnalysisSkipped: savedProgress.formData?.brandAnalysisSkipped || data.brand_analysis_skipped || false,
      brandAnalysisCompleted: savedProgress.formData?.brandAnalysisCompleted || data.brand_analysis_completed || false
    }

    const result = {
      step: data.onboarding_step || savedProgress.step || 0,
      stepId: data.onboarding_step_id || savedProgress.stepId || 'welcome',
      formData: mergedFormData
    }

    console.log('[Onboarding] Loaded progress:', {
      step: result.step,
      stepId: result.stepId,
      hasBrandAnalysis: !!result.formData.brandAnalysis,
      hasBrandIdentity: !!result.formData.brandIdentity,
      brandAnalysisInDb: !!data.brand_analysis,
      brandIdentityInDb: !!data.brand_identity,
      formDataKeys: Object.keys(result.formData).filter(k => result.formData[k])
    })

    return result
  }

  /**
   * Complete onboarding - calls API to finalize
   */
  static async completeOnboarding(userId: string): Promise<boolean> {
    try {
      console.log('[Onboarding] completeOnboarding called for:', userId)

      // First load current progress to get brand data
      const progress = await this.loadProgress(userId)
      const formData = progress.formData || {}

      // Call API to complete onboarding
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: userId,
          onboarding_completed: true,
          step: 4,
          stepId: 'complete',

          // Include brand data
          brandAnalysis: formData.brandAnalysis || formData.brandIdentity,
          brandIdentity: formData.brandIdentity || formData.brandAnalysis,

          // Include other important data
          fullName: formData.fullName,
          companyName: formData.companyName,
          industry: formData.industry,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        console.warn('[Onboarding] Complete API warning:', result.error)
      }

      return true
    } catch (error) {
      console.error('[Onboarding] Complete error:', error)
      return true
    }
  }
  
  /**
   * Skip onboarding - calls API
   */
  static async skipOnboarding(userId: string): Promise<boolean> {
    try {
      console.log('[Onboarding] skipOnboarding called for:', userId)

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: userId,
          onboarding_completed: true,
          step: 0,
          stepId: 'skipped',
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        console.warn('[Onboarding] Skip API warning:', result.error)
      }

      return true
    } catch (error) {
      console.error('[Onboarding] Skip error:', error)
      return true
    }
  }
}
