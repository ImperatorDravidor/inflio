"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { 
  IconVideo,
  IconClock,
  IconScissors,
  IconArticle,
  IconFileText
} from "@tabler/icons-react"
import { ProjectService } from "@/lib/services"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

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
  popularContent: Array<{
    id: string
    title: string
    type: string
    views: number
    exports: number
  }>
  weeklyStats: Array<{
    day: string
    projects: number
    clips: number
    blogs: number
  }>
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const allProjects = await ProjectService.getAllProjects()

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
        popularContent: [],
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

      // Generate mock recent activity
      data.recentActivity = allProjects
        .slice(0, 10)
        .map(project => ({
          id: project.id,
          projectTitle: project.title,
          action: 'Uploaded video',
          timestamp: new Date(project.created_at).toISOString(),
          type: 'upload' as const
        }))

      // Generate mock popular content
      data.popularContent = allProjects
        .slice(0, 5)
        .map(project => ({
          id: project.id,
          title: project.title,
          type: 'Video',
          views: Math.floor(Math.random() * 1000) + 100,
          exports: Math.floor(Math.random() * 50) + 5
        }))

      // Generate weekly stats
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      data.weeklyStats = days.map(day => ({
        day,
        projects: Math.floor(Math.random() * 5) + 1,
        clips: Math.floor(Math.random() * 20) + 5,
        blogs: Math.floor(Math.random() * 10) + 2
      }))

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

  const stats = [
    {
      title: "Total Videos Processed",
      value: analyticsData.totalProjects.toString(),
      change: "+12%",
      trend: "up",
      icon: IconVideo,
      description: "vs last month"
    },
    {
      title: "Hours Transcribed",
      value: (analyticsData.totalVideoDuration / 3600).toFixed(1),
      change: "+18%",
      trend: "up",
      icon: IconFileText,
      description: "vs last month"
    },
    {
      title: "Clips Generated",
      value: analyticsData.totalClips.toString(),
      change: "+25%",
      trend: "up",
      icon: IconScissors,
      description: "vs last month"
    },
    {
      title: "Blog Posts Created",
      value: analyticsData.totalBlogs.toString(),
      change: "+8%",
      trend: "up",
      icon: IconArticle,
      description: "vs last month"
    }
  ]

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
              <p className="text-xs text-muted-foreground">
                <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>
                  {stat.change}
                </span> {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Processing Time Chart */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Processing Time Trends</CardTitle>
          <CardDescription>
            Average processing time per video over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartAreaInteractive />
        </CardContent>
      </Card>

      {/* Recent Activity and Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Processing Queue</CardTitle>
            <CardDescription>Current and upcoming video processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Conference Recording</p>
                    <p className="text-xs text-muted-foreground">Started 5 min ago</p>
                  </div>
                </div>
                <span className="text-sm text-orange-600">65%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Tutorial Part 2</p>
                    <p className="text-xs text-muted-foreground">Queued</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">Waiting</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Marketing Video</p>
                    <p className="text-xs text-muted-foreground">Queued</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">Waiting</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Output Distribution</CardTitle>
            <CardDescription>Types of content generated this month</CardDescription>
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
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${(analyticsData.totalClips / (analyticsData.totalClips + analyticsData.totalBlogs + analyticsData.totalSocialPosts)) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Blog Posts</span>
                  <span className="text-sm font-medium">{analyticsData.totalBlogs}</span>
                </div>
                <div className="w-full bg-secondary/50 h-2 rounded-full">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${(analyticsData.totalBlogs / (analyticsData.totalClips + analyticsData.totalBlogs + analyticsData.totalSocialPosts)) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Social Posts</span>
                  <span className="text-sm font-medium">{analyticsData.totalSocialPosts}</span>
                </div>
                <div className="w-full bg-secondary/50 h-2 rounded-full">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${(analyticsData.totalSocialPosts / (analyticsData.totalClips + analyticsData.totalBlogs + analyticsData.totalSocialPosts)) * 100}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
