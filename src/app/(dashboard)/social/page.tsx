"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
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
  IconX
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
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
import {
  IconSettings,
  IconRefresh,
  IconPencil,
  IconLock,
  IconLockOpen,
  IconTemplate,
  IconWand,
  IconSend,
  IconThumbUp,
  IconMessage,
  IconShare,
  IconCrown,
  IconChartLine
} from "@tabler/icons-react"

const platformIcons = {
  youtube: IconBrandYoutube,
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  linkedin: IconBrandLinkedin,
  twitter: IconBrandTwitter,
  x: IconBrandTwitter, // X uses the same icon as Twitter
  facebook: IconBrandFacebook,
  threads: IconBrandInstagram // Threads uses Instagram icon for now
}

const platformColors = {
  youtube: "text-red-500 bg-red-50 dark:bg-red-950/20",
  instagram: "text-pink-500 bg-pink-50 dark:bg-pink-950/20",
  tiktok: "text-black dark:text-white bg-gray-50 dark:bg-gray-950/20",
  linkedin: "text-blue-700 bg-blue-50 dark:bg-blue-950/20",
  twitter: "text-sky-500 bg-sky-50 dark:bg-sky-950/20",
  x: "text-black dark:text-white bg-gray-50 dark:bg-gray-950/20", // X color scheme
  facebook: "text-blue-600 bg-blue-50 dark:bg-blue-950/20",
  threads: "text-black dark:text-white bg-gray-50 dark:bg-gray-950/20" // Threads color
}

const stateColors = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  publishing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  published: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
}

