'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, Circle, User, Palette, Bot, UserCircle,
  Upload, ArrowRight, Sparkles, Video, Zap, Play,
  ChevronRight, Lock, CheckCheck, Wand2, Rocket,
  FileVideo, Globe, DollarSign, TrendingUp, Clock,
  Shield, Star, Mic, Camera, Brain, Lightbulb, X, SkipForward
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IconBrandInstagram, IconBrandTiktok, IconBrandLinkedin, IconBrandYoutube, IconBrandX } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface OnboardingStep {
  id: string
  title: string
  description: string
  benefit: string
  timeEstimate: string
  icon: React.ComponentType<{ className?: string }>
  image?: string
  path: string
  status: 'completed' | 'current' | 'upcoming'
  completedAt?: Date
}

interface InflioAIOnboardingProps {
  userId: string
  userName?: string
  userEmail?: string
}

export function InflioAIOnboarding({ userId, userName, userEmail }: InflioAIOnboardingProps) {
  const router = useRouter()
  const [currentMessage, setCurrentMessage] = useState('')
  const [fullMessage, setFullMessage] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [showSocialModal, setShowSocialModal] = useState(false)
  const [hasBrandData, setHasBrandData] = useState(false)
  const [personaStatus, setPersonaStatus] = useState<'none' | 'analyzing' | 'ready' | 'failed'>('none')
  const [portraitsGenerated, setPortraitsGenerated] = useState(0)
  const portraitsTotal = 10
  const personaPollingRef = useRef<NodeJS.Timeout | null>(null)
  const typewriterInterval = useRef<NodeJS.Timeout | null>(null)
  const messageQueue = useRef<string>('')
  const isUpdatingMessage = useRef(false)
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'onboarding',
      title: 'Complete onboarding',
      description: 'Set up your profile, brand, and AI avatar',
      benefit: 'InflioAI learns everything about you and your brand',
      timeEstimate: '',
      icon: Rocket,
      path: '/onboarding',
      status: 'current'
    },
    {
      id: 'review-brand',
      title: 'Review your brand',
      description: 'Check your brand colors, fonts, and guidelines',
      benefit: 'Ensure everything matches your vision perfectly',
      timeEstimate: '',
      icon: Palette,
      path: '/brand',
      status: 'upcoming'
    },
    {
      id: 'review-persona',
      title: 'Review your AI avatar',
      description: 'See your generated thumbnails and avatars',
      benefit: 'Fine-tune your AI-generated visuals',
      timeEstimate: '',
      icon: Bot,
      path: '/personas',
      status: 'upcoming'
    },
    {
      id: 'connect',
      title: 'Connect your socials',
      description: 'Link Instagram, TikTok, LinkedIn, and more',
      benefit: 'Publish everywhere with one click',
      timeEstimate: '',
      icon: Globe,
      path: '/settings/connections',
      status: 'upcoming'
    },
    {
      id: 'upload',
      title: 'Upload your first video',
      description: 'Watch InflioAI transform it into content',
      benefit: 'One video becomes 30+ pieces of content',
      timeEstimate: '',
      icon: Upload,
      path: '/studio/upload',
      status: 'upcoming'
    }
  ])

  // AI messages that InflioAI will cycle through
  const aiMessages = {
    welcome: `Hi ${userName?.split(' ')[0] || 'there'}! I'm InflioAI, your content creation copilot. Let's get your studio set up properly. I'll guide you through each step.`,
    
    onboarding: "Let's start by setting up your profile, brand, and AI avatar. This is where I learn everything about you - your style, your brand, your voice. It's the foundation for all the content we'll create together.",
    
    'review-brand': "Great! Now let's review your brand settings. Take a moment to ensure your colors, fonts, and guidelines are exactly how you want them. Every piece of content will follow these rules.",
    
    'review-persona': "", // Dynamic — set by getPersonaMessage()
    
    connect: "Time to connect your social platforms! Link Instagram, TikTok, LinkedIn, YouTube - wherever your audience is. I'll optimize and publish content to each platform automatically.",
    
    upload: "Perfect! Everything is set up. Now comes the fun part - upload any video and watch me transform it into dozens of content pieces. Clips, blogs, posts, thumbnails - all created instantly.",
    
    completed: `Excellent work, ${userName?.split(' ')[0] || 'there'}! Your content studio is fully configured. From now on, just upload videos and I'll handle the rest. Ready to create amazing content together!`
  }

  // Load user progress
  useEffect(() => {
    let mounted = true
    const initializeOnboarding = async () => {
      await loadUserProgress()
      // Initial message will be set by loadUserProgress
    }
    
    if (mounted) {
      initializeOnboarding()
    }
    
    // Also refresh when window gets focus (user returns from another page)
    const handleFocus = () => {
      if (mounted) {
        loadUserProgress()
      }
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      mounted = false
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadUserProgress = async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clerk_user_id', userId)
        .single()

      if (profile) {
        const updatedSteps = [...steps]
        let currentStepIndex = 0

        // Check if user completed the main onboarding flow
        const hasCompletedOnboarding = profile.onboarding_completed
        const hasBrand = !!(profile.brand_identity || profile.brand_analysis)
        const skippedBrand = profile.brand_analysis_skipped === true
        const skippedPersona = profile.persona_skipped === true

        // Check if user has any personas and their generation status (using API to bypass RLS)
        let hasPersona = !!profile.persona_id
        let currentPersonaStatus: 'none' | 'analyzing' | 'ready' | 'failed' = 'none'
        let currentPortraitsCount = 0
        
        try {
          const personaResponse = await fetch('/api/personas/check-persona')
          if (personaResponse.ok) {
            const personaData = await personaResponse.json()
            const personas = personaData.personas || []
            if (personas.length > 0) {
              hasPersona = true
              const mainPersona = personas[0] // Most recent persona
              currentPersonaStatus = mainPersona.status === 'ready' ? 'ready'
                : mainPersona.status === 'failed' ? 'failed'
                : mainPersona.status === 'analyzing' ? 'analyzing'
                : 'none'
              // Count generated portraits (not user uploads)
              currentPortraitsCount = (mainPersona.images || []).filter(
                (img: { metadata?: { type?: string } }) => img.metadata?.type === 'reference_portrait'
              ).length
            }
          }
        } catch (err) {
          console.error('[5-step] Error checking personas:', err)
        }
        
        setPersonaStatus(currentPersonaStatus)
        setPortraitsGenerated(currentPortraitsCount)

        console.log('[5-step] Status check:', { hasCompletedOnboarding, hasBrand, hasPersona, skippedBrand, skippedPersona, currentPersonaStatus, currentPortraitsCount })

        // Update state for button visibility
        setHasBrandData(hasBrand)

        if (hasCompletedOnboarding) {
          // Step 1: Complete onboarding - DONE
          updatedSteps[0].status = 'completed'
          updatedSteps[0].completedAt = new Date(profile.updated_at)
          currentStepIndex = 1

          // Step 2: Review brand
          // Only complete if brand EXISTS and reviewed, or was explicitly skipped
          if (hasBrand) {
            // Brand exists - check if reviewed
            if (profile.brand_reviewed) {
              updatedSteps[1].status = 'completed'
              currentStepIndex = 2
            } else {
              updatedSteps[1].status = 'current'
              // Keep original path - brand page will show the brand to review
            }
          } else if (skippedBrand) {
            // No brand but explicitly skipped
            updatedSteps[1].status = 'completed'
            updatedSteps[1].description = 'Skipped - create brand in settings'
            currentStepIndex = 2
          } else {
            // No brand and didn't skip - still current, brand page will show empty state
            updatedSteps[1].status = 'current'
            // Keep path as /brand - the brand page has its own empty state with create button
          }

          // Step 3: Review persona
          // Only complete if persona EXISTS and reviewed, or was explicitly skipped
          if (updatedSteps[1].status === 'completed') {
            if (hasPersona) {
              // Persona exists - check if reviewed
              if (profile.persona_reviewed) {
                updatedSteps[2].status = 'completed'
                currentStepIndex = 3
              } else {
                updatedSteps[2].status = 'current'
                // Keep original path - personas page will show the persona to review
              }
            } else if (skippedPersona) {
              // No persona but explicitly skipped
              updatedSteps[2].status = 'completed'
              updatedSteps[2].description = 'Skipped - create avatar in settings'
              currentStepIndex = 3
            } else {
              // No persona and didn't skip - still current, personas page will show empty state
              updatedSteps[2].status = 'current'
              // Keep path as /personas - the personas page has its own empty state with create button
            }
          }
          
          // Step 4: Connect socials
          if (updatedSteps[2].status === 'completed') {
            updatedSteps[3].status = 'current'
            currentStepIndex = 3
            
            if (profile.socials_connected) {
              updatedSteps[3].status = 'completed'
              currentStepIndex = 4
            }
          }
          
          // Step 5: Upload first video
          if (updatedSteps[3].status === 'completed') {
            updatedSteps[4].status = 'current'
            currentStepIndex = 4
            
            // Check if they've uploaded their first video
            const { data: projects } = await supabase
              .from('projects')
              .select('id')
              .eq('user_id', profile.clerk_user_id)
              .limit(1)
              
            if (projects && projects.length > 0) {
              updatedSteps[4].status = 'completed'
              currentStepIndex = 5 // All done
            }
          }
        }
        
        setSteps(updatedSteps)
        
        // Update AI message based on current step after a small delay to prevent race conditions
        setTimeout(() => {
          const currentStep = updatedSteps.find(s => s.status === 'current')
          updateAIMessage(currentStep?.id || 'completed')
        }, 100)
      } else {
        // No profile yet, show welcome message
        setTimeout(() => {
          updateAIMessage('welcome')
        }, 100)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
      // Show welcome on error
      setTimeout(() => {
        updateAIMessage('welcome')
      }, 100)
    }
  }

  const getPersonaMessage = (): string => {
    if (personaStatus === 'none') {
      return "Time to create your AI avatar! Upload a few photos and I'll generate 10 unique portraits you can use across all your content."
    }
    if (personaStatus === 'analyzing') {
      if (portraitsGenerated === 0) {
        return "I'm analyzing your photos and creating your AI avatar. This takes a few minutes — I'll generate 10 unique portraits for you. Feel free to continue with other steps while this runs in the background."
      }
      return `Your avatar is being generated... ${portraitsGenerated} of ${portraitsTotal} portraits are ready. You can continue with other steps while this finishes.`
    }
    if (personaStatus === 'failed') {
      return "There was an issue generating your avatar. You can try again or skip this step for now."
    }
    // ready
    return "Your AI avatar is ready! All 10 portraits have been generated. Review them and pick your favorites — these will be used across all your content."
  }

  const updateAIMessage = async (stepId: string) => {
    // Prevent concurrent updates
    if (isUpdatingMessage.current) {
      return
    }
    isUpdatingMessage.current = true
    
    // Clear any existing typewriter animation
    if (typewriterInterval.current) {
      clearInterval(typewriterInterval.current)
      typewriterInterval.current = null
    }
    
    // Start thinking state without clearing message immediately
    setIsThinking(true)
    
    try {
      // Get real guidance from InflioAI
      const response = await fetch('/api/inflioai/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          currentStep: stepId,
          completedSteps: steps.filter(s => s.status === 'completed').map(s => s.id),
          totalSteps: steps.length
        })
      })
      
      let message = stepId === 'review-persona' 
        ? getPersonaMessage() 
        : (aiMessages[stepId as keyof typeof aiMessages] || aiMessages.welcome)
      
      if (response.ok) {
        const data = await response.json()
        if (data.message && !data.fallback) {
          // Use the AI-generated message
          message = `${userName?.split(' ')[0] || 'Hey there'}! ${data.message}`
        }
      }
      
      // Store the full message
      setFullMessage(message)
      messageQueue.current = message
      
      // Clear current message only now, right before typewriter starts
      setCurrentMessage('')
      
      // Start typewriter effect
      let index = 0
      typewriterInterval.current = setInterval(() => {
        if (messageQueue.current !== message) {
          // Message changed, stop this animation
          if (typewriterInterval.current) {
            clearInterval(typewriterInterval.current)
            typewriterInterval.current = null
          }
          return
        }
        
        setCurrentMessage(message.slice(0, index))
        index++
        
        if (index > message.length) {
          if (typewriterInterval.current) {
            clearInterval(typewriterInterval.current)
            typewriterInterval.current = null
          }
          setIsThinking(false)
          isUpdatingMessage.current = false
        }
      }, 20)
    } catch (error) {
      console.error('Error getting AI guidance:', error)
      // Use fallback message
      const message = stepId === 'review-persona' 
        ? getPersonaMessage() 
        : (aiMessages[stepId as keyof typeof aiMessages] || aiMessages.welcome)
      setFullMessage(message)
      setCurrentMessage(message)
      setIsThinking(false)
      isUpdatingMessage.current = false
    }
  }
  
  // Poll persona generation progress while analyzing
  useEffect(() => {
    if (personaStatus !== 'analyzing') {
      // Clear any existing polling
      if (personaPollingRef.current) {
        clearInterval(personaPollingRef.current)
        personaPollingRef.current = null
      }
      return
    }

    const pollPersona = async () => {
      try {
        const response = await fetch('/api/personas/check-persona')
        if (!response.ok) return
        const data = await response.json()
        const personas = data.personas || []
        if (personas.length === 0) return

        const mainPersona = personas[0]
        const newStatus: 'none' | 'analyzing' | 'ready' | 'failed' = 
          mainPersona.status === 'ready' ? 'ready'
          : mainPersona.status === 'failed' ? 'failed'
          : 'analyzing'
        
        const newCount = (mainPersona.images || []).filter(
          (img: { metadata?: { type?: string } }) => img.metadata?.type === 'reference_portrait'
        ).length
        
        setPortraitsGenerated(newCount)
        
        if (newStatus !== 'analyzing') {
          // Generation finished — update status and refresh the AI message + step states
          setPersonaStatus(newStatus)
          if (personaPollingRef.current) {
            clearInterval(personaPollingRef.current)
            personaPollingRef.current = null
          }
          // Refresh the full progress to update step states and AI message
          loadUserProgress()
        }
      } catch (err) {
        console.error('[persona-poll] Error:', err)
      }
    }

    // Poll every 5 seconds
    personaPollingRef.current = setInterval(pollPersona, 5000)
    // Run once immediately
    pollPersona()

    return () => {
      if (personaPollingRef.current) {
        clearInterval(personaPollingRef.current)
        personaPollingRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaStatus])

  // Refresh AI message when portrait count changes during generation
  useEffect(() => {
    if (personaStatus === 'analyzing' && portraitsGenerated > 0) {
      // Update the AI copilot message to reflect new count
      const currentStep = steps.find(s => s.status === 'current')
      if (currentStep?.id === 'review-persona') {
        const newMessage = getPersonaMessage()
        setFullMessage(newMessage)
        setCurrentMessage(newMessage)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portraitsGenerated])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typewriterInterval.current) {
        clearInterval(typewriterInterval.current)
      }
      if (personaPollingRef.current) {
        clearInterval(personaPollingRef.current)
      }
    }
  }, [])

  const handleStepClick = async (step: OnboardingStep) => {
    if (step.status === 'upcoming') {
      const currentIndex = steps.findIndex(s => s.status === 'current')
      const clickedIndex = steps.findIndex(s => s.id === step.id)

      if (clickedIndex > currentIndex) {
        // Don't trigger a new AI message, just update the current one
        const warningMessage = `Please complete "${steps[currentIndex].title}" first. Each step builds on the previous one.`
        setFullMessage(warningMessage)
        setCurrentMessage(warningMessage)
        return
      }
    }

    // For review steps, DON'T auto-mark as reviewed on click
    // User must explicitly click "Mark as Done" after reviewing
    // Just navigate to the page

    // Show modal for social connect step (infrastructure not ready yet)
    if (step.id === 'connect' && step.status === 'current') {
      setShowSocialModal(true)
      return
    }

    router.push(step.path)
  }

  const handleSkipSocials = async () => {
    // Mark socials as connected (skipped) and move to next step
    await fetch('/api/onboarding/mark-reviewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'socials_connected' })
    })
    
    setShowSocialModal(false)
    
    // Update local state
    const updatedSteps = [...steps]
    const connectIndex = updatedSteps.findIndex(s => s.id === 'connect')
    if (connectIndex !== -1) {
      updatedSteps[connectIndex].status = 'completed'
      updatedSteps[connectIndex].description = 'Skipped - connect later in settings'
      if (connectIndex + 1 < updatedSteps.length) {
        updatedSteps[connectIndex + 1].status = 'current'
      }
      setSteps(updatedSteps)
      
      // Update AI message for next step
      updateAIMessage('upload')
    }
  }

  const completedSteps = steps.filter(s => s.status === 'completed').length
  const progress = (completedSteps / steps.length) * 100

  // Auto-complete setup when everything is done
  useEffect(() => {
    if (completedSteps === steps.length) {
      // Mark setup as complete in the database so dashboard shows normal view
      const markSetupComplete = async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          await supabase
            .from('user_profiles')
            .update({ 
              setup_completed: true,
              show_launchpad: false 
            })
            .eq('clerk_user_id', userId)
          
          // Give user a moment to see the completion message, then redirect
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } catch (error) {
          console.error('Error marking setup complete:', error)
          // Still redirect even if update fails
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      }
      markSetupComplete()
    }
  }, [completedSteps, steps.length, userId, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* InflioAI Speaking Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
            
            <CardContent className="relative p-8">
              <div className="flex items-start gap-6">
                {/* InflioAI Avatar */}
                <motion.div
                  animate={{ 
                    scale: isThinking ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: isThinking ? Infinity : 0 
                  }}
                  className="relative"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl">
                    <Brain className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    <div className={cn(
                      "w-4 h-4 rounded-full",
                      isThinking ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                    )} />
                  </div>
                </motion.div>

                {/* Message Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      InflioAI
                    </h2>
                    <Badge variant="secondary" className="text-xs">
                      Your Content Copilot
                    </Badge>
                    {isThinking && (
                      <Badge variant="outline" className="text-xs animate-pulse">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Thinking...
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-lg leading-relaxed text-foreground/90 min-h-[60px] transition-opacity duration-300">
                    {isThinking && currentMessage.length === 0 ? (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center text-muted-foreground"
                      >
                        <span className="animate-pulse">Analyzing your progress</span>
                        <span className="ml-2 flex space-x-1">
                          <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                      </motion.span>
                    ) : (
                      <motion.div
                        key={fullMessage}
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {currentMessage || fullMessage}
                        {isThinking && currentMessage.length > 0 && currentMessage.length < fullMessage.length && (
                          <span className="inline-block w-0.5 h-5 bg-primary animate-pulse ml-0.5" />
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  {completedSteps === 0 && (
                    <div className="flex items-center gap-6 mt-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        <span>Set up once, use forever</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span>Your data is secure</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Brain className="h-4 w-4" />
                        <span>AI learns from your content</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Overview */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Your content studio setup
            </h1>
            <p className="text-muted-foreground">
              {completedSteps === steps.length 
                ? "Everything is ready! Start creating amazing content."
                : completedSteps === 0
                ? "Let's get your studio configured properly"
                : `${completedSteps} of ${steps.length} steps complete`
              }
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{Math.round(progress)}%</div>
            <Progress value={progress} className="w-32 h-2 mt-2" />
          </div>
        </div>

        {/* Setup Steps */}
        <div className="grid gap-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  "group cursor-pointer transition-all duration-200 overflow-hidden",
                  step.status === 'completed' && "border-green-500/50 bg-green-50/5",
                  step.status === 'current' && "border-primary shadow-lg shadow-primary/20 bg-primary/5",
                  step.status === 'upcoming' && "border-muted hover:border-muted-foreground/30"
                )}
                onClick={() => handleStepClick(step)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center">
                    {/* Left Section - Icon & Status */}
                    <div className={cn(
                      "w-24 h-full flex flex-col items-center justify-center p-6 border-r",
                      step.status === 'completed' && "bg-green-500/10 border-green-500/20",
                      step.status === 'current' && "bg-primary/10 border-primary/20",
                      step.status === 'upcoming' && "bg-muted/50"
                    )}>
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center mb-2",
                        step.status === 'completed' && "bg-green-500 text-white",
                        step.status === 'current' && step.id === 'review-persona' && personaStatus === 'analyzing' && "bg-amber-500 text-white",
                        step.status === 'current' && !(step.id === 'review-persona' && personaStatus === 'analyzing') && "bg-primary text-primary-foreground",
                        step.status === 'upcoming' && "bg-muted text-muted-foreground"
                      )}>
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="h-7 w-7" />
                        ) : step.status === 'current' && step.id === 'review-persona' && personaStatus === 'analyzing' ? (
                          <div className="h-7 w-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          (() => {
                            const Icon = step.icon
                            return <Icon className="h-7 w-7" />
                          })()
                        )}
                      </div>
                      <span className={cn(
                        "text-xs font-medium",
                        step.status === 'completed' && "text-green-600",
                        step.status === 'current' && step.id === 'review-persona' && personaStatus === 'analyzing' && "text-amber-600",
                        step.status === 'current' && !(step.id === 'review-persona' && personaStatus === 'analyzing') && "text-primary",
                        step.status === 'upcoming' && "text-muted-foreground"
                      )}>
                        {step.status === 'completed' ? 'Done' 
                          : step.status === 'current' && step.id === 'review-persona' && personaStatus === 'analyzing' ? 'Generating'
                          : `Step ${index + 1}`}
                      </span>
                    </div>

                    {/* Middle Section - Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {step.title}
                            </h3>
                            {step.status === 'current' && step.id === 'review-persona' && personaStatus === 'analyzing' ? (
                              <Badge variant="outline" className="animate-pulse border-amber-500 text-amber-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Generating {portraitsGenerated}/{portraitsTotal}
                              </Badge>
                            ) : step.status === 'current' && (
                              <Badge className="animate-pulse">
                                <ArrowRight className="h-3 w-3 mr-1" />
                                Current
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {step.description}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium",
                              "bg-gradient-to-r from-primary/10 to-purple-500/10",
                              "border border-primary/20"
                            )}>
                              <Lightbulb className="h-3 w-3 inline mr-1.5" />
                              Why this matters: {step.benefit}
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Action */}
                        <div className="ml-6 flex flex-col gap-2">
                          {step.status === 'completed' ? (
                            <div className="text-center">
                              <CheckCheck className="h-8 w-8 text-green-500 mx-auto mb-1" />
                              <span className="text-xs text-green-600">Complete</span>
                            </div>
                          ) : step.status === 'current' ? (
                            <>
                              {/* Main action button — contextual for persona step */}
                              {step.id === 'review-persona' && personaStatus === 'analyzing' ? (
                                <Button 
                                  size="default"
                                  variant="outline"
                                  className="group shadow-sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push('/personas')
                                  }}
                                >
                                  View Progress
                                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                              ) : step.id === 'review-persona' && personaStatus === 'ready' ? (
                                <Button 
                                  size="default"
                                  className="group shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push('/personas')
                                  }}
                                >
                                  Review Avatars
                                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                              ) : step.id === 'review-persona' && personaStatus === 'failed' ? (
                                null
                              ) : (
                                <Button 
                                  size="default"
                                  className="group shadow-lg"
                                >
                                  Start
                                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                              )}
                              {/* Allow marking review steps as complete - only shown when data exists */}
                              {step.id === 'review-brand' && hasBrandData && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      const response = await fetch('/api/onboarding/mark-reviewed', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ field: 'brand_reviewed' })
                                      })
                                      if (response.ok) {
                                        // Refresh progress locally instead of full page reload
                                        loadUserProgress()
                                      }
                                    } catch (err) {
                                      console.error('Error:', err)
                                    }
                                  }}
                                >
                                  Mark as Done
                                </Button>
                              )}
                              {step.id === 'review-persona' && personaStatus === 'analyzing' && (
                                <div className="flex flex-col gap-2 items-center">
                                  <div className="w-full space-y-1">
                                    <div className="flex items-center gap-1.5 justify-center">
                                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                      <span className="text-xs font-medium text-amber-600">Generating...</span>
                                    </div>
                                    <Progress value={(portraitsGenerated / portraitsTotal) * 100} className="h-1.5 w-full" />
                                    <span className="text-[10px] text-muted-foreground block text-center">{portraitsGenerated}/{portraitsTotal} portraits</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs"
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      try {
                                        const response = await fetch('/api/onboarding/mark-reviewed', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ field: 'persona_reviewed' })
                                        })
                                        if (response.ok) {
                                          loadUserProgress()
                                        }
                                      } catch (err) {
                                        console.error('Error:', err)
                                      }
                                    }}
                                  >
                                    Continue anyway
                                  </Button>
                                </div>
                              )}
                              {step.id === 'review-persona' && personaStatus === 'ready' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      const response = await fetch('/api/onboarding/mark-reviewed', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ field: 'persona_reviewed' })
                                      })
                                      if (response.ok) {
                                        loadUserProgress()
                                      }
                                    } catch (err) {
                                      console.error('Error:', err)
                                    }
                                  }}
                                >
                                  Mark as Done
                                </Button>
                              )}
                              {step.id === 'review-persona' && personaStatus === 'failed' && (
                                <div className="flex flex-col gap-1 items-center">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push('/personas')
                                    }}
                                  >
                                    Retry
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs"
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      try {
                                        const response = await fetch('/api/onboarding/mark-reviewed', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ field: 'persona_reviewed' })
                                        })
                                        if (response.ok) {
                                          loadUserProgress()
                                        }
                                      } catch (err) {
                                        console.error('Error:', err)
                                      }
                                    }}
                                  >
                                    Skip
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center">
                              <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                              <span className="text-xs text-muted-foreground">Locked</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* What Happens Next */}
        <Card className="bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border-primary/20">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              What happens after setup?
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold">Upload any video</h4>
                <p className="text-sm text-muted-foreground">
                  Podcasts, tutorials, vlogs - any format works
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                  <Wand2 className="h-6 w-6 text-purple-500" />
                </div>
                <h4 className="font-semibold">InflioAI works its magic</h4>
                <p className="text-sm text-muted-foreground">
                  Creates clips, blogs, posts, thumbnails automatically
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <h4 className="font-semibold">Publish everywhere</h4>
                <p className="text-sm text-muted-foreground">
                  One click to post on all your connected platforms
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-center">
                <Star className="h-4 w-4 inline mr-1 text-primary" />
                <strong>Remember:</strong> Set up once, create forever. 
                InflioAI learns and improves with every video you upload.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Skip Setup Option (for returning users) */}
        {completedSteps < steps.length && (
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={async () => {
                // Mark that user wants to skip for now
                try {
                  const supabase = createSupabaseBrowserClient()
                  await supabase
                    .from('user_profiles')
                    .update({ setup_skipped: true })
                    .eq('clerk_user_id', userId)
                } catch (error) {
                  console.error('Error saving skip state:', error)
                }
                
                // Use router for smooth navigation
                router.push('/dashboard')
              }}
              className="text-muted-foreground"
            >
              I'll finish setup later
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Social Connect Modal */}
      <Dialog open={showSocialModal} onOpenChange={setShowSocialModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Connect Your Social Accounts
            </DialogTitle>
            <DialogDescription>
              Link your social platforms to publish content directly from InflioAI.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            {/* Coming Soon Message */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Social Integrations Coming Soon!</h4>
              <p className="text-sm text-muted-foreground">
                We're building direct integrations with all major platforms. Skip for now and we'll notify you when it's ready.
              </p>
            </div>
            
            {/* Platform Icons Preview */}
            <div className="flex justify-center gap-4 py-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white">
                <IconBrandInstagram className="h-6 w-6" />
              </div>
              <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center text-white">
                <IconBrandTiktok className="h-6 w-6" />
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white">
                <IconBrandLinkedin className="h-6 w-6" />
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center text-white">
                <IconBrandYoutube className="h-6 w-6" />
              </div>
              <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center text-white">
                <IconBrandX className="h-6 w-6" />
              </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              You can connect your accounts later in Settings → Connections
            </p>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSocialModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSkipSocials}>
              <SkipForward className="h-4 w-4 mr-2" />
              Skip for Now & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
