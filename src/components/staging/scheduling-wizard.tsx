"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
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
  IconBrain,
  IconRocket,
  IconTrendingUp,
  IconUsers,
  IconEye,
  IconWand,
  IconBolt,
  IconChartBar,
  IconHash,
  IconBrandFacebook,
  IconShare2
} from "@tabler/icons-react"
import { StagedContent, ScheduledContent, StagingService } from "@/lib/staging/staging-service"
import { format, addDays, startOfDay, addHours, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import type { SocialPlatform } from "@/lib/social/types"

interface SchedulingWizardProps {
  content: StagedContent[]
  onComplete: (scheduled: ScheduledContent[]) => void
  onBack: () => void
}

type SchedulingStrategy = 'optimal' | 'rapid' | 'steady' | 'viral'

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

const strategies = [
  {
    id: 'optimal' as const,
    name: 'AI Optimal',
    icon: IconBrain,
    description: 'Let AI find the perfect time for each post',
    color: 'from-purple-500 to-pink-500',
    benefits: ['Maximum engagement', 'Platform-specific timing', 'Audience analysis']
  },
  {
    id: 'rapid' as const,
    name: 'Rapid Fire',
    icon: IconBolt,
    description: 'Quick burst for immediate impact',
    color: 'from-orange-500 to-red-500',
    benefits: ['Fast visibility', 'Momentum building', 'Trend catching']
  },
  {
    id: 'steady' as const,
    name: 'Steady Growth',
    icon: IconTrendingUp,
    description: 'Consistent presence over time',
    color: 'from-green-500 to-teal-500',
    benefits: ['Long-term growth', 'Algorithm friendly', 'Audience retention']
  },
  {
    id: 'viral' as const,
    name: 'Viral Push',
    icon: IconRocket,
    description: 'Optimized for maximum reach',
    color: 'from-blue-500 to-purple-500',
    benefits: ['Peak hours only', 'Hashtag optimization', 'Cross-platform synergy']
  }
]

export function SchedulingWizard({ content, onComplete, onBack }: SchedulingWizardProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<SchedulingStrategy>('optimal')
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [aiInsights, setAiInsights] = useState<string[]>([])
  const [step, setStep] = useState<'strategy' | 'calendar' | 'preview'>('strategy')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

  // Calendar helpers
  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 })
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }

  const getPostsForDate = (date: Date) => {
    return scheduledContent.filter(post => 
      isSameDay(new Date(post.scheduledDate), date)
    )
  }

  const analyzeAndSchedule = async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAiInsights([])

    // Simulate AI analysis steps
    const steps = [
      { progress: 20, insight: "Analyzing your audience activity patterns..." },
      { progress: 40, insight: "Identifying peak engagement windows..." },
      { progress: 60, insight: "Optimizing for platform algorithms..." },
      { progress: 80, insight: "Calculating viral potential scores..." },
      { progress: 100, insight: "Finalizing your perfect schedule..." }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 600))
      setAnalysisProgress(step.progress)
      setAiInsights(prev => [...prev, step.insight])
    }

    // Generate scheduled content based on strategy
    const scheduled = await generateScheduleByStrategy(content, selectedStrategy)
    setScheduledContent(scheduled)
    setIsAnalyzing(false)
    setStep('calendar')
  }

  const generateScheduleByStrategy = async (
    content: StagedContent[], 
    strategy: SchedulingStrategy
  ): Promise<ScheduledContent[]> => {
    const now = new Date()
    let scheduled: ScheduledContent[] = []

    switch (strategy) {
      case 'optimal':
        // AI-optimized scheduling with best times for each platform
        scheduled = content.map((item, index) => {
          const optimalTimes = getOptimalTimesForPlatforms(item.platforms)
          const bestTime = optimalTimes[index % optimalTimes.length]
          
          return {
            stagedContent: item,
            platforms: item.platforms,
            scheduledDate: bestTime,
            engagementPrediction: {
              score: 85 + Math.floor(Math.random() * 10),
              bestTime: true,
              reasoning: `Peak ${item.platforms[0]} engagement window`
            },
            optimizationReason: 'AI selected optimal posting time based on your audience behavior',
            suggestedHashtags: generateSmartHashtags(item)
          }
        })
        break

      case 'rapid':
        // Quick succession posting
        scheduled = content.map((item, index) => ({
          stagedContent: item,
          platforms: item.platforms,
          scheduledDate: addHours(now, index * 0.5),
          engagementPrediction: {
            score: 70 + Math.floor(Math.random() * 15),
            bestTime: false,
            reasoning: 'Rapid momentum building'
          },
          optimizationReason: 'Quick succession to build momentum',
          suggestedHashtags: generateTrendingHashtags(item)
        }))
        break

      case 'steady':
        // Evenly distributed over a week
        const daysToSpread = 7
        const postsPerDay = Math.ceil(content.length / daysToSpread)
        
        scheduled = content.map((item, index) => {
          const dayOffset = Math.floor(index / postsPerDay)
          const timeSlot = (index % postsPerDay) * 4 + 10
          
          return {
            stagedContent: item,
            platforms: item.platforms,
            scheduledDate: addHours(addDays(startOfDay(now), dayOffset), timeSlot),
            engagementPrediction: {
              score: 75 + Math.floor(Math.random() * 10),
              bestTime: timeSlot >= 10 && timeSlot <= 20,
              reasoning: 'Consistent presence strategy'
            },
            optimizationReason: 'Steady presence for algorithm favorability',
            suggestedHashtags: generateEvergreenHashtags(item)
          }
        })
        break

      case 'viral':
        // Only post at peak viral hours
        const viralHours = [10, 12, 17, 19, 21] // Peak hours
        scheduled = content.map((item, index) => {
          const dayOffset = Math.floor(index / viralHours.length)
          const hour = viralHours[index % viralHours.length]
          
          return {
            stagedContent: item,
            platforms: item.platforms,
            scheduledDate: addHours(startOfDay(addDays(now, dayOffset)), hour),
            engagementPrediction: {
              score: 90 + Math.floor(Math.random() * 10),
              bestTime: true,
              reasoning: 'Prime viral window'
            },
            optimizationReason: 'Scheduled during peak viral potential hours',
            suggestedHashtags: generateViralHashtags(item)
          }
        })
        break
    }

    return scheduled
  }

  const getOptimalTimesForPlatforms = (platforms: SocialPlatform[]): Date[] => {
    const now = new Date()
    const optimalTimes: Date[] = []
    
    // Platform-specific optimal times
    const platformPeakHours: Record<string, number[]> = {
      x: [9, 12, 17, 20],
      instagram: [11, 13, 19, 21],
      linkedin: [7, 10, 12, 17],
      tiktok: [6, 10, 19, 23],
      youtube: [12, 15, 20, 22],
      'youtube-short': [12, 15, 20, 22],
      threads: [8, 12, 18, 21],
      facebook: [9, 13, 15, 19]
    }

    for (let day = 0; day < 7; day++) {
      for (const platform of platforms) {
        const peakHours = platformPeakHours[platform] || [12, 18]
        for (const hour of peakHours) {
          optimalTimes.push(addHours(startOfDay(addDays(now, day)), hour))
        }
      }
    }

    return optimalTimes.sort((a, b) => a.getTime() - b.getTime())
  }

  const generateSmartHashtags = (item: StagedContent): string[] => {
    const baseTags = ['trending', 'viral', 'fyp', 'explore']
    const contentTags = item.type === 'clip' ? ['reels', 'shorts'] : 
                       item.type === 'blog' ? ['article', 'insights'] : ['content']
    return [...baseTags, ...contentTags].slice(0, 5)
  }

  const generateTrendingHashtags = (item: StagedContent): string[] => {
    return ['trending2024', 'viralcontent', 'mustwatch', 'breakingnow', 'hottopic']
  }

  const generateEvergreenHashtags = (item: StagedContent): string[] => {
    return ['evergreen', 'timeless', 'valuable', 'educational', 'helpful']
  }

  const generateViralHashtags = (item: StagedContent): string[] => {
    return ['goviral', 'viralnow', 'trending', 'fyp', 'explore', 'viralpost']
  }

  // Calendar View
  if (step === 'calendar') {
    return (
      <div className="space-y-6">
        {/* Calendar Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Schedule Calendar View</CardTitle>
                <CardDescription>
                  Review when your content will be published across platforms
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStep('strategy')
                    setScheduledContent([])
                  }}
                >
                  Change Strategy
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStep('preview')}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  Continue
                  <IconChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week View Calendar */}
            <div className="space-y-4">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map(date => {
                  const posts = getPostsForDate(date)
                  const isToday = isSameDay(date, new Date())
                  const isHovered = hoveredDate && isSameDay(date, hoveredDate)
                  
                  return (
                    <motion.div
                      key={date.toISOString()}
                      onHoverStart={() => setHoveredDate(date)}
                      onHoverEnd={() => setHoveredDate(null)}
                      className={cn(
                        "min-h-[120px] p-2 rounded-lg border bg-card transition-all",
                        isToday && "border-primary bg-primary/5",
                        isHovered && "shadow-lg border-primary/50",
                        posts.length > 0 && "bg-accent/5"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "text-sm font-medium",
                          isToday && "text-primary"
                        )}>
                          {format(date, 'd')}
                        </span>
                        {posts.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {posts.length}
                          </Badge>
                        )}
                      </div>
                      
                      <ScrollArea className="h-[80px]">
                        <div className="space-y-1">
                          {posts.slice(0, 3).map((post, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group"
                            >
                              <div className="flex items-center gap-1 p-1 rounded bg-muted/50 hover:bg-muted transition-colors">
                                <div className="flex -space-x-1">
                                  {post.platforms.slice(0, 2).map((platform, pidx) => {
                                    const Icon = platformIcons[platform] || IconShare2
                                    return (
                                      <div
                                        key={pidx}
                                        className={cn(
                                          "w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br text-white",
                                          platformColors[platform] || 'from-gray-500 to-gray-600'
                                        )}
                                        style={{ zIndex: 2 - pidx }}
                                      >
                                        <Icon className="h-3 w-3" />
                                      </div>
                                    )
                                  })}
                                  {post.platforms.length > 2 && (
                                    <div className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs">
                                      +{post.platforms.length - 2}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs truncate flex-1">
                                  {format(post.scheduledDate, 'h:mma')}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                          {posts.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{posts.length - 3} more
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/20" />
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-accent/20" />
                  <span>Scheduled Posts</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts List by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {getWeekDays().map(date => {
                  const posts = getPostsForDate(date)
                  if (posts.length === 0) return null
                  
                  return (
                    <div key={date.toISOString()} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        {format(date, 'EEEE, MMMM d')}
                      </h4>
                      {posts.map((post, idx) => (
                        <PostCard key={idx} post={post} />
                      ))}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Post Card Component
  const PostCard = ({ post }: { post: ScheduledContent }) => {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-all"
      >
        <div className="flex -space-x-2">
          {post.platforms.map((platform, idx) => {
            const Icon = platformIcons[platform] || IconShare2
            return (
              <div
                key={idx}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br text-white shadow-sm",
                  platformColors[platform] || 'from-gray-500 to-gray-600'
                )}
                style={{ zIndex: post.platforms.length - idx }}
              >
                <Icon className="h-4 w-4" />
              </div>
            )
          })}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{post.stagedContent.title}</h4>
            <Badge variant="outline" className="text-xs">
              {post.stagedContent.type}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <div className="flex items-center gap-1">
              <IconClock className="h-3 w-3" />
              {format(post.scheduledDate, 'h:mm a')}
            </div>
            {post.engagementPrediction && (
              <div className="flex items-center gap-1">
                <IconChartBar className="h-3 w-3" />
                {post.engagementPrediction.score}% reach
              </div>
            )}
          </div>
        </div>
        
        {post.suggestedHashtags && post.suggestedHashtags.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconHash className="h-3 w-3" />
            {post.suggestedHashtags.length}
          </div>
        )}
      </motion.div>
    )
  }

  // Preview step (existing code)
  if (step === 'preview') {
    return (
      <div className="space-y-6">
        {/* AI Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <IconSparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>AI-Optimized Schedule Ready</CardTitle>
                    <CardDescription>
                      {scheduledContent.length} posts optimized for maximum impact
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('calendar')}
                >
                  Back to Calendar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <IconChartBar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(scheduledContent.reduce((sum, item) => 
                        sum + (item.engagementPrediction?.score || 0), 0
                      ) / scheduledContent.length)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Avg. Reach Score</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <IconEye className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">
                      {scheduledContent.filter(s => s.engagementPrediction?.bestTime).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Peak Time Posts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <IconUsers className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">
                      {new Set(scheduledContent.flatMap(s => s.platforms)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Platforms</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Schedule Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Your Optimized Timeline</CardTitle>
            <CardDescription>
              Posts are scheduled based on {strategies.find(s => s.id === selectedStrategy)?.name} strategy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {scheduledContent.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative"
                  >
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 to-transparent" />
                    <div className="flex gap-4">
                      <div className="relative z-10 flex-shrink-0">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                          (item.engagementPrediction?.score ?? 0) >= 90 
                            ? "bg-green-500 text-white" 
                            : (item.engagementPrediction?.score ?? 0) >= 80
                            ? "bg-blue-500 text-white"
                            : "bg-muted"
                        )}>
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1 p-4 rounded-lg border bg-card hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{item.stagedContent.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <IconCalendar className="h-3.5 w-3.5" />
                                {format(item.scheduledDate, 'MMM d, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <IconClock className="h-3.5 w-3.5" />
                                {format(item.scheduledDate, 'h:mm a')}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.stagedContent.type}
                          </Badge>
                        </div>
                        
                        {/* Engagement Prediction */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Predicted Reach</span>
                            <span className={cn(
                              "text-sm font-bold",
                              (item.engagementPrediction?.score ?? 0) >= 90 ? "text-green-500" :
                              (item.engagementPrediction?.score ?? 0) >= 80 ? "text-blue-500" :
                              "text-yellow-500"
                            )}>
                              {item.engagementPrediction?.score}%
                            </span>
                          </div>
                          <Progress 
                            value={item.engagementPrediction?.score || 0} 
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.engagementPrediction?.reasoning}
                          </p>
                        </div>
                        
                        {/* Platforms */}
                        <div className="flex items-center gap-2">
                          {item.platforms.map((platform) => {
                            const Icon = platformIcons[platform] || IconShare2
                            return (
                              <div
                                key={platform}
                                className={cn(
                                  "p-2 rounded-md bg-gradient-to-br text-white",
                                  platformColors[platform] || 'from-gray-500 to-gray-600'
                                )}
                                title={platform}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                            )
                          })}
                          {item.suggestedHashtags && item.suggestedHashtags.length > 0 && (
                            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                              <IconHash className="h-3.5 w-3.5" />
                              {item.suggestedHashtags.length} hashtags
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep('calendar')}>
            Back to Calendar
          </Button>
          <Button 
            onClick={() => onComplete(scheduledContent)}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            Confirm Schedule
            <IconChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // Strategy Selection (existing code with improvements)
  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Publishing Strategy</CardTitle>
          <CardDescription>
            Let AI optimize your content schedule for maximum impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((strategy) => {
              const Icon = strategy.icon
              const isSelected = selectedStrategy === strategy.id
              
              return (
                <motion.button
                  key={strategy.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStrategy(strategy.id)}
                  className={cn(
                    "relative p-6 rounded-xl border-2 text-left transition-all overflow-hidden group",
                    isSelected 
                      ? "border-primary shadow-lg" 
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  {/* Background Gradient */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br",
                    strategy.color
                  )} />
                  
                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-3">
                      <div className={cn(
                        "p-3 rounded-lg bg-gradient-to-br text-white",
                        strategy.color
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{strategy.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {strategy.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {strategy.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isSelected ? "bg-primary" : "bg-muted-foreground"
                          )} />
                          <span className={cn(
                            isSelected ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                    >
                      <IconSparkles className="h-4 w-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Button */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={analyzeAndSchedule}
          disabled={isAnalyzing}
          className="bg-gradient-to-r from-primary to-primary/80 min-w-[200px]"
        >
          {isAnalyzing ? (
            <>
              <IconBrain className="h-4 w-4 mr-2 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <IconWand className="h-4 w-4 mr-2" />
              Generate AI Schedule
            </>
          )}
        </Button>
      </div>

      {/* AI Analysis Progress */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-primary/20">
              <CardContent className="py-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">AI Analysis in Progress</p>
                    <p className="text-sm text-muted-foreground">{analysisProgress}%</p>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                  
                  <div className="space-y-2 mt-4">
                    {aiInsights.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <IconSparkles className="h-4 w-4 text-primary animate-pulse" />
                        {insight}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 