"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { 
  IconInfoCircle, 
  IconAlertCircle, 
  IconCheck,
  IconClock,
  IconTargetArrow,
  IconEye
} from "@tabler/icons-react"
import { Platform } from "@/lib/social/types"
import { StagedContent } from "@/lib/staging/staging-service"
import { countCharacters, getPlatformLimit, getPlatformPreviewLength } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface PlatformFieldsProps {
  platform: Platform
  content: StagedContent
  platformData: any
  onUpdate: (field: string, value: any) => void
}

export function PlatformFields({ platform, content, platformData, onUpdate }: PlatformFieldsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const platformLimit = getPlatformLimit(platform)
  const previewLength = getPlatformPreviewLength(platform)
  
  // Calculate character count with platform-specific rules
  const fullText = (platformData.caption || '') + 
    (platformData.hashtags?.length > 0 ? ' ' + platformData.hashtags.map((tag: string) => `#${tag}`).join(' ') : '')
  const charCount = countCharacters(fullText, platform)
  const isOverLimit = charCount > platformLimit
  const isNearLimit = charCount > platformLimit * 0.9

  // Calculate preview text for platforms that truncate
  const previewText = previewLength && platformData.caption 
    ? platformData.caption.substring(0, previewLength) + (platformData.caption.length > previewLength ? '...' : '')
    : null

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Platform-specific header with tips */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium capitalize">{platform} Optimization</h3>
            <Badge variant={isOverLimit ? "destructive" : isNearLimit ? "outline" : "secondary"}>
              {charCount}/{platformLimit}
            </Badge>
          </div>
          
          {/* Character limit progress */}
          <div className="space-y-2">
            <Progress 
              value={(charCount / platformLimit) * 100} 
              className={cn(
                "h-2",
                isOverLimit && "bg-red-100",
                isNearLimit && "bg-amber-100 dark:bg-amber-900/20"
              )}
            />
            
            {/* Preview length indicator for platforms that truncate */}
            {previewLength && (
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1 mb-1">
                  <IconEye className="h-3 w-3" />
                  <span>Preview (first {previewLength} chars):</span>
                </div>
                <div className="p-2 bg-background rounded border text-sm">
                  {previewText || <span className="text-muted-foreground">No caption preview</span>}
                </div>
              </div>
            )}
          </div>

          {/* Platform-specific warnings */}
          {platform === 'x' && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
              <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                <IconInfoCircle className="h-3 w-3" />
                <span>Emojis and URLs count differently on X/Twitter</span>
              </div>
            </div>
          )}
        </div>

        {/* Caption Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`caption-${platform}`}>Caption</Label>
            {content.type === 'clip' && platform === 'youtube' && (
              <Tooltip>
                <TooltipTrigger>
                  <IconInfoCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>YouTube descriptions support timestamps (e.g., 1:23) and links</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          <Textarea
            id={`caption-${platform}`}
            value={platformData.caption || ''}
            onChange={(e) => onUpdate('caption', e.target.value)}
            placeholder={getPlatformPlaceholder(platform, content.type)}
            className={cn(
              "min-h-[120px]",
              isOverLimit && "border-destructive focus-visible:ring-destructive"
            )}
          />

          {isOverLimit && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <IconAlertCircle className="h-3 w-3" />
              Content exceeds {platformLimit} character limit
            </p>
          )}
        </div>

        {/* Platform-specific required fields */}
        {renderPlatformSpecificFields(platform, content, platformData, onUpdate)}

        {/* Advanced Settings Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="advanced-settings" className="text-sm">Advanced Settings</Label>
          <Switch
            id="advanced-settings"
            checked={showAdvanced}
            onCheckedChange={setShowAdvanced}
          />
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            {renderAdvancedFields(platform, content, platformData, onUpdate)}
          </div>
        )}

        {/* Platform-specific tips */}
        <div className="p-3 rounded-lg bg-muted/30 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {platform.charAt(0).toUpperCase() + platform.slice(1)} Best Practices:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {getPlatformTips(platform, content.type).map((tip, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-primary">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </TooltipProvider>
  )
}

