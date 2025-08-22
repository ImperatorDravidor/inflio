"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { 
  Sparkles, ChevronRight, ChevronLeft, Check, Upload,
  Twitter, Instagram, Linkedin, Youtube, Facebook, Globe,
  Palette, Type, Camera, Hash, MessageSquare, Zap,
  Shield, ArrowRight, User, Briefcase, Target, TrendingUp,
  Heart, Star, Gift, Rocket, Crown, Brain, Circle, LayoutGrid, Video
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { OnboardingService } from '@/lib/services/onboarding-service'
import { PersonaUploadService } from '@/lib/services/persona-upload-service'
import { designSystem } from '@/lib/design-system'

interface SeamlessOnboardingProps {
  userId: string
  onComplete?: () => void
}

const steps = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
  { id: 'platforms', title: 'Platforms', icon: Globe, color: 'from-blue-500 to-cyan-500' },
  { id: 'profile', title: 'Profile', icon: User, color: 'from-green-500 to-emerald-500' },
  { id: 'brand', title: 'Brand', icon: Palette, color: 'from-orange-500 to-red-500' },
  { id: 'photos', title: 'Photos', icon: Camera, color: 'from-purple-500 to-indigo-500' },
  { id: 'content', title: 'Content', icon: MessageSquare, color: 'from-pink-500 to-rose-500' },
  { id: 'ai', title: 'AI Setup', icon: Brain, color: 'from-cyan-500 to-blue-500' },
  { id: 'legal', title: 'Privacy', icon: Shield, color: 'from-gray-600 to-gray-800' }
]

