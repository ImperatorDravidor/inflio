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
  IconSparkles
} from "@tabler/icons-react"
import { ScheduledContent } from "@/lib/staging/staging-service"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Platform } from "@/lib/social/types"
import { Label } from "@/components/ui/label"

interface StagingReviewProps {
  scheduledPosts: ScheduledContent[]
  onPublish: () => void
  onBack: () => void
  publishing: boolean
}

const platformIcons = {
  instagram: IconBrandInstagram,
  linkedin: IconBrandLinkedin,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  x: IconBrandX,
  facebook: IconBrandFacebook,
  threads: IconBrandInstagram
}

const contentTypeIcons = {
  clip: IconVideo,
  blog: IconArticle,
  image: IconPhoto,
  carousel: IconPhoto
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

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold">{totalPosts}</p>
              <p className="text-sm text-muted-foreground">Posts Selected</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold">{platforms.size}</p>
              <p className="text-sm text-muted-foreground">Platforms</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold">{Object.keys(postsByDate).length}</p>
              <p className="text-sm text-muted-foreground">Days</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {Object.entries(contentTypes).map(([type, count]) => {
                  const Icon = contentTypeIcons[type as keyof typeof contentTypeIcons]
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

      {/* Posts Review */}
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
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Timeline View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-6">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {Object.entries(postsByDate).map(([date, posts]) => (
                    <div key={date} className="space-y-3">
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
            </TabsContent>

            <TabsContent value="list" className="mt-6">
              <ScrollArea className="h-[400px] pr-4">
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} disabled={publishing}>
          Back to Schedule
        </Button>
        
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {totalPosts === 0 
              ? 'No posts selected' 
              : `${totalPosts} post${totalPosts === 1 ? '' : 's'} will be scheduled`
            }
          </p>
          <Button
            onClick={onPublish}
            disabled={totalPosts === 0 || publishing}
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
  const ContentIcon = contentTypeIcons[post.stagedContent.type]
  
  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border transition-all",
      selected ? "border-primary bg-primary/5" : "border-border"
    )}>
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
              <p className="text-sm text-muted-foreground">
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
            <IconClock className="h-3 w-3" />
            {format(post.scheduledDate, showFullDate ? 'MMM d, h:mm a' : 'h:mm a')}
          </div>
          
          <div className="flex items-center gap-1">
            {post.platforms.map((platform) => {
              const Icon = platformIcons[platform]
              return <Icon key={platform} className="h-3 w-3" />
            })}
          </div>
          
          {post.engagementPrediction && (
            <Badge 
              variant={post.engagementPrediction.score >= 80 ? "default" : "secondary"}
              className="text-xs"
            >
              {post.engagementPrediction.score}% engagement
            </Badge>
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
    </div>
  )
} 