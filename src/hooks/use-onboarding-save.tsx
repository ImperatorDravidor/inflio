import { useState, useCallback, useRef } from 'react'
import { OnboardingService } from '@/lib/services/onboarding-service'
import { toast } from 'sonner'

interface UseOnboardingSaveProps {
  userId: string
  currentStep: number
  stepId: string
}

export function useOnboardingSave({ userId, currentStep, stepId }: UseOnboardingSaveProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState<string>()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const saveProgress = useCallback(async (formData: any, showToast = false) => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    setSaveStatus('saving')
    setSaveMessage(undefined)
    
    try {
      const success = await OnboardingService.saveProgress(
        userId,
        currentStep,
        stepId,
        formData
      )
      
      if (success) {
        setSaveStatus('saved')
        if (showToast) {
          toast.success('Progress saved', {
            description: 'Your information has been saved successfully'
          })
        }
        
        // Reset to idle after 3 seconds
        saveTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle')
        }, 3000)
      } else {
        setSaveStatus('error')
        setSaveMessage('Failed to save progress')
        if (showToast) {
          toast.error('Save failed', {
            description: "We couldn't save your progress. Please try again."
          })
        }
      }
    } catch (error) {
      console.error('Save error:', error)
      setSaveStatus('error')
      setSaveMessage('An unexpected error occurred')
      if (showToast) {
        toast.error('Error', {
          description: 'An unexpected error occurred while saving'
        })
      }
    }
  }, [userId, currentStep, stepId, toast])
  
  // Auto-save function with debouncing
  const autoSave = useCallback((formData: any) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveProgress(formData, false)
    }, 1500) // Save after 1.5 seconds of inactivity
  }, [saveProgress])
  
  return {
    saveStatus,
    saveMessage,
    saveProgress,
    autoSave
  }
}
