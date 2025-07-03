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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
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
  IconShare2
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
  facebook: IconBrandFacebook
}

const platformColors = {
  twitter: 'bg-black',
  x: 'bg-black',
  linkedin: 'bg-blue-700',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  tiktok: 'bg-black',
  youtube: 'bg-red-600',
  facebook: 'bg-blue-600'
}

const platformNames = {
  twitter: 'X (Twitter)',
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook'
}

interface PostMetadata {
  type?: 'video' | 'blog' | 'image'
  thumbnail?: string
  duration?: number
  platforms?: string[]
  [key: string]: any
}

interface ScheduledPost extends Omit<SocialPost, 'metadata'> {
  projectName?: string
  type?: 'video' | 'blog' | 'image'
  thumbnail?: string
  duration?: number
  metadata?: PostMetadata
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
      
      // Fetch scheduled posts
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
      const transformedPosts: ScheduledPost[] = posts?.map(post => ({
        ...post,
        publish_date: new Date(post.publish_date),
        created_at: new Date(post.created_at),
        updated_at: new Date(post.updated_at),
        projectName: post.project?.title,
        type: post.metadata?.type || 'video',
        thumbnail: post.metadata?.thumbnail,
        duration: post.metadata?.duration,
        platforms: post.metadata?.platforms || []
      })) || []