export function SeamlessOnboarding({ userId, onComplete }: SeamlessOnboardingProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)
  
  // Load saved progress on mount
  useEffect(() => {
    const loadSavedProgress = async () => {
      try {
        const progress = await OnboardingService.loadProgress(userId)
        if (progress) {
          setCurrentStep(progress.currentStep || 0)
          setFormData(progress.formData || {})
        }
      } catch (error) {
        console.error('Failed to load progress:', error)
      } finally {
        setIsLoadingProgress(false)
      }
    }
    
    loadSavedProgress()
  }, [userId])

  // Auto-save on step change
  useEffect(() => {
    const saveData = async () => {
      if (currentStep > 0 && currentStep < steps.length - 1 && !isSaving) {
        setIsSaving(true)
        try {
          await OnboardingService.saveProgress(userId, currentStep, formData, steps[currentStep].id)
        } catch (error) {
          console.error('Failed to save progress:', error)
        } finally {
          setIsSaving(false)
        }
      }
    }
    
    saveData()
  }, [currentStep, formData, userId])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentStep < steps.length - 1) {
        handleNext()
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        handleBack()
      } else if (e.key === 'Enter' && currentStep === steps.length - 1 && formData.acceptedTerms && formData.dataConsent) {
        handleComplete()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, formData])

  const handleComplete = async () => {
    console.log('🚀 Starting onboarding completion...')
    console.log('Form data:', formData)
    
    setIsLoading(true)
    try {
      console.log('Calling OnboardingService.completeOnboarding...')
      const success = await OnboardingService.completeOnboarding(userId, formData)
      console.log('Completion result:', success)
      
      if (success) {
        console.log('✅ Onboarding completed successfully! Redirecting to dashboard...')
        onComplete?.()
        // Force navigation with window.location for a hard refresh
        window.location.href = '/dashboard'
      } else {
        console.error('❌ Failed to complete onboarding, trying with minimal data...')
        // Try again with minimal data
        const minimalSuccess = await OnboardingService.completeOnboarding(userId, {
          ...formData,
          acceptedTerms: true,
          dataConsent: true
        })
        if (minimalSuccess) {
          console.log('✅ Minimal completion successful! Redirecting...')
          window.location.href = '/dashboard'
        } else {
          console.error('❌ Minimal completion also failed. Force redirecting...')
          window.location.href = '/dashboard'
        }
      }
    } catch (error) {
      console.error('🔥 Onboarding completion error:', error)
      console.log('Force redirecting to dashboard anyway...')
      // Last resort - try to navigate anyway
      window.location.href = '/dashboard'
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDevBypass = async () => {
    // Allow in development mode
    if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_NODE_ENV !== 'development') return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/dev-bypass-onboarding', {
        method: 'POST'
      })
      if (response.ok) {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Dev bypass failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  // Step progress calculation
  const progress = ((currentStep + 1) / steps.length) * 100
  
  // Show loading state while fetching saved progress
  if (isLoadingProgress) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Image
            src={theme === 'dark' ? '/infliologodark.svg' : '/infliologo.svg'}
            alt="Inflio"
            width={150}
            height={50}
            className="mx-auto"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 mx-auto"
          >
            <Sparkles className="h-12 w-12 text-primary" />
          </motion.div>
          <p className="text-muted-foreground">Loading your progress...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted/20">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 h-20 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <Image
            src={theme === 'dark' ? '/infliologodark.svg' : '/infliologo.svg'}
            alt="Inflio"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
          
          {/* Dev bypass button - only in development */}
          {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_NODE_ENV === 'development') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDevBypass}
              disabled={isLoading}
              className="ml-4 text-xs border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                  </motion.div>
                  Bypassing...
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  Dev: Skip Onboarding
                </>
              )}
            </Button>
          )}
        </div>

        {/* Step indicators */}
        <div className="hidden md:flex items-center gap-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-2",
                index < steps.length - 1 && "mr-2"
              )}
            >
              <motion.div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  index < currentStep && "bg-primary text-primary-foreground",
                  index === currentStep && "bg-gradient-to-r ring-2 ring-primary ring-offset-2 text-white",
                  index > currentStep && "bg-muted text-muted-foreground",
                  index === currentStep && `bg-gradient-to-r ${step.color}`
                )}
                animate={{
                  scale: index === currentStep ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </motion.div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-12 h-0.5 transition-all",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Save indicator and Skip button */}
        <div className="flex items-center gap-4">
          {isSaving && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-3 w-3" />
              </motion.div>
              Saving...
            </motion.div>
          )}
          
          {currentStep < steps.length - 1 && currentStep > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="relative z-10 h-[calc(100vh-11rem)] flex items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full max-w-4xl"
          >
            {/* Welcome Step */}
            {currentStep === 0 && (
              <div className="text-center space-y-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto"
                >
                  <Image
                    src={theme === 'dark' ? '/infliologodark.svg' : '/infliologo.svg'}
                    alt="Inflio"
                    width={180}
                    height={60}
                    className="mx-auto"
                  />
                </motion.div>
                
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Welcome to Inflio
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Let's set up your AI-powered content creation workspace in just a few minutes
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  {[
                    { icon: Rocket, title: "Quick Setup", description: "5 minutes to get started" },
                    { icon: Brain, title: "AI Powered", description: "Personalized to your brand" },
                    { icon: Crown, title: "Premium Tools", description: "Professional content creation" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="p-6 rounded-xl bg-card border"
                    >
                      <item.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Platforms Step */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">Where do you create?</h2>
                  <p className="text-muted-foreground">Select the platforms you're active on</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {[
                    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600', borderColor: 'hover:border-red-500' },
                    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-purple-500 to-pink-500', borderColor: 'hover:border-pink-500' },
                    { id: 'tiktok', name: 'TikTok', icon: Hash, color: 'from-gray-800 to-black', borderColor: 'hover:border-gray-800' },
                    { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'from-gray-700 to-black', borderColor: 'hover:border-gray-700' },
                    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-700', borderColor: 'hover:border-blue-600' },
                    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-500 to-blue-700', borderColor: 'hover:border-blue-700' }
                  ].map((platform, i) => (
                    <motion.button
                      key={platform.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const platforms = formData.platforms || []
                        const updated = platforms.includes(platform.id)
                          ? platforms.filter(p => p !== platform.id)
                          : [...platforms, platform.id]
                        updateFormData('platforms', updated)
                      }}
                      className={cn(
                        "relative p-6 rounded-xl border-2 transition-all overflow-hidden group",
                        formData.platforms?.includes(platform.id)
                          ? "border-primary shadow-lg"
                          : "border-border",
                        platform.borderColor
                      )}
                    >
                      {formData.platforms?.includes(platform.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 20 }}
                          className={cn(
                            "absolute inset-0 rounded-full opacity-10 bg-gradient-to-br",
                            platform.color
                          )}
                        />
                      )}
                      
                      <div className="relative">
                        <platform.icon className={cn(
                          "h-8 w-8 mx-auto mb-2 transition-transform",
                          formData.platforms?.includes(platform.id) && "scale-110"
                        )} />
                        <span className="text-sm font-medium">{platform.name}</span>
                        {formData.platforms?.includes(platform.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <Check className="h-4 w-4 text-primary mx-auto mt-2" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="max-w-md mx-auto space-y-3">
                  <label className="text-sm font-medium">Your main platform handle</label>
                  <Input
                    placeholder="@username"
                    value={formData.handle || ''}
                    onChange={(e) => updateFormData('handle', e.target.value)}
                    className="text-center text-lg"
                  />
                </div>
              </div>
            )}

            {/* Profile Step */}
            {currentStep === 2 && (
              <div className="space-y-8 max-w-2xl mx-auto">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">Tell us about yourself</h2>
                  <p className="text-muted-foreground">Help our AI understand your content style</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Your Name</label>
                    <Input
                      placeholder="John Doe"
                      value={formData.name || ''}
                      onChange={(e) => updateFormData('name', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Industry/Niche</label>
                    <Input
                      placeholder="Tech, Fashion, Gaming..."
                      value={formData.industry || ''}
                      onChange={(e) => updateFormData('industry', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    placeholder="Tell us about your content and what makes it unique..."
                    value={formData.bio || ''}
                    onChange={(e) => updateFormData('bio', e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Content Pillars</label>
                  <div className="flex flex-wrap gap-2">
                    {['Education', 'Entertainment', 'Inspiration', 'Behind-the-scenes', 'Tutorials', 'Reviews', 'News', 'Lifestyle'].map((pillar) => (
                      <Button
                        key={pillar}
                        variant={formData.pillars?.includes(pillar) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const pillars = formData.pillars || []
                          const updated = pillars.includes(pillar)
                            ? pillars.filter(p => p !== pillar)
                            : [...pillars, pillar]
                          updateFormData('pillars', updated)
                        }}
                      >
                        {pillar}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Brand Step */}
            {currentStep === 3 && (
              <div className="space-y-8 max-w-2xl mx-auto">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">Define your brand</h2>
                  <p className="text-muted-foreground">Create a consistent visual identity</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Primary Color</label>
                    <div className="flex gap-2">
                      {['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'].map((color) => (
                        <button
                          key={color}
                          onClick={() => updateFormData('primaryColor', color)}
                          className={cn(
                            "w-12 h-12 rounded-lg transition-all",
                            formData.primaryColor === color && "ring-2 ring-offset-2 ring-primary"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Font Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Modern', 'Classic', 'Playful', 'Bold'].map((font) => (
                        <Button
                          key={font}
                          variant={formData.fontStyle === font ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateFormData('fontStyle', font)}
                        >
                          {font}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Brand Voice</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'professional', label: 'Professional', icon: Briefcase },
                      { id: 'casual', label: 'Casual', icon: Heart },
                      { id: 'funny', label: 'Funny', icon: Star },
                      { id: 'inspiring', label: 'Inspiring', icon: TrendingUp },
                      { id: 'educational', label: 'Educational', icon: Target },
                      { id: 'authentic', label: 'Authentic', icon: User }
                    ].map((voice) => (
                      <Button
                        key={voice.id}
                        variant={formData.voice === voice.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFormData('voice', voice.id)}
                        className="h-auto py-3"
                      >
                        <voice.icon className="h-4 w-4 mr-1" />
                        {voice.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Logo (Optional)</label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Drop your logo here or click to browse</p>
                  </div>
                </div>
              </div>
            )}

            {/* Photos Step */}
            {currentStep === 4 && (
              <div className="space-y-8 max-w-3xl mx-auto">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">Train your AI persona</h2>
                  <p className="text-muted-foreground">Upload 10-20 photos for personalized thumbnails</p>
                </div>

                <div className="border-2 border-dashed rounded-xl p-12 text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Drop photos here</h3>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <Button variant="outline">
                    Choose Photos
                  </Button>
                </div>

                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {uploadedPhotos.map((photo, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="aspect-square rounded-lg bg-muted"
                      />
                    ))}
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Pro Tips
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Include various angles and expressions</li>
                    <li>• Use high-quality, well-lit photos</li>
                    <li>• More photos = better AI results</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Content Step */}
            {currentStep === 5 && (
              <div className="space-y-8 max-w-2xl mx-auto">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">Content preferences</h2>
                  <p className="text-muted-foreground">What type of content do you create?</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Content Types</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'short', label: 'Shorts/Reels', icon: Zap },
                        { id: 'long', label: 'Long-form', icon: Video },
                        { id: 'carousel', label: 'Carousels', icon: LayoutGrid },
                        { id: 'stories', label: 'Stories', icon: Circle }
                      ].map((type) => (
                        <Button
                          key={type.id}
                          variant={formData.contentTypes?.includes(type.id) ? "default" : "outline"}
                          onClick={() => {
                            const types = formData.contentTypes || []
                            const updated = types.includes(type.id)
                              ? types.filter(t => t !== type.id)
                              : [...types, type.id]
                            updateFormData('contentTypes', updated)
                          }}
                          className="h-auto py-4"
                        >
                          <type.icon className="h-5 w-5 mr-2" />
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-3 block">Posting Frequency</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Daily', '2-3/week', 'Weekly'].map((freq) => (
                        <Button
                          key={freq}
                          variant={formData.frequency === freq ? "default" : "outline"}
                          onClick={() => updateFormData('frequency', freq)}
                        >
                          {freq}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-3 block">Primary Goal</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'growth', label: 'Grow audience', icon: TrendingUp },
                        { id: 'engagement', label: 'Boost engagement', icon: Heart },
                        { id: 'monetize', label: 'Monetization', icon: Gift },
                        { id: 'brand', label: 'Build brand', icon: Crown }
                      ].map((goal) => (
                        <Button
                          key={goal.id}
                          variant={formData.goal === goal.id ? "default" : "outline"}
                          onClick={() => updateFormData('goal', goal.id)}
                          className="h-auto py-3"
                        >
                          <goal.icon className="h-4 w-4 mr-2" />
                          {goal.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Setup Step */}
            {currentStep === 6 && (
              <div className="space-y-8 max-w-2xl mx-auto">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">Configure your AI assistant</h2>
                  <p className="text-muted-foreground">Personalize how AI creates content for you</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Caption Style</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        'Short & punchy',
                        'Detailed & informative',
                        'Story-driven',
                        'Question-based'
                      ].map((style) => (
                        <Button
                          key={style}
                          variant={formData.captionStyle === style ? "default" : "outline"}
                          onClick={() => updateFormData('captionStyle', style)}
                        >
                          {style}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-3 block">Hashtag Strategy</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Minimal (5-10)', 'Moderate (10-20)', 'Maximum (20-30)'].map((strategy) => (
                        <Button
                          key={strategy}
                          variant={formData.hashtagStrategy === strategy ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateFormData('hashtagStrategy', strategy)}
                        >
                          {strategy}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-3 block">Call-to-Action Preference</label>
                    <div className="space-y-2">
                      {[
                        { id: 'subscribe', label: 'Subscribe/Follow focused' },
                        { id: 'engage', label: 'Comment/Like focused' },
                        { id: 'link', label: 'Link click focused' },
                        { id: 'mixed', label: 'Mixed CTAs' }
                      ].map((cta) => (
                        <Button
                          key={cta.id}
                          variant={formData.ctaPreference === cta.id ? "default" : "outline"}
                          onClick={() => updateFormData('ctaPreference', cta.id)}
                          className="w-full justify-start"
                        >
                          {cta.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-3 block">Language</label>
                    <select
                      className="w-full p-2 rounded-lg border bg-background"
                      value={formData.language || 'en'}
                      onChange={(e) => updateFormData('language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="pt">Portuguese</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Legal Step */}
            {currentStep === 7 && (
              <div className="space-y-8 max-w-2xl mx-auto">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">Almost there!</h2>
                  <p className="text-muted-foreground">Review and accept our terms</p>
                  
                  {/* Quick complete for dev */}
                  {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_NODE_ENV === 'development') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateFormData('acceptedTerms', true)
                        updateFormData('dataConsent', true)
                        updateFormData('marketingConsent', true)
                      }}
                      className="text-xs"
                    >
                      Dev: Accept All
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={formData.acceptedTerms || false}
                        onChange={(e) => updateFormData('acceptedTerms', e.target.checked)}
                        className="mt-1"
                      />
                      <label htmlFor="terms" className="text-sm">
                        I agree to the <a href="/terms" className="text-primary underline">Terms of Service</a> and <a href="/privacy" className="text-primary underline">Privacy Policy</a>
                      </label>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="consent"
                        checked={formData.dataConsent || false}
                        onChange={(e) => updateFormData('dataConsent', e.target.checked)}
                        className="mt-1"
                      />
                      <label htmlFor="consent" className="text-sm">
                        I consent to Inflio processing my data to provide personalized AI services
                      </label>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="updates"
                        checked={formData.marketingConsent || false}
                        onChange={(e) => updateFormData('marketingConsent', e.target.checked)}
                        className="mt-1"
                      />
                      <label htmlFor="updates" className="text-sm">
                        Send me tips, updates, and special offers (optional)
                      </label>
                    </div>
                  </div>

                  <motion.div 
                    className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-6 text-center space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div 
                      className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    >
                      <motion.div
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      >
                        <Check className="h-10 w-10 text-white" />
                      </motion.div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="space-y-2"
                    >
                      <h3 className="font-bold text-xl">You're all set! 🎉</h3>
                      <p className="text-sm text-muted-foreground">
                        Welcome to the Inflio family. Let's create something amazing together!
                      </p>
                    </motion.div>
                    
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1, type: "spring", stiffness: 200 }}
                      className="flex justify-center gap-2 pt-2"
                    >
                      {['🚀', '✨', '🎨', '🎬', '📈'].map((emoji, i) => (
                        <motion.span
                          key={i}
                          className="text-2xl"
                          animate={{ 
                            y: [0, -10, 0],
                            rotate: [-5, 5, -5]
                          }}
                          transition={{
                            duration: 2,
                            delay: 1.2 + i * 0.1,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        >
                          {emoji}
                        </motion.span>
                      ))}
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      <div className="absolute bottom-0 left-0 right-0 h-24 px-8 flex items-center justify-between bg-gradient-to-t from-background to-transparent">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 0}
          className={cn(
            "transition-opacity",
            currentStep === 0 && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-2 md:hidden">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentStep ? "w-8 bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <Button
          onClick={currentStep === steps.length - 1 ? handleComplete : handleNext}
          disabled={
            (currentStep === 7 && (!formData.acceptedTerms || !formData.dataConsent)) ||
            isLoading
          }
          className="min-w-[120px]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
              Setting up...
            </span>
          ) : currentStep === steps.length - 1 ? (
            <>
              Complete
              <Check className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}