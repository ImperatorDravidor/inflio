"use client"

import React, { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  IconPlus,
  IconCalendar,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconBrandTiktok,
  IconBrandFacebook,
  IconChartBar,
  IconEdit,
  IconTrash,
  IconEye,
  IconSparkles,
  IconClock,
  IconCheck,
  IconX,
  IconRefresh,
  IconPencil,
  IconSettings,
  IconArrowRight,
  IconTrendingUp,
  IconUsers,
  IconRocket,
  IconBolt,
  IconLink
} from "@tabler/icons-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { ROUTES } from "@/lib/constants"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useProjectNavigation } from "@/hooks/use-project-navigation"
import { SocialMediaServiceClient } from "@/lib/social/types"
import type { SocialIntegration, SocialPost, Platform } from "@/lib/social/types"
import { format, formatDistance } from "date-fns"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AnimatedBackground } from "@/components/animated-background"
import { SocialPlatformSelector } from "@/components/social/social-platform-selector"
import { SocialPostCard } from "@/components/social/social-post-card"
import { SocialAnalyticsChart } from "@/components/social/social-analytics-chart"
import { SocialQuickActions, QuickCreateWidget } from "@/components/social/social-quick-actions"
import { SocialAuthChecker } from "@/lib/social/auth-check"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SocialAccountConnector } from "@/components/social/social-account-connector"
import SocialPostsExpandable from "@/components/social/social-posts-expandable"
import { EmptyState } from "@/components/empty-state"
import Link from "next/link"

const platformIcons = {
  youtube: IconBrandYoutube,
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  linkedin: IconBrandLinkedin,
  twitter: IconBrandTwitter,
  x: IconBrandTwitter,
  facebook: IconBrandFacebook,
  threads: IconBrandInstagram
}

const platformColors = {
  youtube: "text-red-500 bg-red-50 dark:bg-red-950/20",
  instagram: "text-pink-500 bg-pink-50 dark:bg-pink-950/20",
  tiktok: "text-black dark:text-white bg-gray-50 dark:bg-gray-950/20",
  linkedin: "text-blue-700 bg-blue-50 dark:bg-blue-950/20",
  twitter: "text-sky-500 bg-sky-50 dark:bg-sky-950/20",
  x: "text-black dark:text-white bg-gray-50 dark:bg-gray-950/20",
  facebook: "text-blue-600 bg-blue-50 dark:bg-blue-950/20",
  threads: "text-black dark:text-white bg-gray-50 dark:bg-gray-950/20"
}

const stateColors = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  publishing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  published: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
}

function SocialMediaDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId } = useAuth()
  const { navigateToProjects } = useProjectNavigation()
  const [integrations, setIntegrations] = useState<SocialIntegration[]>([])
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshing, setRefreshing] = useState(false)
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])

  const socialService = new SocialMediaServiceClient()

  // Check for connect parameter in URL
  useEffect(() => {
    const connectPlatform = searchParams.get('connect')
    if (connectPlatform) {
      setActiveTab('accounts')
      toast.info(`Please connect your ${connectPlatform} account to continue`)
    }
  }, [searchParams])

  // Keyboard shortcuts
  const shortcuts = [
    {
      key: 'n',
      ctrlKey: true,
      description: 'Create new post',
      action: () => router.push(ROUTES.SOCIAL_COMPOSE)
    },
    {
      key: 'c',
      ctrlKey: true,
      description: 'View calendar',
      action: () => router.push(ROUTES.SOCIAL_CALENDAR)
    },
    {
      key: 'p',
      ctrlKey: true,
      description: 'Go to projects',
      action: () => navigateToProjects()
    }
  ]

  useKeyboardShortcuts({ shortcuts })

  useEffect(() => {
    if (userId) {
      loadData()
      checkConnectedPlatforms()
    }

    const handleSocialUpdate = () => {
      loadData()
    }

    window.addEventListener('socialUpdate', handleSocialUpdate)
    
    return () => {
      window.removeEventListener('socialUpdate', handleSocialUpdate)
    }
  }, [userId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [integrationsData, postsData] = await Promise.all([
        socialService.getIntegrations(userId!),
        socialService.getPosts(userId!)
      ])
      
      setIntegrations(integrationsData)
      setRecentPosts(postsData)
      setScheduledPosts(postsData.filter(p => p.state === 'scheduled'))

      // Set selected platforms based on connected integrations
      const connectedPlatforms = integrationsData
        .filter(i => !i.disabled)
        .map(i => i.platform as Platform)
      setSelectedPlatforms(connectedPlatforms)
    } catch {
      console.error('Failed to load social media data')
      toast.error('Failed to load social media data')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
    toast.success('Data refreshed!')
  }

  const checkConnectedPlatforms = async () => {
    if (!userId) return
    
    try {
      const connected = await SocialAuthChecker.getConnectedPlatforms(userId)
      setConnectedPlatforms(connected)
    } catch (error) {
      console.error('Error checking connected platforms:', error)
    }
  }

  const connectPlatform = (platformId: string) => {
    // For now, show instructions on how to connect
    toast.info(`OAuth integration for ${platformId} is not yet configured. Please check the documentation for setup instructions.`)
    
    // In production, this would redirect to OAuth flow:
    // window.location.href = `/api/social/auth/${platformId}`
  }

  const disconnectPlatform = async (integrationId: string) => {
    try {
      await socialService.deleteIntegration(integrationId)
      await loadData()
      toast.success('Platform disconnected')
    } catch {
      toast.error('Failed to disconnect platform')
    }
  }

  const deletePost = async (postId: string) => {
    try {
      await socialService.deletePost(postId)
      await loadData()
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete post')
    }
  }

  const publishNow = async (postId: string) => {
    try {
      await socialService.publishPostNow(postId)
      await loadData()
      toast.success('Publishing post...')
    } catch {
      toast.error('Failed to publish post')
    }
  }

  // Calculate stats
  const stats = {
    totalConnected: integrations.filter(i => !i.disabled).length,
    totalPosts: recentPosts.length,
    scheduledPosts: scheduledPosts.length,
    publishedToday: recentPosts.filter(p => 
      p.state === 'published' && 
      new Date(p.publish_date).toDateString() === new Date().toDateString()
    ).length,
    failedPosts: recentPosts.filter(p => p.state === 'failed').length,
    totalEngagement: recentPosts.reduce((sum, post) => {
      const analytics = post.analytics || {}
      return sum + (analytics.likes || 0) + (analytics.comments || 0) + (analytics.shares || 0)
    }, 0)
  }

  // Transform integrations for platform selector
  const platforms = Object.entries(platformIcons).map(([id, icon]) => {
    const isConnected = connectedPlatforms.includes(id)
    const integration = integrations.find(i => i.platform === id)
    return {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      icon,
      isConnected,
      isSelected: selectedPlatforms.includes(id as Platform),
      audienceSize: integration?.followers_count || 0,
      engagementRate: 5.2, // Mock data
      username: integration?.name
    }
  })

  // Filter posts by selected platforms
  const filteredScheduledPosts = scheduledPosts.filter(post => {
    const platform = integrations.find(i => i.id === post.integration_id)?.platform
    return !platform || selectedPlatforms.length === 0 || selectedPlatforms.includes(platform as Platform)
  })

  const filteredRecentPosts = recentPosts.filter(post => {
    const platform = integrations.find(i => i.id === post.integration_id)?.platform
    return !platform || selectedPlatforms.length === 0 || selectedPlatforms.includes(platform as Platform)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="relative">
      <AnimatedBackground variant="subtle" />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative space-y-8"
      >
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 p-8"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, currentColor 1px, transparent 1px)`,
              backgroundSize: '30px 30px'
            }} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Social Media Hub
                </h1>
                <p className="text-lg text-muted-foreground">
                  Manage and grow your social presence across all platforms
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  disabled={refreshing}
                >
                  <IconRefresh className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                  Refresh
                </Button>
                <Button
                  onClick={() => router.push('/social/compose')}
                  className="shadow-lg"
                >
                  <IconPencil className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Platforms', value: `${stats.totalConnected}/8`, icon: IconSettings, trend: '+2' },
                { label: 'Scheduled', value: stats.scheduledPosts, icon: IconClock, trend: '+5' },
                { label: 'Published Today', value: stats.publishedToday, icon: IconCheck, trend: '+12' },
                { label: 'Total Engagement', value: stats.totalEngagement, icon: IconTrendingUp, trend: '+23%' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background/50 backdrop-blur-sm rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    {React.createElement(stat.icon, { className: "h-5 w-5 text-muted-foreground" })}
                    <Badge variant="secondary" className="text-xs">
                      {stat.trend}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <SocialQuickActions variant="grid" />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Create Widget */}
              <QuickCreateWidget />

              {/* Recent Posts */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Posts</CardTitle>
                      <CardDescription>Your latest social media activity</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('posts')}>
                      View All
                      <IconArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentPosts.length > 0 ? (
                    <div className="space-y-3">
                      {recentPosts.slice(0, 3).map((post) => (
                        <SocialPostCard
                          key={post.id}
                          post={post}
                          onEdit={() => router.push(`/social/compose?postId=${post.id}`)}
                          onDelete={() => deletePost(post.id)}
                          onPublishNow={() => publishNow(post.id)}
                          variant="compact"
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={React.createElement(IconEdit)}
                      title="No posts yet"
                      description="Start creating content to see it here"
                      action={{
                        label: "Create First Post",
                        onClick: () => router.push('/social/compose')
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Analytics Overview */}
            <SocialAnalyticsChart />
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <SocialAccountConnector onConnectionChange={() => {
              loadData()
              checkConnectedPlatforms()
            }} />
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Posts</CardTitle>
                    <CardDescription>
                      Manage your published and scheduled content
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push('/social/compose')}>
                    <IconPlus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentPosts.length > 0 ? (
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <SocialPostCard
                        key={post.id}
                        post={post}
                        onEdit={() => router.push(`/social/compose?postId=${post.id}`)}
                        onDelete={() => deletePost(post.id)}
                        onPublishNow={() => publishNow(post.id)}
                        onViewAnalytics={() => router.push(`/social/calendar?post=${post.id}`)}
                        variant="detailed"
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={React.createElement(IconEdit)}
                    title="No posts found"
                    description="Create your first post to get started"
                    action={{
                      label: "Create Post",
                      onClick: () => router.push('/social/compose')
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <SocialAnalyticsChart showPlatformBreakdown />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Posts</CardTitle>
                  <CardDescription>Your best content this month</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentPosts.filter(p => p.state === 'published').length > 0 ? (
                    <div className="space-y-3">
                      {recentPosts
                        .filter(p => p.state === 'published')
                        .sort((a, b) => {
                          const aEngagement = (a.analytics?.likes || 0) + (a.analytics?.comments || 0) + (a.analytics?.shares || 0)
                          const bEngagement = (b.analytics?.likes || 0) + (b.analytics?.comments || 0) + (b.analytics?.shares || 0)
                          return bEngagement - aEngagement
                        })
                        .slice(0, 3)
                        .map((post, index) => {
                          const engagement = (post.analytics?.likes || 0) + (post.analytics?.comments || 0) + (post.analytics?.shares || 0)
                          const platform = integrations.find(i => i.id === post.integration_id)?.platform || 'unknown'
                          const Icon = platformIcons[platform as keyof typeof platformIcons] || IconLink
                          
                          return (
                            <div key={post.id} className="flex items-center gap-3">
                              <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                              <div className={cn("p-2 rounded", platformColors[platform as keyof typeof platformColors])}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium truncate">{post.content}</p>
                                <p className="text-xs text-muted-foreground">
                                  {engagement} engagements • {format(new Date(post.publish_date), 'MMM d')}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <IconChartBar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No published posts to analyze yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Platform Performance</CardTitle>
                  <CardDescription>Engagement by platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {integrations.filter(i => !i.disabled).map((integration) => {
                      const platformPosts = recentPosts.filter(p => p.integration_id === integration.id && p.state === 'published')
                      const totalEngagement = platformPosts.reduce((sum, post) => {
                        return sum + (post.analytics?.likes || 0) + (post.analytics?.comments || 0) + (post.analytics?.shares || 0)
                      }, 0)
                      const Icon = platformIcons[integration.platform as keyof typeof platformIcons] || IconLink
                      
                      return (
                        <div key={integration.id} className="flex items-center gap-3">
                          <div className={cn("p-2 rounded", platformColors[integration.platform as keyof typeof platformColors])}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{integration.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {platformPosts.length} posts • {totalEngagement} total engagements
                            </p>
                          </div>
                          {integration.followers_count && (
                            <Badge variant="secondary">{integration.followers_count} followers</Badge>
                          )}
                        </div>
                      )
                    })}
                    {integrations.filter(i => !i.disabled).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <IconUsers className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Connect platforms to see performance data</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

export default function SocialMediaDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <SocialMediaDashboardContent />
    </Suspense>
  )
} 