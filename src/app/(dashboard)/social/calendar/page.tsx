"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  IconCalendar,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandX,
  IconBrandFacebook,
  IconPlus,
  IconFilter,
  IconClock,
  IconCheck,
  IconList,
  IconCalendarWeek,
  IconCalendarMonth,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconTrash,
  IconEye,
  IconDotsVertical,
  IconX,
  IconRefresh,
  IconSparkles,
  IconAlertCircle,
  IconPhoto,
  IconVideo,
  IconArticle,
  IconGripVertical,
  IconPlayerPlay,
  IconCopy,
  IconSend,
  IconShare2,
  IconBrandThreads,
  IconDownload,
  IconLink,
  IconHash,
  IconTrendingUp,
  IconUsers,
  IconHeart,
  IconMessage,
  IconBookmark,
  IconExternalLink,
  IconBrain,
  IconRocket,
  IconTarget,
  IconChartBar
} from "@tabler/icons-react"
import { AnimatedBackground } from "@/components/animated-background"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addWeeks, subWeeks, addMonths, subMonths, isToday, isSameMonth, parseISO, addHours } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ProjectService } from "@/lib/services"
import { useClerkUser } from "@/hooks/use-clerk-user"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import type { SocialPost, Platform } from "@/lib/social/types"
import { SocialPostCard } from "@/components/social/social-post-card"
import { SocialQuickActions } from "@/components/social/social-quick-actions"
import { useRouter } from "next/navigation"

const platformIcons = {
  twitter: IconBrandX,
  x: IconBrandX,
  linkedin: IconBrandLinkedin,
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  facebook: IconBrandFacebook,
  threads: IconBrandThreads,
  'youtube-short': IconBrandYoutube
}

const platformColors = {
  twitter: 'from-gray-900 to-black',
  x: 'from-gray-900 to-black',
  linkedin: 'from-blue-600 to-blue-700',
  instagram: 'from-purple-500 via-pink-500 to-orange-400',
  tiktok: 'from-black to-gray-800',
  youtube: 'from-red-500 to-red-600',
  facebook: 'from-blue-500 to-blue-600',
  threads: 'from-gray-700 to-black',
  'youtube-short': 'from-red-500 to-pink-500'
}

const platformNames = {
  twitter: 'X (Twitter)',
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
  threads: 'Threads',
  'youtube-short': 'YouTube Shorts'
}

interface PostMetadata {
  type?: 'video' | 'blog' | 'image' | 'clip' | 'carousel' | 'social' | 'longform'
  thumbnail?: string
  duration?: number
  platforms?: string[]
  platform?: string
  title?: string
  description?: string
  caption?: string
  engagementPrediction?: {
    score: number
    factors?: string[]
    reasoning?: string
  }
  optimizationReason?: string
  suggestedHashtags?: string[]
  wordCount?: number
  [key: string]: any
}

interface ScheduledPost extends Omit<SocialPost, 'metadata'> {
  projectName?: string
  type?: 'video' | 'blog' | 'image' | 'clip' | 'carousel' | 'social' | 'longform'
  thumbnail?: string
  duration?: number
  metadata?: PostMetadata
  platform?: string
  platforms?: string[]
}

