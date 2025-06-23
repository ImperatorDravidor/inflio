"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  IconSparkles,
  IconCalendar,
  IconSend,
  IconPhoto,
  IconHash,
  IconWand,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandThreads,
  IconBrandFacebook
} from "@tabler/icons-react"
import { Platform } from "@/lib/social/types"
import { toast } from "sonner"
import { useAuth } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SocialMediaComposerProps {
  projectId?: string
  initialContent?: string
  initialMedia?: string
  onSuccess: (posts: any[]) => void
  onCancel: () => void
}

export function SocialMediaComposer({
  projectId,
  initialContent = "",
  initialMedia,
  onSuccess,
  onCancel
}: SocialMediaComposerProps) {
  const { userId } = useAuth()
  const [content, setContent] = useState(initialContent)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])
  const [hashtags, setHashtags] = useState<string[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>(initialMedia ? [initialMedia] : [])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null)

  const handleGenerateContent = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content first")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatforms[0] || 'x',
          content: content,
          tone: 'professional'
        })
      })

      if (!response.ok) throw new Error('Failed to generate content')

      const data = await response.json()
      setContent(data.caption)
      if (data.hashtags) {
        setHashtags(data.hashtags)
      }
      toast.success("Content enhanced with AI!")
    } catch (error) {
      toast.error("Failed to generate content")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error("Please enter content before publishing")
      return
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform")
      return
    }

    setIsPublishing(true)
    try {
      const response = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content + (hashtags.length > 0 ? '\n\n' + hashtags.map(h => `#${h}`).join(' ') : ''),
          platforms: selectedPlatforms,
          media_urls: mediaUrls,
          scheduled_date: scheduleDate?.toISOString(),
          project_id: projectId,
          metadata: {
            source: 'composer',
            ai_enhanced: isGenerating
          }
        })
      })

      if (!response.ok) throw new Error('Failed to publish')

      const data = await response.json()
      toast.success("Posts created successfully!")
      onSuccess(data.posts || [])
    } catch (error) {
      toast.error("Failed to create posts")
    } finally {
      setIsPublishing(false)
    }
  }

  const characterCount = content.length
  const maxCharacters = selectedPlatforms.includes('x') ? 280 : 
                       selectedPlatforms.includes('linkedin') ? 3000 : 2200

  return (
    <div className="space-y-6">
      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Create Your Post</CardTitle>
          <CardDescription>
            Craft your message and we'll optimize it for each platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Content */}
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share your thoughts, updates, or insights..."
              className="min-h-[150px] resize-none"
              maxLength={maxCharacters}
            />
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                "text-muted-foreground",
                characterCount > maxCharacters * 0.9 && "text-orange-500",
                characterCount >= maxCharacters && "text-red-500"
              )}>
                {characterCount} / {maxCharacters} characters
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateContent}
                disabled={isGenerating || !content.trim()}
              >
                <IconWand className="h-4 w-4 mr-2" />
                {isGenerating ? "Enhancing..." : "Enhance with AI"}
              </Button>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label>Hashtags</Label>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer">
                  #{tag}
                  <button
                    onClick={() => setHashtags(hashtags.filter((_, i) => i !== index))}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const tag = prompt("Enter hashtag:")
                  if (tag) setHashtags([...hashtags, tag.replace('#', '')])
                }}
              >
                <IconHash className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Media */}
          {mediaUrls.length > 0 && (
            <div className="space-y-2">
              <Label>Attached Media</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <IconPhoto className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{mediaUrls.length} media file(s) attached</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Platforms</CardTitle>
          <CardDescription>
            Choose where to publish your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'x' as Platform, name: 'X', icon: IconBrandTwitter },
              { id: 'instagram' as Platform, name: 'Instagram', icon: IconBrandInstagram },
              { id: 'linkedin' as Platform, name: 'LinkedIn', icon: IconBrandLinkedin },
              { id: 'tiktok' as Platform, name: 'TikTok', icon: IconBrandTiktok },
              { id: 'youtube' as Platform, name: 'YouTube', icon: IconBrandYoutube },
              { id: 'threads' as Platform, name: 'Threads', icon: IconBrandThreads },
              { id: 'facebook' as Platform, name: 'Facebook', icon: IconBrandFacebook }
            ].map((platform) => {
              const Icon = platform.icon
              const isSelected = selectedPlatforms.includes(platform.id)
              
              return (
                <motion.button
                  key={platform.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id))
                    } else {
                      setSelectedPlatforms([...selectedPlatforms, platform.id])
                    }
                  }}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                    isSelected 
                      ? "border-primary bg-primary/10" 
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isSelected && "text-primary")} />
                  <span className="text-sm font-medium">{platform.name}</span>
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Scheduling Options */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant={!scheduleDate ? "default" : "outline"}
              onClick={() => setScheduleDate(null)}
            >
              <IconSend className="h-4 w-4 mr-2" />
              Publish Now
            </Button>
            <Button
              variant={scheduleDate ? "default" : "outline"}
              onClick={() => setScheduleDate(new Date(Date.now() + 24 * 60 * 60 * 1000))}
            >
              <IconCalendar className="h-4 w-4 mr-2" />
              Schedule for Later
            </Button>
          </div>
          {scheduleDate && (
            <p className="text-sm text-muted-foreground mt-2">
              Scheduled for: {scheduleDate.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handlePublish}
          disabled={!content.trim() || selectedPlatforms.length === 0 || isPublishing}
        >
          <IconSparkles className="h-4 w-4 mr-2" />
          {isPublishing ? "Creating..." : "Create Posts"}
        </Button>
      </div>
    </div>
  )
} 