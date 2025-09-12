"use client"

import { useState, useEffect } from "react"
import { IconVideo, IconPhoto } from "@tabler/icons-react"

interface SupabaseVideoPreviewProps {
  videoUrl?: string | null
  thumbnailUrl?: string | null
  title: string
  className?: string
}

export function SupabaseVideoPreview({
  videoUrl,
  thumbnailUrl,
  title,
  className = "w-full h-full object-cover"
}: SupabaseVideoPreviewProps) {
  const [imageError, setImageError] = useState(false)

  // Reset error when URLs change
  useEffect(() => {
    setImageError(false)
  }, [videoUrl, thumbnailUrl])

  // Priority 1: Use thumbnail if available and working
  if (thumbnailUrl && !imageError) {
    return (
      <img
        src={thumbnailUrl}
        alt={title}
        className={className}
        onError={() => {
          console.log('Thumbnail failed to load, falling back')
          setImageError(true)
        }}
      />
    )
  }

  // Priority 2: If we have a video URL, show it as a video element
  // Note: Videos from Supabase won't show a preview frame until they start playing
  // This is a browser limitation with cross-origin videos
  if (videoUrl) {
    return (
      <div className="relative w-full h-full bg-black">
        <video
          className={className}
          muted
          playsInline
          preload="none" // Don't preload to save bandwidth
          onMouseEnter={(e) => {
            // Play on hover to show preview
            const video = e.currentTarget
            video.play().catch(() => {
              // Ignore autoplay errors
            })
          }}
          onMouseLeave={(e) => {
            // Pause and reset on mouse leave
            const video = e.currentTarget
            video.pause()
            video.currentTime = 0
          }}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
        
        {/* Overlay to indicate it's a video */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <IconVideo className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>
    )
  }

  // Priority 3: Show placeholder if no media available
  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
      <div className="p-4 rounded-full bg-white/80 dark:bg-black/40 shadow-lg">
        <IconPhoto className="h-10 w-10 text-slate-600 dark:text-slate-400" />
      </div>
    </div>
  )
}