export default function SocialMediaDashboard() {
  const router = useRouter()
  const { userId } = useAuth()
  const { navigateToProjects } = useProjectNavigation()
  const [integrations, setIntegrations] = useState<SocialIntegration[]>([])
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const socialService = new SocialMediaServiceClient()

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
    loadData()

    // Listen for social updates
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

  const connectPlatform = (platform: Platform) => {
    // TODO: Implement OAuth flow for each platform
    toast.info(`Connecting to ${platform}...`)
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
        {/* Enhanced Header with Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Social Media Hub</h1>
              <p className="text-lg text-white/90">
                Manage and grow your social presence across all platforms
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <IconRefresh className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button
                className="bg-white text-purple-600 hover:bg-white/90 shadow-lg"
                onClick={() => router.push('/social/compose')}
              >
                <IconPencil className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-sm text-white/80">Platforms</p>
              <p className="text-2xl font-bold">{stats.totalConnected}/6</p>
              <p className="text-xs text-white/70">Connected</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-sm text-white/80">Scheduled</p>
              <p className="text-2xl font-bold">{stats.scheduledPosts}</p>
              <p className="text-xs text-white/70">Ready to publish</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-sm text-white/80">Published</p>
              <p className="text-2xl font-bold">{stats.publishedToday}</p>
              <p className="text-xs text-white/70">Today</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-sm text-white/80">Engagement</p>
              <p className="text-2xl font-bold">{stats.totalEngagement}</p>
              <p className="text-xs text-white/70">Total interactions</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards - Simplified */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {[
            { label: "Total Posts", value: stats.totalPosts, icon: IconEdit, color: "text-blue-600" },
            { label: "Scheduled", value: stats.scheduledPosts, icon: IconClock, color: "text-purple-600" },
            { label: "Published Today", value: stats.publishedToday, icon: IconCheck, color: "text-green-600" },
            { label: "Failed", value: stats.failedPosts, icon: IconX, color: "text-red-600" },
            { label: "Engagement", value: stats.totalEngagement, icon: IconChartBar, color: "text-orange-600" },
            { label: "Connected", value: `${stats.totalConnected}/6`, icon: IconSettings, color: "text-gray-600" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                    <Badge variant="secondary" className="text-xs">
                      {stat.label}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Connected Accounts */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Connected Accounts</CardTitle>
                  <CardDescription>Manage your social media connections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(platformIcons).map(([platform, Icon]) => {
                      const integration = integrations.find(i => i.platform === platform)
                      const isConnected = integration && !integration.disabled
                      
                      return (
                        <motion.div
                          key={platform}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card className={cn(
                            "cursor-pointer transition-all",
                            isConnected ? "border-primary/50" : "border-muted"
                          )}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn("p-2 rounded-lg", platformColors[platform as Platform])}>
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="font-medium capitalize">{platform}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {isConnected ? integration.name : "Not connected"}
                                    </p>
                                  </div>
                                </div>
                                {isConnected ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => disconnectPlatform(integration.id)}
                                  >
                                    <IconLockOpen className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => connectPlatform(platform as Platform)}
                                  >
                                    <IconLock className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Posts */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Posts</CardTitle>
                  <CardDescription>Next scheduled posts</CardDescription>
                </CardHeader>
                <CardContent>
                  {scheduledPosts.length > 0 ? (
                    <div className="space-y-3">
                      {scheduledPosts.map((post) => {
                        const Icon = platformIcons[post.integration?.platform || 'twitter']
                        return (
                          <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className={cn("p-2 rounded-lg", platformColors[post.integration?.platform || 'twitter'])}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-2">{post.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistance(new Date(post.publish_date), new Date(), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <IconCalendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No upcoming posts</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(ROUTES.SOCIAL_COMPOSE)}>
                  <CardContent className="p-6 text-center">
                    <IconPencil className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-medium">Compose</h3>
                    <p className="text-sm text-muted-foreground">Create new post</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toast.info('Templates coming soon!')}>
                  <CardContent className="p-6 text-center">
                    <IconTemplate className="h-8 w-8 mx-auto mb-3 text-green-600" />
                    <h3 className="font-medium">Templates</h3>
                    <p className="text-sm text-muted-foreground">Saved templates</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(ROUTES.SOCIAL_CALENDAR)}>
                  <CardContent className="p-6 text-center">
                    <IconCalendar className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                    <h3 className="font-medium">Calendar</h3>
                    <p className="text-sm text-muted-foreground">Content schedule</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toast.info('AI Assistant coming soon!')}>
                  <CardContent className="p-6 text-center">
                    <IconWand className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                    <h3 className="font-medium">AI Assistant</h3>
                    <p className="text-sm text-muted-foreground">Generate content</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => {
                const Icon = platformIcons[integration.platform]
                return (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", platformColors[integration.platform])}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium">{integration.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{integration.platform}</p>
                          </div>
                        </div>
                        <Badge variant={integration.disabled ? "secondary" : "default"}>
                          {integration.disabled ? "Disabled" : "Active"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Connected</span>
                          <span>{format(new Date(integration.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {integration.refresh_needed && (
                          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              Token refresh needed
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <IconSettings className="h-4 w-4 mr-2" />
                            Settings
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => disconnectPlatform(integration.id)}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {/* Add New Account Card */}
              <Card className="cursor-pointer border-dashed hover:border-primary transition-colors" onClick={() => toast.info('Platform connection coming soon!')}>
                <CardContent className="h-full flex items-center justify-center p-6">
                  <div className="text-center">
                    <IconPlus className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="font-medium">Add Account</h3>
                    <p className="text-sm text-muted-foreground">Connect a new platform</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {Object.entries(platformIcons).map(([platform, Icon]) => (
                  <Button
                    key={platform}
                    size="sm"
                    variant={selectedPlatform === platform ? "default" : "outline"}
                    onClick={() => setSelectedPlatform(selectedPlatform === platform ? null : platform as Platform)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">All: {recentPosts.length}</Badge>
                <Badge variant="outline" className={stateColors.scheduled}>
                  Scheduled: {scheduledPosts.length}
                </Badge>
                <Badge variant="outline" className={stateColors.published}>
                  Published: {recentPosts.filter(p => p.state === 'published').length}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {recentPosts
                .filter(post => !selectedPlatform || post.integration?.platform === selectedPlatform)
                .map((post) => {
                  const Icon = platformIcons[post.integration?.platform || 'twitter']
                  return (
                    <Card key={post.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn("p-2 rounded-lg", platformColors[post.integration?.platform || 'twitter'])}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium line-clamp-2">{post.content}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span>{format(new Date(post.publish_date), 'MMM d, yyyy h:mm a')}</span>
                                  <Badge className={cn("text-xs", stateColors[post.state])}>
                                    {post.state}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {post.state === 'scheduled' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => publishNow(post.id)}
                                  >
                                    <IconSend className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toast.info('Edit post coming soon!')}
                                >
                                  <IconEdit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deletePost(post.id)}
                                >
                                  <IconTrash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {post.analytics && (
                              <div className="flex items-center gap-6 mt-3 text-sm">
                                <span className="flex items-center gap-1">
                                  <IconEye className="h-4 w-4" />
                                  {post.analytics.views || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconThumbUp className="h-4 w-4" />
                                  {post.analytics.likes || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconMessage className="h-4 w-4" />
                                  {post.analytics.comments || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconShare className="h-4 w-4" />
                                  {post.analytics.shares || 0}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Social Media Analytics</CardTitle>
                    <CardDescription>Track your performance across platforms</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                    <IconCrown className="h-3 w-3 mr-1" />
                    Pro Feature
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                                            <IconChartLine className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
                  <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
                  <p className="text-muted-foreground mb-6">
                    Get detailed insights on your social media performance
                  </p>
                  <Button className="gradient-premium">
                    <IconSparkles className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
} 