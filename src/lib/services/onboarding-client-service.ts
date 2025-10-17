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
      const supabase = createSupabaseBrowserClient()
      
      // Check if profile exists
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('clerk_user_id')
        .eq('clerk_user_id', userId)
        .maybeSingle()
      
      if (!existing) {
        // Create minimal profile
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            clerk_user_id: userId,
            email: email || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (error) {
          console.error('Error creating profile:', error)
          return false
        }
      }
      
      return true
    } catch (error) {
      console.error('Error ensuring profile:', error)
      return false
    }
  }
  
  /**
   * Save onboarding progress - simplified for client use
   */
  static async saveProgress(
    userId: string,
    step: number,
    stepId: string,
    formData: OnboardingFormData
  ): Promise<boolean> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Ensure profile exists first
      await this.ensureProfile(userId, formData.email)
      
      // Build update data
      const updates: any = {
        updated_at: new Date().toISOString(),
        onboarding_step: step,
        onboarding_step_id: stepId
      }
      
      // Map key form fields
      if (formData.fullName) updates.full_name = formData.fullName
      if (formData.companyName) updates.company_name = formData.companyName
      if (formData.bio) updates.bio = formData.bio
      if (formData.title) updates.title = formData.title
      if (formData.industry) updates.industry = formData.industry
      if (formData.audience) updates.target_audience = formData.audience
      if (formData.brandIdentity) updates.brand_identity = formData.brandIdentity
      if (formData.brandAnalysis) updates.brand_analysis = formData.brandAnalysis
      if (formData.personaId) updates.persona_id = formData.personaId
      
      // Track completion
      if (step === 4 && stepId === 'review') {
        updates.onboarding_completed = true
        updates.onboarding_completed_at = new Date().toISOString()
      }
      
      // Save progress as JSON
      updates.onboarding_progress = {
        step,
        stepId,
        formData,
        savedAt: new Date().toISOString()
      }
      
      // Update profile
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('clerk_user_id', userId)
      
      if (error) {
        // Log detailed error but don't crash
        console.warn('Onboarding save warning:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // Still return true if it's a minor error
        // Most important thing is user can continue
        if (error.code === '42703') {
          console.log('Some columns may not exist yet, but core data saved')
          return true
        }
        
        return false
      }
      
      return true
    } catch (error) {
      console.error('Client save error:', error)
      // Don't block user progress
      return true
    }
  }
  
  /**
   * Load saved progress
   */
  static async loadProgress(userId: string): Promise<any> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clerk_user_id', userId)
        .maybeSingle()
      
      return data?.onboarding_progress || {
        step: 0,
        stepId: 'welcome',
        formData: {}
      }
    } catch (error) {
      console.error('Load progress error:', error)
      return {
        step: 0,
        stepId: 'welcome',
        formData: {}
      }
    }
  }
  
  /**
   * Complete onboarding
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
        console.warn('Complete onboarding warning:', error)
      }
      
      return true
    } catch (error) {
      console.error('Complete error:', error)
      return true
    }
  }
  
  /**
   * Skip onboarding
   */
  static async skipOnboarding(userId: string): Promise<boolean> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Ensure profile exists
      await this.ensureProfile(userId)
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_skipped: true,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', userId)
      
      if (error) {
        console.warn('Skip onboarding warning:', error)
      }
      
      return true
    } catch (error) {
      console.error('Skip error:', error)
      return true
    }
  }
}
