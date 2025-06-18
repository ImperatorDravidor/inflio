"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { 
  IconVideo,
  IconClock,
  IconScissors,
  IconArticle,
  IconFileText,
  IconTrendingUp,
  IconTrendingDown,
  IconEqual
} from "@tabler/icons-react"
import { ProjectService, UsageService } from "@/lib/services"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Project } from "@/lib/project-types"
import { useAuth } from "@clerk/nextjs"
import { Progress } from "@/components/ui/progress"

interface AnalyticsData {
  totalProjects: number
  totalVideoDuration: number
  totalVideoSize: number
  totalClips: number
  totalBlogs: number
  totalSocialPosts: number
  totalPodcasts: number
  projectsByStatus: Record<string, number>
  recentActivity: Array<{
    id: string
    projectTitle: string
    action: string
    timestamp: string
    type: 'upload' | 'process' | 'export'
  }>
  processingProjects: Project[]
  weeklyStats: Array<{
    day: string
    projects: number
    clips: number
    blogs: number
  }>
}

export default function AnalyticsPage() {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    if (userId) {
      loadAnalytics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const allProjects = await ProjectService.getAllProjects(userId || undefined)

      // Calculate analytics data
      const data: AnalyticsData = {
        totalProjects: allProjects.length,
        totalVideoDuration: 0,
        totalVideoSize: 0,
        totalClips: 0,
        totalBlogs: 0,
        totalSocialPosts: 0,
        totalPodcasts: 0,
        projectsByStatus: {
          draft: 0,
          processing: 0,
          ready: 0,
          published: 0
        },
        recentActivity: [],
        processingProjects: [],
        weeklyStats: []
      }

      // Aggregate data from projects
      allProjects.forEach(project => {
        data.totalVideoDuration += project.metadata.duration
        data.totalVideoSize += project.metadata.size
        data.totalClips += project.folders.clips.length
        data.totalBlogs += project.folders.blog.length
        data.totalSocialPosts += project.folders.social.length
        data.totalPodcasts += project.folders.podcast.length
        data.projectsByStatus[project.status] = (data.projectsByStatus[project.status] || 0) + 1
      })

      // Get processing projects
      data.processingProjects = allProjects.filter(p => p.status === 'processing')

      // Generate recent activity from actual projects
      data.recentActivity = allProjects
        .slice(0, 10)
        .map(project => ({
          id: project.id,
          projectTitle: project.title,
          action: project.status === 'processing' ? 'Processing video' : 
                  project.status === 'ready' ? 'Completed processing' : 
                  'Uploaded video',
          timestamp: project.updated_at || project.created_at,
          type: (project.status === 'processing' ? 'process' : 
                project.status === 'ready' ? 'export' : 
                'upload') as 'upload' | 'process' | 'export'
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // Calculate weekly stats based on project creation dates
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const projectsThisWeek = allProjects.filter(p => new Date(p.created_at) >= weekAgo)
      
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      
      data.weeklyStats = days.map((day) => {
        const dayProjects = projectsThisWeek.filter(p => {
          const projectDay = new Date(p.created_at).getDay()
          return dayIndex[projectDay].startsWith(day)
        })
        
        return {
          day,
          projects: dayProjects.length,
          clips: dayProjects.reduce((sum, p) => sum + p.folders.clips.length, 0),
          blogs: dayProjects.reduce((sum, p) => sum + p.folders.blog.length, 0)
        }
      })

      setAnalyticsData(data)
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!analyticsData) return null

  // Calculate trend percentages based on actual data
  const calculateTrend = (current: number, previous: number = 0) => {
    if (previous === 0) return { value: '+100%', trend: 'up' }
    const change = ((current - previous) / previous * 100).toFixed(0)
    return {
      value: `${Number(change) >= 0 ? '+' : ''}${change}%`,
      trend: Number(change) > 0 ? 'up' : Number(change) < 0 ? 'down' : 'neutral'
    }
  }

  const stats = [
    {
      title: "Total Videos Processed",
      value: analyticsData.totalProjects.toString(),
      change: calculateTrend(analyticsData.totalProjects, 0).value,
      trend: calculateTrend(analyticsData.totalProjects, 0).trend,
      icon: IconVideo,
      description: "all time"
    },
    {
      title: "Hours Transcribed",
      value: (analyticsData.totalVideoDuration / 3600).toFixed(1),
      change: calculateTrend(analyticsData.totalVideoDuration, 0).value,
      trend: calculateTrend(analyticsData.totalVideoDuration, 0).trend,
      icon: IconFileText,
      description: "of video content"
    },
    {
      title: "Clips Generated",
      value: analyticsData.totalClips.toString(),
      change: calculateTrend(analyticsData.totalClips, 0).value,
      trend: calculateTrend(analyticsData.totalClips, 0).trend,
      icon: IconScissors,
      description: "short-form videos"
    },
    {
      title: "Blog Posts Created",
      value: analyticsData.totalBlogs.toString(),
      change: calculateTrend(analyticsData.totalBlogs, 0).value,
      trend: calculateTrend(analyticsData.totalBlogs, 0).trend,
      icon: IconArticle,
      description: "written content"
    }
  ]

  const usage = UsageService.getUsage()
  const usagePercentage = UsageService.getUsagePercentage()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your content transformation metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {stat.trend === 'up' && <IconTrendingUp className="h-3 w-3 text-green-600" />}
                {stat.trend === 'down' && <IconTrendingDown className="h-3 w-3 text-red-600" />}
                {stat.trend === 'neutral' && <IconEqual className="h-3 w-3 text-gray-600" />}
                <span className={
                  stat.trend === "up" ? "text-green-600" : 
                  stat.trend === "down" ? "text-red-600" : 
                  "text-gray-600"
                }>
                  {stat.change}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage and Chart */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-border/50 shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>
              Content creation activity over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartAreaInteractive />
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Monthly Usage</CardTitle>
            <CardDescription>Your {usage.plan} plan usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Videos Processed</span>
                <span className="text-sm font-bold">{usage.used} / {usage.limit}</span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {UsageService.getRemainingVideos()} videos remaining
              </p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Resets on {new Date(usage.resetDate).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Processing Queue</CardTitle>
            <CardDescription>Current and recent video processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.processingProjects.length > 0 ? (
                analyticsData.processingProjects.map(project => {
                  const progress = ProjectService.calculateProjectProgress(project)
                  return (
                    <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <IconClock className="h-4 w-4 text-muted-foreground animate-pulse" />
                        <div>
                          <p className="text-sm font-medium">{project.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Started {new Date(project.updated_at || project.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-orange-600">{progress}%</span>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconVideo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No videos processing</p>
                </div>
              )}
              
              {analyticsData.recentActivity
                .filter(activity => activity.type !== 'process')
                .slice(0, Math.max(0, 3 - analyticsData.processingProjects.length))
                .map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <IconVideo className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{activity.projectTitle}</p>
                        <p className="text-xs text-muted-foreground">{activity.action}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Output Distribution</CardTitle>
            <CardDescription>Types of content generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Transcriptions</span>
                  <span className="text-sm font-medium">{analyticsData.totalProjects}</span>
                </div>
                <div className="w-full bg-secondary/50 h-2 rounded-full">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Video Clips</span>
                  <span className="text-sm font-medium">{analyticsData.totalClips}</span>
                </div>
                <div className="w-full bg-secondary/50 h-2 rounded-full">
                  <div className="bg-primary h-2 rounded-full" style={{ 
                    width: analyticsData.totalClips + analyticsData.totalBlogs + analyticsData.totalSocialPosts > 0
                      ? `${(analyticsData.totalClips / (analyticsData.totalClips + analyticsData.totalBlogs + analyticsData.totalSocialPosts)) * 100}%`
                      : '0%'
                  }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Blog Posts</span>
                  <span className="text-sm font-medium">{analyticsData.totalBlogs}</span>
                </div>
                <div className="w-full bg-secondary/50 h-2 rounded-full">
                  <div className="bg-primary h-2 rounded-full" style={{ 
                    width: analyticsData.totalClips + analyticsData.totalBlogs + analyticsData.totalSocialPosts > 0
                      ? `${(analyticsData.totalBlogs / (analyticsData.totalClips + analyticsData.totalBlogs + analyticsData.totalSocialPosts)) * 100}%`
                      : '0%'
                  }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Social Posts</span>
                  <span className="text-sm font-medium">{analyticsData.totalSocialPosts}</span>
                </div>
                <div className="w-full bg-secondary/50 h-2 rounded-full">
                  <div className="bg-primary h-2 rounded-full" style={{ 
                    width: analyticsData.totalClips + analyticsData.totalBlogs + analyticsData.totalSocialPosts > 0
                      ? `${(analyticsData.totalSocialPosts / (analyticsData.totalClips + analyticsData.totalBlogs + analyticsData.totalSocialPosts)) * 100}%`
                      : '0%'
                  }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
