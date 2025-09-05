"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { PersonaPhotoCapture } from './persona-photo-capture'
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
  Smile
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { cn } from '@/lib/utils'
import { OnboardingService } from '@/lib/services/onboarding-service'
import { PersonaUploadService } from '@/lib/services/persona-upload-service'
import { designSystem } from '@/lib/design-system'

interface IntelligentOnboardingProps {
  userId: string
  onComplete?: () => void
}

// Brand book analysis results interface
interface BrandAnalysis {
  colors: {
    primary: string[]
    secondary: string[]
    accent: string[]
  }
  typography: {
    headings: string[]
    body: string[]
  }
  voice: {
    tone: string[]
    personality: string[]
    values: string[]
  }
  visual_style: {
    photography: string[]
    graphics: string[]
    patterns: string[]
  }
  competitors: string[]
  target_audience: {
    demographics: string[]
    psychographics: string[]
    pain_points: string[]
  }
  content_themes: string[]
  unique_value_proposition: string
  mission_statement: string
  brand_story: string
  do_and_donts: {
    do: string[]
    dont: string[]
  }
}

// Camera guide for persona training
interface CameraGuide {
  title: string
  description: string
  icon: LucideIcon
  examples: {
    good: string[]
    bad: string[]
  }
  tips: string[]
}

const CAMERA_GUIDES: CameraGuide[] = [
  {
    title: 'Lighting Requirements',
    description: 'Proper lighting is crucial for AI training',
    icon: Sun,
    examples: {
      good: [
        'Natural daylight from window',
        'Even, soft lighting on face',
        'No harsh shadows',
        'Well-lit background'
      ],
      bad: [
        'Backlit (window behind you)',
        'Single harsh light source',
        'Dark or dim lighting',
        'Mixed color temperatures'
      ]
    },
    tips: [
      'Face a window for best natural light',
      'Use ring light if available',
      'Avoid overhead lighting only',
      'Check for shadows on face'
    ]
  },
  {
    title: 'Camera Angles',
    description: 'Capture diverse angles for better AI model',
    icon: Camera,
    examples: {
      good: [
        'Straight on (0°)',
        'Slight left turn (15-30°)',
        'Slight right turn (15-30°)',
        'Slight upward tilt',
        'Natural head positions'
      ],
      bad: [
        'Extreme angles (>45°)',
        'Looking down at camera',
        'Profile shots only',
        'Tilted/rotated images'
      ]
    },
    tips: [
      'Keep camera at eye level',
      'Include variety of angles',
      'Maintain consistent distance',
      'Look directly at lens for some shots'
    ]
  },
  {
    title: 'Expressions & Poses',
    description: 'Variety helps AI understand your features',
    icon: Smile,
    examples: {
      good: [
        'Natural smile',
        'Neutral expression',
        'Slight smile',
        'Talking/speaking pose',
        'Professional look'
      ],
      bad: [
        'Exaggerated expressions',
        'Covered face (hands/objects)',
        'Sunglasses or masks',
        'Blurry from movement'
      ]
    },
    tips: [
      'Be natural and relaxed',
      'Include your typical expressions',
      'Avoid props covering face',
      'Take multiple shots of each pose'
    ]
  },
  {
    title: 'Image Quality',
    description: 'High quality images train better models',
    icon: Aperture,
    examples: {
      good: [
        'Sharp, in-focus images',
        'High resolution (1080p+)',
        'Clean background',
        'Good color accuracy'
      ],
      bad: [
        'Blurry or out of focus',
        'Low resolution/pixelated',
        'Cluttered background',
        'Heavy filters or edits'
      ]
    },
    tips: [
      'Clean your camera lens',
      'Use timer to avoid shake',
      'Check focus before shooting',
      'Avoid digital zoom'
    ]
  }
]

// Content strategy templates based on industry
const CONTENT_STRATEGIES = {
  'Technology': {
    pillars: ['Product Reviews', 'Tutorials', 'Industry News', 'Tips & Tricks', 'Future Trends'],
    formats: ['Demo Videos', 'Comparison Content', 'How-to Guides', 'News Commentary'],
    tone: ['Informative', 'Expert', 'Accessible'],
    platforms: ['youtube', 'linkedin', 'twitter']
  },
  'Education': {
    pillars: ['Lessons', 'Study Tips', 'Career Advice', 'Resources', 'Student Life'],
    formats: ['Educational Videos', 'Infographics', 'Course Content', 'Q&A Sessions'],
    tone: ['Encouraging', 'Clear', 'Supportive'],
    platforms: ['youtube', 'instagram', 'tiktok']
  },
  'Marketing': {
    pillars: ['Case Studies', 'Strategy', 'Tools', 'Trends', 'Analytics'],
    formats: ['Webinars', 'Reports', 'Templates', 'Podcasts'],
    tone: ['Professional', 'Data-driven', 'Strategic'],
    platforms: ['linkedin', 'twitter', 'youtube']
  },
  'Fitness': {
    pillars: ['Workouts', 'Nutrition', 'Motivation', 'Progress', 'Wellness'],
    formats: ['Workout Videos', 'Meal Prep', 'Transformation Stories', 'Live Classes'],
    tone: ['Motivational', 'Energetic', 'Supportive'],
    platforms: ['instagram', 'tiktok', 'youtube']
  }
}

