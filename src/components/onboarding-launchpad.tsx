'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, Circle, Sparkles, User, Palette, Bot, 
  UserCheck, Upload, ArrowRight, MessageSquare, Send,
  Loader2, ChevronRight, Trophy, Zap, Target, BookOpen,
  Rocket, Star, Gift, Crown, Brain, Wand2, Play, Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  path: string
  status: 'completed' | 'current' | 'locked'
  points: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface OnboardingLaunchpadProps {
  userId: string
  userName?: string
  userEmail?: string
}

export function OnboardingLaunchpad({ userId, userName, userEmail }: OnboardingLaunchpadProps) {
  const router = useRouter()
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'onboarding',
      title: 'Complete Onboarding',
      description: 'Set up your creator profile and preferences',
      icon: User,
      path: '/onboarding',
      status: 'current',
      points: 100
    },
    {
      id: 'brand',
      title: 'Review Brand Page',
      description: 'Fine-tune your brand identity and guidelines',
      icon: Palette,
      path: '/brand',
      status: 'locked',
      points: 50
    },
    {
      id: 'persona',
      title: 'Review AI Persona',
      description: 'Check your AI avatar and thumbnails',
      icon: Bot,
      path: '/personas',
      status: 'locked',
      points: 50
    },
    {
      id: 'profile',
      title: 'Finalize Profile',
      description: 'Complete your creator profile details',
      icon: UserCheck,
      path: '/profile',
      status: 'locked',
      points: 50
    },
    {
      id: 'first-project',
      title: 'Start Your First Project!',
      description: 'Upload your first video and see the magic',
      icon: Upload,
      path: '/studio/upload',
      status: 'locked',
      points: 150
    }
  ])

  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [totalPoints, setTotalPoints] = useState(0)
  const [level, setLevel] = useState(1)
  const [showCelebration, setShowCelebration] = useState(false)

  // Load user progress from database
  useEffect(() => {
    loadUserProgress()
    // Send initial greeting
    sendAIMessage(`Welcome to Inflio, ${userName || 'creator'}! 🎉 I'm your AI assistant powered by GPT-5. I'll help you set up your content creation studio. Let's start with completing your onboarding - it only takes 5 minutes!`)
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
        
        // Update step statuses based on actual data
        if (profile.onboarding_completed) {
          updatedSteps[0].status = 'completed'
          updatedSteps[1].status = 'current'
          setTotalPoints(100)
        }
        
        if (profile.brand_identity) {
          updatedSteps[1].status = 'completed'
          updatedSteps[2].status = 'current'
          setTotalPoints(150)
        }
        
        if (profile.persona_id) {
          updatedSteps[2].status = 'completed'
          updatedSteps[3].status = 'current'
          setTotalPoints(200)
        }
        
        if (profile.full_name && profile.bio && profile.company_name) {
          updatedSteps[3].status = 'completed'
          updatedSteps[4].status = 'current'
          setTotalPoints(250)
        }
        
        setSteps(updatedSteps)
        calculateLevel()
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const calculateLevel = () => {
    const newLevel = Math.floor(totalPoints / 100) + 1
    setLevel(newLevel)
    
    // Show celebration for level ups
    if (newLevel > level) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }

  const sendAIMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      // Call GPT-5 API
      const response = await fetch('/api/gpt5-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            userName,
            completedSteps: steps.filter(s => s.status === 'completed').map(s => s.id),
            currentStep: steps.find(s => s.status === 'current')?.id
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        sendAIMessage(data.response)
      } else {
        // Fallback response if API fails
        sendAIMessage(getSmartResponse(inputMessage))
      }
    } catch (error) {
      console.error('Error calling GPT-5:', error)
      sendAIMessage(getSmartResponse(inputMessage))
    } finally {
      setIsTyping(false)
    }
  }

  const getSmartResponse = (input: string): string => {
    const lowerInput = input.toLowerCase()
    
    if (lowerInput.includes('help')) {
      return "I'm here to help! Click on any of the steps above to get started. Each step unlocks new features and earns you points. What would you like to know more about?"
    }
    
    if (lowerInput.includes('upload') || lowerInput.includes('video')) {
      return "Ready to upload? Complete the first 4 steps to unlock video uploading. This ensures your content is perfectly branded and optimized!"
    }
    
    if (lowerInput.includes('brand')) {
      return "Your brand identity is crucial! After onboarding, you can review and customize your brand colors, fonts, and voice. Want me to guide you there?"
    }
    
    if (lowerInput.includes('ai') || lowerInput.includes('persona')) {
      return "The AI persona creates stunning thumbnails with your likeness! Upload 5-10 photos during onboarding to train your personal AI model."
    }
    
    return "Great question! I'm here to guide you through setting up your content studio. Click on the current step above to continue, or ask me anything about Inflio's features!"
  }

  const handleStepClick = (step: OnboardingStep) => {
    if (step.status === 'locked') {
      toast.error('Complete previous steps to unlock this!')
      return
    }
    router.push(step.path)
  }

  const completedSteps = steps.filter(s => s.status === 'completed').length
  const progress = (completedSteps / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1 }}
                className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center"
              >
                <Trophy className="h-16 w-16 text-white" />
              </motion.div>
              <h2 className="text-4xl font-bold mb-2">Level Up!</h2>
              <p className="text-xl text-muted-foreground">You're now Level {level}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header with Progress */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Welcome to Your Content Studio</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Let's Get You Started! 🚀
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete these 5 simple steps to unlock the full power of AI-driven content creation
          </p>

          {/* Level & Points Display */}
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-2xl font-bold">{level}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Points</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{Math.round(progress)}%</p>
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="max-w-md mx-auto">
            <Progress value={progress} className="h-3" />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Steps Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Your Journey to Content Mastery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleStepClick(step)}
                    className={cn(
                      "relative p-6 rounded-xl border-2 transition-all cursor-pointer group",
                      step.status === 'completed' && "bg-green-50 dark:bg-green-950/20 border-green-500",
                      step.status === 'current' && "bg-primary/5 border-primary shadow-lg scale-[1.02]",
                      step.status === 'locked' && "opacity-60 bg-muted/30 border-muted"
                    )}
                  >
                    {/* Step Number */}
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border-2 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>

                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                        step.status === 'completed' && "bg-green-500 text-white",
                        step.status === 'current' && "bg-gradient-to-br from-primary to-purple-600 text-white animate-pulse",
                        step.status === 'locked' && "bg-muted text-muted-foreground"
                      )}>
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="h-7 w-7" />
                        ) : (
                          <step.icon className="h-7 w-7" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold">{step.title}</h3>
                          <div className="flex items-center gap-2">
                            {step.status === 'completed' && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Complete
                              </Badge>
                            )}
                            {step.status === 'current' && (
                              <Badge className="animate-pulse">
                                Start Now
                              </Badge>
                            )}
                            <Badge variant="outline">
                              +{step.points} pts
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {step.description}
                        </p>
                        
                        {step.status === 'current' && (
                          <Button size="sm" className="group">
                            Continue
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Connection Line */}
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "absolute left-6 -bottom-4 w-0.5 h-8",
                        step.status === 'completed' ? "bg-green-500" : "bg-border"
                      )} />
                    )}
                  </motion.div>
                ))}

                {/* Completion Reward */}
                {completedSteps === steps.length && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20"
                  >
                    <div className="flex items-center gap-4">
                      <Crown className="h-12 w-12 text-yellow-500" />
                      <div>
                        <h3 className="text-lg font-semibold">Congratulations! You're All Set! 🎉</h3>
                        <p className="text-sm text-muted-foreground">
                          You've unlocked all features. Start creating amazing content now!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Assistant Chat */}
          <div className="lg:col-span-1">
            <Card className="border-2 h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  AI Assistant (GPT-5)
                </CardTitle>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' && "flex-row-reverse"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        {message.role === 'assistant' ? (
                          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                            <Sparkles className="h-4 w-4" />
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback>
                            {userName?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div
                        className={cn(
                          "max-w-[80%] p-3 rounded-lg",
                          message.role === 'assistant' 
                            ? "bg-muted" 
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                          <Sparkles className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted p-3 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button 
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInputMessage("What should I do next?")}
                  >
                    What's next?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInputMessage("Tell me about Inflio")}
                  >
                    About Inflio
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInputMessage("How do I upload videos?")}
                  >
                    Upload help
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Time to Complete', value: '~10 min', icon: Clock },
            { label: 'Features Unlocked', value: `${completedSteps}/5`, icon: Wand2 },
            { label: 'Next Reward', value: `${steps.find(s => s.status === 'current')?.points || 0} pts`, icon: Gift },
            { label: 'Ready to Create', value: completedSteps === 5 ? 'Yes!' : 'Soon', icon: Rocket }
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
