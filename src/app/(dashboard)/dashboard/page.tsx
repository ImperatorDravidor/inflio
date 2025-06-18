"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
  IconScissors
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { ProjectService } from "@/lib/services"
import { Project } from "@/lib/project-types"
import { formatDuration } from "@/lib/video-utils"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { RecapWizard } from "@/components/social/recap-wizard"

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
  const [showRecap, setShowRecap] = useState(false)
  const [hasSeenRecap, setHasSeenRecap] = useState(false)

  // Dynamic tips that rotate
  const tips = [
    {
      title: "Optimize Video Length",
      description: "Videos under 60 seconds get 2x more engagement"
    },
    {
      title: "Add Captions",
      description: "85% of videos are watched without sound"
    },
    {
      title: "Best Upload Times",
      description: "Tuesday-Thursday, 9AM-12PM see highest views"
    },
    {
      title: "Use Templates",
      description: "Save time with pre-built content templates"
    },
    {
      title: "Batch Processing",
      description: "Upload multiple videos to maximize efficiency"
    },
    {
      title: "SEO Optimization",
      description: "Add keywords to your titles and descriptions"
    }
  ]

  // Select random tips
  const [currentTips] = useState(() => {
    const shuffled = [...tips].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 2)
  })

  useEffect(() => {
    // Check if user has seen recap today
    const lastRecapDate = localStorage.getItem(`recap_shown_${userId}`)
    const today = new Date().toDateString()
    
    if (!lastRecapDate || lastRecapDate !== today) {
      setTimeout(() => {
        setShowRecap(true)
        localStorage.setItem(`recap_shown_${userId}`, today)
      }, 1000) // Show after 1 second
    }
    setHasSeenRecap(true)
  }, [userId])

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
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  const recentProjects = projects.slice(0, 5)

  const statsCards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: IconFolder,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Video Clips",
      value: stats.totalClips,
      icon: IconVideo,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      title: "Blog Posts",
      value: stats.totalBlogPosts,
      icon: IconFileText,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      title: "Social Posts",
      value: stats.totalSocialPosts,
      icon: IconShare,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Recap Dialog */}
      {userId && hasSeenRecap && (
        <Dialog open={showRecap} onOpenChange={setShowRecap}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <RecapWizard 
              userId={userId} 
              isReturningUser={stats.totalProjects > 0}
              onClose={() => setShowRecap(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 p-8"
      >
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Your content creation hub is ready. What will you create today?
          </p>
          <div className="flex gap-4">
            <Button 
              size="lg" 
              className="gradient-premium hover:opacity-90 shadow-lg"
              onClick={() => router.push('/studio/upload')}
            >
              <IconVideoPlus className="h-5 w-5 mr-2" />
              Upload New Video
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push('/projects')}
            >
              View All Projects
              <IconArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="ghost"
              onClick={() => setShowRecap(true)}
            >
              <IconChartBar className="h-5 w-5 mr-2" />
              View Recap
            </Button>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-10">
          <IconSparkles className="h-80 w-80" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16 mt-2" />
              </CardHeader>
            </Card>
          ))
        ) : (
          statsCards.map((stat) => (
            <MotionCard
              key={stat.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
            </MotionCard>
          ))
        )}
      </motion.div>

      {/* Content Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Your latest video projects and their status</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/projects">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-16 w-24 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-60" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentProjects.length > 0 ? (
                <div className="space-y-4">
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
                        <div className="flex items-center gap-4 p-4 rounded-xl border hover:border-primary/50 transition-all">
                          <div className="relative h-16 w-24 rounded-lg overflow-hidden bg-muted">
                            {project.thumbnail_url ? (
                              <Image
                                src={project.thumbnail_url}
                                alt={project.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <IconVideo className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                            )}
                            {project.status === 'processing' && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <IconPlayerPlay className="h-6 w-6 text-white animate-pulse" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-semibold group-hover:text-primary transition-colors">
                              {project.title}
                            </h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <IconClock className="h-4 w-4" />
                                {formatDuration(project.metadata.duration)}
                              </span>
                              <span className="flex items-center gap-1">
                                <IconVideo className="h-4 w-4" />
                                {projectStats.totalClips} clips
                              </span>
                              <span className="flex items-center gap-1">
                                <IconFileText className="h-4 w-4" />
                                {projectStats.totalBlogs} posts
                              </span>
                            </div>
                            <Progress value={progress} className="h-1.5 mt-2" />
                          </div>
                          
                          <div className="text-right">
                            <Badge variant={
                              project.status === 'ready' ? 'default' :
                              project.status === 'processing' ? 'secondary' :
                              project.status === 'published' ? 'default' :
                              'outline'
                            }>
                              {project.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(project.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <IconFolder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No projects yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your first video to get started
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => router.push('/studio/upload')}
                  >
                    <IconVideoPlus className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Processing Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Processing Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Tasks</span>
                <span className="font-semibold">{stats.activeProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-semibold">{stats.completedProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Time</span>
                <span className="font-semibold">{formatDuration(stats.totalProcessingTime)}</span>
              </div>
              <Button className="w-full" variant="outline" size="sm">
                <IconChartBar className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconSparkles className="h-5 w-5 text-primary" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentTips.map((tip, index) => (
                <div key={index} className="text-sm">
                  <p className="font-medium mb-1">{tip.title}</p>
                  <p className="text-muted-foreground">
                    {tip.description}
                  </p>
                </div>
              ))}
              <Button className="w-full" size="sm" variant="ghost" onClick={() => router.push('/templates')}>
                View All Tips
                <IconArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Platform Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
            <CardDescription>Your content across different formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-lg border">
                <div className="p-3 rounded-lg bg-muted text-purple-500">
                  <IconScissors className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Video Clips</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{stats.totalClips} generated</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg border">
                <div className="p-3 rounded-lg bg-muted text-green-500">
                  <IconFileText className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Blog Posts</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{stats.totalBlogPosts} written</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg border">
                <div className="p-3 rounded-lg bg-muted text-orange-500">
                  <IconShare className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Social Posts</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{stats.totalSocialPosts} created</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 
