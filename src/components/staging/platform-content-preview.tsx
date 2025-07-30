"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandX,
  IconBrandFacebook,
  IconHeart,
  IconMessageCircle,
  IconShare,
  IconBookmark,
  IconDots,
  IconThumbUp,
  IconRepeat,
  IconEye,
  IconClock,
  IconMapPin
} from "@tabler/icons-react"
import { Platform } from "@/lib/social/types"
import { StagedContent } from "@/lib/staging/staging-service"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import Image from "next/image"

interface PlatformContentPreviewProps {
  content: StagedContent
  platform: Platform
  scheduledDate?: Date
}

const platformIcons: Record<Platform, any> = {
  instagram: IconBrandInstagram,
  linkedin: IconBrandLinkedin,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  x: IconBrandX,
  facebook: IconBrandFacebook,
  threads: IconBrandInstagram
}

const platformColors = {
  instagram: 'from-purple-500 to-pink-500',
  linkedin: 'from-blue-600 to-blue-700',
  tiktok: 'from-black to-gray-800',
  youtube: 'from-red-500 to-red-600',
  x: 'from-gray-900 to-black',
  facebook: 'from-blue-500 to-blue-600',
  threads: 'from-gray-800 to-black'
}

export function PlatformContentPreview({ content, platform, scheduledDate }: PlatformContentPreviewProps) {
  const platformData = content.platformContent[platform]
  
  if (!platformData) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No content for this platform yet</p>
        </CardContent>
      </Card>
    )
  }

  const renderInstagramPreview = () => (
    <div className="max-w-[468px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">your_username</p>
            {(platformData as any).location && (
              <p className="text-xs text-muted-foreground">{(platformData as any).location}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <IconDots className="h-4 w-4" />
        </Button>
      </div>

      {/* Media */}
      {content.thumbnailUrl && (
        <div className="relative aspect-square bg-muted">
          <Image 
            src={content.thumbnailUrl} 
            alt={content.title}
            fill
            className="object-cover"
          />
          {content.type === 'clip' && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {content.duration ? `${Math.floor(content.duration / 60)}:${(content.duration % 60).toString().padStart(2, '0')}` : 'Video'}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <IconHeart className="h-6 w-6 cursor-pointer hover:text-red-500 transition-colors" />
            <IconMessageCircle className="h-6 w-6 cursor-pointer hover:text-primary transition-colors" />
            <IconShare className="h-6 w-6 cursor-pointer hover:text-primary transition-colors" />
          </div>
          <IconBookmark className="h-6 w-6 cursor-pointer hover:text-primary transition-colors" />
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-semibold mr-2">your_username</span>
            {platformData.caption}
          </p>
          
          {/* Hashtags */}
          {platformData.hashtags && platformData.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {platformData.hashtags.map((tag, idx) => (
                <span key={idx} className="text-sm text-blue-600 cursor-pointer hover:underline">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {scheduledDate && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <IconClock className="h-3 w-3" />
              Scheduled for {format(scheduledDate, 'MMM d, h:mm a')}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const renderTikTokPreview = () => (
    <div className="max-w-[350px] mx-auto">
      {/* Video Container */}
      <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
        {content.thumbnailUrl && (
          <Image 
            src={content.thumbnailUrl} 
            alt={content.title}
            fill
            className="object-cover"
          />
        )}
        
        {/* Overlay UI */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {/* Top bar */}
          <div className="text-white text-center">
            <p className="text-sm font-medium">Following | For You</p>
          </div>

          {/* Bottom content */}
          <div className="text-white">
            <div className="mb-4">
              <p className="font-semibold mb-1">@your_username</p>
              <p className="text-sm">{platformData.caption}</p>
              
              {/* Hashtags */}
              {platformData.hashtags && platformData.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {platformData.hashtags.slice(0, 5).map((tag, idx) => (
                    <span key={idx} className="text-xs">#{tag}</span>
                  ))}
                </div>
              )}
              
              {(platformData as any).sounds && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full animate-spin" />
                  <p className="text-xs">🎵 {(platformData as any).sounds}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side actions */}
        <div className="absolute right-2 bottom-20 flex flex-col gap-4 text-white">
          <div className="text-center">
            <IconHeart className="h-8 w-8 mb-1" />
            <p className="text-xs">0</p>
          </div>
          <div className="text-center">
            <IconMessageCircle className="h-8 w-8 mb-1" />
            <p className="text-xs">0</p>
          </div>
          <div className="text-center">
            <IconShare className="h-8 w-8 mb-1" />
            <p className="text-xs">Share</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderYouTubePreview = () => (
    <div className="max-w-[600px] mx-auto space-y-4">
      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {content.thumbnailUrl && (
          <Image 
            src={content.thumbnailUrl} 
            alt={platformData.title || content.title}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors">
            <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{platformData.title || content.title}</h3>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <IconEye className="h-4 w-4" />
              0 views
            </span>
            <span>{scheduledDate ? format(scheduledDate, 'MMM d, yyyy') : 'Just now'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <IconThumbUp className="h-4 w-4 mr-1" />
              Like
            </Button>
            <Button variant="ghost" size="sm">
              Share
            </Button>
          </div>
        </div>

        <Separator />

        {/* Channel info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>YT</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">Your Channel</p>
              <p className="text-sm text-muted-foreground">0 subscribers</p>
            </div>
          </div>
          <Button variant="destructive">Subscribe</Button>
        </div>

        {/* Description */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm whitespace-pre-wrap">{platformData.description}</p>
          
          {/* Tags */}
          {(platformData as any).tags && (platformData as any).tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {(platformData as any).tags.map((tag: string, idx: number) => (
                <span key={idx} className="text-xs text-blue-600">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderLinkedInPreview = () => (
    <div className="max-w-[550px] mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Author */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>LI</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">Your Name</p>
                <p className="text-sm text-muted-foreground">Your Title • 1st</p>
                <p className="text-xs text-muted-foreground">Now • 🌐</p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <IconDots className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            {platformData.title && (
              <h3 className="font-semibold text-lg">{platformData.title}</h3>
            )}
            <p className="text-sm whitespace-pre-wrap">{platformData.caption}</p>
            
            {/* Hashtags */}
            {platformData.hashtags && platformData.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {platformData.hashtags.map((tag, idx) => (
                  <span key={idx} className="text-sm text-blue-600 cursor-pointer hover:underline">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Media */}
          {content.thumbnailUrl && (
            <div className="relative aspect-video bg-muted rounded overflow-hidden">
              <Image 
                src={content.thumbnailUrl} 
                alt={content.title}
                fill
                className="object-cover"
              />
              {content.type === 'clip' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                    <div className="w-0 h-0 border-l-[16px] border-l-blue-600 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1" />
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Engagement */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <button className="hover:text-blue-600 transition-colors">Like</button>
              <button className="hover:text-blue-600 transition-colors">Comment</button>
              <button className="hover:text-blue-600 transition-colors">Repost</button>
              <button className="hover:text-blue-600 transition-colors">Send</button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderXPreview = () => (
    <div className="max-w-[550px] mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>X</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold">Your Name</p>
                <p className="text-sm text-muted-foreground">@username • now</p>
              </div>
              
              <p className="text-sm whitespace-pre-wrap">{(platformData as any).tweet || platformData.caption}</p>
              
              {/* Media */}
              {content.thumbnailUrl && (
                <div className="relative aspect-video bg-muted rounded-xl overflow-hidden mt-2">
                  <Image 
                    src={content.thumbnailUrl} 
                    alt={content.title}
                    fill
                    className="object-cover"
                  />
                  {content.type === 'clip' && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {content.duration ? `${Math.floor(content.duration / 60)}:${(content.duration % 60).toString().padStart(2, '0')}` : 'Video'}
                    </div>
                  )}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <button className="flex items-center gap-2 hover:text-primary transition-colors">
                  <IconMessageCircle className="h-5 w-5" />
                  <span className="text-sm">0</span>
                </button>
                <button className="flex items-center gap-2 hover:text-green-600 transition-colors">
                  <IconRepeat className="h-5 w-5" />
                  <span className="text-sm">0</span>
                </button>
                <button className="flex items-center gap-2 hover:text-red-600 transition-colors">
                  <IconHeart className="h-5 w-5" />
                  <span className="text-sm">0</span>
                </button>
                <button className="flex items-center gap-2 hover:text-primary transition-colors">
                  <IconShare className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderFacebookPreview = () => (
    <div className="max-w-[550px] mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>FB</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">Your Name</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Just now</span>
                  <span>•</span>
                  <span>🌐 Public</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <IconDots className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <p className="text-sm whitespace-pre-wrap">{platformData.caption}</p>
          
          {/* Media */}
          {content.thumbnailUrl && (
            <div className="relative aspect-video bg-muted rounded overflow-hidden -mx-4">
              <Image 
                src={content.thumbnailUrl} 
                alt={content.title}
                fill
                className="object-cover"
              />
              {content.type === 'clip' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                    <div className="w-0 h-0 border-l-[20px] border-l-blue-600 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reactions */}
          <div className="flex items-center justify-between py-2 border-y text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">👍</div>
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">❤️</div>
              </div>
              <span className="ml-1">0</span>
            </div>
            <div className="flex items-center gap-4">
              <span>0 comments</span>
              <span>0 shares</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-around">
            <Button variant="ghost" size="sm" className="flex-1">
              <IconThumbUp className="h-4 w-4 mr-2" />
              Like
            </Button>
            <Button variant="ghost" size="sm" className="flex-1">
              <IconMessageCircle className="h-4 w-4 mr-2" />
              Comment
            </Button>
            <Button variant="ghost" size="sm" className="flex-1">
              <IconShare className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPreview = () => {
    switch (platform) {
      case 'instagram':
        return renderInstagramPreview()
      case 'tiktok':
        return renderTikTokPreview()
      case 'youtube':
        return renderYouTubePreview()
      case 'linkedin':
        return renderLinkedInPreview()
      case 'x':
        return renderXPreview()
      case 'facebook':
        return renderFacebookPreview()
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Preview not available for this platform
          </div>
        )
    }
  }

  const Icon = platformIcons[platform]

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg text-white bg-gradient-to-br",
            platformColors[platform]
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <CardTitle className="text-lg">Preview</CardTitle>
          {platformData.characterCount && (
            <Badge variant="outline" className="ml-auto">
              {platformData.characterCount} chars
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-y-auto max-h-[600px]">
        {renderPreview()}
      </CardContent>
    </Card>
  )
} 