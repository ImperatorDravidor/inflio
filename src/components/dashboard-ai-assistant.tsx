'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, TrendingUp, AlertCircle, Calendar, Users, 
  Eye, Heart, MessageSquare, Share2, Target, Zap,
  ChevronDown, ChevronUp, Send, Copy, RefreshCw,
  BarChart3, Video, FileText, Clock, CheckCircle,
  X, Lightbulb, Trophy, Flame, ArrowRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { toast } from 'sonner'

interface AIInsight {
  id: string
  type: 'trend' | 'recommendation' | 'warning' | 'success' | 'task'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  metrics?: {
    label: string
    value: string | number
    change?: number
    changeType?: 'increase' | 'decrease'
  }[]
  relatedContent?: {
    type: 'video' | 'post' | 'blog'
    title: string
    url: string
    thumbnail?: string
  }[]
}

interface PlatformMetrics {
  platform: string
  views: number
  followers: number
  engagement: number
  topContent?: {
    title: string
    views: number
    url: string
  }
}

interface DashboardAIAssistantProps {
  userName?: string
  userAvatar?: string
  totalViews?: number
  totalFollowers?: number
  weeklyGrowth?: number
  platformMetrics?: PlatformMetrics[]
  scheduledPosts?: number
  pendingTasks?: string[]
  onTaskComplete?: (taskId: string) => void
  onRefresh?: () => void
}