// Competitor analysis template
interface CompetitorAnalysis {
  name: string
  platforms: string[]
  content_frequency: string
  engagement_rate: string
  unique_features: string[]
  weaknesses: string[]
  opportunities: string[]
}

// Enhanced step configuration with substeps
const INTELLIGENT_STEPS = [
  { 
    id: 'welcome', 
    title: 'Welcome to Your AI Studio', 
    subtitle: 'Let\'s build your content empire',
    icon: Sparkles, 
    color: 'from-purple-500 to-pink-500',
    description: 'Discover how AI will transform your content',
    substeps: ['introduction', 'capabilities', 'workflow']
  },
  { 
    id: 'brand_analysis', 
    title: 'Brand Intelligence', 
    subtitle: 'Upload brand materials for AI analysis',
    icon: Brain, 
    color: 'from-blue-500 to-indigo-500',
    description: 'Our AI will learn your brand identity',
    substeps: ['upload', 'analysis', 'insights']
  },
  { 
    id: 'market_position', 
    title: 'Market Positioning', 
    subtitle: 'Understand your competitive landscape',
    icon: Target, 
    color: 'from-green-500 to-teal-500',
    description: 'AI-powered competitor and audience analysis',
    substeps: ['competitors', 'audience', 'opportunities']
  },
  { 
    id: 'persona_training', 
    title: 'AI Persona Training', 
    subtitle: 'Train your personal AI avatar',
    icon: Camera, 
    color: 'from-purple-500 to-indigo-500',
    description: 'Create stunning thumbnails with your face',
    substeps: ['preparation', 'capture', 'processing']
  },
  { 
    id: 'content_strategy', 
    title: 'Content Strategy', 
    subtitle: 'AI-optimized content planning',
    icon: LayoutGrid, 
    color: 'from-orange-500 to-red-500',
    description: 'Build a winning content strategy',
    substeps: ['platforms', 'formats', 'calendar']
  },
  { 
    id: 'ai_customization', 
    title: 'AI Customization', 
    subtitle: 'Fine-tune your AI assistant',
    icon: Settings, 
    color: 'from-cyan-500 to-blue-500',
    description: 'Personalize AI to match your style',
    substeps: ['voice', 'style', 'automation']
  },
  { 
    id: 'launch', 
    title: 'Launch Your Studio', 
    subtitle: 'Review and activate your AI workspace',
    icon: Rocket, 
    color: 'from-green-500 to-emerald-500',
    description: 'Start creating amazing content',
    substeps: ['review', 'activate', 'first_project']
  }
]

