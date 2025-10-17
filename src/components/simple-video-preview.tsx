"use client"

import { useState, useEffect } from "react"
import { IconVideo } from "@tabler/icons-react"

interface SimpleVideoPreviewProps {
  videoUrl?: string
  thumbnailUrl?: string
  title: string
  className?: string
}

export function SimpleVideoPreview({
  videoUrl,
  thumbnailUrl,
  title,
  className = "w-full h-full object-cover"
}: SimpleVideoPreviewProps) {
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)

  // Reset errors when URLs change
  useEffect(() => {
    setImageError(false)
    setVideoError(false)
    setVideoLoaded(false)
  }, [videoUrl, thumbnailUrl])

  // If no video or thumbnail URL, show fallback
  if (!videoUrl && !thumbnailUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
        <div className="p-4 rounded-full bg-white/80 dark:bg-black/40 shadow-lg">
          <IconVideo className="h-10 w-10 text-slate-600 dark:text-slate-400" />
        </div>
      </div>
    )
  }

  // Try thumbnail first if available
  if (thumbnailUrl && !imageError) {
    return (
      <img
        src={thumbnailUrl}
        alt={title}
        className={className}
        onError={() => {
          console.log('Thumbnail failed to load:', thumbnailUrl)
          setImageError(true)
        }}
      />
    )
  }

  // If thumbnail failed or not available, try video
  if (videoUrl && !videoError) {
    return (
      <div className="relative w-full h-full">
        {!videoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            <div className="p-4 rounded-full bg-white/80 dark:bg-black/40 shadow-lg animate-pulse">
              <IconVideo className="h-10 w-10 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        )}
        <video
          className={className}
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => {
            console.log('Video loaded successfully')
            setVideoLoaded(true)
          }}
          onError={(e) => {
            console.error('Video failed to load:', videoUrl, e)
            setVideoError(true)
          }}
          style={{ opacity: videoLoaded ? 1 : 0 }}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
        </video>
      </div>
    )
  }

  // Everything failed, show fallback
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
      <div className="p-4 rounded-full bg-white/80 dark:bg-black/40 shadow-lg">
        <IconVideo className="h-10 w-10 text-slate-600 dark:text-slate-400" />
      </div>
    </div>
  )
}