export default function SocialCalendarPage() {
  const { user } = useClerkUser()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentView, setCurrentView] = useState<'week' | 'month' | 'list'>('month')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const dragControls = useDragControls()
  const router = useRouter()

  // Load posts from database
  useEffect(() => {
    if (user?.id) {
      loadScheduledPosts()
    }
  }, [user])

  const loadScheduledPosts = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const supabase = createSupabaseBrowserClient()
      
      // Fetch scheduled posts (including demo posts without integration_id)
      const { data: posts, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          project:projects!social_posts_project_id_fkey (
            id,
            title
          )
        `)
        .eq('user_id', user.id)
        .in('state', ['scheduled', 'published', 'draft'])
        .order('publish_date', { ascending: true })

      if (error) {
        console.error('Error loading posts:', error)
        toast.error('Failed to load scheduled posts')
        return
      }

      // Transform posts to include project name and type
      const transformedPosts: ScheduledPost[] = posts?.map(post => {
        // Extract platform from metadata for demo posts
        const platform = post.metadata?.platform || post.metadata?.platforms?.[0] || 'instagram'
        const platforms = post.metadata?.platforms || [platform]
        
        return {
          ...post,
          publish_date: new Date(post.publish_date),
          created_at: new Date(post.created_at),
          updated_at: new Date(post.updated_at),
          projectName: post.project?.title,
          type: post.metadata?.type || 'video',
          thumbnail: post.metadata?.thumbnail || post.media_urls?.[0],
          duration: post.metadata?.duration,
          platform: platform, // Ensure platform is set for display
          platforms: platforms // Ensure platforms array exists
        }
      }) || []

      setScheduledPosts(transformedPosts)
      
      // Log info about demo posts
      const demoPosts = transformedPosts.filter((post: any) => !post.integration_id)
      if (demoPosts.length > 0) {
        console.log(`Loaded ${transformedPosts.length} posts (${demoPosts.length} in demo mode)`)
      }
    } catch (error) {
      console.error('Error loading posts:', error)
      toast.error('Failed to load scheduled posts')
    } finally {
      setLoading(false)
    }
  }

  const refreshPosts = async () => {
    setRefreshing(true)
    await loadScheduledPosts()
    setRefreshing(false)
    toast.success('Calendar refreshed')
  }

  // Helper functions
  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(post => 
      post.publish_date && isSameDay(new Date(post.publish_date), date)
    )
  }

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 })
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }

  const getMonthDays = () => {
    const start = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'next' ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1))
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'next' ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1))
  }

  const filteredPosts = selectedPlatforms.length > 0
    ? scheduledPosts.filter(post => {
        const platforms = post.metadata?.platforms || (post as any).platforms || []
        return platforms.some((p: string) => selectedPlatforms.includes(p))
      })
    : scheduledPosts

  // CRUD Operations
  const handleEdit = (post: ScheduledPost) => {
    setSelectedPost(post)
    setEditDialogOpen(true)
  }

  const handleDelete = (post: ScheduledPost) => {
    setSelectedPost(post)
    setDeleteDialogOpen(true)
  }

  const handleDuplicate = async (post: ScheduledPost) => {
    try {
      const supabase = createSupabaseBrowserClient()
      
      const newPost = {
        ...post,
        id: undefined,
        publish_date: addHours(new Date(post.publish_date), 1).toISOString(),
        state: 'draft' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('social_posts')
        .insert([newPost])
      
      if (error) throw error
      
      toast.success('Post duplicated successfully')
      await loadScheduledPosts()
    } catch (error) {
      console.error('Error duplicating post:', error)
      toast.error('Failed to duplicate post')
    }
  }

  const handlePublishNow = async (post: ScheduledPost) => {
    if (!post.integration_id) {
      toast.error('Please connect your social accounts in Settings to publish')
      return
    }
    
    setSelectedPost(post)
    setPublishDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedPost) return
    
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', selectedPost.id)
      
      if (error) throw error
      
      toast.success('Post deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedPost(null)
      await loadScheduledPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    }
  }

  const confirmPublish = async () => {
    if (!selectedPost) return
    
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('social_posts')
        .update({ 
          state: 'publishing', 
          publish_date: new Date().toISOString() 
        })
        .eq('id', selectedPost.id)
      
      if (error) throw error
      
      toast.success('Post is being published...')
      setPublishDialogOpen(false)
      setSelectedPost(null)
      await loadScheduledPosts()
    } catch (error) {
      console.error('Error publishing post:', error)
      toast.error('Failed to publish post')
    }
  }

  const saveEdit = async (updatedContent: string) => {
    if (!selectedPost) return
    
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('social_posts')
        .update({ 
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPost.id)
      
      if (error) throw error
      
      toast.success('Post updated successfully')
      setEditDialogOpen(false)
      setSelectedPost(null)
      await loadScheduledPosts()
    } catch (error) {
      console.error('Error updating post:', error)
      toast.error('Failed to update post')
    }
  }

  const showPostDetails = (post: ScheduledPost) => {
    setSelectedPost(post)
    setDetailDialogOpen(true)
  }

  // Enhanced Post Card Component
  const PostCard = ({ post, showDate = false, isDraggable = false }: { post: ScheduledPost; showDate?: boolean; isDraggable?: boolean }) => {
    // Get platforms from metadata or fallback to platform field
    const platforms = post.metadata?.platforms || (post as any).platforms || [(post as any).platform || 'instagram']
    const firstPlatform = platforms[0] || 'instagram'
    const Icon = platformIcons[firstPlatform as keyof typeof platformIcons]
    const bgGradient = platformColors[firstPlatform as keyof typeof platformColors]
    
    // Get content type icon
    const contentType: string = post.metadata?.type || post.type || 'video'
    let ContentTypeIcon = IconShare2
    
    if (contentType === 'video' || contentType === 'clip') {
      ContentTypeIcon = IconVideo
    } else if (contentType === 'longform') {
      ContentTypeIcon = IconPlayerPlay
    } else if (contentType === 'blog' || contentType === 'article') {
      ContentTypeIcon = IconArticle
    } else if (contentType === 'image' || contentType === 'carousel') {
      ContentTypeIcon = IconPhoto
    }

    const contentPreview = post.content || post.metadata?.caption || post.metadata?.title || post.metadata?.description || 'No caption yet'
    const thumbnail = post.metadata?.thumbnail || post.thumbnail || post.media_urls?.[0]

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <Card 
          className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer bg-card/50 backdrop-blur border-2 border-border/50"
          onClick={() => showPostDetails(post)}
        >
          {/* Thumbnail Section */}
          {thumbnail ? (
            <div className="relative h-48 overflow-hidden">
              <img 
                src={thumbnail} 
                alt="" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Platform badges on thumbnail */}
              <div className="absolute top-2 right-2 flex gap-1">
                {platforms.map((platform: string, idx: number) => {
                  const PlatformIcon = platformIcons[platform as keyof typeof platformIcons] || IconShare2
                  return (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                    >
                      <PlatformIcon className="h-4 w-4 text-gray-800" />
                    </div>
                  )
                })}
              </div>
              
              {/* Content type badge */}
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-white/90 backdrop-blur-sm text-gray-800">
                  <ContentTypeIcon className="h-3 w-3 mr-1" />
                  {contentType}
                </Badge>
              </div>

              {/* Duration badge for videos */}
              {post.metadata?.duration && (
                <div className="absolute bottom-2 right-2">
                  <Badge className="bg-black/70 text-white">
                    {Math.floor(post.metadata.duration / 60)}:{(post.metadata.duration % 60).toString().padStart(2, '0')}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className={cn("h-32 bg-gradient-to-br", bgGradient)}>
              <div className="h-full flex items-center justify-center relative p-4">
                <ContentTypeIcon className="h-12 w-12 text-white/20 absolute" />
                <div className="flex gap-2 z-10">
                  {platforms.map((platform: string, idx: number) => {
                    const PlatformIcon = platformIcons[platform as keyof typeof platformIcons] || IconShare2
                    return (
                      <div
                        key={idx}
                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"
                      >
                        <PlatformIcon className="h-5 w-5 text-gray-800" />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Content Section */}
          <CardContent className="p-4">
            {/* Project Name */}
            {post.projectName && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  {post.projectName}
                </span>
              </div>
            )}

            {/* Title if available */}
            {post.metadata?.title && (
              <h3 className="font-semibold text-sm mb-2 line-clamp-1">
                {post.metadata.title}
              </h3>
            )}

            {/* Caption Preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {contentPreview}
            </p>

            {/* Meta Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <IconCalendar className="h-3 w-3" />
                  {format(new Date(post.publish_date), "MMM d")}
                </span>
                <span className="flex items-center gap-1">
                  <IconClock className="h-3 w-3" />
                  {format(new Date(post.publish_date), "h:mm a")}
                </span>
              </div>

              <Badge 
                variant={
                  post.state === 'published' ? 'default' : 
                  post.state === 'failed' ? 'destructive' : 
                  'outline'
                }
                className="text-xs"
              >
                {post.state}
              </Badge>
            </div>

            {/* Engagement Score */}
            {post.metadata?.engagementPrediction && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">AI Predicted Reach</span>
                  <div className="flex items-center gap-1">
                    <IconSparkles className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-bold text-yellow-500">
                      {post.metadata.engagementPrediction.score}%
                    </span>
                  </div>
                </div>
                {/* AI Prediction Progress Bar */}
                <Progress value={post.metadata.engagementPrediction.score} className="h-1 mt-1" />
              </div>
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {post.hashtags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    #{tag.replace('#', '')}
                  </Badge>
                ))}
                {post.hashtags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{post.hashtags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>

          {/* Actions Menu - Hidden by default, shown on hover */}
          <div className="px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEdit(post) }}>
                <IconEdit className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDuplicate(post) }}>
                <IconCopy className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(post) }}>
                <IconTrash className="h-3 w-3" />
              </Button>
              {post.state === 'scheduled' && (
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handlePublishNow(post) }}>
                  <IconSend className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Beautiful Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Content Calendar
              </h1>
              <p className="text-muted-foreground mt-2">
                Visualize and manage your content schedule
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-primary/10 border-primary/20 py-1.5 px-3">
                <IconSparkles className="h-4 w-4 mr-1.5 text-primary" />
                <span className="font-semibold">{scheduledPosts.length} Posts</span>
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshPosts}
                disabled={refreshing}
              >
                <IconRefresh className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
              {process.env.NODE_ENV === 'development' && scheduledPosts.length === 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/populate-demo-calendar', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      })
                      if (res.ok) {
                        toast.success('Demo calendar populated!')
                        await loadScheduledPosts()
                      } else {
                        toast.error('Failed to populate demo calendar')
                      }
                    } catch (error) {
                      toast.error('Error populating calendar')
                    }
                  }}
                  className="border-dashed"
                >
                  <IconSparkles className="h-4 w-4 mr-2" />
                  Load Demo Content
                </Button>
              )}
              <Button onClick={() => router.push('/social/compose')} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                <IconPlus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{filteredPosts.length}</p>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                </div>
                <IconCalendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {filteredPosts.filter(p => p.state === 'published').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
                <IconCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {filteredPosts.filter(p => p.state === 'scheduled').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
                <IconClock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {[...new Set(scheduledPosts.flatMap(p => p.metadata?.platforms || (p as any).platforms || []))].length}
                  </p>
                  <p className="text-sm text-muted-foreground">Platforms</p>
                </div>
                <IconSparkles className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <Card className="shadow-2xl border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="month" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <IconCalendarMonth className="h-4 w-4 mr-2" />
                    Month
                  </TabsTrigger>
                  <TabsTrigger value="week" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <IconCalendarWeek className="h-4 w-4 mr-2" />
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <IconList className="h-4 w-4 mr-2" />
                    List
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex gap-2 ml-auto">
                <Select 
                  value={selectedPlatforms.length === 0 ? 'all' : selectedPlatforms.join(',')} 
                  onValueChange={(value) => setSelectedPlatforms(value === 'all' ? [] : value.split(','))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="x">X (Twitter)</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="threads">Threads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Calendar Views */}
            <AnimatePresence mode="wait">
              {currentView === 'month' && (
                <motion.div
                  key="month"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      {format(selectedDate, 'MMMM yyyy')}
                    </h2>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="bg-card p-3 text-center">
                        <span className="text-xs font-medium text-muted-foreground">{day}</span>
                      </div>
                    ))}
                    
                    {getMonthDays().map((date, index) => {
                      const posts = getPostsForDate(date).filter(post => 
                        selectedPlatforms.length === 0 || 
                        (post.metadata?.platforms || (post as any).platforms || []).some((p: string) => selectedPlatforms.includes(p))
                      )
                      const isCurrentMonth = isSameMonth(date, selectedDate)
                      const isCurrentDay = isToday(date)
                      
                      return (
                        <div 
                          key={index}
                          className={cn(
                            "min-h-[120px] bg-card p-2 border border-border/50 relative overflow-hidden group",
                            !isCurrentMonth && "bg-muted/20",
                            isCurrentDay && "ring-2 ring-primary ring-offset-2"
                          )}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={cn(
                              "text-sm font-medium",
                              !isCurrentMonth && "text-muted-foreground",
                              isCurrentDay && "text-primary"
                            )}>
                              {format(date, 'd')}
                            </span>
                            {posts.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {posts.length}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            {posts.slice(0, 2).map(post => {
                              const platforms = post.metadata?.platforms || (post as any).platforms || []
                              const firstPlatform = platforms[0] || 'instagram'
                              const Icon = platformIcons[firstPlatform as keyof typeof platformIcons]
                              return (
                                <div 
                                  key={post.id} 
                                  className="flex items-center gap-1 p-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                                  onClick={() => showPostDetails(post)}
                                >
                                  <Icon className="h-3 w-3 text-primary" />
                                  <span className="text-xs truncate">
                                    {format(new Date(post.publish_date), "HH:mm")}
                                  </span>
                                </div>
                              )
                            })}
                            {posts.length > 2 && (
                              <span className="text-xs text-muted-foreground pl-1">
                                +{posts.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {currentView === 'week' && (
                <motion.div
                  key="week"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      Week of {format(startOfWeek(selectedDate), 'MMM d, yyyy')}
                    </h2>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-4">
                    {getWeekDays().map((date, index) => {
                      const posts = getPostsForDate(date).filter(post => 
                        selectedPlatforms.length === 0 || 
                        (post.metadata?.platforms || (post as any).platforms || []).some((p: string) => selectedPlatforms.includes(p))
                      )
                      const isCurrentDay = isToday(date)
                      
                      return (
                        <div 
                          key={index}
                          className={cn(
                            "space-y-2",
                            isCurrentDay && "ring-2 ring-primary ring-offset-2 rounded-lg p-2"
                          )}
                        >
                          <div className="text-center mb-2">
                            <p className="text-xs text-muted-foreground">{format(date, 'EEE')}</p>
                            <p className={cn(
                              "text-lg font-semibold",
                              isCurrentDay && "text-primary"
                            )}>
                              {format(date, 'd')}
                            </p>
                          </div>
                          
                          <ScrollArea className="h-[400px]">
                            <div className="space-y-2">
                              {posts.length > 0 ? posts.map(post => (
                                <PostCard key={post.id} post={post} />
                              )) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                  No posts
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {currentView === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="space-y-4">
                    {filteredPosts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPosts.map(post => (
                          <PostCard key={post.id} post={post} showDate />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={<IconCalendar />}
                        title="No scheduled posts"
                        description="Start creating content to see it appear here"
                        action={{
                          label: "Create Post",
                          onClick: () => router.push('/social/compose')
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Enhanced Post Detail Dialog */}
        {selectedPost && (
          <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-bold">
                    {selectedPost.metadata?.title || "Post Details"}
                  </DialogTitle>
                  <Badge 
                    variant={
                      selectedPost.state === 'published' ? 'default' : 
                      selectedPost.state === 'scheduled' ? 'secondary' :
                      'outline'
                    }
                  >
                    {selectedPost.state}
                  </Badge>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Media Preview */}
                {(selectedPost.thumbnail || selectedPost.media_urls?.[0]) && (
                  <div className="relative rounded-lg overflow-hidden">
                    <img 
                      src={selectedPost.thumbnail || selectedPost.media_urls?.[0] || ''} 
                      alt="" 
                      className="w-full h-64 object-cover"
                    />
                    {selectedPost.metadata?.duration && (
                      <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                        <IconClock className="h-3 w-3 mr-1" />
                        {Math.floor(selectedPost.metadata.duration / 60)}:{(selectedPost.metadata.duration % 60).toString().padStart(2, '0')}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Platform & Schedule Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Platforms</Label>
                    <div className="flex gap-2">
                      {(selectedPost.metadata?.platforms || []).map((platform: string) => {
                        const Icon = platformIcons[platform as keyof typeof platformIcons]
                        const name = platformNames[platform as keyof typeof platformNames] || platform
                        return (
                          <div key={platform} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-lg">
                            {Icon && <Icon className="h-4 w-4" />}
                            <span className="text-sm">{name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Schedule</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <IconCalendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(selectedPost.publish_date), 'PPP')}
                      <span className="text-muted-foreground">at</span>
                      {format(new Date(selectedPost.publish_date), 'p')}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Content</Label>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedPost.content || 'No caption'}</p>
                  </div>
                </div>

                {/* Hashtags */}
                {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Hashtags</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedPost.hashtags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">
                          <IconHash className="h-3 w-3 mr-1" />
                          {tag.replace('#', '')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Analytics */}
                {selectedPost.metadata?.engagementPrediction && (
                  <div className="space-y-4 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <IconBrain className="h-4 w-4 text-purple-500" />
                        AI Performance Prediction
                      </Label>
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        {selectedPost.metadata.engagementPrediction.score}% Score
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Predicted Reach</span>
                        <span className="font-semibold">
                          {Math.round(selectedPost.metadata.engagementPrediction.score * 100)} - {Math.round(selectedPost.metadata.engagementPrediction.score * 150)} views
                        </span>
                      </div>
                      
                      <Progress value={selectedPost.metadata.engagementPrediction.score} className="h-2" />
                      
                      {selectedPost.metadata.engagementPrediction.factors && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-2">Key Success Factors:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedPost.metadata.engagementPrediction.factors.map((factor, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                <IconSparkles className="h-3 w-3 mr-1" />
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Optimization Suggestions */}
                {selectedPost.metadata?.optimizationReason && (
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <IconRocket className="h-4 w-4 text-blue-500" />
                      <Label className="text-sm font-semibold">AI Optimization Applied</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedPost.metadata.optimizationReason}
                    </p>
                  </div>
                )}

                {/* Project Info */}
                {selectedPost.projectName && (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Associated Project</p>
                      <p className="font-semibold">{selectedPost.projectName}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${selectedPost.project_id}`)}>
                      <IconExternalLink className="h-3 w-3 mr-1" />
                      View Project
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => handleEdit(selectedPost)}>
                  <IconEdit className="h-4 w-4 mr-2" />
                  Edit Post
                </Button>
                <Button variant="outline" onClick={() => handleDuplicate(selectedPost)}>
                  <IconCopy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                {selectedPost.state === 'scheduled' && (
                  <Button onClick={() => handlePublishNow(selectedPost)}>
                    <IconSend className="h-4 w-4 mr-2" />
                    Publish Now
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}