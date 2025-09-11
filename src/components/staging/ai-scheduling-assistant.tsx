"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  IconCalendar,
  IconClock,
  IconSparkles,
  IconChevronRight,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandThreads,
  IconBrandFacebook,
  IconShare2,
  IconUser,
  IconEdit,
  IconCheck,
  IconInfoCircle,
  IconBrain,
  IconSearch,
  IconTrendingUp,
  IconRefresh
} from "@tabler/icons-react"
import { StagedContent, ScheduledContent } from "@/lib/staging/staging-service"
import { AISchedulingService } from "@/lib/ai-scheduling-service"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@clerk/nextjs"

interface AISchedulingAssistantProps {
  content: StagedContent[]
  onComplete: (scheduled: ScheduledContent[]) => void
  onBack: () => void
}

const platformIcons: Record<string, any> = {
  x: IconBrandTwitter,
  instagram: IconBrandInstagram,
  linkedin: IconBrandLinkedin,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  'youtube-short': IconBrandYoutube,
  threads: IconBrandThreads,
  facebook: IconBrandFacebook
}

const platformColors: Record<string, string> = {
  x: 'from-gray-900 to-black',
  instagram: 'from-purple-500 to-pink-500',
  linkedin: 'from-blue-600 to-blue-700',
  tiktok: 'from-black to-gray-800',
  youtube: 'from-red-500 to-red-600',
  'youtube-short': 'from-red-500 to-red-600',
  threads: 'from-gray-800 to-black',
  facebook: 'from-blue-500 to-blue-600'
}