      setScheduledPosts(transformedPosts)
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
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)
    const days = eachDayOfInterval({ start, end })
    
    // Add days from previous month to fill the first week
    const firstDayOfWeek = startOfWeek(start, { weekStartsOn: 0 })
    const daysFromPrevMonth = eachDayOfInterval({ start: firstDayOfWeek, end: start }).slice(0, -1)
    
    // Add days from next month to fill the last week
    const lastDayOfWeek = endOfWeek(end, { weekStartsOn: 0 })
    const daysFromNextMonth = eachDayOfInterval({ start: end, end: lastDayOfWeek }).slice(1)
    
    return [...daysFromPrevMonth, ...days, ...daysFromNextMonth]
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'next' ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1))
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'next' ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1))
  }

  const filteredPosts = selectedPlatforms.length > 0
    ? scheduledPosts.filter(post => {
        const platforms = post.metadata?.platforms || []
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

  const handlePublishNow = (post: ScheduledPost) => {
    setSelectedPost(post)
    setPublishDialogOpen(true)
  }

  const handleDuplicate = async (post: ScheduledPost) => {
    if (!user?.id) return
    
    try {
      const supabase = createSupabaseBrowserClient()
      const newPost = {
        ...post,
        id: undefined,
        state: 'draft' as const,
        publish_date: addHours(new Date(post.publish_date), 1).toISOString(),
        created_at: undefined,
        updated_at: undefined
      }
      
      const { error } = await supabase
        .from('social_posts')
        .insert(newPost)
      
      if (error) throw error
      
      toast.success('Post duplicated successfully')
      await loadScheduledPosts()
    } catch (error) {
      console.error('Error duplicating post:', error)
      toast.error('Failed to duplicate post')
    }
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

  const confirmPublishNow = async () => {
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
      
      // TODO: Trigger actual publishing workflow
    } catch (error) {
      console.error('Error publishing post:', error)
      toast.error('Failed to publish post')
    }
  }

  const saveEditedPost = async (updatedContent: string) => {
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

  // Components
  const PostCard = ({ post, showDate = false, isDraggable = false }: { post: ScheduledPost; showDate?: boolean; isDraggable?: boolean }) => {
    const platforms = post.metadata?.platforms || []
    const firstPlatform = platforms[0] || 'instagram'
    const Icon = platformIcons[firstPlatform as keyof typeof platformIcons]
    const bgColor = platformColors[firstPlatform as keyof typeof platformColors]
    
    // Get content type icon
    const contentType: string = post.metadata?.type || post.type || 'video'
    let ContentTypeIcon = IconShare2
    
    if (contentType === 'video' || contentType === 'clip' || contentType === 'longform') {
      ContentTypeIcon = IconVideo
    } else if (contentType === 'blog' || contentType === 'article') {
      ContentTypeIcon = IconArticle
    } else if (contentType === 'image' || contentType === 'carousel') {
      ContentTypeIcon = IconPhoto
    }
    
    const content = (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all cursor-pointer group">
        {isDraggable && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
            <IconGripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        
        {/* Platform Icons */}
        <div className="flex -space-x-2">
          {platforms.slice(0, 3).map((platform: string, idx: number) => {
            const PlatformIcon = platformIcons[platform as keyof typeof platformIcons] || IconShare2
            const platformBg = platformColors[platform as keyof typeof platformColors] || 'bg-gray-500'
            
            return (
              <div
                key={idx}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm",
                  platformBg
                )}
                style={{ zIndex: 3 - idx }}
              >
                <PlatformIcon className="h-4 w-4" />
              </div>
            )
          })}
          {platforms.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shadow-sm">
              +{platforms.length - 3}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {post.metadata?.title || post.content}
            </span>
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <ContentTypeIcon className="h-3 w-3" />
              {contentType}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            {showDate && (
              <span className="flex items-center gap-1">
                <IconCalendar className="h-3 w-3" />
                {format(new Date(post.publish_date), "MMM d")}
              </span>
            )}
            <span className="flex items-center gap-1">
              <IconClock className="h-3 w-3" />
              {format(new Date(post.publish_date), "h:mm a")}
            </span>
            {post.projectName && (
              <span className="truncate max-w-[100px] flex items-center gap-1">
                <IconPlayerPlay className="h-3 w-3" />
                {post.projectName}
              </span>
            )}
            {post.metadata?.engagementPrediction && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <IconSparkles className="h-3 w-3" />
                {post.metadata.engagementPrediction.score}%
              </span>
            )}
          </div>
        </div>
        
        <Badge 
          variant={
            post.state === 'published' ? 'default' : 
            post.state === 'failed' ? 'destructive' : 
            post.state === 'publishing' ? 'secondary' :
            'outline'
          }
          className="text-xs"
        >
          {post.state}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleEdit(post)}>
              <IconEdit className="h-4 w-4 mr-2" />
              Edit Caption
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedPost(post)} onSelect={() => setEditDialogOpen(true)}>
              <IconEye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicate(post)}>
              <IconCopy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            {post.state === 'scheduled' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handlePublishNow(post)}>
                  <IconSend className="h-4 w-4 mr-2" />
                  Publish Now
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => handleDelete(post)}
            >
              <IconTrash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )

    if (isDraggable) {
      return (
        <Reorder.Item
          value={post}
          id={post.id}
          dragListener={false}
          dragControls={dragControls}
        >
          {content}
        </Reorder.Item>
      )
    }

    return content
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Social Media Calendar</h1>
            <Button
              variant="outline"
              size="icon"
              onClick={refreshPosts}
              disabled={refreshing}
            >
              <IconRefresh className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage and track all your scheduled social media posts across platforms
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as typeof currentView)} className="w-full sm:w-auto">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="week" className="flex items-center gap-2">
                <IconCalendarWeek className="h-4 w-4" />
                <span className="hidden sm:inline">Week</span>
              </TabsTrigger>
              <TabsTrigger value="month" className="flex items-center gap-2">
                <IconCalendarMonth className="h-4 w-4" />
                <span className="hidden sm:inline">Month</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <IconList className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 ml-auto">
            <Select 
              value={selectedPlatforms.length === 0 ? 'all' : selectedPlatforms.join(',')} 
              onValueChange={(value) => setSelectedPlatforms(value === 'all' ? [] : value.split(','))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="twitter">X (Twitter)</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => router.push('/social/compose')}>
              <IconPlus className="h-4 w-4 mr-2" />
              Schedule Post
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Week View */}
          {currentView === 'week' && (
            <motion.div
              key="week"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between">
                    <CardTitle>Week of {format(startOfWeek(selectedDate), 'MMM d, yyyy')}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigateWeek('prev')}
                      >
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDate(new Date())}
                      >
                        Today
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigateWeek('next')}
                      >
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-7 border-b">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-3 text-center text-sm font-medium border-r last:border-r-0 bg-muted/30">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 min-h-[500px]">
                    {getWeekDays().map((date, index) => {
                      const posts = getPostsForDate(date).filter(post => 
                        selectedPlatforms.length === 0 || 
                        (post.metadata?.platforms || []).some((p: string) => selectedPlatforms.includes(p))
                      )
                      
                      return (
                        <div 
                          key={index}
                          className={cn(
                            "border-r last:border-r-0 p-2 overflow-hidden",
                            isToday(date) && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                              "text-sm font-medium",
                              isToday(date) && "text-primary font-bold"
                            )}>
                              {format(date, 'd')}
                            </span>
                            {posts.length > 0 && (
                              <Badge variant="secondary" className="text-xs h-5">
                                {posts.length}
                              </Badge>
                            )}
                          </div>
                          <ScrollArea className="h-[400px]">
                            <div className="space-y-2">
                              {posts.map(post => (
                                <PostCard key={post.id} post={post} />
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Month View */}
          {currentView === 'month' && (
            <motion.div
              key="month"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between">
                    <CardTitle>{format(selectedDate, 'MMMM yyyy')}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigateMonth('prev')}
                      >
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDate(new Date())}
                      >
                        Today
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigateMonth('next')}
                      >
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-7 border-b">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-medium border-r last:border-r-0 bg-muted/30">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {getMonthDays().map((date, index) => {
                      const posts = getPostsForDate(date).filter(post => 
                        selectedPlatforms.length === 0 || 
                        (post.metadata?.platforms || []).some((p: string) => selectedPlatforms.includes(p))
                      )
                      const isCurrentMonth = isSameMonth(date, selectedDate)
                      
                      return (
                        <div 
                          key={index}
                          className={cn(
                            "min-h-[120px] border-r border-b last:border-r-0 p-2",
                            !isCurrentMonth && "bg-muted/30",
                            isToday(date) && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className={cn(
                              "text-sm",
                              !isCurrentMonth && "text-muted-foreground",
                              isToday(date) && "font-bold text-primary"
                            )}>
                              {format(date, 'd')}
                            </span>
                            {posts.length > 0 && (
                              <Badge variant="secondary" className="text-xs h-5">
                                {posts.length}
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1">
                            {posts.slice(0, 3).map(post => {
                              const platforms = post.metadata?.platforms || []
                              const firstPlatform = platforms[0] || 'instagram'
                              const Icon = platformIcons[firstPlatform as keyof typeof platformIcons]
                              return (
                                <div key={post.id} className="flex items-center gap-1 cursor-pointer hover:bg-accent/50 rounded px-1">
                                  <Icon className="h-3 w-3" />
                                  <span className="text-xs truncate">{format(new Date(post.publish_date), "h:mm a")}</span>
                                </div>
                              )
                            })}
                            {posts.length > 3 && (
                              <span className="text-xs text-muted-foreground pl-1">
                                +{posts.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* List View */}
          {currentView === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>All Scheduled Posts</CardTitle>
                  <CardDescription>
                    {filteredPosts.length} posts scheduled across all platforms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredPosts.length === 0 ? (
                    <EmptyState
                      icon={<IconCalendar className="h-12 w-12" />}
                      title="No scheduled posts"
                      description="You don't have any posts scheduled yet. Create content in your projects and schedule them to appear here."
                      action={{
                        label: "Schedule Your First Post",
                        onClick: () => router.push('/social/compose')
                      }}
                    />
                  ) : (
                    <ScrollArea className="h-[600px]">
                      <Reorder.Group
                        axis="y"
                        values={filteredPosts}
                        onReorder={setScheduledPosts}
                        className="space-y-3"
                      >
                        {filteredPosts
                          .sort((a, b) => new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime())
                          .map(post => (
                            <PostCard key={post.id} post={post} showDate isDraggable />
                          ))}
                      </Reorder.Group>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <IconCalendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredPosts.filter(p => 
                      new Date(p.publish_date) >= startOfWeek(new Date()) && 
                      new Date(p.publish_date) <= endOfWeek(new Date())
                    ).length}
                  </p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <IconCheck className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredPosts.filter(p => p.state === 'published').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <IconClock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredPosts.filter(p => p.state === 'scheduled').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <IconSparkles className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {[...new Set(scheduledPosts.flatMap(p => p.metadata?.platforms || []))].length}
                  </p>
                  <p className="text-sm text-muted-foreground">Platforms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post Caption</DialogTitle>
            <DialogDescription>
              Update the caption for this social media post
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(selectedPost.metadata?.platforms || []).map((platform: string) => {
                  const Icon = platformIcons[platform as keyof typeof platformIcons]
                  const bgColor = platformColors[platform as keyof typeof platformColors]
                  return (
                    <div key={platform} className={`p-2 rounded-lg ${bgColor} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  )
                })}
              </div>
              <div>
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  defaultValue={selectedPost.content}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              const textarea = document.getElementById('caption') as HTMLTextAreaElement
              if (textarea) saveEditedPost(textarea.value)
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scheduled post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">{selectedPost.content}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Now Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Now</DialogTitle>
            <DialogDescription>
              This will publish the post immediately to all selected platforms. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{selectedPost.content}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(selectedPost.metadata?.platforms || []).map((platform: string) => (
                  <Badge key={platform} variant="secondary">
                    {platformNames[platform as keyof typeof platformNames]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPublishNow}>
              <IconSend className="h-4 w-4 mr-2" />
              Publish Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}