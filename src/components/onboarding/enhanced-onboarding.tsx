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
  Heart, Star, Gift, Rocket, Crown, Brain, Circle, LayoutGrid, 
  Video, Info, HelpCircle, PlayCircle, FileText, BarChart,
  Clock, Users, Wand2, ImageIcon, PenTool, Share2, Layers,
  Lightbulb, Settings, AlertCircle, CheckCircle, TrendingDown,
  Bot, Megaphone, Calendar, DollarSign, Award, BookOpen,
  Monitor, Smartphone, Coffee, Music, Gamepad, Dumbbell,
  ShoppingBag, Plane, Home, Brush, Code, HeadphonesIcon,
  X, Loader2, ChevronDown, ExternalLink, Mail, LucideIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { OnboardingService } from '@/lib/services/onboarding-service'
import { PersonaUploadService } from '@/lib/services/persona-upload-service'
import { designSystem } from '@/lib/design-system'

interface EnhancedOnboardingProps {
  userId: string
  onComplete?: () => void
}

// Define app features with benefits
const APP_FEATURES = [
  {
    icon: Bot,
    title: 'AI Content Engine',
    description: 'Transform videos into 50+ content pieces instantly',
    benefit: 'Save 10+ hours per week on content creation'
  },
  {
    icon: ImageIcon,
    title: 'Smart Thumbnails',
    description: 'AI-generated thumbnails that get clicks',
    benefit: 'Increase CTR by up to 300%'
  },
  {
    icon: PenTool,
    title: 'Caption Optimizer',
    description: 'Platform-specific captions that drive engagement',
    benefit: 'Boost engagement by 2-5x'
  },
  {
    icon: Calendar,
    title: 'Content Calendar',
    description: 'Schedule across all platforms from one place',
    benefit: 'Never miss a posting opportunity'
  },
  {
    icon: BarChart,
    title: 'Analytics Hub',
    description: 'Track performance across all channels',
    benefit: 'Make data-driven content decisions'
  },
  {
    icon: Wand2,
    title: 'AI Persona',
    description: 'Train AI on your unique style and voice',
    benefit: 'Maintain consistent brand identity'
  }
]

// Platform configuration with detailed info
const PLATFORMS_CONFIG = [
  { 
    id: 'youtube', 
    name: 'YouTube', 
    icon: Youtube, 
    color: 'from-red-500 to-red-600',
    benefits: ['Auto-generate chapters', 'Smart thumbnails', 'SEO optimization'],
    metrics: '2.5B+ monthly users'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: Instagram, 
    color: 'from-purple-500 to-pink-500',
    benefits: ['Reels from long-form', 'Story templates', 'Hashtag research'],
    metrics: '2B+ monthly users'
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    icon: Hash, 
    color: 'from-gray-800 to-black',
    benefits: ['Viral clip detection', 'Trend analysis', 'Sound matching'],
    metrics: '1B+ monthly users'
  },
  { 
    id: 'twitter', 
    name: 'X (Twitter)', 
    icon: Twitter, 
    color: 'from-gray-700 to-black',
    benefits: ['Thread generation', 'Quote cards', 'Engagement timing'],
    metrics: '500M+ monthly users'
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: Linkedin, 
    color: 'from-blue-600 to-blue-700',
    benefits: ['Professional tone', 'Article creation', 'B2B optimization'],
    metrics: '900M+ professionals'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: Facebook, 
    color: 'from-blue-500 to-blue-700',
    benefits: ['Group posting', 'Event promotion', 'Community building'],
    metrics: '3B+ monthly users'
  }
]

// Industries with icons
const INDUSTRIES_WITH_ICONS = [
  { name: 'Technology', icon: Code },
  { name: 'Education', icon: BookOpen },
  { name: 'Healthcare', icon: Heart },
  { name: 'Finance', icon: DollarSign },
  { name: 'E-commerce', icon: ShoppingBag },
  { name: 'Marketing', icon: Megaphone },
  { name: 'Entertainment', icon: Music },
  { name: 'Fashion', icon: Brush },
  { name: 'Food & Beverage', icon: Coffee },
  { name: 'Travel', icon: Plane },
  { name: 'Real Estate', icon: Home },
  { name: 'Fitness', icon: Dumbbell },
  { name: 'Gaming', icon: Gamepad },
  { name: 'Photography', icon: Camera },
  { name: 'Music', icon: HeadphonesIcon },
  { name: 'Art & Design', icon: Palette },
]

