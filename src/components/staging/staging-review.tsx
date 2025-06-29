"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  IconCalendar,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandX,
  IconBrandFacebook,
  IconPhoto,
  IconVideo,
  IconArticle,
  IconHash,
  IconEye,
  IconSend,
  IconSparkles,
  IconShare2,
  IconCalendarWeek,
  IconCalendarMonth,
  IconChartBar,
  IconList
} from "@tabler/icons-react"
import { ScheduledContent } from "@/lib/staging/staging-service"
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks } from "date-fns"
import { cn } from "@/lib/utils"
import { Platform } from "@/lib/social/types"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"

interface StagingReviewProps {
  scheduledPosts: ScheduledContent[]
  onPublish: () => void
  onBack: () => void
  publishing: boolean
}

const platformIcons: Record<string, any> = {
  instagram: IconBrandInstagram,
  linkedin: IconBrandLinkedin,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  'youtube-short': IconBrandYoutube,
  x: IconBrandX,
  facebook: IconBrandFacebook,
  threads: IconBrandInstagram
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

const contentTypeIcons: Record<string, any> = {
  clip: IconVideo,
  blog: IconArticle,
  image: IconPhoto,
  carousel: IconPhoto,
  social: IconShare2,
  longform: IconVideo
}

export function StagingReview({ 
  scheduledPosts, 
  onPublish, 
  onBack, 
  publishing 
}: StagingReviewProps) {
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(
    new Set(scheduledPosts.map((_, index) => index))
  )
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [calendarView, setCalendarView] = useState<'week' | 'list'>('week')

  const togglePostSelection = (index: number) => {
    const newSelection = new Set(selectedPosts)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedPosts(newSelection)
  }

  const toggleAllPosts = () => {
    if (selectedPosts.size === scheduledPosts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(scheduledPosts.map((_, index) => index)))
    }
  }

  // Calendar helpers
  const getWeekDays = () => {
    const firstPostDate = scheduledPosts.length > 0 
      ? new Date(scheduledPosts[0].scheduledDate) 
      : new Date()
    const start = startOfWeek(firstPostDate, { weekStartsOn: 0 })
    const end = endOfWeek(addWeeks(firstPostDate, 1), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }

  const getPostsForDate = (date: Date) => {
    return scheduledPosts
      .map((post, index) => ({ post, index }))
      .filter(({ index }) => selectedPosts.has(index))
      .filter(({ post }) => isSameDay(new Date(post.scheduledDate), date))
  }

  // Group posts by date
  const postsByDate = scheduledPosts.reduce((acc, post, index) => {
    const dateKey = format(post.scheduledDate, 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push({ post, index })
    return acc
  }, {} as Record<string, Array<{ post: ScheduledContent; index: number }>>)

  // Calculate stats
  const totalPosts = selectedPosts.size
  const platforms = new Set(
    scheduledPosts
      .filter((_, index) => selectedPosts.has(index))
      .flatMap(post => post.platforms)
  )
  const contentTypes = scheduledPosts
    .filter((_, index) => selectedPosts.has(index))
    .reduce((acc, post) => {
      acc[post.stagedContent.type] = (acc[post.stagedContent.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  // Average engagement score
  const avgEngagement = scheduledPosts
    .filter((_, index) => selectedPosts.has(index))
    .reduce((sum, post) => sum + (post.engagementPrediction?.score || 0), 0) / (totalPosts || 1)

  return (
    <div className="space-y-6">
      {/* Summary Stats with Calendar Preview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-1">
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-primary">{totalPosts}</p>
              <p className="text-sm text-muted-foreground">Posts Selected</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1">
                {Array.from(platforms).slice(0, 3).map((platform) => {
                  const Icon = platformIcons[platform as string] || IconShare2
                  return <Icon key={platform} className="h-5 w-5" />
                })}
                {platforms.size > 3 && (
                  <span className="text-sm text-muted-foreground">+{platforms.size - 3}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{platforms.size} Platforms</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-green-500">{Math.round(avgEngagement)}%</p>
              <p className="text-sm text-muted-foreground">Avg. Reach</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold">{Object.keys(postsByDate).length}</p>
              <p className="text-sm text-muted-foreground">Days</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {Object.entries(contentTypes).slice(0, 3).map(([type, count]) => {
                  const Icon = contentTypeIcons[type as keyof typeof contentTypeIcons] || IconShare2
                  return (
                    <div key={type} className="flex items-center gap-1">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-sm text-muted-foreground">Content Mix</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Notice */}
      <Alert>
        <IconAlertCircle className="h-4 w-4" />
        <AlertTitle>Before You Publish</AlertTitle>
        <AlertDescription>
          Please review your scheduled posts carefully. Once published to your social media calendar, 
          posts will be automatically shared at their scheduled times. You can still edit or cancel 
          them from your social media dashboard.
        </AlertDescription>
      </Alert>

      {/* Calendar Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Schedule Overview</CardTitle>
              <CardDescription>
                Visual preview of your publishing schedule
              </CardDescription>
            </div>
            <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as 'week' | 'list')}>
              <TabsList>
                <TabsTrigger value="week" className="flex items-center gap-2">
                  <IconCalendarWeek className="h-4 w-4" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <IconList className="h-4 w-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {calendarView === 'week' ? (
            <div className="space-y-4">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium py-2">
                    {day}
                  </div>
                ))}
                
                {getWeekDays().map(date => {
                  const posts = getPostsForDate(date)
                  const isToday = isSameDay(date, new Date())
                  
                  return (
                    <motion.div
                      key={date.toISOString()}
                      className={cn(
                        "min-h-[100px] p-2 rounded-lg border bg-card transition-all",
                        isToday && "border-primary bg-primary/5",
                        posts.length > 0 && "bg-accent/5"
                      )}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-sm font-medium",
                          isToday && "text-primary"
                        )}>
                          {format(date, 'd')}
                        </span>
                        {posts.length > 0 && (
                          <Badge variant="secondary" className="text-xs h-5 px-1">
                            {posts.length}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {posts.slice(0, 2).map(({ post, index }) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1 p-1 rounded bg-muted/50 text-xs"
                          >
                            <div className="flex -space-x-1">
                              {post.platforms.slice(0, 2).map((platform, pidx) => {
                                const Icon = platformIcons[platform] || IconShare2
                                return (
                                  <div
                                    key={pidx}
                                    className={cn(
                                      "w-4 h-4 rounded-full flex items-center justify-center bg-gradient-to-br text-white",
                                      platformColors[platform] || 'from-gray-500 to-gray-600'
                                    )}
                                    style={{ zIndex: 2 - pidx }}
                                  >
                                    <Icon className="h-2.5 w-2.5" />
                                  </div>
                                )
                              })}
                            </div>
                            <span className="truncate flex-1">
                              {format(post.scheduledDate, 'HH:mm')}
                            </span>
                            {post.engagementPrediction && post.engagementPrediction.score >= 85 && (
                              <IconSparkles className="h-3 w-3 text-yellow-500" />
                            )}
                          </motion.div>
                        ))}
                        {posts.length > 2 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{posts.length - 2}
                          </div>
                        )}
                      </div>
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
                <div className="flex items-center gap-2">
                  <IconSparkles className="h-4 w-4 text-yellow-500" />
                  <span>High Engagement</span>
                </div>
              </div>
            </div>
          ) : (
            // List View
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {Object.entries(postsByDate).map(([date, posts]) => (
                  <div key={date} className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground sticky top-0 bg-background py-2">
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </h3>
                    {posts.map(({ post, index }) => (
                      <PostReviewCard
                        key={index}
                        post={post}
                        index={index}
                        selected={selectedPosts.has(index)}
                        onToggle={() => togglePostSelection(index)}
                        onPreview={() => setPreviewIndex(index)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detailed Posts Review */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Final Review</CardTitle>
              <CardDescription>
                Select the posts you want to schedule
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedPosts.size === scheduledPosts.length}
                onCheckedChange={toggleAllPosts}
              />
              <Label className="text-sm font-medium">Select All</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {scheduledPosts.map((post, index) => (
                <PostReviewCard
                  key={index}
                  post={post}
                  index={index}
                  selected={selectedPosts.has(index)}
                  onToggle={() => togglePostSelection(index)}
                  onPreview={() => setPreviewIndex(index)}
                  showFullDate
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} disabled={publishing}>
          Back to Schedule
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {totalPosts === 0 
                ? 'No posts selected' 
                : `${totalPosts} post${totalPosts === 1 ? '' : 's'} will be scheduled`
              }
            </p>
            {totalPosts > 0 && (
              <p className="text-xs text-muted-foreground">
                across {platforms.size} platform{platforms.size === 1 ? '' : 's'}
              </p>
            )}
          </div>
          <Button
            onClick={onPublish}
            disabled={totalPosts === 0 || publishing}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {publishing ? (
              <>
                <IconSparkles className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <IconSend className="h-4 w-4 mr-2" />
                Publish to Calendar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface PostReviewCardProps {
  post: ScheduledContent
  index: number
  selected: boolean
  onToggle: () => void
  onPreview: () => void
  showFullDate?: boolean
}

function PostReviewCard({ 
  post, 
  index, 
  selected, 
  onToggle, 
  onPreview, 
  showFullDate = false 
}: PostReviewCardProps) {
  const ContentIcon = contentTypeIcons[post.stagedContent.type] || IconShare2
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-all hover:shadow-sm",
        selected ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        className="mt-1"
      />
      
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <ContentIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium">{post.stagedContent.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {post.stagedContent.description}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreview}
          >
            <IconEye className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <IconClock className="h-3.5 w-3.5" />
            {format(post.scheduledDate, showFullDate ? 'MMM d, h:mm a' : 'h:mm a')}
          </div>
          
          <div className="flex items-center gap-1">
            {post.platforms.map((platform) => {
              const Icon = platformIcons[platform] || IconShare2
              return (
                <div
                  key={platform}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br text-white",
                    platformColors[platform] || 'from-gray-500 to-gray-600'
                  )}
                  title={platform}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
              )
            })}
          </div>
          
          {post.engagementPrediction && (
            <div className="flex items-center gap-1">
              <IconChartBar className="h-3.5 w-3.5" />
              <span className={cn(
                "font-medium",
                post.engagementPrediction.score >= 85 ? "text-green-500" :
                post.engagementPrediction.score >= 75 ? "text-blue-500" :
                "text-yellow-500"
              )}>
                {post.engagementPrediction.score}%
              </span>
            </div>
          )}
        </div>
        
        {post.suggestedHashtags && post.suggestedHashtags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <IconHash className="h-3 w-3 text-muted-foreground" />
            {post.suggestedHashtags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground">
                #{tag}
              </span>
            ))}
            {post.suggestedHashtags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{post.suggestedHashtags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
} 