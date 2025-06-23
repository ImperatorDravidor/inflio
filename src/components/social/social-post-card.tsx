"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconDotsVertical,
  IconEdit,
  IconCopy,
  IconTrash,
  IconSend,
  IconEye,
  IconCalendar,
  IconClock,
  IconHash,
  IconPhoto,
  IconVideo,
  IconArticle,
  IconChartBar
} from "@tabler/icons-react"
import { format } from "date-fns"
import type { SocialPost, Platform } from "@/lib/social/types"

interface PostMetadata {
  type?: 'video' | 'image' | 'blog';
  platforms?: string[];
  thumbnail?: string;
}

interface SocialPostCardProps {
  post: SocialPost & { metadata?: PostMetadata }
  platform?: Platform
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onPublishNow?: () => void
  onViewAnalytics?: () => void
  variant?: 'compact' | 'detailed'
  showActions?: boolean
}

const platformIcons = {
  video: IconVideo,
  image: IconPhoto,
  blog: IconArticle
}

const stateStyles = {
  draft: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  scheduled: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  publishing: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
  published: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400' }
}

export function SocialPostCard({
  post,
  platform,
  onEdit,
  onDuplicate,
  onDelete,
  onPublishNow,
  onViewAnalytics,
  variant = 'compact',
  showActions = true
}: SocialPostCardProps) {
  const TypeIcon = platformIcons[post.metadata?.type as keyof typeof platformIcons] || IconArticle
  const stateStyle = stateStyles[post.state] || stateStyles.draft
  const isDetailed = variant === 'detailed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card transition-all duration-200",
        "hover:shadow-md hover:border-primary/50",
        isDetailed && "p-4"
      )}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      </div>

      <div className={cn("relative", !isDetailed && "p-4")}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-2 rounded-lg bg-primary/10 text-primary"
            >
              <TypeIcon className="h-5 w-5" />
            </motion.div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary"
                  className={cn("text-xs", stateStyle.bg, stateStyle.text)}
                >
                  {post.state}
                </Badge>
                {post.metadata?.platforms && Array.isArray(post.metadata.platforms) && (
                  <>
                    {post.metadata.platforms.map((p: string) => (
                      <Badge key={p} variant="outline" className="text-xs">
                        {p}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
              
              {post.publish_date && (
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <IconCalendar className="h-3 w-3" />
                    {format(new Date(post.publish_date), "MMM d")}
                  </span>
                  <span className="flex items-center gap-1">
                    <IconClock className="h-3 w-3" />
                    {format(new Date(post.publish_date), "h:mm a")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IconDotsVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <IconEdit className="h-4 w-4 mr-2" />
                    Edit Post
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <IconCopy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {post.state === 'scheduled' && onPublishNow && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onPublishNow}>
                      <IconSend className="h-4 w-4 mr-2" />
                      Publish Now
                    </DropdownMenuItem>
                  </>
                )}
                {post.state === 'published' && onViewAnalytics && (
                  <DropdownMenuItem onClick={onViewAnalytics}>
                    <IconChartBar className="h-4 w-4 mr-2" />
                    View Analytics
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={onDelete}
                    >
                      <IconTrash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className={cn(
            "text-sm",
            isDetailed ? "line-clamp-none" : "line-clamp-2"
          )}>
            {post.content}
          </p>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <IconHash className="h-3 w-3 text-muted-foreground" />
              {post.hashtags.slice(0, isDetailed ? undefined : 3).map((tag, idx) => (
                <span 
                  key={idx} 
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {tag}
                </span>
              ))}
              {!isDetailed && post.hashtags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{post.hashtags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Analytics Preview (for published posts) */}
          {post.state === 'published' && post.analytics && isDetailed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4 pt-3 border-t"
            >
              <div className="flex items-center gap-1 text-sm">
                <IconEye className="h-4 w-4 text-muted-foreground" />
                <span>{post.analytics.views?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <IconChartBar className="h-4 w-4 text-muted-foreground" />
                <span>{Math.round(((post.analytics.likes || 0) + (post.analytics.comments || 0) + (post.analytics.shares || 0)) / Math.max((post.analytics.views || 1), 1) * 100)}%</span>
              </div>
              {onViewAnalytics && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  onClick={onViewAnalytics}
                >
                  View Details
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Media Preview */}
        {post.metadata?.thumbnail && isDetailed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 rounded-lg overflow-hidden border"
          >
            <img
              src={post.metadata.thumbnail}
              alt="Post preview"
              className="w-full h-32 object-cover"
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
} 