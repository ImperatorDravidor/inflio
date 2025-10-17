"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import confetti from 'canvas-confetti'
import { InflioLogo } from '@/components/inflio-logo'
import { AIAvatarTraining } from '@/components/onboarding/ai-avatar-training'
import { BrandIdentityEnhanced } from '@/components/onboarding/brand-identity-enhanced'
import { 
  Sparkles, ChevronRight, ChevronLeft, Check, Upload, AlertCircle,
  Twitter, Instagram, Linkedin, Youtube, Facebook, Globe,
  Palette, Type, Camera, Hash, MessageSquare, Zap,
  Shield, ArrowRight, User, Briefcase, Target, TrendingUp,
  Heart, Star, Gift, Rocket, Crown, Brain, Circle, LayoutGrid, 
  Video, Info, HelpCircle, PlayCircle, FileText, BarChart,
  Clock, Users, Wand2, ImageIcon, PenTool, Share2, Layers,
  Lightbulb, CheckCircle, TrendingDown,
  Bot, Megaphone, Calendar, DollarSign, Award, BookOpen,
  Monitor, Smartphone, Coffee, Music, Gamepad, Dumbbell,
  ShoppingBag, Plane, Home, Brush, Code, HeadphonesIcon,
  X, Loader2, ChevronDown, ExternalLink, Mail, LucideIcon,
  FileUp, FilePlus, FileCheck, Scan, RefreshCw, Maximize2,
  FolderOpen, Link, Copy, Download, Eye, Edit, Trash2,
  Search, Filter, Tag, Grid3x3, List, Mic, MicOff,
  CameraOff, FlipHorizontal, RotateCw, Crop, Aperture,
  Focus, Sun, Moon, Contrast, Droplets, Thermometer,
  Wind, CloudRain, Activity, Zap as Lightning, Package,
  ShieldCheck, Lock, Unlock, Key, Database, Server,
  Cpu, HardDrive, Wifi, WifiOff, Signal, Battery,
  BatteryCharging, Volume2, VolumeX, Headphones, Speaker,
  Smile, ArrowUpRight, TrendingUpIcon, Gem, Infinity,
  Play, Pause, SkipForward, SkipBack, Repeat, Shuffle,
  Bell, BellOff, Send, Archive, Inbox, Flag,
  Bookmark, BookmarkCheck, Hash as HashIcon, AtSign,
  Globe2, MapPin, Navigation, Compass, Map,
  Film, Tv, Radio, Podcast, Newspaper,
  ShoppingCart, CreditCard, Wallet, Receipt, Calculator
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { OnboardingClientService } from '@/lib/services/onboarding-client-service'
import { PersonaUploadService } from '@/lib/services/persona-upload-service'
import { PersonaService } from '@/lib/services/persona-service'
import { designSystem } from '@/lib/design-system'
import { toast } from 'sonner'

interface PremiumOnboardingProps {
  userId: string
  onComplete?: () => void
}

// Smooth step configuration with better flow
const ONBOARDING_FLOW = [
  {
    id: 'welcome',
    title: 'Welcome to Inflio',
    icon: Sparkles,
    gradient: 'from-violet-600 to-purple-600',
    duration: 'Just a moment',
    sections: [
      {
        id: 'intro',
        title: 'Your AI Content Studio Awaits',
        description: 'Transform your content creation with the power of AI'
      }
    ]
  },
  {
    id: 'creator_profile',
    title: 'Quick Intro',
    icon: User,
    gradient: 'from-blue-600 to-cyan-600',
    duration: '30 seconds',
    sections: [
      {
        id: 'basics',
        title: 'Basic Information',
        description: 'Just the essentials - AI handles the rest'
      }
    ]
  },
  {
    id: 'brand',
    title: 'Brand Identity',
    icon: Palette,
    gradient: 'from-orange-600 to-pink-600',
    duration: '1 minute',
    sections: [
      {
        id: 'upload',
        title: 'Brand Materials',
        description: 'Upload your brand book or let AI analyze your style'
      },
      {
        id: 'customize',
        title: 'Visual Identity',
        description: 'Colors, fonts, and voice that represent you'
      }
    ]
  },
  {
    id: 'persona',
    title: 'AI Avatar',
    icon: Camera,
    gradient: 'from-purple-600 to-indigo-600',
    duration: '2 minutes',
    sections: [
      {
        id: 'photos',
        title: 'Train Your AI Face',
        description: 'Create stunning thumbnails with your likeness'
      }
    ]
  },
  {
    id: 'launch',
    title: 'Ready to Launch',
    icon: Rocket,
    gradient: 'from-green-600 to-emerald-600',
    duration: 'Let\'s go!',
    sections: [
      {
        id: 'review',
        title: 'Everything Looks Great!',
        description: 'Your AI studio is ready'
      }
    ]
  }
]

// Platform configurations with better UX
const PLATFORM_CONFIGS = [
  { 
    id: 'youtube', 
    name: 'YouTube', 
    icon: Youtube,
    color: '#FF0000',
    gradient: 'from-red-500 to-red-600',
    features: ['Long-form videos', 'Shorts', 'Live streaming', 'Community posts'],
    audienceSize: '2.7B users',
    bestFor: 'Educational content, tutorials, entertainment'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: Instagram,
    color: '#E4405F',
    gradient: 'from-pink-500 to-purple-500',
    features: ['Reels', 'Stories', 'Posts', 'IGTV'],
    audienceSize: '2B users',
    bestFor: 'Visual content, lifestyle, behind-the-scenes'
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    icon: Music,
    color: '#000000',
    gradient: 'from-gray-800 to-black',
    features: ['Short videos', 'Live streams', 'Effects', 'Sounds'],
    audienceSize: '1.2B users',
    bestFor: 'Viral content, trends, entertainment'
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: Linkedin,
    color: '#0077B5',
    gradient: 'from-blue-600 to-blue-700',
    features: ['Articles', 'Videos', 'Newsletters', 'Events'],
    audienceSize: '900M professionals',
    bestFor: 'B2B content, thought leadership, networking'
  },
  { 
    id: 'twitter', 
    name: 'X', 
    icon: Twitter,
    color: '#000000',
    gradient: 'from-gray-700 to-black',
    features: ['Threads', 'Spaces', 'Long posts', 'Communities'],
    audienceSize: '550M users',
    bestFor: 'News, discussions, real-time updates'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: Facebook,
    color: '#1877F2',
    gradient: 'from-blue-500 to-blue-600',
    features: ['Videos', 'Stories', 'Groups', 'Pages'],
    audienceSize: '3B users',
    bestFor: 'Community building, diverse content'
  }
]

// Industry templates with smart defaults
const INDUSTRY_TEMPLATES = {
  'Technology': {
    colors: ['#0EA5E9', '#8B5CF6', '#10B981'],
    fonts: ['Inter', 'SF Pro', 'Roboto'],
    voice: ['Informative', 'Expert', 'Innovative'],
    contentTypes: ['Tutorials', 'Reviews', 'News'],
    platforms: ['youtube', 'linkedin', 'twitter']
  },
  'Education': {
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
    fonts: ['Lato', 'Open Sans', 'Poppins'],
    voice: ['Encouraging', 'Clear', 'Supportive'],
    contentTypes: ['Lessons', 'Tips', 'Resources'],
    platforms: ['youtube', 'instagram', 'tiktok']
  },
  'Fitness': {
    colors: ['#EF4444', '#F97316', '#10B981'],
    fonts: ['Montserrat', 'Bebas Neue', 'Oswald'],
    voice: ['Motivational', 'Energetic', 'Inspiring'],
    contentTypes: ['Workouts', 'Nutrition', 'Progress'],
    platforms: ['instagram', 'tiktok', 'youtube']
  },
  'Business': {
    colors: ['#1E40AF', '#059669', '#7C3AED'],
    fonts: ['Playfair Display', 'Merriweather', 'Georgia'],
    voice: ['Professional', 'Strategic', 'Authoritative'],
    contentTypes: ['Case Studies', 'Insights', 'Leadership'],
    platforms: ['linkedin', 'twitter', 'youtube']
  }
}

export function PremiumOnboarding({ userId, onComplete }: PremiumOnboardingProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [currentStep, setCurrentStep] = useState(0)
  const [currentSection, setCurrentSection] = useState(0)
  const [formData, setFormData] = useState<any>({
    platforms: [],
    selectedTemplate: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  
  // Animation controls
  const controls = useAnimation()
  const progressAnimation = useAnimation()
  const contentAnimation = useAnimation()
  
  // Refs
  // File refs moved to respective components
  // Video and canvas refs moved to AIAvatarTraining component
  
  // State for brand analysis
  // Brand state is now managed in BrandIdentityEnhanced component
  
  // State for persona training - handled by AIAvatarTraining component
  const [isTraining, setIsTraining] = useState(false)
  
  // Progress calculation
  const totalSteps = ONBOARDING_FLOW.length
  const currentStepData = ONBOARDING_FLOW[currentStep]
  const totalSections = currentStepData.sections.length
  const overallProgress = ((currentStep + (currentSection / totalSections)) / totalSteps) * 100

  // Auto-save with debounce
  useEffect(() => {
    if (Object.keys(formData).length > 0 && currentStep > 0) {
      const timer = setTimeout(() => {
        setIsSaving(true)
        OnboardingClientService.saveProgress(userId, currentStep, currentStepData.id, formData)
          .then(() => setIsSaving(false))
          .catch(console.error)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [formData, currentStep, userId])

  // Smooth animations on step change
  useEffect(() => {
    contentAnimation.start({
      opacity: [0, 1],
      y: [20, 0],
      transition: { duration: 0.5, ease: "easeOut" }
    })
    
    progressAnimation.start({
      width: `${overallProgress}%`,
      transition: { duration: 0.8, ease: "easeInOut" }
    })
  }, [currentStep, currentSection])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        handleContinue()
      } else if (e.key === 'Escape') {
        setShowSkip(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentStep, currentSection])

  // Smart field validation
  const validateCurrentSection = (): boolean => {
    const stepId = currentStepData.id
    const sectionId = currentStepData.sections[currentSection].id
    
    switch (`${stepId}.${sectionId}`) {
      case 'creator_profile.basics':
        // Simple validation - just name and industry required
        return !!formData.fullName && !!formData.industry
      case 'brand.upload':
      case 'brand.customize':
        // Brand identity component handles its own validation
        // Require at least brand analysis or manual setup
        return !!formData.brandAnalysis || (!!formData.primaryColor && !!formData.brandVoice)
      case 'platforms.connect':
        return formData.platforms.length > 0
      default:
        return true
    }
  }

  // Handle continue with validation
  const handleContinue = () => {
    if (!validateCurrentSection()) {
      toast.error('Please complete all required fields')
      return
    }
    
    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1)
    } else if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
      setCurrentSection(0)
    } else {
      handleComplete()
    }
  }

  // Handle back navigation
  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      const prevStepSections = ONBOARDING_FLOW[currentStep - 1].sections.length
      setCurrentSection(prevStepSections - 1)
    }
  }

  // Handle completion with celebration
  const handleComplete = async () => {
    setIsLoading(true)
    
    try {
      // Create persona and start training if photos were collected
      if (formData.personaPhotos && formData.personaPhotos.length >= 5) {
        toast.info('Creating your AI persona...')
        
        const personaPhotosFormatted = formData.personaPhotos.map((url: string, idx: number) => ({
          id: `photo-${idx}`,
          url
        }))
        
        const persona = await PersonaService.createPersona(
          userId,
          formData.fullName || 'Professional',
          'AI Avatar for personalized content generation',
          personaPhotosFormatted
        )
        
        if (persona) {
          toast.success('AI persona created! Training will begin shortly.')
          
          // Monitor training progress in the background
          if (persona.trainingJobId) {
            PersonaService.monitorTrainingProgress(
              persona.trainingJobId,
              (status, progress) => {
                console.log(`Training progress: ${progress}%`)
              },
              () => {
                toast.success('🎉 Your AI avatar is ready! You can now generate personalized content.')
              },
              (error) => {
                console.error('Training error:', error)
              }
            )
          }
        }
      }
      
      // Save final progress with completion flag
      await OnboardingClientService.saveProgress(userId, currentStep, 'complete', {
        ...formData,
        onboardingCompleted: true,
        completedAt: new Date().toISOString()
      })
      
      // Mark as complete
      await OnboardingClientService.completeOnboarding(userId)
      
      // Celebration animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      
      toast.success('Welcome to Inflio! Your AI studio is ready.')
      
      setTimeout(() => {
        onComplete?.()
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Completion error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Smart template application
  const applyIndustryTemplate = (industry: string) => {
    const template = INDUSTRY_TEMPLATES[industry as keyof typeof INDUSTRY_TEMPLATES]
    if (template) {
      setFormData((prev: any) => ({
        ...prev,
        industry,
        primaryColor: template.colors[0],
        brandColors: template.colors,
        fonts: template.fonts,
        brandVoice: template.voice[0],
        contentTypes: template.contentTypes,
        suggestedPlatforms: template.platforms,
        selectedTemplate: industry
      }))
      
      toast.success(`Applied ${industry} template. You can customize it anytime.`)
    }
  }


  // Camera management moved to AIAvatarTraining component

  const updateFormData = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }))
    setTouchedFields(prev => new Set(prev).add(key))
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/10">
        {/* Animated background elements - matching dashboard */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"
            animate={{
              x: [0, -50, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>

        {/* Top progress bar */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-border">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
          
          {/* Floating header - transparent, no border */}
          <div className="bg-transparent">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <InflioLogo size="sm" />
            
            {/* Step breadcrumb - Skip AI Preferences */}
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span>{currentStepData.title}</span>
              {currentStepData.sections.length > 1 && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span>{currentStepData.sections[currentSection].title}</span>
                </>
              )}
            </div>
          </div>
              
              <div className="flex items-center gap-3">
                {isSaving && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </motion.div>
                )}
                
                <Badge variant="outline" className="text-xs">
                  Step {currentStep + 1} of {totalSteps}
                </Badge>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSkip(true)}
                  className="text-xs"
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content - better centered */}
        <div className="pt-32 pb-32 px-6 min-h-screen flex items-center">
          <div className="max-w-4xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentStep}-${currentSection}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Welcome Step */}
                {currentStep === 0 && (
                  <div className="min-h-[60vh] flex flex-col justify-center">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-center space-y-8"
                    >
                      <div className="relative">
                        <motion.div
                          className="absolute inset-0 bg-primary/20 blur-3xl"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                        />
                        <h1 className="relative text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                          Welcome to Inflio
                        </h1>
                      </div>
                      
                      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Your AI-powered content studio that transforms one video into 50+ pieces of content
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        {[
                          {
                            icon: Clock,
                            title: "5 minute setup",
                            description: "Get started in no time"
                          },
                          {
                            icon: Wand2,
                            title: "AI-powered",
                            description: "GPT-5 & Stable Diffusion"
                          },
                          {
                            icon: Infinity,
                            title: "Unlimited content",
                            description: "From one source"
                          }
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="p-6 rounded-2xl bg-card border border-border shadow-lg hover:shadow-xl transition-all"
                          >
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 mx-auto">
                              <item.icon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2 text-center">{item.title}</h3>
                            <p className="text-sm text-muted-foreground text-center">{item.description}</p>
                          </motion.div>
                        ))}
                      </div>
                      
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center justify-center gap-4"
                      >
                        <div className="flex -space-x-2">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/60 border-2 border-background"
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Join 50,000+ creators
                        </p>
                      </motion.div>
                    </motion.div>
                  </div>
                )}

                {/* Simple Creator Profile Step */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold">Quick Introduction</h2>
                      <p className="text-muted-foreground">
                        Just the basics - we'll extract everything else from your content
                      </p>
                    </div>
                    
                    <Card className="p-6">
                      <div className="space-y-6">
                        {/* Essential fields only */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name *</Label>
                            <Input
                              id="fullName"
                              placeholder="John Doe"
                              value={formData.fullName || ''}
                              onChange={(e) => updateFormData('fullName', e.target.value)}
                              className={cn(
                                "transition-all",
                                touchedFields.has('fullName') && !formData.fullName && "border-destructive"
                              )}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="professionalTitle">Title/Role</Label>
                            <Input
                              id="professionalTitle"
                              placeholder="Content Creator, CEO, etc. (optional)"
                              value={formData.professionalTitle || ''}
                              onChange={(e) => updateFormData('professionalTitle', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="companyName">Company/Brand</Label>
                            <Input
                              id="companyName"
                              placeholder="Your company or brand (optional)"
                              value={formData.companyName || ''}
                              onChange={(e) => updateFormData('companyName', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="industry">Main Industry *</Label>
                            <Select
                              value={formData.industry || ''}
                              onValueChange={(value) => updateFormData('industry', value)}
                            >
                              <SelectTrigger id="industry">
                                <SelectValue placeholder="Select your industry" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Technology">Technology</SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="Health">Health & Wellness</SelectItem>
                                <SelectItem value="Entertainment">Entertainment</SelectItem>
                                <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Creative">Creative/Arts</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bio">Quick Bio</Label>
                          <Textarea
                            id="bio"
                            placeholder="Brief introduction (optional - we'll learn more from your content)"
                            value={formData.bio || ''}
                            onChange={(e) => updateFormData('bio', e.target.value)}
                            className="min-h-[80px]"
                          />
                          <p className="text-xs text-muted-foreground">
                            Don't overthink it - our AI will learn your style from your brand materials
                          </p>
                        </div>
                      </div>
                    </Card>
                    
                    <Alert className="border-primary/20 bg-primary/5">
                      <Sparkles className="h-4 w-4" />
                      <AlertDescription>
                        <strong>That's it!</strong> In the next step, we'll use AI to extract your brand identity, 
                        content strategy, and everything else from your existing materials. No more forms!
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Enhanced Brand Identity Step */}
                {currentStep === 2 && (
                  <BrandIdentityEnhanced
                    formData={formData}
                    updateFormData={updateFormData}
                    onComplete={() => {
                      // Auto-advance to next step
                      if (currentStep < totalSteps - 1) {
                        setCurrentStep(currentStep + 1)
                        setCurrentSection(0)
                      }
                    }}
                  />
                )}

                {/* Persona Step */}
                {currentStep === 3 && (
                  <AIAvatarTraining
                    onComplete={(photos, personaId) => {
                      if (personaId) {
                        updateFormData('personaId', personaId)
                        updateFormData('personaTrained', true)
                        toast.success('AI Avatar created and training started!')
                      } else {
                        updateFormData('personaPhotos', photos.map(p => p.url))
                        toast.success('Photos saved! Training will start after onboarding.')
                      }
                      // Auto-advance to next step
                      setTimeout(() => {
                        if (currentStep < totalSteps - 1) {
                          setCurrentStep(currentStep + 1)
                          setCurrentSection(0)
                        } else {
                          handleComplete()
                        }
                      }, 1500)
                    }}
                    onSkip={() => {
                      updateFormData('personaSkipped', true)
                      if (currentStep < totalSteps - 1) {
                        setCurrentStep(currentStep + 1)
                        setCurrentSection(0)
                      } else {
                        handleComplete()
                      }
                    }}
                    onBack={() => {
                      if (currentStep > 0) {
                        setCurrentStep(currentStep - 1)
                        setCurrentSection(0)
                      }
                    }}
                    formData={formData}
                    updateFormData={updateFormData}
                    minPhotos={5}
                    recommendedPhotos={10}
                    maxPhotos={20}
                  />
                )}

                {/* Launch Step - Now Step 4 after removing platforms */}
                {currentStep === 4 && (
                  <div className="min-h-[60vh] flex flex-col justify-center">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center space-y-8"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center"
                      >
                        <CheckCircle className="h-12 w-12 text-white" />
                      </motion.div>
                      
                      <div>
                        <h1 className="text-4xl font-bold mb-2">You're all set!</h1>
                        <p className="text-xl text-muted-foreground">
                          Your AI content studio is ready to create amazing content
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        {[
                          { label: 'Platforms', value: formData.platforms?.length || 0 },
                          { label: 'AI Models', value: formData.personaPhotos?.length > 0 ? 'Trained' : 'Ready' },
                          { label: 'Brand', value: 'Configured' }
                        ].map((stat, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="p-4 rounded-xl bg-card border border-border shadow-lg"
                          >
                            <p className="text-3xl font-bold text-primary">
                              {stat.value}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {stat.label}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                      
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-4"
                      >
                        <Button
                          size="lg"
                          onClick={handleComplete}
                          disabled={isLoading}
                          className="min-w-[200px]"
                        >
                          {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              Launch Dashboard
                              <Rocket className="h-5 w-5 ml-2" />
                            </>
                          )}
                        </Button>
                        
                        <p className="text-sm text-muted-foreground">
                          Ready to upload your first video?
                        </p>
                      </motion.div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom navigation - transparent, no border */}
        <div className="fixed bottom-0 left-0 right-0 bg-transparent">
          <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0 && currentSection === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              {ONBOARDING_FLOW.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === currentStep ? "w-8 bg-primary" :
                    i < currentStep ? "bg-primary/50" : "bg-muted"
                  )}
                />
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              {currentStep === 2 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    updateFormData('brandAnalysisSkipped', true)
                    setCurrentStep(3)
                    setCurrentSection(0)
                  }}
                >
                  Skip to AI Avatar
                </Button>
              )}
              <Button
                onClick={handleContinue}
                disabled={!validateCurrentSection()}
                className="min-w-[120px]"
              >
                {currentStep === totalSteps - 1 ? 'Complete' : 'Continue'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Skip dialog */}
        <Dialog open={showSkip} onOpenChange={setShowSkip}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skip onboarding?</DialogTitle>
              <DialogDescription>
                You can always complete setup later in settings. Some features may be limited.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSkip(false)}>
                Continue Setup
              </Button>
              <Button onClick={() => router.push('/dashboard')}>
                Skip to Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}