// Enhanced step configuration
const ENHANCED_STEPS = [
  { 
    id: 'welcome', 
    title: 'Welcome to Inflio', 
    subtitle: 'Your AI-powered content studio',
    icon: Sparkles, 
    color: 'from-purple-500 to-pink-500',
    description: 'Transform your content creation workflow with AI'
  },
  { 
    id: 'platforms', 
    title: 'Connect Platforms', 
    subtitle: 'Where do you share your content?',
    icon: Share2, 
    color: 'from-blue-500 to-cyan-500',
    description: 'We\'ll optimize content for each platform\'s algorithm'
  },
  { 
    id: 'profile', 
    title: 'Creator Profile', 
    subtitle: 'Tell us about yourself',
    icon: User, 
    color: 'from-green-500 to-emerald-500',
    description: 'This helps AI understand your unique voice and style'
  },
  { 
    id: 'brand', 
    title: 'Brand Identity', 
    subtitle: 'Define your visual style',
    icon: Palette, 
    color: 'from-orange-500 to-red-500',
    description: 'Maintain consistent branding across all content'
  },
  { 
    id: 'photos', 
    title: 'AI Persona Training', 
    subtitle: 'Upload photos for personalized thumbnails',
    icon: Camera, 
    color: 'from-purple-500 to-indigo-500',
    description: 'Create eye-catching thumbnails with your face'
  },
  { 
    id: 'content', 
    title: 'Content Preferences', 
    subtitle: 'What type of content do you create?',
    icon: LayoutGrid, 
    color: 'from-pink-500 to-rose-500',
    description: 'We\'ll tailor our AI to your content format'
  },
  { 
    id: 'ai', 
    title: 'AI Configuration', 
    subtitle: 'Personalize your AI assistant',
    icon: Brain, 
    color: 'from-cyan-500 to-blue-500',
    description: 'Fine-tune how AI creates content for you'
  },
  { 
    id: 'final', 
    title: 'Ready to Launch', 
    subtitle: 'Review and get started',
    icon: Rocket, 
    color: 'from-green-500 to-emerald-500',
    description: 'Complete setup and start creating amazing content'
  }
]