function getPlatformPlaceholder(platform: Platform, contentType: string): string {
  const placeholders: Record<Platform, Record<string, string>> = {
    instagram: {
      video: "🎬 Share what this video is about... Ask a question to engage your audience! 💭",
      image: "✨ What story does this image tell? Share your thoughts...",
      carousel: "📸 Take your followers through this visual journey...",
      blog: "📖 Give your audience a preview of your latest article..."
    },
    linkedin: {
      video: "Excited to share this professional insight with my network...",
      image: "This visual perfectly captures an important industry trend...",
      blog: "Just published a detailed analysis on [topic]. Key takeaways include...",
      carousel: "Breaking down complex concepts into digestible insights..."
    },
    x: {
      video: "🎥 Quick take on [topic] 👇",
      image: "This says it all 👀",
      blog: "New post: [Title] 🧵",
      carousel: "Thread: Key insights 🧵"
    },
    tiktok: {
      video: "Wait for it... 🤯 #fyp #viral",
      image: "POV: You see this image 👀",
      blog: "Storytime: Found this article 📚",
      carousel: "Swipe for the plot twist ➡️"
    },
    facebook: {
      video: "Just shared this video and wanted to get your thoughts...",
      image: "Sometimes a picture really is worth a thousand words.",
      blog: "I just published an article about [topic]. What's your experience with this?",
      carousel: "Check out these insights and let me know what you think!"
    },
    youtube: {
      video: "New video is up! Timestamps and links in description below 👇",
      image: "Visual content to accompany today's discussion 🎨",
      blog: "Blog post with more details linked in description 📝",
      carousel: "Visual breakdown of key concepts 📊"
    },
    threads: {
      video: "New video dropped 🎬 Thoughts?",
      image: "Visual storytelling at its finest 📸",
      blog: "Just wrote about this... Let's discuss 💬",
      carousel: "Visual thread incoming 🧵"
    }
  }

  return placeholders[platform]?.[contentType] || placeholders[platform]?.video || "Share your thoughts..."
}