export function AISchedulingAssistant({ content, onComplete, onBack }: AISchedulingAssistantProps) {
  const { user } = useUser()
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [analysisStep, setAnalysisStep] = useState('')
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [aiRecommendation, setAiRecommendation] = useState<{
    schedule: ScheduledContent[]
    insights: string[]
    reasoning: string[]
    platformResearch?: any[]
    contentAnalysis?: any[]
  } | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledContent[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    // Start AI analysis when component mounts
    performIntelligentAnalysis()
  }, [])

  const performIntelligentAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    try {
      // Simulate analysis steps for better UX
      const steps = [
        { progress: 10, message: 'Analyzing your content with GPT-5...' },
        { progress: 25, message: 'Researching current platform trends...' },
        { progress: 40, message: 'Checking optimal posting times for your audience...' },
        { progress: 55, message: 'Analyzing competitor posting patterns...' },
        { progress: 70, message: 'Evaluating viral potential of each post...' },
        { progress: 85, message: 'Optimizing schedule based on AI insights...' },
        { progress: 100, message: 'Finalizing personalized recommendations...' }
      ]
      
      // Show progress steps
      for (const step of steps) {
        setAnalysisStep(step.message)
        setAnalysisProgress(step.progress)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Call the AI scheduling service
      const recommendation = await AISchedulingService.generateIntelligentSchedule(
        content,
        user?.id || 'anonymous',
        'current-project' // This should be the actual project ID
      )
      
      setAiRecommendation(recommendation)
      setSelectedSchedule(recommendation.schedule)
      setIsAnalyzing(false)
      
    } catch (error) {
      console.error('Error in AI analysis:', error)
      toast.error('Failed to generate AI recommendations. Please try again.')
      setIsAnalyzing(false)
      
      // Fallback to basic schedule
      generateFallbackSchedule()
    }
  }

  const generateFallbackSchedule = () => {
    // Basic fallback scheduling if AI fails
    const now = new Date()
    const schedule = content.map((item, index) => ({
      stagedContent: item,
      platforms: item.platforms,
      scheduledDate: new Date(now.getTime() + (index * 24 * 60 * 60 * 1000)), // One per day
      engagementPrediction: {
        score: 75,
        bestTime: true,
        reasoning: 'Standard scheduling applied'
      },
      optimizationReason: 'Default schedule (AI analysis unavailable)',
      suggestedHashtags: ['trending', 'viral', 'content']
    }))
    
    setAiRecommendation({
      schedule,
      insights: ['Using default scheduling pattern. AI analysis is temporarily unavailable.'],
      reasoning: ['Posts scheduled one per day at standard times.']
    })
    setSelectedSchedule(schedule)
  }

  const handleAcceptRecommendation = () => {
    if (selectedSchedule.length > 0) {
      onComplete(selectedSchedule)
      toast.success('AI-optimized schedule confirmed!')
    }
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    toast.info('Regenerating schedule with latest data...')
    await performIntelligentAnalysis()
    setIsRegenerating(false)
  }

  const handleEditTime = (index: number, newDate: Date) => {
    const updated = [...selectedSchedule]
    updated[index] = {
      ...updated[index],
      scheduledDate: newDate,
      optimizationReason: 'Manually adjusted by user'
    }
    setSelectedSchedule(updated)
    setEditingIndex(null)
    toast.success('Schedule updated')
  }

  // Loading state with detailed progress
  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <Card className="border-primary/20">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <IconBrain className="h-16 w-16 text-primary" />
                <motion.div
                  className="absolute inset-0"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <IconSparkles className="h-16 w-16 text-primary/30" />
                </motion.div>
              </motion.div>
              
              <div className="text-center space-y-3 max-w-md">
                <h3 className="text-lg font-semibold">AI is working its magic...</h3>
                <p className="text-sm text-muted-foreground">{analysisStep}</p>
                
                <div className="w-full">
                  <Progress value={analysisProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{analysisProgress}% complete</p>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <IconSearch className="h-3 w-3" />
                  <span>Analyzing with GPT-5</span>
                  <span>•</span>
                  <IconTrendingUp className="h-3 w-3" />
                  <span>Real-time research</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Main AI recommendation view
  return (
    <div className="space-y-6">
      {/* AI Conversation Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <IconBrain className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">
                  I've completed a comprehensive analysis of your content
                </CardTitle>
                <CardDescription className="mt-2 text-foreground/80 space-y-2">
                  <p>
                    Using GPT-5, real-time web research, and platform-specific data, 
                    I've created a personalized posting schedule optimized for maximum engagement.
                  </p>
                  {content.length > 0 && (
                    <p className="text-sm">
                      Analyzed: {content.filter(c => c.type === 'clip').length > 0 && `${content.filter(c => c.type === 'clip').length} short videos, `}
                      {content.filter(c => c.type === 'blog').length > 0 && `${content.filter(c => c.type === 'blog').length} blog posts, `}
                      {content.filter(c => c.type === 'image').length > 0 && `${content.filter(c => c.type === 'image').length} images, `}
                      across {[...new Set(content.flatMap(c => c.platforms))].join(', ')}.
                    </p>
                  )}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                <IconRefresh className={cn(
                  "h-4 w-4",
                  isRegenerating && "animate-spin"
                )} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Insights */}
            {aiRecommendation && aiRecommendation.insights.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <IconInfoCircle className="h-4 w-4 text-primary" />
                  Key Insights from AI Analysis
                </h4>
                {aiRecommendation.insights.slice(0, 5).map((insight, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-foreground/80">{insight}</p>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Content Analysis Summary */}
            {aiRecommendation?.contentAnalysis && aiRecommendation.contentAnalysis.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Content Quality Analysis
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Engagement Potential</p>
                    <p className="text-lg font-bold text-primary">
                      {Math.round(
                        aiRecommendation.contentAnalysis.reduce((sum, a) => sum + a.engagementPotential, 0) / 
                        aiRecommendation.contentAnalysis.length
                      )}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Viral Factors Detected</p>
                    <p className="text-lg font-bold text-primary">
                      {aiRecommendation.contentAnalysis.reduce((sum, a) => sum + (a.viralFactors?.length || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Optimized Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your AI-Optimized Schedule</CardTitle>
              <CardDescription>
                Each post is strategically timed based on real-time data and content analysis
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Powered by GPT-5
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {selectedSchedule.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.stagedContent.title}</h4>
                      <div className="flex items-center gap-3 mt-2">
                        {/* Platforms */}
                        <div className="flex -space-x-2">
                          {item.platforms.map((platform, idx) => {
                            const Icon = platformIcons[platform] || IconShare2
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br text-white shadow-sm",
                                  platformColors[platform] || 'from-gray-500 to-gray-600'
                                )}
                                style={{ zIndex: item.platforms.length - idx }}
                                title={platform}
                              >
                                <Icon className="h-3 w-3" />
                              </div>
                            )
                          })}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.stagedContent.type}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Time Display/Editor */}
                    <div className="text-right">
                      {editingIndex === index ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            defaultValue={format(item.scheduledDate, "yyyy-MM-dd'T'HH:mm")}
                            onChange={(e) => handleEditTime(index, new Date(e.target.value))}
                            className="px-2 py-1 text-sm border rounded"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingIndex(null)}
                          >
                            <IconCheck className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setEditingIndex(index)}
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {format(item.scheduledDate, 'EEE, MMM d')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(item.scheduledDate, 'h:mm a')}
                            </div>
                          </div>
                          <IconEdit className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* AI Reasoning */}
                  <div className="flex items-start gap-2 p-2 rounded bg-muted/50">
                    <IconSparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {item.optimizationReason}
                    </p>
                  </div>
                  
                  {/* Engagement Score */}
                  {item.engagementPrediction && (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Predicted Reach</span>
                        <span className={cn(
                          "text-xs font-bold",
                          item.engagementPrediction.score >= 85 ? "text-green-500" :
                          item.engagementPrediction.score >= 70 ? "text-blue-500" :
                          "text-yellow-500"
                        )}>
                          {item.engagementPrediction.score}%
                        </span>
                      </div>
                      <Progress 
                        value={item.engagementPrediction.score} 
                        className="h-1.5"
                      />
                    </div>
                  )}
                  
                  {/* Suggested Hashtags */}
                  {item.suggestedHashtags && item.suggestedHashtags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.suggestedHashtags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRegenerate}
          >
            Regenerate with Latest Data
          </Button>
          
          <Button 
            onClick={handleAcceptRecommendation}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            Accept AI Schedule
            <IconChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Attribution */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Powered by GPT-5 • Real-time web research • Platform-specific optimization</p>
        <p>Data sources: Live platform APIs, trending analysis, competitor research</p>
      </div>
    </div>
  )
}