export function DashboardAIAssistant({
  userName = 'there',
  userAvatar,
  totalViews = 0,
  totalFollowers = 0,
  weeklyGrowth = 0,
  platformMetrics = [],
  scheduledPosts = 0,
  pendingTasks = [],
  onTaskComplete,
  onRefresh
}: DashboardAIAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [aiMessage, setAiMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showFullInsights, setShowFullInsights] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate personalized greeting based on time and performance
  const getGreeting = () => {
    const hour = new Date().getHours()
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    
    if (weeklyGrowth > 20) {
      return `${timeGreeting}, ${userName}! 🚀 Incredible week - you're on fire!`
    } else if (weeklyGrowth > 10) {
      return `${timeGreeting}, ${userName}! 📈 Great momentum this week!`
    } else if (weeklyGrowth > 0) {
      return `${timeGreeting}, ${userName}! We're trending in a good direction!`
    } else {
      return `${timeGreeting}, ${userName}! Let's make this week count!`
    }
  }

  // Generate AI insights based on data
  const generateInsights = (): AIInsight[] => {
    const insights: AIInsight[] = []

    // Performance insight
    if (weeklyGrowth > 10) {
      insights.push({
        id: '1',
        type: 'success',
        priority: 'high',
        title: `${weeklyGrowth}% growth this week!`,
        description: 'Your content strategy is working. Keep up the momentum!',
        metrics: [
          { label: 'Total Views', value: totalViews.toLocaleString(), change: weeklyGrowth, changeType: 'increase' },
          { label: 'New Followers', value: totalFollowers, change: 15, changeType: 'increase' }
        ]
      })
    }

    // Platform-specific insights
    const topPlatform = platformMetrics.sort((a, b) => b.views - a.views)[0]
    if (topPlatform) {
      insights.push({
        id: '2',
        type: 'trend',
        priority: 'medium',
        title: `${topPlatform.platform} is your strongest platform`,
        description: `${topPlatform.views.toLocaleString()} views this week. Consider posting more ${topPlatform.platform === 'LinkedIn' ? 'professional insights' : topPlatform.platform === 'Instagram' ? 'behind-the-scenes content' : 'trending content'}.`,
        action: {
          label: 'Create Content',
          onClick: () => console.log('Create content for', topPlatform.platform)
        }
      })
    }

    // Content recommendations
    insights.push({
      id: '3',
      type: 'recommendation',
      priority: 'medium',
      title: 'Content Opportunity Detected',
      description: 'Your audience engages most with authentic, "in the wild" content. Try sharing more behind-the-scenes moments from conferences, meetings, or travels.',
      action: {
        label: 'View Examples',
        onClick: () => console.log('Show examples')
      }
    })

    // Task reminder
    if (pendingTasks.length > 0) {
      insights.push({
        id: '4',
        type: 'task',
        priority: 'high',
        title: `${pendingTasks.length} tasks need your attention`,
        description: pendingTasks[0],
        action: {
          label: 'Review Tasks',
          onClick: () => console.log('Review tasks')
        }
      })
    }

    // Scheduling insight
    if (scheduledPosts < 5) {
      insights.push({
        id: '5',
        type: 'warning',
        priority: 'low',
        title: 'Content Calendar Looking Light',
        description: `Only ${scheduledPosts} posts scheduled for next week. Your optimal posting frequency is 2-3 times per day.`,
        action: {
          label: 'Schedule Content',
          onClick: () => console.log('Schedule content')
        }
      })
    }

    return insights
  }

  const [insights, setInsights] = useState<AIInsight[]>(generateInsights())

  // Simulate AI typing effect
  useEffect(() => {
    const message = `I'm excited to see how your content is performing! ${
      weeklyGrowth > 10 
        ? "You're seeing great engagement, especially on LinkedIn where your authentic posts are resonating." 
        : "Let's focus on creating more organic, behind-the-scenes content this week."
    } ${
      pendingTasks.length > 0 
        ? `You have ${pendingTasks.length} items to review. ` 
        : ''
    }Remember, your audience loves when you share real moments - conference highlights, meeting insights, or even vacation glimpses add a personal touch that drives engagement.`

    setIsTyping(true)
    let index = 0
    const timer = setInterval(() => {
      setAiMessage(message.slice(0, index))
      index++
      if (index > message.length) {
        clearInterval(timer)
        setIsTyping(false)
      }
    }, 20)

    return () => clearInterval(timer)
  }, [weeklyGrowth, pendingTasks.length])

  const handleSendMessage = async () => {
    if (!userInput.trim()) return
    
    setIsGenerating(true)
    // Simulate AI response
    setTimeout(() => {
      toast.success('AI is processing your request...')
      setUserInput('')
      setIsGenerating(false)
    }, 1500)
  }

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />
      case 'recommendation': return <Lightbulb className="h-4 w-4" />
      case 'warning': return <AlertCircle className="h-4 w-4" />
      case 'success': return <Trophy className="h-4 w-4" />
      case 'task': return <CheckCircle className="h-4 w-4" />
    }
  }

  const getInsightColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-500 bg-amber-50 border-amber-200'
      case 'low': return 'text-blue-500 bg-blue-50 border-blue-200'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card className="relative overflow-hidden border-2 border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background">
        {/* Animated background effect */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-pulse" />
        </div>

        <CardContent className="relative p-6">
          {/* Header with AI Avatar */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                {isTyping && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{getGreeting()}</h3>
                  <Badge variant="secondary" className="text-xs">
                    AI Assistant
                  </Badge>
                </div>
                
                {/* AI Message */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {aiMessage}
                        {isTyping && <span className="animate-pulse">|</span>}
                      </p>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Total Views</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {totalViews.toLocaleString()}
                          </p>
                          {weeklyGrowth > 0 && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-500">+{weeklyGrowth}%</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">New Followers</span>
                          </div>
                          <p className="text-2xl font-bold">
                            +{totalFollowers}
                          </p>
                          <Badge variant="secondary" className="text-xs">This week</Badge>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Scheduled</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {scheduledPosts}
                          </p>
                          <span className="text-xs text-muted-foreground">Next 7 days</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Flame className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Streak</span>
                          </div>
                          <p className="text-2xl font-bold">
                            12
                          </p>
                          <span className="text-xs text-muted-foreground">Days active</span>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* AI Insights */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            AI Insights & Recommendations
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFullInsights(!showFullInsights)}
                            className="text-xs"
                          >
                            {showFullInsights ? 'Show Less' : 'Show All'}
                            {showFullInsights ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {insights.slice(0, showFullInsights ? insights.length : 3).map((insight) => (
                            <motion.div
                              key={insight.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "p-3 rounded-lg border",
                                getInsightColor(insight.priority)
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getInsightIcon(insight.type)}
                                    <span className="font-medium text-sm">{insight.title}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {insight.description}
                                  </p>
                                  
                                  {insight.metrics && (
                                    <div className="flex gap-4 mb-2">
                                      {insight.metrics.map((metric, i) => (
                                        <div key={i} className="text-xs">
                                          <span className="text-muted-foreground">{metric.label}: </span>
                                          <span className="font-medium">{metric.value}</span>
                                          {metric.change && (
                                            <span className={cn(
                                              "ml-1",
                                              metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                                            )}>
                                              {metric.changeType === 'increase' ? '+' : '-'}{metric.change}%
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                {insight.action && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={insight.action.onClick}
                                    className="text-xs"
                                  >
                                    {insight.action.label}
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Platform Performance */}
                      {platformMetrics.length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-primary" />
                              Platform Performance
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {platformMetrics.map((platform) => (
                                <div
                                  key={platform.platform}
                                  className="p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium capitalize">
                                      {platform.platform}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      +{platform.followers} new
                                    </Badge>
                                  </div>
                                  <p className="text-lg font-bold">
                                    {platform.views.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">views</p>
                                  {platform.topContent && (
                                    <div className="mt-2 pt-2 border-t">
                                      <p className="text-xs text-muted-foreground truncate">
                                        Top: {platform.topContent.title}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Quick Actions */}
                      <Separator className="my-4" />
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Ask me anything or tell me what content you want to create..."
                            className="min-h-[80px] pr-10 resize-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendMessage()
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute bottom-2 right-2"
                            onClick={handleSendMessage}
                            disabled={!userInput.trim() || isGenerating}
                          >
                            {isGenerating ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Video className="h-3 w-3 mr-1" />
                          Upload Video
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Generate Blog
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule Posts
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          View Analytics
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Expand/Collapse Button */}
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="text-muted-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
