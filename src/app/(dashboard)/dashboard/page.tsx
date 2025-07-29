"use client"

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { 
  IconVideoPlus,
  IconFolder,
  IconChartBar,
  IconClock,
  IconSparkles,
  IconArrowRight,
  IconVideo,
  IconFileText,
  IconShare,
  IconPlayerPlay,
  IconScissors,
  IconUsers,
  IconEye,
  IconTrendingUp,
  IconBrandYoutube,
  IconBrandInstagram,
  IconBrandTiktok,
  IconTarget,
  IconFlame,
  IconMedal,
  IconCalendar,
  IconBrandLinkedin,
  IconBrandX,
  IconBrandFacebook,
  IconPlus,
  IconCheck,
  IconDots,
  IconArrowUp,
  IconGift,
  IconRocket,
  IconEdit,
  IconLoader2
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { ProjectService } from "@/lib/services"
import { Project } from "@/lib/project-types"
import { formatDuration } from "@/lib/video-utils"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { 
  AnimatedStatCard,
  AchievementBadge,
  CelebrationOverlay
} from "@/components/dashboard-enhancements"
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from 'recharts'
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const MotionCard = motion(Card)

interface DashboardStats {
  totalProjects: number
  totalVideos: number
  totalClips: number
  totalBlogPosts: number
  totalSocialPosts: number
  totalProcessingTime: number
  activeProjects: number
  completedProjects: number
}

interface ScheduledPost {
  id: string
  publish_date: Date
  platform: string
  content: string
  state: 'scheduled' | 'published' | 'draft' | 'failed' | 'publishing'
  metadata?: {
    type?: 'video' | 'image' | 'blog' | 'story' | 'clip' | 'longform' | 'carousel' | 'article'
    platforms?: string[]
    title?: string
    thumbnail?: string
    duration?: number
    engagementPrediction?: {
      score: number
    }
  }
  project?: {
    id: string
    title: string
  }
}

const platformIcons = {
  youtube: IconBrandYoutube,
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  linkedin: IconBrandLinkedin,
  x: IconBrandX,
  facebook: IconBrandFacebook
}

const platformColors = {
  youtube: 'bg-red-600',
  instagram: 'bg-gradient-to-br from-purple-600 to-pink-600',
  tiktok: 'bg-black',
  linkedin: 'bg-blue-700',
  x: 'bg-black',
  facebook: 'bg-blue-600'
}

export default function DashboardPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalVideos: 0,
    totalClips: 0,
    totalBlogPosts: 0,
    totalSocialPosts: 0,
    totalProcessingTime: 0,
    activeProjects: 0,
    completedProjects: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [viewMode, setViewMode] = useState<'overview' | 'calendar' | 'analytics'>('overview')
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)

  // Load scheduled posts from database
  const loadScheduledPosts = async () => {
    if (!userId) return
    
    try {
      setPostsLoading(true)
      const supabase = createSupabaseBrowserClient()
      
      // Fetch scheduled posts for the current week
      const weekStart = startOfWeek(new Date())
      const weekEnd = addDays(weekStart, 7)
      
      const { data: posts, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          project:projects!social_posts_project_id_fkey (
            id,
            title
          )
        `)
        .eq('user_id', userId)
        .gte('publish_date', weekStart.toISOString())
        .lte('publish_date', weekEnd.toISOString())
        .order('publish_date', { ascending: true })

      if (error) {
        console.error('Error loading scheduled posts:', error)
        return
      }

      // Transform posts to match our interface
      const transformedPosts: ScheduledPost[] = posts?.map(post => ({
        ...post,
        publish_date: new Date(post.publish_date),
        platform: post.metadata?.platforms?.[0] || 'instagram', // First platform as primary
      })) || []

      setScheduledPosts(transformedPosts)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setPostsLoading(false)
    }
  }

  // Performance data based on real stats
  const performanceData = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfWeek(new Date()), i)
    return {
      day: format(date, 'EEE'),
      views: 0, // Will be populated when we integrate analytics
      engagement: 0, // Will be populated when we integrate analytics
      posts: scheduledPosts.filter(p => isSameDay(new Date(p.publish_date), date)).length
    }
  })

  // Current streak calculation based on actual posting history
  const [currentStreak, setCurrentStreak] = useState(0)

  const calculateStreak = async () => {
    if (!userId) return
    
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: posts } = await supabase
        .from('social_posts')
        .select('publish_date')
        .eq('user_id', userId)
        .eq('state', 'published')
        .order('publish_date', { ascending: false })
        .limit(30) // Check last 30 days

      if (!posts || posts.length === 0) {
        setCurrentStreak(0)
        return
      }

      // Calculate consecutive days
      let streak = 0
      const currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0)

      for (let i = 0; i < 30; i++) {
        const dateToCheck = new Date(currentDate)
        dateToCheck.setDate(currentDate.getDate() - i)
        
        const hasPost = posts.some(post => {
          const postDate = new Date(post.publish_date)
          postDate.setHours(0, 0, 0, 0)
          return postDate.getTime() === dateToCheck.getTime()
        })

        if (hasPost) {
          streak++
        } else if (i > 0) { // Allow today to be empty
          break
        }
      }

      setCurrentStreak(streak)
    } catch (error) {
      console.error('Error calculating streak:', error)
    }
  }

  // Dynamic achievements based on real data
  const achievements = [
    {
      id: '1',
      title: 'Content Creator',
      description: 'Create 10 video clips',
      icon: IconScissors,
      color: 'bg-purple-500',
      progress: stats.totalClips,
      maxProgress: 10,
      reward: '250 credits',
      claimed: stats.totalClips >= 10,
      rarity: 'rare' as const
    },
    {
      id: '2',
      title: 'Consistency King',
      description: 'Post daily for 7 days',
      icon: IconFlame,
      color: 'bg-orange-500',
      progress: Math.min(currentStreak, 7),
      maxProgress: 7,
      reward: '500 credits',
      claimed: currentStreak >= 7,
      rarity: 'epic' as const
    },
    {
      id: '3',
      title: 'Multi-Platform Master',
      description: 'Post on 4+ platforms',
      icon: IconRocket,
      color: 'bg-gradient-to-br from-blue-500 to-purple-500',
      progress: 0, // Will be calculated from actual platform usage
      maxProgress: 4,
      reward: 'Pro Badge',
      claimed: false,
      rarity: 'legendary' as const
    }
  ]

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return
      
      try {
        setLoading(true)
        const allProjects = await ProjectService.getAllProjects(userId)
        setProjects(allProjects)

        // Calculate stats
        const totalProjects = allProjects.length
        const totalVideos = allProjects.length
        const totalClips = allProjects.reduce((sum, p) => sum + p.folders.clips.length, 0)
        const totalBlogPosts = allProjects.reduce((sum, p) => sum + p.folders.blog.length, 0)
        const totalSocialPosts = allProjects.reduce((sum, p) => sum + p.folders.social.length, 0)
        const totalProcessingTime = allProjects.reduce((sum, p) => sum + (p.metadata?.duration || 0), 0)
        const activeProjects = allProjects.filter(p => p.status === 'processing').length
        const completedProjects = allProjects.filter(p => p.status === 'ready' || p.status === 'published').length

        setStats({
          totalProjects,
          totalVideos,
          totalClips,
          totalBlogPosts,
          totalSocialPosts,
          totalProcessingTime,
          activeProjects,
          completedProjects
        })

        // Load scheduled posts and calculate streak
        await Promise.all([
          loadScheduledPosts(),
          calculateStreak()
        ])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(post => isSameDay(new Date(post.publish_date), date))
  }

  const renderContentCalendar = () => {
    const weekStart = startOfWeek(new Date())
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <IconCalendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Content Calendar
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your posting schedule for this week</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/social/calendar')} className="text-xs sm:text-sm h-8 sm:h-9">
                <IconCalendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Full Calendar</span>
                <span className="xs:hidden">Calendar</span>
              </Button>
              <Button size="sm" onClick={() => router.push('/social/compose')} className="text-xs sm:text-sm h-8 sm:h-9">
                <IconPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Create Post</span>
                <span className="xs:hidden">Create</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-[80px] sm:h-[120px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekDays.map((date, index) => {
                const posts = getPostsForDate(date)
                const isCurrentDay = isToday(date)
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "min-h-[80px] sm:min-h-[120px] p-2 sm:p-3 rounded-lg border",
                      isCurrentDay && "border-primary bg-primary/5",
                      "hover:shadow-md transition-all cursor-pointer"
                    )}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {format(date, 'EEE')}
                        </p>
                        <p className={cn(
                          "text-sm sm:text-lg font-bold",
                          isCurrentDay && "text-primary"
                        )}>
                          {format(date, 'd')}
                        </p>
                      </div>
                      {posts.length > 0 && (
                        <Badge variant="secondary" className="text-xs h-5 px-1">
                          {posts.length}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {/* Mobile: Show only count and first platform */}
                      <div className="sm:hidden">
                        {posts.length > 0 && (
                          <div className="flex items-center gap-1">
                            {(() => {
                              const firstPost = posts[0]
                              const platforms = firstPost.metadata?.platforms || [firstPost.platform]
                              const firstPlatform = platforms[0]
                              const Icon = platformIcons[firstPlatform as keyof typeof platformIcons] || IconShare
                              return (
                                <div className={cn(
                                  "p-0.5 rounded",
                                  platformColors[firstPlatform as keyof typeof platformColors] || 'bg-gray-500'
                                )}>
                                  <Icon className="h-2.5 w-2.5 text-white" />
                                </div>
                              )
                            })()}
                            <span className="text-xs text-muted-foreground">
                              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Desktop: Show full post preview */}
                      <div className="hidden sm:block space-y-1">
                        {posts.slice(0, 2).map((post) => {
                          const platforms = post.metadata?.platforms || [post.platform]
                          const firstPlatform = platforms[0]
                          const Icon = platformIcons[firstPlatform as keyof typeof platformIcons] || IconShare
                          return (
                            <div key={post.id} className="flex items-center gap-1">
                              <div className={cn(
                                "p-1 rounded",
                                platformColors[firstPlatform as keyof typeof platformColors] || 'bg-gray-500'
                              )}>
                                <Icon className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-xs truncate flex-1">
                                {format(new Date(post.publish_date), "h:mm a")}
                              </span>
                            </div>
                          )
                        })}
                        {posts.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{posts.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Selected Date Posts */}
          {selectedDate && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
              <h4 className="font-medium mb-3 text-sm sm:text-base">
                {format(selectedDate, 'EEEE, MMMM d')} Schedule
              </h4>
              <div className="space-y-2">
                {getPostsForDate(selectedDate).length > 0 ? (
                  getPostsForDate(selectedDate).map((post) => {
                    const platforms = post.metadata?.platforms || [post.platform]
                    const firstPlatform = platforms[0]
                    const Icon = platformIcons[firstPlatform as keyof typeof platformIcons] || IconShare
                    return (
                      <div key={post.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                        <div className={cn(
                          "p-1.5 sm:p-2 rounded-lg text-white flex-shrink-0",
                          platformColors[firstPlatform as keyof typeof platformColors] || 'bg-gray-500'
                        )}>
                          <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{post.metadata?.title || post.content}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(new Date(post.publish_date), "h:mm a")}</span>
                            {post.project && <span className="hidden sm:inline">• {post.project.title}</span>}
                          </div>
                        </div>
                        <Badge variant={
                          post.state === 'published' ? 'default' :
                          post.state === 'scheduled' ? 'secondary' :
                          post.state === 'failed' ? 'destructive' :
                          'outline'
                        } className="text-xs">
                          {post.state}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push('/social/calendar')
                          }}
                        >
                          <IconDots className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <IconCalendar className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">No posts scheduled for this day</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 text-xs sm:text-sm h-7 sm:h-8"
                      onClick={() => router.push('/social/compose')}
                    >
                      <IconPlus className="h-3 w-3 mr-1" />
                      Schedule Post
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const recentProjects = projects.slice(0, 3)

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Celebration Overlay */}
      <CelebrationOverlay show={showCelebration} />

      {/* Enhanced Header with Streak */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-lg sm:rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 p-4 sm:p-6"
      >
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">Welcome back!</h1>
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-orange-500/20">
                  <IconFlame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  <span className="text-xs sm:text-sm font-medium">{currentStreak} day streak</span>
                </div>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                You have {scheduledPosts.filter(p => isToday(new Date(p.publish_date)) && p.state === 'scheduled').length} posts scheduled for today
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button 
                className="gradient-premium shadow-lg text-sm sm:text-base"
                size="sm"
                onClick={() => router.push('/studio/upload')}
              >
                <IconVideoPlus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Create Content</span>
                <span className="xs:hidden">Create</span>
              </Button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-background/50 backdrop-blur-sm rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-2">
                <IconEye className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Views</p>
                  <div className="text-lg sm:text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-5 sm:h-6 w-12 sm:w-16" />
                    ) : (
                      0
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-background/50 backdrop-blur-sm rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-2">
                <IconUsers className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Followers</p>
                  <div className="text-lg sm:text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-5 sm:h-6 w-12 sm:w-16" />
                    ) : (
                      0
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-background/50 backdrop-blur-sm rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-2">
                <IconVideo className="h-4 w-4 text-green-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Clips</p>
                  <div className="text-lg sm:text-2xl font-bold">
                    {stats.totalClips}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-background/50 backdrop-blur-sm rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-2">
                <IconTrendingUp className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">Growth</p>
                  <div className="text-lg sm:text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-5 sm:h-6 w-10 sm:w-12" />
                    ) : (
                      '0%'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 sm:-right-20 -bottom-10 sm:-bottom-20 opacity-10">
          <IconSparkles className="h-40 w-40 sm:h-80 sm:w-80" />
        </div>
      </motion.div>

      {/* Achievements Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            onClaim={() => {
              setShowCelebration(true)
              setTimeout(() => setShowCelebration(false), 3000)
            }}
          />
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Content Calendar - Takes up 2 columns on desktop, full width on mobile */}
        <div className="lg:col-span-2">
          {renderContentCalendar()}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Today's Focus */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <IconTarget className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {postsLoading ? (
                <>
                  <Skeleton className="h-14 sm:h-16" />
                  <Skeleton className="h-14 sm:h-16" />
                </>
              ) : (
                <>
                  {scheduledPosts
                    .filter(p => isToday(new Date(p.publish_date)) && p.state === 'scheduled')
                    .slice(0, 3)
                    .map((post) => {
                      const platforms = post.metadata?.platforms || [post.platform]
                      const firstPlatform = platforms[0]
                      const Icon = platformIcons[firstPlatform as keyof typeof platformIcons] || IconShare
                      const bgColor = platformColors[firstPlatform as keyof typeof platformColors] || 'bg-gray-500'
                      
                      return (
                        <div key={post.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted hover:bg-accent/50 transition-all cursor-pointer"
                          onClick={() => router.push('/social/calendar')}
                        >
                          <div className={cn("p-1.5 sm:p-2 rounded-lg text-white flex-shrink-0", bgColor)}>
                            <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs sm:text-sm truncate">{post.metadata?.title || post.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(post.publish_date), "h:mm a")}
                              {platforms.length > 1 && ` • ${platforms.length} platforms`}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  }
                  {scheduledPosts.filter(p => isToday(new Date(p.publish_date)) && p.state === 'scheduled').length === 0 && (
                    <div className="text-center py-3 sm:py-4 text-muted-foreground">
                      <p className="text-xs sm:text-sm">No posts scheduled for today</p>
                    </div>
                  )}
                  <Button className="w-full text-xs sm:text-sm" variant="outline" size="sm" onClick={() => router.push('/social/calendar')}>
                    View Full Calendar
                    <IconArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Performance Mini Chart */}
          <Card className="hidden sm:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base">This Week's Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-24 sm:h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-3 sm:mt-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Views</p>
                  <div className="text-lg sm:text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 mx-auto" />
                    ) : (
                      0
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Likes</p>
                  <div className="text-lg sm:text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 mx-auto" />
                    ) : (
                      0
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Comments</p>
                  <div className="text-lg sm:text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 mx-auto" />
                    ) : (
                      0
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9" onClick={() => router.push('/studio/upload')}>
                <IconVideoPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="ml-1 sm:ml-2">Upload</span>
              </Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9" onClick={() => router.push('/templates')}>
                <IconSparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="ml-1 sm:ml-2">Templates</span>
              </Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9" onClick={() => router.push('/social/compose')}>
                <IconEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="ml-1 sm:ml-2">Compose</span>
              </Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9" onClick={() => router.push('/analytics')}>
                <IconChartBar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="ml-1 sm:ml-2">Analytics</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Projects Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Recent Projects</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your latest video projects and their progress</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm">
              <Link href="/projects">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 sm:gap-4">
                  <Skeleton className="h-12 w-20 sm:h-16 sm:w-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 sm:h-4 w-32 sm:w-40" />
                    <Skeleton className="h-2.5 sm:h-3 w-48 sm:w-60" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {recentProjects.map((project) => {
                const projectStats = ProjectService.getProjectStats(project)
                const progress = ProjectService.calculateProjectProgress(project)
                
                return (
                  <motion.div
                    key={project.id}
                    whileHover={{ x: 4 }}
                    className="group cursor-pointer"
                    onClick={() => {
                      if (project.status === 'processing') {
                        router.push(`/studio/processing/${project.id}`)
                      } else {
                        router.push(`/projects/${project.id}`)
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border hover:border-primary/50 transition-all">
                      <div className="relative h-12 w-20 sm:h-16 sm:w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {project.thumbnail_url ? (
                          project.thumbnail_url.startsWith('http') ? (
                            <img
                              src={project.thumbnail_url}
                              alt={project.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Image
                              src={project.thumbnail_url}
                              alt={project.title}
                              fill
                              className="object-cover"
                            />
                          )
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <IconVideo className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
                          </div>
                        )}
                        {project.status === 'processing' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <IconPlayerPlay className="h-4 w-4 sm:h-6 sm:w-6 text-white animate-pulse" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold group-hover:text-primary transition-colors text-sm sm:text-base truncate">
                          {project.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <IconClock className="h-3 w-3 sm:h-4 sm:w-4" />
                            {formatDuration(project.metadata.duration)}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconVideo className="h-3 w-3 sm:h-4 sm:w-4" />
                            {projectStats.totalClips} clips
                            {(() => {
                              const clipsTask = project.tasks.find(t => t.type === 'clips');
                              if (clipsTask && clipsTask.status === 'processing') {
                                return (
                                  <span className="ml-1 inline-flex items-center">
                                    <IconLoader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin text-primary" />
                                    <span className="text-xs ml-0.5 sm:ml-1 text-primary">+{clipsTask.progress || 0}%</span>
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </span>
                          <span className="flex items-center gap-1 hidden xs:flex">
                            <IconFileText className="h-3 w-3 sm:h-4 sm:w-4" />
                            {projectStats.totalBlogs} posts
                          </span>
                        </div>
                        <Progress value={progress} className="h-1 sm:h-1.5 mt-2" />
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <Badge variant={
                          project.status === 'ready' ? 'default' :
                          project.status === 'processing' ? 'secondary' :
                          project.status === 'published' ? 'default' :
                          'outline'
                        } className="text-xs">
                          {project.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <IconFolder className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="font-medium mb-2 text-sm sm:text-base">No projects yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Upload your first video to get started
              </p>
              <Button 
                size="sm"
                onClick={() => router.push('/studio/upload')}
                className="text-xs sm:text-sm h-8 sm:h-9"
              >
                <IconVideoPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Upload Video
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
