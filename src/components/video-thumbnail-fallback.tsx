"use client"

import { useEffect, useState } from "react"
import { IconVideo } from "@tabler/icons-react"
import { generateVideoThumbnailFromUrl } from "@/lib/video-thumbnail-fix"

interface VideoThumbnailFallbackProps {
  videoUrl?: string
  thumbnailUrl?: string
  title: string
  className?: string
  fallbackClassName?: string
}

export function VideoThumbnailFallback({
  videoUrl,
  thumbnailUrl,
  title,
  className = "w-full h-full object-cover",
  fallbackClassName = ""
}: VideoThumbnailFallbackProps) {
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function generateThumbnail() {
      if (!thumbnailUrl && videoUrl && !generatedThumbnail && !isGenerating && !error) {
        setIsGenerating(true)
        try {
          console.log('VideoThumbnailFallback: Generating thumbnail for', videoUrl)
          // Try to generate thumbnail from video at 0.5 seconds mark (or 1 second for longer videos)
          const thumbnail = await generateVideoThumbnailFromUrl(videoUrl, 0.5)
          
          if (thumbnail && thumbnail !== '') {
            console.log('VideoThumbnailFallback: Thumbnail generated successfully')
            setGeneratedThumbnail(thumbnail)
          } else {
            console.log('VideoThumbnailFallback: Empty thumbnail returned, trying fallback')
            // Try again at 1 second if first attempt failed
            const fallbackThumbnail = await generateVideoThumbnailFromUrl(videoUrl, 1)
            if (fallbackThumbnail && fallbackThumbnail !== '') {
              setGeneratedThumbnail(fallbackThumbnail)
            } else {
              setError(true)
            }
          }
        } catch (err) {
          console.error("VideoThumbnailFallback: Failed to generate thumbnail:", err)
          setError(true)
        } finally {
          setIsGenerating(false)
        }
      }
    }
    
    generateThumbnail()
  }, [videoUrl, thumbnailUrl, generatedThumbnail, isGenerating, error])

  // If we have a thumbnail URL, use it
  if (thumbnailUrl) {
    if (thumbnailUrl.startsWith('http')) {
      return (
        <img
          src={thumbnailUrl}
          alt={title}
          className={className}
        />
      )
    } else {
      return (
        <img
          src={thumbnailUrl}
          alt={title}
          className={className}
        />
      )
    }
  }

  // If we generated a thumbnail, use it
  if (generatedThumbnail) {
    return (
      <img
        src={generatedThumbnail}
        alt={title}
        className={className}
      />
    )
  }

  // Show loading state while generating
  if (isGenerating) {
    return (
      <div className={`flex items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 ${fallbackClassName}`}>
        <div className="text-center">
          <div className="p-4 rounded-full bg-white/80 dark:bg-black/40 shadow-lg animate-pulse">
            <IconVideo className="h-10 w-10 sm:h-12 sm:w-12 text-slate-600 dark:text-slate-400" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  // Fallback to icon if all else fails
  return (
    <div className={`flex items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 ${fallbackClassName}`}>
      <div className="p-4 rounded-full bg-white/80 dark:bg-black/40 shadow-lg">
        <IconVideo className="h-10 w-10 sm:h-12 sm:w-12 text-slate-600 dark:text-slate-400" />
      </div>
    </div>
  )
}

