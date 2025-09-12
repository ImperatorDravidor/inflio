'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Rocket, X, ArrowRight, CheckCircle2, Circle, 
  Sparkles, ChevronRight, AlertCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface OnboardingReminderProps {
  progress: number
  userId: string
  onDismiss?: () => void
  onComplete?: () => void
}

export function OnboardingReminder({ 
  progress, 
  userId, 
  onDismiss,
  onComplete 
}: OnboardingReminderProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)

  const handleDismiss = async () => {
    setIsDismissing(true)
    
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase
        .from('user_profiles')
        .update({ onboarding_reminder_dismissed: true })
        .eq('clerk_user_id', userId)
      
      onDismiss?.()
    } catch (error) {
      console.error('Error dismissing reminder:', error)
    }
    
    setIsDismissing(false)
  }

  const handleContinueSetup = async () => {
    // Set a flag to force showing the launchpad
    const supabase = createSupabaseBrowserClient()
    await supabase
      .from('user_profiles')
      .update({ 
        onboarding_reminder_dismissed: false,
        show_launchpad: true 
      })
      .eq('clerk_user_id', userId)
    
    // Reload to show the launchpad
    window.location.reload()
  }

  const getProgressMessage = () => {
    if (progress >= 90) return "Almost there! Just a few more steps."
    if (progress >= 70) return "Great progress! Let's finish setting up."
    if (progress >= 50) return "Halfway there! Keep going."
    if (progress >= 30) return "Good start! Continue your setup."
    return "Let's finish setting up your content studio."
  }

  const getProgressColor = () => {
    if (progress >= 90) return "text-green-500"
    if (progress >= 70) return "text-blue-500"
    if (progress >= 50) return "text-yellow-500"
    return "text-orange-500"
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className={cn(
          "border-2 overflow-hidden",
          progress >= 90 ? "border-green-500/50 bg-green-50/5" : "border-primary/50 bg-primary/5"
        )}>
          <CardContent className="p-0">
            {/* Collapsed View */}
            <div 
              className="p-4 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    progress >= 90 
                      ? "bg-green-500/10" 
                      : "bg-gradient-to-br from-primary/10 to-purple-500/10"
                  )}>
                    {progress >= 90 ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Rocket className={cn("h-6 w-6", getProgressColor())} />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">
                        Complete Your Setup
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(progress)}% complete
                      </Badge>
                      {progress < 50 && (
                        <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Action needed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getProgressMessage()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Progress value={progress} className="w-24 h-2" />
                  
                  <Button
                    size="sm"
                    variant={progress >= 90 ? "outline" : "default"}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleContinueSetup()
                    }}
                  >
                    {progress >= 90 ? "Review" : "Continue Setup"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDismiss()
                    }}
                    disabled={isDismissing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Expanded View */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t px-4 pb-4"
                >
                  <div className="pt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 inline mr-1 text-primary" />
                      Complete your setup to unlock the full power of InflioAI. Your content studio needs a few more details to start creating amazing content automatically.
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Profile", complete: progress >= 20 },
                        { label: "Brand", complete: progress >= 40 },
                        { label: "AI Avatar", complete: progress >= 60 },
                        { label: "Platforms", complete: progress >= 90 }
                      ].map((item, i) => (
                        <div 
                          key={i}
                          className={cn(
                            "p-2 rounded-lg border text-center text-xs",
                            item.complete 
                              ? "bg-green-50/50 border-green-500/50 text-green-700"
                              : "bg-muted/50 border-border text-muted-foreground"
                          )}
                        >
                          {item.complete ? (
                            <CheckCircle2 className="h-4 w-4 mx-auto mb-1" />
                          ) : (
                            <Circle className="h-4 w-4 mx-auto mb-1" />
                          )}
                          {item.label}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleDismiss}
                        className="text-muted-foreground"
                      >
                        Remind me later
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={handleContinueSetup}
                        className="shadow-lg"
                      >
                        Finish Setup Now
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