export function EnhancedOnboarding({ userId, onComplete }: EnhancedOnboardingProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSkipDialog, setShowSkipDialog] = useState(false)
  
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
      if (currentStep > 0 && currentStep < ENHANCED_STEPS.length - 1 && !isSaving) {
        setIsSaving(true)
        try {
          await OnboardingService.saveProgress(
            userId, 
            currentStep, 
            formData, 
            ENHANCED_STEPS[currentStep].id
          )
        } catch (error) {
          console.error('Failed to save progress:', error)
        } finally {
          setIsSaving(false)
        }
      }
    }
    
    saveData()
  }, [currentStep, formData, userId])

  const validateStep = (stepId: string): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (stepId) {
      case 'platforms':
        if (!formData.platforms || formData.platforms.length === 0) {
          newErrors.platforms = 'Please select at least one platform'
        }
        break
      
      case 'profile':
        if (!formData.name?.trim()) {
          newErrors.name = 'Name is required'
        }
        if (!formData.bio?.trim() || formData.bio.length < 20) {
          newErrors.bio = 'Please provide at least 20 characters about yourself'
        }
        break
      
      case 'brand':
        if (!formData.primaryColor) {
          newErrors.primaryColor = 'Please select a primary color'
        }
        if (!formData.voice) {
          newErrors.voice = 'Please select your brand voice'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    const currentStepId = ENHANCED_STEPS[currentStep].id
    
    // Skip validation for welcome step
    if (currentStep === 0 || validateStep(currentStepId)) {
      if (currentStep < ENHANCED_STEPS.length - 1) {
        setCurrentStep(currentStep + 1)
        setErrors({})
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setErrors({})
    }
  }

  const handleSkip = () => {
    if (currentStep < ENHANCED_STEPS.length - 2) {
      setShowSkipDialog(true)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const success = await OnboardingService.completeOnboarding(userId, {
        ...formData,
        acceptedTerms: true,
        dataConsent: true
      })
      
      if (success) {
        onComplete?.()
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Onboarding completion error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }))
  }

  // Calculate progress
  const progress = ((currentStep + 1) / ENHANCED_STEPS.length) * 100
  
  // Show loading state
  if (isLoadingProgress) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          {/* Logo with proper contrast */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl opacity-20" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Inflio
            </h1>
          </div>
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto"
          >
            <Sparkles className="h-16 w-16 text-primary" />
          </motion.div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium">Setting up your workspace...</p>
            <p className="text-sm text-muted-foreground">This will only take a moment</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/10 overflow-hidden">
        {/* Enhanced background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0]
            }}
            transition={{ duration: 25, repeat: Infinity }}
          />
        </div>

        {/* Enhanced progress bar */}
        <div className="absolute top-0 left-0 right-0">
          <Progress value={progress} className="h-1" />
          <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        </div>

        {/* Enhanced header */}
        <div className="relative z-10 h-20 flex items-center justify-between px-8 bg-background/80 backdrop-blur-xl border-b">
          <div className="flex items-center gap-4">
            {/* Enhanced logo */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-50" />
                <Sparkles className="h-8 w-8 text-primary relative" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Inflio
                </h1>
                <p className="text-xs text-muted-foreground">AI Content Studio</p>
              </div>
            </div>
          </div>

          {/* Enhanced step indicators */}
          <div className="hidden lg:flex items-center gap-3">
            {ENHANCED_STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              
              return (
                <div key={step.id} className="flex items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className={cn(
                          "relative flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer",
                          isActive && "ring-2 ring-primary ring-offset-2",
                          isCompleted && "bg-primary text-primary-foreground",
                          !isActive && !isCompleted && "bg-muted text-muted-foreground"
                        )}
                        animate={{
                          scale: isActive ? 1.1 : 1,
                        }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => {
                          if (isCompleted) setCurrentStep(index)
                        }}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                        {isActive && (
                          <motion.div
                            className={cn(
                              "absolute inset-0 rounded-full bg-gradient-to-r opacity-20",
                              step.color
                            )}
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {index < ENHANCED_STEPS.length - 1 && (
                    <div className={cn(
                      "w-12 h-0.5 mx-1 transition-all",
                      index < currentStep ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Help and save status */}
          <div className="flex items-center gap-3">
            {isSaving && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </motion.div>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHelp(true)}
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Get help</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Main content area */}
        <div className="relative z-10 h-[calc(100vh-11rem)] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="min-h-full flex items-center justify-center px-8 py-12"
            >
              {/* Welcome Step - Enhanced */}
              {currentStep === 0 && (
                <div className="max-w-5xl w-full space-y-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center space-y-6"
                  >
                    <div className="relative inline-block">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl opacity-30"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      <h1 className="relative text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                        Welcome to Inflio
                      </h1>
                    </div>
                    
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                      Transform your content creation with AI that understands your unique voice and style.
                      Join thousands of creators saving 10+ hours per week.
                    </p>

                    {/* Value proposition cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
                      {[
                        {
                          icon: Clock,
                          title: "Save 10+ Hours Weekly",
                          description: "Automate repetitive tasks and focus on creativity"
                        },
                        {
                          icon: TrendingUp,
                          title: "3x Your Engagement",
                          description: "AI-optimized content that resonates with your audience"
                        },
                        {
                          icon: Award,
                          title: "Professional Quality",
                          description: "Studio-grade content creation at your fingertips"
                        }
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="p-6 rounded-xl bg-card border hover:border-primary/50 transition-all hover:shadow-lg group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <item.icon className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Feature showcase */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="mt-12"
                    >
                      <h3 className="text-lg font-medium mb-6 text-muted-foreground">
                        What you'll get with Inflio:
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                        {APP_FEATURES.map((feature, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7 + i * 0.05 }}
                            whileHover={{ y: -2 }}
                            className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-all cursor-pointer group"
                          >
                            <feature.icon className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                            <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                            <p className="text-xs text-muted-foreground">{feature.benefit}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Social proof */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="flex items-center justify-center gap-8 mt-8 pt-8 border-t"
                    >
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">50,000+</div>
                        <div className="text-sm text-muted-foreground">Active Creators</div>
                      </div>
                      <Separator orientation="vertical" className="h-12" />
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">10M+</div>
                        <div className="text-sm text-muted-foreground">Content Created</div>
                      </div>
                      <Separator orientation="vertical" className="h-12" />
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">4.9/5</div>
                        <div className="text-sm text-muted-foreground">User Rating</div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              )}

              {/* Platforms Step - Enhanced */}
              {currentStep === 1 && (
                <div className="max-w-4xl w-full space-y-8">
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center"
                    >
                      <Share2 className="h-8 w-8 text-white" />
                    </motion.div>
                    
                    <div>
                      <h2 className="text-3xl font-bold">Where do you share content?</h2>
                      <p className="text-muted-foreground mt-2">
                        Select your platforms and we'll optimize content for each one's algorithm and best practices
                      </p>
                    </div>

                    {/* Why we need this info */}
                    <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                      <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-sm font-medium">Why we need this:</p>
                          <p className="text-sm text-muted-foreground">
                            Each platform has unique requirements - aspect ratios, caption lengths, hashtag strategies, and posting times. 
                            We'll automatically adapt your content for maximum impact on each platform.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PLATFORMS_CONFIG.map((platform, i) => {
                      const Icon = platform.icon
                      const isSelected = formData.platforms?.includes(platform.id)
                      
                      return (
                        <motion.div
                          key={platform.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={cn(
                              "p-6 cursor-pointer transition-all",
                              isSelected && "border-primary shadow-lg",
                              "hover:border-primary/50"
                            )}
                            onClick={() => {
                              const platforms = formData.platforms || []
                              const updated = platforms.includes(platform.id)
                                ? platforms.filter((p: string) => p !== platform.id)
                                : [...platforms, platform.id]
                              updateFormData('platforms', updated)
                            }}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-r",
                                  platform.color
                                )}>
                                  <Icon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold">{platform.name}</h3>
                                  <p className="text-xs text-muted-foreground">{platform.metrics}</p>
                                </div>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                                >
                                  <Check className="h-4 w-4 text-primary-foreground" />
                                </motion.div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              {platform.benefits.map((benefit, j) => (
                                <div key={j} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  <span className="text-sm text-muted-foreground">{benefit}</span>
                                </div>
                              ))}
                            </div>

                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4 pt-4 border-t"
                              >
                                <Input
                                  placeholder={`@username`}
                                  value={formData[`${platform.id}Handle`] || ''}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    updateFormData(`${platform.id}Handle`, e.target.value)
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-sm"
                                />
                              </motion.div>
                            )}
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>

                  {errors.platforms && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-red-500 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {errors.platforms}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Profile Step - Enhanced */}
              {currentStep === 2 && (
                <div className="max-w-3xl w-full space-y-8">
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center"
                    >
                      <User className="h-8 w-8 text-white" />
                    </motion.div>
                    
                    <div>
                      <h2 className="text-3xl font-bold">Tell us about yourself</h2>
                      <p className="text-muted-foreground mt-2">
                        This helps our AI understand your unique voice and create authentic content
                      </p>
                    </div>

                    <Card className="p-4 bg-green-500/10 border-green-500/20">
                      <div className="flex gap-3">
                        <Lightbulb className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-sm font-medium">Pro tip:</p>
                          <p className="text-sm text-muted-foreground">
                            The more specific you are about your content and style, the better our AI can replicate your unique voice. 
                            Think of this as training your personal AI assistant.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Your Name *
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 inline ml-2 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This is how you'll be addressed in the app</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name || ''}
                          onChange={(e) => updateFormData('name', e.target.value)}
                          className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500">{errors.name}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="industry">
                          Industry/Niche
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 inline ml-2 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Helps us provide industry-specific content suggestions</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <div className="relative">
                          <select
                            id="industry"
                            value={formData.industry || ''}
                            onChange={(e) => updateFormData('industry', e.target.value)}
                            className="w-full p-2 rounded-md border bg-background"
                          >
                            <option value="">Select your industry</option>
                            {INDUSTRIES_WITH_ICONS.map((industry) => (
                              <option key={industry.name} value={industry.name}>
                                {industry.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">
                        Bio *
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formData.bio?.length || 0}/300)
                        </span>
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="I create content about... My mission is to help people..."
                        value={formData.bio || ''}
                        onChange={(e) => updateFormData('bio', e.target.value.slice(0, 300))}
                        rows={4}
                        className={cn(
                          "resize-none",
                          errors.bio ? 'border-red-500' : '',
                          formData.bio?.length >= 20 && 'border-green-500/50'
                        )}
                      />
                      {errors.bio && (
                        <p className="text-xs text-red-500">{errors.bio}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Be specific - this trains your AI voice
                        </p>
                        {formData.bio?.length >= 20 && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Content Pillars (Topics you cover)</Label>
                      <div className="flex flex-wrap gap-2">
                        {['Education', 'Entertainment', 'Inspiration', 'Behind-the-scenes', 
                          'Tutorials', 'Reviews', 'News', 'Lifestyle', 'How-to', 'Tips & Tricks'].map((pillar) => (
                          <Button
                            key={pillar}
                            variant={formData.pillars?.includes(pillar) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const pillars = formData.pillars || []
                              const updated = pillars.includes(pillar)
                                ? pillars.filter((p: string) => p !== pillar)
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
                </div>
              )}

              {/* Brand Step - Enhanced */}
              {currentStep === 3 && (
                <div className="max-w-3xl w-full space-y-8">
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center"
                    >
                      <Palette className="h-8 w-8 text-white" />
                    </motion.div>
                    
                    <div>
                      <h2 className="text-3xl font-bold">Define your brand</h2>
                      <p className="text-muted-foreground mt-2">
                        Create a consistent visual identity across all your content
                      </p>
                    </div>

                    <Card className="p-4 bg-orange-500/10 border-orange-500/20">
                      <div className="flex gap-3">
                        <Brush className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-sm font-medium">Why branding matters:</p>
                          <p className="text-sm text-muted-foreground">
                            Consistent branding increases recognition by 80%. We'll apply your brand colors, fonts, and voice 
                            to all generated content, making your brand instantly recognizable.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label>Primary Brand Color *</Label>
                      <p className="text-xs text-muted-foreground mb-3">Choose a color that represents your brand</p>
                      <div className="grid grid-cols-6 gap-2">
                        {['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                          '#6366F1', '#14B8A6', '#F97316', '#84CC16', '#06B6D4', '#A855F7'].map((color) => (
                          <motion.button
                            key={color}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateFormData('primaryColor', color)}
                            className={cn(
                              "w-full aspect-square rounded-lg transition-all",
                              formData.primaryColor === color && "ring-2 ring-offset-2 ring-primary"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      {errors.primaryColor && (
                        <p className="text-xs text-red-500 mt-2">{errors.primaryColor}</p>
                      )}
                    </div>

                    <div>
                      <Label>Font Style</Label>
                      <p className="text-xs text-muted-foreground mb-3">Select your preferred typography</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'modern', label: 'Modern & Clean', preview: 'font-sans' },
                          { id: 'classic', label: 'Classic & Elegant', preview: 'font-serif' },
                          { id: 'playful', label: 'Playful & Fun', preview: 'font-mono' },
                          { id: 'bold', label: 'Bold & Strong', preview: 'font-bold' }
                        ].map((font) => (
                          <Card
                            key={font.id}
                            className={cn(
                              "p-4 cursor-pointer transition-all",
                              formData.fontStyle === font.id && "border-primary"
                            )}
                            onClick={() => updateFormData('fontStyle', font.id)}
                          >
                            <p className={cn("text-lg mb-1", font.preview)}>Aa Bb Cc</p>
                            <p className="text-sm text-muted-foreground">{font.label}</p>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Brand Voice *</Label>
                      <p className="text-xs text-muted-foreground mb-3">How do you communicate with your audience?</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'professional', label: 'Professional', icon: Briefcase, description: 'Formal and authoritative' },
                          { id: 'casual', label: 'Casual', icon: Coffee, description: 'Friendly and approachable' },
                          { id: 'funny', label: 'Humorous', icon: Star, description: 'Witty and entertaining' },
                          { id: 'inspiring', label: 'Inspiring', icon: Rocket, description: 'Motivational and uplifting' },
                          { id: 'educational', label: 'Educational', icon: BookOpen, description: 'Informative and clear' },
                          { id: 'authentic', label: 'Authentic', icon: Heart, description: 'Real and relatable' }
                        ].map((voice) => {
                          const Icon = voice.icon
                          return (
                            <Card
                              key={voice.id}
                              className={cn(
                                "p-4 cursor-pointer transition-all hover:border-primary/50",
                                formData.voice === voice.id && "border-primary bg-primary/5"
                              )}
                              onClick={() => updateFormData('voice', voice.id)}
                            >
                              <Icon className="h-6 w-6 text-primary mb-2" />
                              <p className="font-medium text-sm">{voice.label}</p>
                              <p className="text-xs text-muted-foreground mt-1">{voice.description}</p>
                            </Card>
                          )
                        })}
                      </div>
                      {errors.voice && (
                        <p className="text-xs text-red-500 mt-2">{errors.voice}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Photos Step - Enhanced */}
              {currentStep === 4 && (
                <div className="max-w-3xl w-full space-y-8">
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center"
                    >
                      <Camera className="h-8 w-8 text-white" />
                    </motion.div>
                    
                    <div>
                      <h2 className="text-3xl font-bold">Train your AI persona</h2>
                      <p className="text-muted-foreground mt-2">
                        Upload photos to create personalized thumbnails with your face
                      </p>
                    </div>

                    <Card className="p-4 bg-purple-500/10 border-purple-500/20">
                      <div className="flex gap-3">
                        <Wand2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-sm font-medium">AI Persona Training:</p>
                          <p className="text-sm text-muted-foreground">
                            Our AI will learn your facial features to generate eye-catching thumbnails that feature you. 
                            Studies show thumbnails with faces get 38% more clicks!
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-8">
                    <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold text-lg mb-2">Drop photos here</h3>
                      <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Photos
                      </Button>
                      
                      <div className="mt-6 space-y-2">
                        <p className="text-xs text-muted-foreground">Recommended: 10-20 photos</p>
                        <p className="text-xs text-muted-foreground">Max file size: 10MB each</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Tips for best results
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        'Include various angles and expressions',
                        'Use well-lit, high-quality photos',
                        'Mix close-ups and full body shots',
                        'Include different backgrounds',
                        'Show different emotions',
                        'More photos = better results'
                      ].map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className="flex items-center justify-center">
                    <Button variant="ghost" onClick={() => setCurrentStep(currentStep + 1)}>
                      Skip for now
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Content Preferences Step - Enhanced */}
              {currentStep === 5 && (
                <div className="max-w-3xl w-full space-y-8">
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center"
                    >
                      <LayoutGrid className="h-8 w-8 text-white" />
                    </motion.div>
                    
                    <div>
                      <h2 className="text-3xl font-bold">Content preferences</h2>
                      <p className="text-muted-foreground mt-2">
                        Tell us about your content creation habits
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label>Content Types</Label>
                      <p className="text-xs text-muted-foreground mb-3">What formats do you create?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'short', label: 'Shorts/Reels', icon: Zap, description: '< 60 seconds' },
                          { id: 'long', label: 'Long-form', icon: Video, description: '> 10 minutes' },
                          { id: 'carousel', label: 'Carousels', icon: LayoutGrid, description: 'Multi-slide posts' },
                          { id: 'stories', label: 'Stories', icon: Circle, description: '24-hour content' },
                          { id: 'live', label: 'Live Streams', icon: PlayCircle, description: 'Real-time content' },
                          { id: 'blog', label: 'Blog Posts', icon: FileText, description: 'Written content' }
                        ].map((type) => {
                          const Icon = type.icon
                          const isSelected = formData.contentTypes?.includes(type.id)
                          
                          return (
                            <Card
                              key={type.id}
                              className={cn(
                                "p-4 cursor-pointer transition-all",
                                isSelected && "border-primary bg-primary/5"
                              )}
                              onClick={() => {
                                const types = formData.contentTypes || []
                                const updated = types.includes(type.id)
                                  ? types.filter((t: string) => t !== type.id)
                                  : [...types, type.id]
                                updateFormData('contentTypes', updated)
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <Icon className="h-6 w-6 text-primary" />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{type.label}</p>
                                  <p className="text-xs text-muted-foreground">{type.description}</p>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                )}
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <Label>Posting Frequency</Label>
                      <p className="text-xs text-muted-foreground mb-3">How often do you post?</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'daily', label: 'Daily', description: '7 days a week' },
                          { id: 'regular', label: '2-3 times/week', description: 'Consistent schedule' },
                          { id: 'weekly', label: 'Weekly', description: 'Quality over quantity' }
                        ].map((freq) => (
                          <Card
                            key={freq.id}
                            className={cn(
                              "p-4 cursor-pointer transition-all text-center",
                              formData.frequency === freq.id && "border-primary bg-primary/5"
                            )}
                            onClick={() => updateFormData('frequency', freq.id)}
                          >
                            <p className="font-medium">{freq.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{freq.description}</p>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Primary Goal</Label>
                      <p className="text-xs text-muted-foreground mb-3">What's your main objective?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'growth', label: 'Audience Growth', icon: TrendingUp, description: 'Reach new followers' },
                          { id: 'engagement', label: 'Engagement', icon: Heart, description: 'Build community' },
                          { id: 'monetize', label: 'Monetization', icon: DollarSign, description: 'Generate revenue' },
                          { id: 'brand', label: 'Brand Building', icon: Award, description: 'Establish authority' }
                        ].map((goal) => {
                          const Icon = goal.icon
                          return (
                            <Card
                              key={goal.id}
                              className={cn(
                                "p-4 cursor-pointer transition-all",
                                formData.goal === goal.id && "border-primary bg-primary/5"
                              )}
                              onClick={() => updateFormData('goal', goal.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-6 w-6 text-primary" />
                                <div>
                                  <p className="font-medium text-sm">{goal.label}</p>
                                  <p className="text-xs text-muted-foreground">{goal.description}</p>
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Configuration Step - Enhanced */}
              {currentStep === 6 && (
                <div className="max-w-3xl w-full space-y-8">
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center"
                    >
                      <Brain className="h-8 w-8 text-white" />
                    </motion.div>
                    
                    <div>
                      <h2 className="text-3xl font-bold">Configure your AI assistant</h2>
                      <p className="text-muted-foreground mt-2">
                        Fine-tune how AI creates content for you
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label>Caption Style</Label>
                      <p className="text-xs text-muted-foreground mb-3">How should AI write your captions?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'short', label: 'Short & Punchy', example: 'Quick, impactful statements.' },
                          { id: 'detailed', label: 'Detailed & Informative', example: 'Comprehensive explanations with context.' },
                          { id: 'story', label: 'Story-driven', example: 'Personal narratives and experiences.' },
                          { id: 'question', label: 'Question-based', example: 'Engaging questions to spark discussion.' }
                        ].map((style) => (
                          <Card
                            key={style.id}
                            className={cn(
                              "p-4 cursor-pointer transition-all",
                              formData.captionStyle === style.id && "border-primary bg-primary/5"
                            )}
                            onClick={() => updateFormData('captionStyle', style.id)}
                          >
                            <p className="font-medium text-sm mb-1">{style.label}</p>
                            <p className="text-xs text-muted-foreground italic">"{style.example}"</p>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Hashtag Strategy</Label>
                      <p className="text-xs text-muted-foreground mb-3">How many hashtags should we use?</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'minimal', label: 'Minimal', count: '5-10', description: 'Clean and focused' },
                          { id: 'moderate', label: 'Moderate', count: '10-20', description: 'Balanced reach' },
                          { id: 'maximum', label: 'Maximum', count: '20-30', description: 'Maximum exposure' }
                        ].map((strategy) => (
                          <Card
                            key={strategy.id}
                            className={cn(
                              "p-4 cursor-pointer transition-all text-center",
                              formData.hashtagStrategy === strategy.id && "border-primary bg-primary/5"
                            )}
                            onClick={() => updateFormData('hashtagStrategy', strategy.id)}
                          >
                            <Hash className="h-6 w-6 text-primary mx-auto mb-2" />
                            <p className="font-medium text-sm">{strategy.label}</p>
                            <p className="text-xs text-muted-foreground">{strategy.count}</p>
                            <p className="text-xs text-muted-foreground mt-1">{strategy.description}</p>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Call-to-Action Preference</Label>
                      <p className="text-xs text-muted-foreground mb-3">What actions do you want viewers to take?</p>
                      <div className="space-y-2">
                        {[
                          { id: 'subscribe', label: 'Subscribe/Follow', description: 'Build your audience', icon: Users },
                          { id: 'engage', label: 'Comment/Like', description: 'Increase engagement', icon: MessageSquare },
                          { id: 'link', label: 'Click Links', description: 'Drive traffic', icon: ExternalLink },
                          { id: 'share', label: 'Share Content', description: 'Expand reach', icon: Share2 }
                        ].map((cta) => {
                          const Icon = cta.icon
                          const isSelected = formData.ctaPreferences?.includes(cta.id)
                          
                          return (
                            <Card
                              key={cta.id}
                              className={cn(
                                "p-3 cursor-pointer transition-all",
                                isSelected && "border-primary bg-primary/5"
                              )}
                              onClick={() => {
                                const prefs = formData.ctaPreferences || []
                                const updated = prefs.includes(cta.id)
                                  ? prefs.filter((p: string) => p !== cta.id)
                                  : [...prefs, cta.id]
                                updateFormData('ctaPreferences', updated)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Icon className="h-5 w-5 text-primary" />
                                  <div>
                                    <p className="font-medium text-sm">{cta.label}</p>
                                    <p className="text-xs text-muted-foreground">{cta.description}</p>
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                )}
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Step - Enhanced */}
              {currentStep === 7 && (
                <div className="max-w-3xl w-full space-y-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-6"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center"
                    >
                      <Rocket className="h-12 w-12 text-white" />
                    </motion.div>
                    
                    <div>
                      <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        You're all set!
                      </h2>
                      <p className="text-lg text-muted-foreground mt-2">
                        Welcome to the Inflio family! Let's create something amazing together.
                      </p>
                    </div>

                    {/* Summary of setup */}
                    <Card className="p-6 text-left max-w-2xl mx-auto">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Your personalized setup is complete
                      </h3>
                      
                      <div className="space-y-3">
                        {formData.platforms?.length > 0 && (
                          <div className="flex items-start gap-3">
                            <Share2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Connected Platforms</p>
                              <p className="text-xs text-muted-foreground">
                                {formData.platforms.length} platform{formData.platforms.length > 1 ? 's' : ''} ready for content
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {formData.name && (
                          <div className="flex items-start gap-3">
                            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Profile Configured</p>
                              <p className="text-xs text-muted-foreground">
                                AI trained on your unique voice and style
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {formData.primaryColor && (
                          <div className="flex items-start gap-3">
                            <Palette className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Brand Identity Set</p>
                              <p className="text-xs text-muted-foreground">
                                Consistent branding across all content
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {formData.captionStyle && (
                          <div className="flex items-start gap-3">
                            <Brain className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">AI Personalized</p>
                              <p className="text-xs text-muted-foreground">
                                Content generation tailored to your preferences
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* What's next */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">What happens next?</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          {
                            step: '1',
                            title: 'Upload Content',
                            description: 'Drop your video or paste a link'
                          },
                          {
                            step: '2',
                            title: 'AI Magic',
                            description: 'Watch AI create 50+ pieces instantly'
                          },
                          {
                            step: '3',
                            title: 'Publish',
                            description: 'Schedule across all platforms'
                          }
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="text-center"
                          >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                              <span className="text-lg font-bold text-primary">{item.step}</span>
                            </div>
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Celebration animation */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                      className="flex justify-center gap-3 pt-4"
                    >
                      {['🚀', '✨', '🎨', '🎬', '📈', '🎯', '💫'].map((emoji, i) => (
                        <motion.span
                          key={i}
                          className="text-3xl"
                          animate={{ 
                            y: [0, -20, 0],
                            rotate: [-10, 10, -10]
                          }}
                          transition={{
                            duration: 2,
                            delay: 0.7 + i * 0.1,
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
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Enhanced footer navigation */}
        <div className="absolute bottom-0 left-0 right-0 h-24 px-8 flex items-center justify-between bg-background/80 backdrop-blur-xl border-t">
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

          <div className="flex items-center gap-4">
            {/* Mobile step indicators */}
            <div className="flex items-center gap-1 lg:hidden">
              {ENHANCED_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentStep ? "w-8 bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            
            {/* Skip option for optional steps */}
            {currentStep > 0 && currentStep < ENHANCED_STEPS.length - 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                Skip this step
              </Button>
            )}
          </div>

          <Button
            onClick={currentStep === ENHANCED_STEPS.length - 1 ? handleComplete : handleNext}
            disabled={isLoading}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting up...
              </span>
            ) : currentStep === ENHANCED_STEPS.length - 1 ? (
              <>
                Launch Dashboard
                <Rocket className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Help Dialog */}
        <Dialog open={showHelp} onOpenChange={setShowHelp}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Need Help?</DialogTitle>
              <DialogDescription>
                We're here to help you get started with Inflio
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-medium mb-2">Why do we need this information?</h4>
                <p className="text-sm text-muted-foreground">
                  Every piece of information helps our AI understand your unique needs and create 
                  content that truly represents you and your brand.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Can I change this later?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! Everything can be updated from your settings dashboard at any time.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Is my data secure?</h4>
                <p className="text-sm text-muted-foreground">
                  Absolutely. We use enterprise-grade encryption and never share your data with third parties.
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Still need help? Reach out to us at{' '}
                  <a href="mailto:support@inflio.com" className="text-primary hover:underline">
                    support@inflio.com
                  </a>
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setShowHelp(false)}>Got it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Skip Dialog */}
        <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skip this step?</DialogTitle>
              <DialogDescription>
                You can always complete this later in settings. Some features may be limited until you complete all steps.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSkipDialog(false)}>
                Stay
              </Button>
              <Button 
                onClick={() => {
                  setShowSkipDialog(false)
                  handleNext()
                }}
              >
                Skip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
