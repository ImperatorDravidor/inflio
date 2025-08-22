"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  Sparkles,
  User,
  Paintbrush,
  Target,
  ChevronLeft,
  ChevronRight,
  Layers,
  Link2,
  Camera,
  Settings,
  Shield,
  Check,
  ArrowRight,
  Zap,
  Trophy,
  Rocket,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Import step components
import { PlatformConnectionStep } from './platform-connection-step'
import { PhotoUploadStep } from './photo-upload-step'
import { CreatorProfileStep } from './creator-profile-step'
import { BrandIdentityStep } from './brand-identity-step'
import { ContentPreferencesStep } from './content-preferences-step'
import { AIPersonalizationStep } from './ai-personalization-step'
import { LegalConsentStep } from './legal-consent-step'
import { OnboardingService } from '@/lib/services/onboarding-service'

const steps = [
  { 
    id: 'welcome', 
    title: 'Welcome', 
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    description: 'Start your AI content journey'
  },
  { 
    id: 'platforms', 
    title: 'Platforms', 
    icon: Link2,
    color: 'from-blue-500 to-cyan-500',
    description: 'Connect your social channels'
  },
  { 
    id: 'profile', 
    title: 'Profile', 
    icon: User,
    color: 'from-green-500 to-emerald-500',
    description: 'Tell us about yourself'
  },
  { 
    id: 'brand', 
    title: 'Brand', 
    icon: Paintbrush,
    color: 'from-orange-500 to-red-500',
    description: 'Define your visual identity'
  },
  { 
    id: 'visuals', 
    title: 'Photos', 
    icon: Camera,
    color: 'from-purple-500 to-indigo-500',
    description: 'Upload photos for AI personas'
  },
  { 
    id: 'preferences', 
    title: 'Content', 
    icon: Settings,
    color: 'from-teal-500 to-green-500',
    description: 'Set your content preferences'
  },
  { 
    id: 'ai', 
    title: 'AI Setup', 
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    description: 'Personalize your AI assistant'
  },
  { 
    id: 'legal', 
    title: 'Privacy', 
    icon: Shield,
    color: 'from-gray-500 to-slate-500',
    description: 'Review terms and privacy'
  }
]