function renderPlatformSpecificFields(
  platform: Platform, 
  content: StagedContent, 
  platformData: any, 
  onUpdate: (field: string, value: any) => void
) {
  const fields = []

  // Alt text for visual content
  if (content.type === 'image' || content.type === 'carousel') {
    fields.push(
      <div key="alt-text" className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={`alt-${platform}`}>Alt Text (Required)</Label>
          <Tooltip>
            <TooltipTrigger>
              <IconInfoCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Describe the visual content for accessibility and screen readers</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          id={`alt-${platform}`}
          value={platformData.altText || ''}
          onChange={(e) => onUpdate('altText', e.target.value)}
          placeholder="Describe the visual content..."
          className={!platformData.altText ? "border-orange-500" : ""}
        />
      </div>
    )
  }

  // YouTube-specific fields
  if (platform === 'youtube') {
    fields.push(
      <div key="title" className="space-y-2">
        <Label htmlFor={`title-${platform}`}>Video Title (Required)</Label>
        <Input
          id={`title-${platform}`}
          value={platformData.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Engaging video title (max 100 characters)"
          maxLength={100}
          className={!platformData.title ? "border-orange-500" : ""}
        />
        <p className="text-xs text-muted-foreground">
          {(platformData.title || '').length}/100 • First 70 characters show in search
        </p>
      </div>
    )

    if (content.type === 'clip') {
      fields.push(
        <div key="category" className="space-y-2">
          <Label htmlFor={`category-${platform}`}>Category</Label>
          <Select
            value={platformData.category || ''}
            onValueChange={(value) => onUpdate('category', value)}
          >
            <SelectTrigger id={`category-${platform}`}>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Entertainment">Entertainment</SelectItem>
              <SelectItem value="Science & Technology">Science & Technology</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Lifestyle">Lifestyle</SelectItem>
              <SelectItem value="Gaming">Gaming</SelectItem>
              <SelectItem value="Music">Music</SelectItem>
              <SelectItem value="News & Politics">News & Politics</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
  }

  // LinkedIn article link
  if (platform === 'linkedin' && content.type === 'blog') {
    fields.push(
      <div key="link" className="space-y-2">
        <Label htmlFor={`link-${platform}`}>Article Link</Label>
        <Input
          id={`link-${platform}`}
          value={platformData.link || ''}
          onChange={(e) => onUpdate('link', e.target.value)}
          placeholder="https://..."
          type="url"
        />
      </div>
    )
  }

  // Call to action for engagement platforms
  if (['instagram', 'facebook', 'linkedin'].includes(platform)) {
    fields.push(
      <div key="cta" className="space-y-2">
        <Label htmlFor={`cta-${platform}`}>Call to Action</Label>
        <Select
          value={platformData.cta || ''}
          onValueChange={(value) => onUpdate('cta', value)}
        >
          <SelectTrigger id={`cta-${platform}`}>
            <SelectValue placeholder="Select a CTA..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Learn More">Learn More</SelectItem>
            <SelectItem value="Shop Now">Shop Now</SelectItem>
            <SelectItem value="Sign Up">Sign Up</SelectItem>
            <SelectItem value="Download">Download</SelectItem>
            <SelectItem value="Get Started">Get Started</SelectItem>
            <SelectItem value="Contact Us">Contact Us</SelectItem>
            <SelectItem value="Watch More">Watch More</SelectItem>
            <SelectItem value="Book Now">Book Now</SelectItem>
            <SelectItem value="Subscribe">Subscribe</SelectItem>
            <SelectItem value="Follow">Follow for More</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
  }

  return fields
}

function renderAdvancedFields(
  platform: Platform, 
  content: StagedContent, 
  platformData: any, 
  onUpdate: (field: string, value: any) => void
) {
  const fields = []

  // Scheduling options
  fields.push(
    <div key="schedule" className="space-y-2">
      <Label>Publishing Options</Label>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id={`now-${platform}`}
            name={`schedule-${platform}`}
            value="now"
            checked={platformData.scheduleType === 'now' || !platformData.scheduleType}
            onChange={(e) => onUpdate('scheduleType', e.target.value)}
            aria-label="Publish immediately"
          />
          <Label htmlFor={`now-${platform}`} className="text-sm">Publish immediately</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id={`schedule-${platform}`}
            name={`schedule-${platform}`}
            value="schedule"
            checked={platformData.scheduleType === 'schedule'}
            onChange={(e) => onUpdate('scheduleType', e.target.value)}
            aria-label="Schedule for later"
          />
          <Label htmlFor={`schedule-${platform}`} className="text-sm">Schedule for later</Label>
        </div>

        {platformData.scheduleType === 'schedule' && (
          <div className="ml-6 space-y-2">
            <Input
              type="datetime-local"
              value={platformData.scheduledTime || ''}
              onChange={(e) => onUpdate('scheduledTime', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        )}
      </div>
    </div>
  )

  // Platform-specific advanced options
  if (platform === 'instagram' && content.type === 'clip') {
    fields.push(
      <div key="location" className="space-y-2">
        <Label htmlFor={`location-${platform}`}>Location (Optional)</Label>
        <Input
          id={`location-${platform}`}
          value={platformData.location || ''}
          onChange={(e) => onUpdate('location', e.target.value)}
          placeholder="Add location..."
        />
      </div>
    )
  }

  if (platform === 'youtube') {
    fields.push(
      <div key="visibility" className="space-y-2">
        <Label>Visibility</Label>
        <Select
          value={platformData.visibility || 'public'}
          onValueChange={(value) => onUpdate('visibility', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="unlisted">Unlisted</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (platform === 'linkedin') {
    fields.push(
      <div key="target-audience" className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`target-${platform}`}
            checked={platformData.targetAudience || false}
            onChange={(e) => onUpdate('targetAudience', e.target.checked)}
            aria-label="Target specific audience"
          />
          <Label htmlFor={`target-${platform}`} className="text-sm">Target specific audience</Label>
        </div>
      </div>
    )
  }

  return fields
}

function getPlatformTips(platform: Platform, contentType: string): string[] {
  const tipsByPlatform: Record<Platform, Record<string, string[]>> = {
    instagram: {
      video: [
        "First 3 seconds are crucial for engagement",
        "Use relevant hashtags (5-10 optimal)",
        "Include a clear call-to-action",
        "Stories disappear after 24 hours - consider highlights"
      ],
      image: [
        "High-quality visuals perform 40% better",
        "Use the rule of thirds for composition",
        "Include faces for 38% more engagement",
        "Consistent visual style builds brand recognition"
      ],
      carousel: [
        "First slide should grab attention",
        "Tell a story across slides",
        "Include a summary on the last slide",
        "Use consistent design elements"
      ],
      blog: [
        "Share key insights in the caption",
        "Use 'Link in bio' to drive traffic",
        "Create carousel posts for key points",
        "Stories can drive immediate traffic"
      ]
    },
    linkedin: {
      video: [
        "Native video gets 5x more engagement",
        "Add captions for accessibility",
        "Keep professional but authentic",
        "Share industry insights and learnings"
      ],
      image: [
        "Professional headshots increase connections",
        "Industry-relevant visuals perform best",
        "Include data visualizations when relevant",
        "Behind-the-scenes content humanizes your brand"
      ],
      blog: [
        "Share personal insights and experiences",
        "Use bullet points for readability",
        "Ask questions to encourage discussion",
        "Tag relevant industry leaders"
      ]
    },
    x: {
      video: [
        "Keep videos under 2 minutes 20 seconds",
        "Captions are automatically generated",
        "Native video gets better reach than links",
        "Thread longer content"
      ],
      image: [
        "Images get 150% more retweets",
        "Use alt text for accessibility",
        "Infographics perform exceptionally well",
        "Current events and memes trend quickly"
      ]
    },
    youtube: {
      video: [
        "First 15 seconds determine watch time",
        "Custom thumbnails get 90% more views",
        "Include keywords in title and description",
        "End screens increase subscriber rates by 5-10%"
      ]
    },
    tiktok: {
      video: [
        "Hook viewers in first 3 seconds",
        "Use trending sounds and effects",
        "Vertical format performs best",
        "Engagement in first hour affects algorithm"
      ]
    },
    facebook: {
      video: [
        "Square videos perform better in feed",
        "Most videos watched without sound",
        "Live videos get 6x more engagement",
        "Keep important action in center of frame"
      ],
      image: [
        "Link previews appear below images",
        "Faces in images increase click-through",
        "Event photos get high engagement",
        "User-generated content builds trust"
      ]
    },
    threads: {
      video: [
        "Keep it conversational and authentic",
        "Reply to comments quickly",
        "Share behind-the-scenes content",
        "Cross-post from Instagram for reach"
      ]
    }
  }

  const platformTips = tipsByPlatform[platform]
  if (!platformTips) return ["Optimize for engagement", "Use platform best practices", "Monitor performance metrics"]
  
  return platformTips[contentType] || platformTips.video || platformTips.image || []
} 