export function IntelligentOnboarding({ userId, onComplete }: IntelligentOnboardingProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [currentStep, setCurrentStep] = useState(0)
  const [currentSubstep, setCurrentSubstep] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Brand analysis states
  const [brandBookFile, setBrandBookFile] = useState<File | null>(null)
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  
  // Persona training states
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [showCameraGuide, setShowCameraGuide] = useState(true)
  const [photoQuality, setPhotoQuality] = useState<Record<string, any>>({})
  const [isTrainingModel, setIsTrainingModel] = useState(false)
  const [modelTrainingProgress, setModelTrainingProgress] = useState(0)
  
  // Competitor analysis states
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([])
  const [isAnalyzingMarket, setIsAnalyzingMarket] = useState(false)
  
  // Content strategy states
  const [contentCalendar, setContentCalendar] = useState<any[]>([])
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([])
  
  // AI insights
  const [aiInsights, setAiInsights] = useState<Record<string, any>>({})
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load saved progress
  useEffect(() => {
    const loadSavedProgress = async () => {
      try {
        const progress = await OnboardingService.loadProgress(userId)
        if (progress) {
          setCurrentStep(progress.currentStep || 0)
          setFormData(progress.formData || {})
          if (progress.formData?.brandAnalysis) {
            setBrandAnalysis(progress.formData.brandAnalysis)
          }
          if (progress.formData?.capturedPhotos) {
            setCapturedPhotos(progress.formData.capturedPhotos)
          }
        }
      } catch (error) {
        console.error('Failed to load progress:', error)
      } finally {
        setIsLoadingProgress(false)
      }
    }
    
    loadSavedProgress()
  }, [userId])

  // Auto-save progress
  useEffect(() => {
    const saveData = async () => {
      if (currentStep > 0 && currentStep < INTELLIGENT_STEPS.length - 1 && !isSaving) {
        setIsSaving(true)
        try {
          await OnboardingService.saveProgress(
            userId, 
            currentStep, 
            {
              ...formData,
              brandAnalysis,
              capturedPhotos,
              competitors,
              contentCalendar,
              aiInsights
            }, 
            INTELLIGENT_STEPS[currentStep].id
          )
        } catch (error) {
          console.error('Failed to save progress:', error)
        } finally {
          setIsSaving(false)
        }
      }
    }
    
    const debounce = setTimeout(saveData, 1000)
    return () => clearTimeout(debounce)
  }, [currentStep, formData, brandAnalysis, capturedPhotos, userId])

  // Brand book upload and analysis
  const handleBrandBookUpload = async (file: File) => {
    setBrandBookFile(file)
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 500)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)
      
      // Call GPT-5 [[memory:4799270]] for brand analysis
      const response = await fetch('/api/analyze-brand', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const analysis = await response.json()
        setBrandAnalysis(analysis)
        setAnalysisProgress(100)
        
        // Extract AI insights
        setAiInsights(prev => ({
          ...prev,
          brand: {
            strengths: analysis.strengths || [],
            opportunities: analysis.opportunities || [],
            recommendations: analysis.recommendations || []
          }
        }))
        
        // Generate recommendations
        generateAIRecommendations('brand', analysis)
      }
    } catch (error) {
      console.error('Brand analysis failed:', error)
    } finally {
      clearInterval(progressInterval)
      setIsAnalyzing(false)
    }
  }

  // Camera setup for persona training
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        }
      })
      
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Camera access failed:', error)
      setErrors({ camera: 'Unable to access camera. Please check permissions.' })
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  // Capture photo for persona training
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        
        const photoUrl = canvas.toDataURL('image/jpeg', 0.95)
        setCapturedPhotos(prev => [...prev, photoUrl])
        
        // Analyze photo quality
        analyzePhotoQuality(photoUrl)
      }
    }
  }

  // Analyze photo quality for LoRA training
  const analyzePhotoQuality = async (photoUrl: string) => {
    // Simulate quality analysis
    const quality = {
      lighting: Math.random() > 0.3 ? 'good' : 'needs improvement',
      sharpness: Math.random() > 0.2 ? 'excellent' : 'acceptable',
      angle: Math.random() > 0.4 ? 'perfect' : 'good',
      expression: 'natural',
      overall: Math.random() > 0.3 ? 'excellent' : 'good'
    }
    
    setPhotoQuality(prev => ({
      ...prev,
      [photoUrl]: quality
    }))
  }

  // Train LoRA model
  const trainPersonaModel = async () => {
    if (capturedPhotos.length < 10) {
      setErrors({ photos: 'Please capture at least 10 photos for optimal training' })
      return
    }
    
    setIsTrainingModel(true)
    setModelTrainingProgress(0)
    
    // Simulate training progress
    const progressInterval = setInterval(() => {
      setModelTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setIsTrainingModel(false)
          return 100
        }
        return prev + 5
      })
    }, 1000)
    
    try {
      // Send photos for LoRA training
      const response = await fetch('/api/personas/train-lora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          photos: capturedPhotos,
          modelName: `${formData.name || 'user'}_persona`
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        updateFormData('personaModelId', result.modelId)
        updateFormData('personaTrainingComplete', true)
      }
    } catch (error) {
      console.error('Model training failed:', error)
    }
  }

  // Competitor analysis
  const analyzeCompetitors = async () => {
    setIsAnalyzingMarket(true)
    
    try {
      const response = await fetch('/api/analyze-competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: formData.industry,
          niche: formData.niche,
          platforms: formData.platforms
        })
      })
      
      if (response.ok) {
        const analysis = await response.json()
        setCompetitors(analysis.competitors || [])
        
        // Generate insights
        setAiInsights(prev => ({
          ...prev,
          market: {
            gaps: analysis.market_gaps || [],
            opportunities: analysis.opportunities || [],
            threats: analysis.threats || []
          }
        }))
        
        generateAIRecommendations('market', analysis)
      }
    } catch (error) {
      console.error('Competitor analysis failed:', error)
    } finally {
      setIsAnalyzingMarket(false)
    }
  }

  // Generate AI recommendations
  const generateAIRecommendations = (category: string, data: any) => {
    const recommendations: string[] = []
    
    switch (category) {
      case 'brand':
        if (data.voice?.tone?.includes('professional')) {
          recommendations.push('Focus on educational and thought leadership content')
        }
        if (data.target_audience?.demographics?.includes('millennials')) {
          recommendations.push('Prioritize Instagram Reels and TikTok for maximum reach')
        }
        break
      
      case 'market':
        if (data.market_gaps?.includes('video_tutorials')) {
          recommendations.push('Create comprehensive video tutorial series')
        }
        if (data.opportunities?.includes('live_content')) {
          recommendations.push('Start weekly live Q&A sessions')
        }
        break
    }
    
    setAiRecommendations(prev => [...prev, ...recommendations])
  }

  const updateFormData = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleNext = () => {
    const currentStepData = INTELLIGENT_STEPS[currentStep]
    
    if (currentSubstep < currentStepData.substeps.length - 1) {
      setCurrentSubstep(currentSubstep + 1)
    } else if (currentStep < INTELLIGENT_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      setCurrentSubstep(0)
      setErrors({})
    }
  }

  const handleBack = () => {
    if (currentSubstep > 0) {
      setCurrentSubstep(currentSubstep - 1)
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      const prevStepData = INTELLIGENT_STEPS[currentStep - 1]
      setCurrentSubstep(prevStepData.substeps.length - 1)
      setErrors({})
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const success = await OnboardingService.completeOnboarding(userId, {
        ...formData,
        brandAnalysis,
        personaPhotos: capturedPhotos,
        competitors,
        contentStrategy: contentCalendar,
        aiInsights,
        acceptedTerms: true,
        dataConsent: true,
        onboardingVersion: 'intelligent_v2'
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

  // Calculate progress
  const totalSubsteps = INTELLIGENT_STEPS.reduce((acc, step) => acc + step.substeps.length, 0)
  const currentSubstepIndex = INTELLIGENT_STEPS.slice(0, currentStep).reduce(
    (acc, step) => acc + step.substeps.length, 0
  ) + currentSubstep
  const progress = ((currentSubstepIndex + 1) / totalSubsteps) * 100

  // Loading state
  if (isLoadingProgress) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl opacity-30"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent relative">
              Inflio
            </h1>
            <p className="text-sm text-muted-foreground mt-1">AI Content Studio</p>
          </div>
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto"
          >
            <Brain className="h-16 w-16 text-primary" />
          </motion.div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium">Initializing AI Systems...</p>
            <p className="text-sm text-muted-foreground">
              Preparing your intelligent workspace
            </p>
          </div>
          
          <Progress value={30} className="w-64 mx-auto" />
        </motion.div>
      </div>
    )
  }

  const currentStepData = INTELLIGENT_STEPS[currentStep]
  const StepIcon = currentStepData.icon

  return (
    <TooltipProvider>
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/5 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 50, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 25, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl"
            animate={{ 
              scale: [0.8, 1, 0.8],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 30, repeat: Infinity }}
          />
        </div>

        {/* Advanced progress indicator */}
        <div className="absolute top-0 left-0 right-0">
          <Progress value={progress} className="h-1" />
          <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          <div className="px-8 py-2 flex items-center justify-between bg-background/50 backdrop-blur-xl border-b">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>Step {currentStep + 1} of {INTELLIGENT_STEPS.length}</span>
              <span>•</span>
              <span>Part {currentSubstep + 1} of {currentStepData.substeps.length}</span>
            </div>
            <div className="flex items-center gap-2">
              {isSaving && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Auto-saving...</span>
                </motion.div>
              )}
              <Badge variant="outline" className="text-xs">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="relative z-10 h-[calc(100vh-8rem)] overflow-y-auto mt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentStep}-${currentSubstep}`}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="min-h-full flex items-center justify-center px-8 py-12"
            >
              {/* Welcome Step */}
              {currentStep === 0 && (
                <div className="max-w-6xl w-full">
                  {currentSubstep === 0 && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center space-y-8"
                    >
                      <div className="relative">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl opacity-20"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                        <h1 className="relative text-6xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                          Welcome to Inflio AI
                        </h1>
                        <p className="text-xl text-muted-foreground mt-4">
                          The most intelligent content creation platform ever built
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {[
                          {
                            icon: Brain,
                            title: 'GPT-5 Powered',
                            description: 'Latest AI model for unmatched content quality'
                          },
                          {
                            icon: Wand2,
                            title: 'Personal AI Avatar',
                            description: 'Train your own face into AI for thumbnails'
                          },
                          {
                            icon: Lightning,
                            title: '50+ Content Pieces',
                            description: 'From one video in under 10 minutes'
                          }
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="p-6 rounded-xl bg-card border hover:border-primary/50 transition-all group"
                          >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <item.icon className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </motion.div>
                        ))}
                      </div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 max-w-3xl mx-auto"
                      >
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-purple-500" />
                          Your Data, Your Control
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          We use enterprise-grade encryption and never share your data. Your brand materials, 
                          photos, and content remain 100% private and owned by you.
                        </p>
                      </motion.div>
                    </motion.div>
                  )}

                  {currentSubstep === 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8 max-w-5xl mx-auto"
                    >
                      <div className="text-center space-y-4">
                        <h2 className="text-4xl font-bold">AI Capabilities</h2>
                        <p className="text-lg text-muted-foreground">
                          Discover what our advanced AI can do for you
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        {[
                          {
                            title: 'Brand Analysis',
                            description: 'Upload your brand book or materials and our AI extracts colors, fonts, voice, and guidelines',
                            icon: Scan,
                            features: ['Color palette extraction', 'Typography analysis', 'Voice & tone detection', 'Competitor insights']
                          },
                          {
                            title: 'Persona Training',
                            description: 'Train a custom AI model with your face for personalized thumbnail generation',
                            icon: Camera,
                            features: ['LoRA model training', 'Stable Diffusion integration', 'Multiple style variations', 'Batch generation']
                          },
                          {
                            title: 'Content Intelligence',
                            description: 'AI analyzes your niche and creates data-driven content strategies',
                            icon: Brain,
                            features: ['Trend detection', 'Viral prediction', 'Hashtag research', 'Optimal timing']
                          },
                          {
                            title: 'Competitor Analysis',
                            description: 'Understand your competition and find market opportunities',
                            icon: Target,
                            features: ['Content gap analysis', 'Engagement benchmarks', 'Strategy insights', 'Growth opportunities']
                          }
                        ].map((capability, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-xl bg-card border hover:border-primary/50 transition-all"
                          >
                            <capability.icon className="h-8 w-8 text-primary mb-3" />
                            <h3 className="font-semibold text-lg mb-2">{capability.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{capability.description}</p>
                            <div className="space-y-1">
                              {capability.features.map((feature, j) => (
                                <div key={j} className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span className="text-xs">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {currentSubstep === 2 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8 max-w-4xl mx-auto"
                    >
                      <div className="text-center space-y-4">
                        <h2 className="text-4xl font-bold">Your AI Workflow</h2>
                        <p className="text-lg text-muted-foreground">
                          See how everything works together
                        </p>
                      </div>

                      <div className="relative">
                        {[
                          {
                            step: 1,
                            title: 'Upload & Analyze',
                            description: 'Drop your video or brand materials',
                            icon: Upload,
                            color: 'from-blue-500 to-indigo-500'
                          },
                          {
                            step: 2,
                            title: 'AI Processing',
                            description: 'GPT-5 analyzes and creates content',
                            icon: Brain,
                            color: 'from-purple-500 to-pink-500'
                          },
                          {
                            step: 3,
                            title: 'Personalization',
                            description: 'Apply your brand and AI persona',
                            icon: Wand2,
                            color: 'from-orange-500 to-red-500'
                          },
                          {
                            step: 4,
                            title: 'Distribution',
                            description: 'Publish everywhere automatically',
                            icon: Share2,
                            color: 'from-green-500 to-emerald-500'
                          }
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.2 }}
                            className="flex items-center gap-6 mb-8 relative"
                          >
                            {i < 3 && (
                              <motion.div
                                className="absolute left-10 top-20 w-0.5 h-16 bg-gradient-to-b from-primary to-transparent"
                                initial={{ height: 0 }}
                                animate={{ height: 64 }}
                                transition={{ delay: 0.5 + i * 0.2 }}
                              />
                            )}
                            <div className={cn(
                              "w-20 h-20 rounded-2xl bg-gradient-to-r flex items-center justify-center text-white",
                              item.color
                            )}>
                              <item.icon className="h-10 w-10" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                Step {item.step}: {item.title}
                              </h3>
                              <p className="text-muted-foreground">{item.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Brand Analysis Step */}
              {currentStep === 1 && (
                <div className="max-w-5xl w-full">
                  {currentSubstep === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      <div className="text-center space-y-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center"
                        >
                          <Brain className="h-10 w-10 text-white" />
                        </motion.div>
                        <h2 className="text-4xl font-bold">Brand Intelligence</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                          Upload your brand book, style guide, or any brand materials. 
                          Our GPT-5 AI will analyze and extract your complete brand identity.
                        </p>
                      </div>

                      <Card className="p-8 max-w-3xl mx-auto">
                        <div 
                          className="border-2 border-dashed border-muted rounded-xl p-12 text-center hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden group"
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault()
                            const file = e.dataTransfer.files[0]
                            if (file) handleBrandBookUpload(file)
                          }}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleBrandBookUpload(file)
                            }}
                          />
                          
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                          
                          <FileUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <h3 className="font-semibold text-xl mb-2">Drop your brand materials here</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Brand books, style guides, logos, presentations
                          </p>
                          <Button variant="outline">
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Browse Files
                          </Button>
                          
                          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                            <span>PDF</span>
                            <span>•</span>
                            <span>DOC/DOCX</span>
                            <span>•</span>
                            <span>PPT/PPTX</span>
                            <span>•</span>
                            <span>Images</span>
                          </div>
                        </div>

                        {brandBookFile && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-muted rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <FileCheck className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="font-medium text-sm">{brandBookFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(brandBookFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBrandBookFile(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        )}
                      </Card>

                      <Alert className="max-w-3xl mx-auto">
                        <Lightbulb className="h-4 w-4" />
                        <AlertTitle>What we'll extract</AlertTitle>
                        <AlertDescription className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-sm">Brand colors, typography, and visual style</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-sm">Voice, tone, and personality traits</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-sm">Target audience and value proposition</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-sm">Do's and don'ts for content creation</span>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {currentSubstep === 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      <div className="text-center space-y-4">
                        <h2 className="text-4xl font-bold">Analyzing Your Brand</h2>
                        <p className="text-lg text-muted-foreground">
                          GPT-5 is processing your brand materials
                        </p>
                      </div>

                      {isAnalyzing ? (
                        <Card className="p-8 max-w-3xl mx-auto">
                          <div className="space-y-6">
                            <div className="flex items-center justify-center">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-24 h-24"
                              >
                                <Brain className="h-24 w-24 text-primary" />
                              </motion.div>
                            </div>
                            
                            <div className="space-y-3">
                              <Progress value={analysisProgress} className="h-2" />
                              <p className="text-center text-sm text-muted-foreground">
                                {analysisProgress < 30 && 'Reading brand materials...'}
                                {analysisProgress >= 30 && analysisProgress < 60 && 'Extracting visual elements...'}
                                {analysisProgress >= 60 && analysisProgress < 90 && 'Analyzing brand voice...'}
                                {analysisProgress >= 90 && 'Generating insights...'}
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              {[
                                { label: 'Colors', icon: Palette, active: analysisProgress >= 20 },
                                { label: 'Typography', icon: Type, active: analysisProgress >= 40 },
                                { label: 'Voice', icon: Mic, active: analysisProgress >= 60 },
                                { label: 'Audience', icon: Users, active: analysisProgress >= 70 },
                                { label: 'Competitors', icon: Target, active: analysisProgress >= 80 },
                                { label: 'Strategy', icon: Lightbulb, active: analysisProgress >= 90 }
                              ].map((item, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ 
                                    opacity: item.active ? 1 : 0.3, 
                                    scale: item.active ? 1 : 0.8 
                                  }}
                                  className={cn(
                                    "p-3 rounded-lg border text-center transition-all",
                                    item.active ? "border-primary bg-primary/5" : "border-muted"
                                  )}
                                >
                                  <item.icon className={cn(
                                    "h-5 w-5 mx-auto mb-1",
                                    item.active ? "text-primary" : "text-muted-foreground"
                                  )} />
                                  <p className={cn(
                                    "text-xs",
                                    item.active ? "font-medium" : "text-muted-foreground"
                                  )}>
                                    {item.label}
                                  </p>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ) : brandAnalysis && (
                        <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
                          <Card className="p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                              <Palette className="h-5 w-5 text-primary" />
                              Visual Identity
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs">Primary Colors</Label>
                                <div className="flex gap-2 mt-2">
                                  {brandAnalysis.colors.primary.map((color, i) => (
                                    <div
                                      key={i}
                                      className="w-12 h-12 rounded-lg border"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Typography</Label>
                                <div className="mt-2 space-y-1">
                                  {brandAnalysis.typography.headings.map((font, i) => (
                                    <Badge key={i} variant="outline">{font}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card>

                          <Card className="p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                              <Mic className="h-5 w-5 text-primary" />
                              Brand Voice
                            </h3>
                            <div className="space-y-3">
                              {brandAnalysis.voice.personality.map((trait, i) => (
                                <Badge key={i} className="mr-2">{trait}</Badge>
                              ))}
                              <p className="text-sm text-muted-foreground">
                                {brandAnalysis.voice.tone.join(', ')}
                              </p>
                            </div>
                          </Card>

                          <Card className="p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                              <Users className="h-5 w-5 text-primary" />
                              Target Audience
                            </h3>
                            <div className="space-y-2">
                              {brandAnalysis.target_audience.demographics.map((demo, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  <span className="text-sm">{demo}</span>
                                </div>
                              ))}
                            </div>
                          </Card>

                          <Card className="p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                              <Target className="h-5 w-5 text-primary" />
                              Value Proposition
                            </h3>
                            <p className="text-sm">
                              {brandAnalysis.unique_value_proposition}
                            </p>
                          </Card>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {currentSubstep === 2 && brandAnalysis && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      <div className="text-center space-y-4">
                        <h2 className="text-4xl font-bold">Brand Insights</h2>
                        <p className="text-lg text-muted-foreground">
                          AI-generated recommendations for your brand
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
                        <Card className="p-6">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            Content Themes
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {brandAnalysis.content_themes.map((theme, i) => (
                              <Badge key={i} variant="secondary">{theme}</Badge>
                            ))}
                          </div>
                        </Card>

                        <Card className="p-6">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Do's
                          </h3>
                          <div className="space-y-2">
                            {brandAnalysis.do_and_donts.do.map((item, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span className="text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </Card>

                        <Card className="p-6">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <X className="h-5 w-5 text-red-500" />
                            Don'ts
                          </h3>
                          <div className="space-y-2">
                            {brandAnalysis.do_and_donts.dont.map((item, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <X className="h-4 w-4 text-red-500 mt-0.5" />
                                <span className="text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </Card>

                        {aiRecommendations.length > 0 && (
                          <Card className="p-6 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                              <Wand2 className="h-5 w-5 text-primary" />
                              AI Recommendations
                            </h3>
                            <div className="space-y-2">
                              {aiRecommendations.map((rec, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                                  <span className="text-sm">{rec}</span>
                                </div>
                              ))}
                            </div>
                          </Card>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Persona Training Step - Enhanced */}
              {currentStep === 3 && (
                <div className="w-full">
                  <PersonaPhotoCapture
                    userId={userId}
                    personaName="Professional Persona"
                    personaDescription="AI persona for professional content creation"
                    showNameInput={true}
                    onComplete={(photos, personaId) => {
                      // Store the photos and persona ID
                      setCapturedPhotos(photos.map(p => p.url))
                      
                      // Update user profile with persona ID
                      if (personaId) {
                        localStorage.setItem('userPersonaId', personaId)
                      }
                      
                      // Start training process
                      if (photos.length >= 5) {
                        setIsTrainingModel(true)
                        // Simulate training progress
                        const interval = setInterval(() => {
                          setModelTrainingProgress(prev => {
                            if (prev >= 100) {
                              clearInterval(interval)
                              setIsTrainingModel(false)
                              return 100
                            }
                            return prev + 5
                          })
                        }, 500)
                      }
                      
                      // Move to next step
                      handleNext()
                    }}
                    onSkip={() => {
                      // Skip persona training  
                      handleNext()
                    }}
                  />
                </div>
              )}

              {/* Old implementation removed - using EnhancedAIAvatarTraining instead */}
              {false && false && currentStep === 3 && (
                <div className="max-w-6xl w-full">
                  {currentSubstep === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      <div className="text-center space-y-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center"
                        >
                          <Camera className="h-10 w-10 text-white" />
                        </motion.div>
                        <h2 className="text-4xl font-bold">AI Persona Training</h2>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                          We'll train a custom Stable Diffusion LoRA model with your face. 
                          This allows us to generate professional thumbnails featuring you in any style or scene.
                        </p>
                      </div>

                      <Alert className="max-w-3xl mx-auto border-purple-500/20 bg-purple-500/5">
                        <Wand2 className="h-4 w-4 text-purple-500" />
                        <AlertTitle>How LoRA Training Works</AlertTitle>
                        <AlertDescription className="mt-2 space-y-2">
                          <p className="text-sm">
                            LoRA (Low-Rank Adaptation) is an advanced AI technique that teaches Stable Diffusion 
                            to recognize and recreate your unique facial features.
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                                <Camera className="h-6 w-6 text-purple-500" />
                              </div>
                              <p className="text-xs font-medium">Capture Photos</p>
                              <p className="text-xs text-muted-foreground">10-20 images</p>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                                <Brain className="h-6 w-6 text-purple-500" />
                              </div>
                              <p className="text-xs font-medium">Train Model</p>
                              <p className="text-xs text-muted-foreground">5-10 minutes</p>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                                <ImageIcon className="h-6 w-6 text-purple-500" />
                              </div>
                              <p className="text-xs font-medium">Generate</p>
                              <p className="text-xs text-muted-foreground">Unlimited thumbnails</p>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {CAMERA_GUIDES.map((guide, i) => (
                          <Card key={i} className="p-6">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              <guide.icon className="h-5 w-5 text-primary" />
                              {guide.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              {guide.description}
                            </p>
                            
                            <Tabs defaultValue="good" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="good">✓ Good</TabsTrigger>
                                <TabsTrigger value="bad">✗ Avoid</TabsTrigger>
                              </TabsList>
                              <TabsContent value="good" className="mt-3 space-y-1">
                                {guide.examples.good.map((example, j) => (
                                  <div key={j} className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span className="text-xs">{example}</span>
                                  </div>
                                ))}
                              </TabsContent>
                              <TabsContent value="bad" className="mt-3 space-y-1">
                                {guide.examples.bad.map((example, j) => (
                                  <div key={j} className="flex items-center gap-2">
                                    <X className="h-3 w-3 text-red-500" />
                                    <span className="text-xs">{example}</span>
                                  </div>
                                ))}
                              </TabsContent>
                            </Tabs>
                            
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                              <p className="text-xs font-medium mb-2">Pro Tips:</p>
                              {guide.tips.map((tip, j) => (
                                <div key={j} className="flex items-start gap-2">
                                  <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5" />
                                  <span className="text-xs">{tip}</span>
                                </div>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {currentSubstep === 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      <div className="text-center space-y-4">
                        <h2 className="text-4xl font-bold">Capture Your Photos</h2>
                        <p className="text-lg text-muted-foreground">
                          Take 10-20 high-quality photos following the guidelines
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
                        <Card className="p-6">
                          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                            {cameraStream ? (
                              <>
                                <video
                                  ref={videoRef}
                                  autoPlay
                                  playsInline
                                  muted
                                  className="w-full h-full object-cover"
                                />
                                <canvas ref={canvasRef} className="hidden" />
                                
                                {/* Camera overlay guides */}
                                <div className="absolute inset-0 pointer-events-none">
                                  {/* Face guide oval */}
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-white/30 rounded-full" />
                                  
                                  {/* Grid lines */}
                                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                                    {[...Array(9)].map((_, i) => (
                                      <div key={i} className="border border-white/10" />
                                    ))}
                                  </div>
                                  
                                  {/* Instructions */}
                                  <div className="absolute top-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                                    <p className="text-white text-sm">
                                      Position your face within the oval guide
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                  <Button
                                    size="lg"
                                    onClick={capturePhoto}
                                    className="bg-white text-black hover:bg-gray-100"
                                  >
                                    <Camera className="h-5 w-5 mr-2" />
                                    Capture
                                  </Button>
                                  <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={stopCamera}
                                    className="bg-black/50 text-white border-white/20"
                                  >
                                    <CameraOff className="h-5 w-5 mr-2" />
                                    Stop
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Button onClick={startCamera} size="lg">
                                  <Camera className="h-5 w-5 mr-2" />
                                  Start Camera
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {errors.camera && (
                            <Alert className="mt-4" variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{errors.camera}</AlertDescription>
                            </Alert>
                          )}
                        </Card>

                        <Card className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">
                              Captured Photos ({capturedPhotos.length}/20)
                            </h3>
                            {capturedPhotos.length >= 10 && (
                              <Badge variant="outline" className="text-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ready to train
                              </Badge>
                            )}
                          </div>
                          
                          <ScrollArea className="h-[400px]">
                            <div className="grid grid-cols-3 gap-2">
                              {capturedPhotos.map((photo, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="relative group"
                                >
                                  <img
                                    src={photo}
                                    alt={`Captured ${i + 1}`}
                                    className="w-full aspect-square object-cover rounded-lg"
                                  />
                                  
                                  {photoQuality[photo] && (
                                    <div className="absolute top-1 right-1">
                                      <Badge
                                        variant={photoQuality[photo].overall === 'excellent' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {photoQuality[photo].overall}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                                    onClick={() => {
                                      setCapturedPhotos(prev => prev.filter((_, idx) => idx !== i))
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </motion.div>
                              ))}
                              
                              {/* Empty slots */}
                              {[...Array(Math.max(0, 12 - capturedPhotos.length))].map((_, i) => (
                                <div
                                  key={`empty-${i}`}
                                  className="aspect-square rounded-lg border-2 border-dashed border-muted flex items-center justify-center"
                                >
                                  <Camera className="h-6 w-6 text-muted-foreground" />
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          
                          {capturedPhotos.length < 10 && (
                            <Alert className="mt-4">
                              <Info className="h-4 w-4" />
                              <AlertDescription>
                                Capture at least {10 - capturedPhotos.length} more photos for optimal results
                              </AlertDescription>
                            </Alert>
                          )}
                        </Card>
                      </div>
                    </motion.div>
                  )}

                  {currentSubstep === 2 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      <div className="text-center space-y-4">
                        <h2 className="text-4xl font-bold">Training Your AI Persona</h2>
                        <p className="text-lg text-muted-foreground">
                          Building your custom LoRA model for thumbnail generation
                        </p>
                      </div>

                      <Card className="p-8 max-w-3xl mx-auto">
                        {isTrainingModel ? (
                          <div className="space-y-6">
                            <div className="flex items-center justify-center">
                              <motion.div
                                className="relative w-32 h-32"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full blur-xl opacity-50" />
                                <div className="relative w-full h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                                  <Wand2 className="h-16 w-16 text-white" />
                                </div>
                              </motion.div>
                            </div>
                            
                            <div className="space-y-3">
                              <Progress value={modelTrainingProgress} className="h-2" />
                              <p className="text-center text-sm font-medium">
                                Training Progress: {modelTrainingProgress}%
                              </p>
                              <p className="text-center text-xs text-muted-foreground">
                                {modelTrainingProgress < 25 && 'Preprocessing images...'}
                                {modelTrainingProgress >= 25 && modelTrainingProgress < 50 && 'Extracting facial features...'}
                                {modelTrainingProgress >= 50 && modelTrainingProgress < 75 && 'Training neural network...'}
                                {modelTrainingProgress >= 75 && modelTrainingProgress < 100 && 'Finalizing model...'}
                                {modelTrainingProgress === 100 && 'Training complete!'}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2">
                              {capturedPhotos.slice(0, 8).map((photo, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="aspect-square rounded-lg overflow-hidden relative"
                                >
                                  <img
                                    src={photo}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/50 to-transparent" />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center space-y-6">
                            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                              <CheckCircle className="h-12 w-12 text-white" />
                            </div>
                            
                            <div>
                              <h3 className="text-2xl font-bold mb-2">Persona Training Complete!</h3>
                              <p className="text-muted-foreground">
                                Your AI model is ready to generate stunning thumbnails
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                              {[
                                { label: 'Model Quality', value: 'Excellent' },
                                { label: 'Generation Speed', value: '< 10 sec' },
                                { label: 'Style Variety', value: 'Unlimited' }
                              ].map((stat, i) => (
                                <div key={i} className="text-center">
                                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                                  <p className="font-semibold">{stat.value}</p>
                                </div>
                              ))}
                            </div>
                            
                            <Alert className="text-left">
                              <Sparkles className="h-4 w-4" />
                              <AlertTitle>What you can do now</AlertTitle>
                              <AlertDescription className="mt-2 space-y-1">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span className="text-sm">Generate thumbnails with your face in any scene</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span className="text-sm">Create consistent brand imagery</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span className="text-sm">A/B test different thumbnail styles</span>
                                </div>
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                        
                        {capturedPhotos.length >= 10 && !isTrainingModel && modelTrainingProgress === 0 && (
                          <div className="mt-6 text-center">
                            <Button
                              size="lg"
                              onClick={trainPersonaModel}
                              className="bg-gradient-to-r from-purple-500 to-indigo-500"
                            >
                              <Wand2 className="h-5 w-5 mr-2" />
                              Start Training
                            </Button>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Add other steps similarly with enhanced complexity */}
              {/* ... Market Position, Content Strategy, AI Customization, Launch steps ... */}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Enhanced footer navigation */}
        <div className="absolute bottom-0 left-0 right-0 h-20 px-8 flex items-center justify-between bg-background/80 backdrop-blur-xl border-t">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0 && currentSubstep === 0}
            className={cn(
              "transition-opacity",
              currentStep === 0 && currentSubstep === 0 && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-4">
            {/* Step indicators */}
            <div className="hidden md:flex items-center gap-1">
              {INTELLIGENT_STEPS.map((step, index) => (
                <Tooltip key={step.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full transition-all cursor-pointer",
                        index === currentStep ? "w-8 bg-primary" : 
                        index < currentStep ? "bg-primary/50" : "bg-muted",
                        index <= currentStep && "hover:bg-primary"
                      )}
                      onClick={() => {
                        if (index <= currentStep) {
                          setCurrentStep(index)
                          setCurrentSubstep(0)
                        }
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{step.title}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            
            {/* Substep indicators */}
            <div className="flex items-center gap-1">
              {currentStepData.substeps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    index === currentSubstep ? "bg-primary w-4" : 
                    index < currentSubstep ? "bg-primary/50" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={
              currentStep === INTELLIGENT_STEPS.length - 1 && 
              currentSubstep === INTELLIGENT_STEPS[currentStep].substeps.length - 1
                ? handleComplete
                : handleNext
            }
            disabled={isLoading}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Launching...
              </span>
            ) : currentStep === INTELLIGENT_STEPS.length - 1 && 
              currentSubstep === INTELLIGENT_STEPS[currentStep].substeps.length - 1 ? (
              <>
                Launch Studio
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
      </div>
    </TooltipProvider>
  )
}