export function OnboardingFlow() {
  const router = useRouter()
  const { user } = useUser()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [formData, setFormData] = useState<any>({})
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  // Load saved progress
  useEffect(() => {
    if (user?.id) {
      loadProgress()
    }
  }, [user])

  const loadProgress = async () => {
    if (!user?.id) return
    
    const progress = await OnboardingService.loadProgress(user.id)
    if (progress) {
      setFormData(progress.formData)
      setCompletedSteps(progress.completedSteps)
      if (progress.currentStep > 0) {
        setCurrentStep(progress.currentStep)
        toast.info('Welcome back! Resuming where you left off.')
      }
    }
  }

  const saveProgress = useCallback(async () => {
    if (!user?.id) return
    
    await OnboardingService.saveProgress(
      user.id,
      currentStep,
      formData,
      steps[currentStep]?.id
    )
  }, [user, currentStep, formData])

  // Auto-save on step change
  useEffect(() => {
    if (currentStep > 0) {
      saveProgress()
    }
  }, [currentStep, saveProgress])

  const handleNext = async () => {
    const currentStepId = steps[currentStep].id
    
    // Validate current step
    const validation = OnboardingService.validateStep(currentStepId, formData)
    
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error))
      return
    }
    
    if (validation.warnings.length > 0 && !showSkipWarning) {
      validation.warnings.forEach(warning => toast.warning(warning))
      setShowSkipWarning(true)
      setTimeout(() => setShowSkipWarning(false), 3000)
    }
    
    // Mark step as completed
    if (!completedSteps.includes(currentStepId)) {
      setCompletedSteps([...completedSteps, currentStepId])
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      await handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleComplete = async () => {
    if (!user?.id) return
    
    setIsSubmitting(true)
    
    try {
      // Final validation
      const allValid = steps.every(step => {
        if (step.id === 'welcome') return true
        const validation = OnboardingService.validateStep(step.id, formData)
        return validation.isValid || validation.errors.length === 0
      })
      
      if (!allValid) {
        toast.error('Please complete all required fields')
        setIsSubmitting(false)
        return
      }
      
      // Save to database
      const success = await OnboardingService.completeOnboarding(user.id, formData)
      
      if (success) {
        // Celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        
        toast.success('🎉 Welcome to Inflio! Your AI is ready to create amazing content!')
        
        // Get personalized recommendations
        const recommendations = OnboardingService.getRecommendations(formData)
        if (recommendations.length > 0) {
          setTimeout(() => {
            toast.info(recommendations[0])
          }, 2000)
        }
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      }
    } catch (error) {
      console.error('Completion error:', error)
      toast.error('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100
  const completionPercentage = OnboardingService.calculateCompletion({ 
    formData, 
    completedSteps,
    currentStep,
    lastSaved: '',
    isComplete: false
  })

  const CurrentStepComponent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return <WelcomeStep user={user} />
      case 'platforms':
        return (
          <PlatformConnectionStep
            platforms={formData.platforms || {}}
            onPlatformsChange={(platforms) => setFormData({...formData, platforms})}
            googleDriveUrl={formData.googleDriveUrl}
            dropboxUrl={formData.dropboxUrl}
            onStorageChange={(storage) => setFormData({
              ...formData, 
              googleDriveUrl: storage.googleDrive,
              dropboxUrl: storage.dropbox
            })}
          />
        )
      case 'profile':
        return (
          <CreatorProfileStep
            data={formData}
            onChange={(updates) => setFormData({...formData, ...updates})}
          />
        )
      case 'brand':
        return (
          <BrandIdentityStep
            data={formData}
            onChange={(updates) => setFormData({...formData, ...updates})}
          />
        )
      case 'visuals':
        return (
          <PhotoUploadStep
            onPhotosChange={(photos, analysis) => setFormData({
              ...formData,
              uploadedPhotos: photos,
              photoAnalysis: analysis
            })}
            initialPhotos={formData.uploadedPhotos}
          />
        )
      case 'preferences':
        return (
          <ContentPreferencesStep
            data={formData}
            onChange={(updates) => setFormData({...formData, ...updates})}
          />
        )
      case 'ai':
        return (
          <AIPersonalizationStep
            data={formData}
            onChange={(updates) => setFormData({...formData, ...updates})}
          />
        )
      case 'legal':
        return (
          <LegalConsentStep
            data={formData}
            onChange={(updates) => setFormData({...formData, ...updates})}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)'
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8">
        {/* Temporary Skip Button - Top Right */}
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                // Simple approach - just mark as completed via API
                if (user) {
                  const response = await fetch('/api/onboarding/skip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                  })
                  
                  if (!response.ok) {
                    console.warn('Failed to save skip status, but continuing anyway')
                  }
                }
                
                // Navigate regardless of save status
                router.push('/dashboard')
              } catch (error) {
                console.error('Skip onboarding error:', error)
                // Force navigation even if save fails
                router.push('/dashboard')
              }
            }}
            className="text-muted-foreground hover:text-foreground border border-muted-foreground/20 hover:border-muted-foreground/40"
          >
            Skip for now →
          </Button>
        </div>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Layers className="h-8 w-8 text-primary" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Inflio Setup
            </h1>
          </div>
          <p className="text-muted-foreground">
            {currentStep === 0 
              ? "Let's build your personalized AI content engine"
              : `Step ${currentStep} of ${steps.length - 1} • ${completionPercentage}% complete`
            }
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <div className="mb-8">
          {/* Progress Bar */}
          <div className="relative mb-6">
            <Progress value={progress} className="h-2" />
            <motion.div
              className="absolute top-0 h-2 bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between relative">
            {/* Connection Line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10" />
            
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = completedSteps.includes(step.id) || index < currentStep
              const Icon = step.icon
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isCompleted || index === 0) {
                        setCurrentStep(index)
                      }
                    }}
                    disabled={!isCompleted && index !== 0 && index !== currentStep}
                    className={cn(
                      "relative w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      "ring-4 ring-background",
                      isActive && "ring-primary/20",
                      isCompleted && "cursor-pointer"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full h-full rounded-full flex items-center justify-center",
                        "bg-gradient-to-br transition-all",
                        isActive ? step.color : isCompleted ? 'from-primary to-primary' : 'from-muted to-muted'
                      )}
                    >
                      {isCompleted && !isActive ? (
                        <Check className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Icon className={cn(
                          "h-4 w-4",
                          isActive || isCompleted ? 'text-white' : 'text-muted-foreground'
                        )} />
                      )}
                    </div>
                    
                    {/* Pulse animation for active step */}
                    {isActive && (
                      <motion.div
                        className={cn("absolute inset-0 rounded-full bg-gradient-to-br", step.color)}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ opacity: 0.3 }}
                      />
                    )}
                  </motion.button>
                  
                  {/* Step Label */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-20 text-center">
                    <p className={cn(
                      "text-xs font-medium transition-colors",
                      isActive ? 'text-foreground' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {step.title}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Main Content Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-2xl border-muted/50 backdrop-blur-sm bg-background/95">
            {/* Step Header */}
            <div className={cn(
              "p-6 bg-gradient-to-br text-white rounded-t-lg",
              steps[currentStep].color
            )}>
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = steps[currentStep].icon
                  return <Icon className="h-8 w-8" />
                })()}
                <div>
                  <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
                  <p className="text-white/90">{steps[currentStep].description}</p>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <CurrentStepComponent />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="p-6 border-t bg-muted/30 rounded-b-lg">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                <div className="flex items-center gap-4">
                  {/* Skip option for non-critical steps */}
                  {currentStep > 0 && currentStep < steps.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(steps.length - 1)}
                      className="text-muted-foreground"
                    >
                      Skip to legal
                    </Button>
                  )}

                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className={cn(
                      "gap-2 min-w-[120px]",
                      currentStep === steps.length - 1 && "bg-gradient-to-r from-primary to-accent"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkles className="h-4 w-4" />
                        </motion.div>
                        Finishing...
                      </>
                    ) : currentStep === steps.length - 1 ? (
                      <>
                        <Rocket className="h-4 w-4" />
                        Launch Inflio
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress Stats */}
              {currentStep > 0 && (
                <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span>{completedSteps.length} steps completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span>{completionPercentage}% profile complete</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Tips & Motivation */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-muted-foreground">
              💡 Tip: {getTipForStep(steps[currentStep].id)}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function WelcomeStep({ user }: { user: any }) {
  return (
    <div className="text-center py-12 space-y-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
      >
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
          <Sparkles className="h-12 w-12 text-white" />
        </div>
      </motion.div>

      <div className="space-y-4">
        <h2 className="text-4xl font-bold">
          Welcome to Inflio, {user?.firstName || 'Creator'}!
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your AI-powered content engine is about to transform how you create and share content across all platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {[
          { icon: Zap, title: 'AI-Powered', desc: 'Smart content generation' },
          { icon: Target, title: 'Multi-Platform', desc: 'Optimized for every channel' },
          { icon: Rocket, title: 'Time-Saving', desc: '10x faster content creation' }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
          >
            <Card className="p-4">
              <feature.icon className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Badge variant="secondary" className="px-4 py-2">
          <Sparkles className="h-4 w-4 mr-2" />
          Setup takes ~5 minutes • No technical skills required
        </Badge>
      </motion.div>
    </div>
  )
}

function getTipForStep(stepId: string): string {
  const tips: Record<string, string> = {
    platforms: 'Connect more platforms for wider reach and better content distribution',
    profile: 'The more we know about you, the better your AI performs',
    brand: 'Consistent branding increases recognition by 80%',
    visuals: 'High-quality photos create stunning AI-generated thumbnails',
    preferences: 'Set your workflow to match how you like to work',
    ai: 'Fine-tune your AI to write exactly like you',
    legal: 'Your content and data are always yours'
  }
  return tips[stepId] || 'You\'re doing great!'
}