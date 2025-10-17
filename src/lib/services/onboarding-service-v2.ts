import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { currentUser } from '@clerk/nextjs/server'

export interface OnboardingFormData {
  [key: string]: any
}

export class OnboardingServiceV2 {
  /**
   * Save onboarding progress - simplified and more robust version
   */
  static async saveProgress(
    userId: string,
    step: number,
    stepId: string,
    formData: OnboardingFormData
  ): Promise<boolean> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Build the profile data
      const profileData: any = {
        clerk_user_id: userId,
        updated_at: new Date().toISOString()
      }
      
      // Add onboarding tracking
      profileData.onboarding_step = step
      profileData.onboarding_step_id = stepId
      
      // Map form data to profile columns
      if (formData.fullName || formData.name) {
        profileData.full_name = formData.fullName || formData.name
      }
      if (formData.email) {
        profileData.email = formData.email
      }
      if (formData.title) {
        profileData.title = formData.title
      }
      if (formData.companyName) {
        profileData.company_name = formData.companyName
      }
      if (formData.bio) {
        profileData.bio = formData.bio
      }
      if (formData.industry) {
        profileData.industry = formData.industry
      }
      if (formData.audience) {
        profileData.target_audience = formData.audience
      }
      
      // Handle brand data
      if (formData.brandIdentity) {
        profileData.brand_identity = formData.brandIdentity
      }
      if (formData.brandAnalysis) {
        profileData.brand_analysis = formData.brandAnalysis
      }
      
      // Handle persona
      if (formData.personaId) {
        profileData.persona_id = formData.personaId
      }
      
      // Track completion states
      if (formData.onboardingCompleted) {
        profileData.onboarding_completed = true
        profileData.onboarding_completed_at = new Date().toISOString()
      }
      if (formData.brandReviewed) {
        profileData.brand_reviewed = true
      }
      if (formData.personaReviewed) {
        profileData.persona_reviewed = true
      }
      if (formData.socialsConnected) {
        profileData.socials_connected = true
      }
      
      // Store the full form data as JSON for recovery
      profileData.onboarding_progress = {
        step,
        stepId,
        formData,
        lastSaved: new Date().toISOString()
      }
      
      // First, try to get existing profile
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .maybeSingle()
      
      let result
      if (existing) {
        // Update existing profile
        result = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('clerk_user_id', userId)
      } else {
        // Create new profile
        result = await supabase
          .from('user_profiles')
          .insert(profileData)
      }
      
      if (result.error) {
        console.error('Onboarding save error:', {
          operation: existing ? 'update' : 'insert',
          error: result.error,
          userId,
          step,
          stepId
        })
        return false
      }
      
      console.log('Onboarding progress saved successfully', {
        userId,
        step,
        stepId,
        operation: existing ? 'updated' : 'created'
      })
      
      return true
    } catch (error) {
      console.error('Unexpected error saving onboarding:', error)
      return false
    }
  }
  
  /**
   * Load saved onboarding progress
   */
  static async loadProgress(userId: string): Promise<any | null> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clerk_user_id', userId)
        .maybeSingle()
      
      if (error) {
        console.error('Error loading onboarding progress:', error)
        return null
      }
      
      // Return the saved progress or empty object
      return data?.onboarding_progress || {
        currentStep: 0,
        completedSteps: [],
        formData: {}
      }
    } catch (error) {
      console.error('Unexpected error loading onboarding:', error)
      return null
    }
  }
  
  /**
   * Mark onboarding as complete
   */
  static async completeOnboarding(userId: string): Promise<boolean> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', userId)
      
      if (error) {
        console.error('Error completing onboarding:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Unexpected error completing onboarding:', error)
      return false
    }
  }
  
  /**
   * Skip onboarding for later
   */
  static async skipOnboarding(userId: string): Promise<boolean> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_skipped: true,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', userId)
      
      if (error) {
        console.error('Error skipping onboarding:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Unexpected error skipping onboarding:', error)
      return false
    }
  }
}
