"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { IconLoader2, IconPlayerPlay, IconVideo } from "@tabler/icons-react"
import { createPlaceholderThumbnail } from "@/lib/video-utils"
import { cn } from "@/lib/utils"

interface EnhancedVideoPlayerProps {
  videoUrl: string | null
  thumbnailUrl?: string | null
  className?: string
  onLoadedMetadata?: (duration: number) => void
  onPlayingStateChange?: (isPlaying: boolean) => void
  autoGenerateThumbnail?: boolean
}

export const EnhancedVideoPlayer = forwardRef<HTMLVideoElement, EnhancedVideoPlayerProps>(({
  videoUrl,
  thumbnailUrl,
  className,
  onLoadedMetadata,
  onPlayingStateChange,
  autoGenerateThumbnail = true
}, forwardedRef) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null)
  
  // Forward the ref
  useImperativeHandle(forwardedRef, () => internalVideoRef.current!, [])
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [posterImage, setPosterImage] = useState<string>("")
  const [showOverlay, setShowOverlay] = useState(true)

  // Generate or use placeholder thumbnail
  useEffect(() => {
    if (!videoUrl) {
      // No video, use placeholder
      if (autoGenerateThumbnail) {
        setPosterImage(createPlaceholderThumbnail())
      }
      return
    }

    if (thumbnailUrl) {
      setPosterImage(thumbnailUrl)
    } else if (autoGenerateThumbnail) {
      // Generate a placeholder if no thumbnail provided
      setPosterImage(createPlaceholderThumbnail())
    }
  }, [videoUrl, thumbnailUrl, autoGenerateThumbnail])

  const handlePlayClick = () => {
    if (internalVideoRef.current) {
      internalVideoRef.current.play()
      setShowOverlay(false)
    }
  }

  const handleVideoPlay = () => {
    setIsPlaying(true)
    setShowOverlay(false)
    setIsLoading(false)
    onPlayingStateChange?.(true)
  }

  const handleVideoPause = () => {
    setIsPlaying(false)
    // Only show overlay again if video is at the beginning
    if (internalVideoRef.current && internalVideoRef.current.currentTime < 0.1) {
      setShowOverlay(true)
    }
    onPlayingStateChange?.(false)
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
    setShowOverlay(true)
    onPlayingStateChange?.(false)
  }

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    setIsLoading(false)
    onLoadedMetadata?.(video.duration)
  }

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error("Video error:", e)
    setIsLoading(false)
    setHasError(true)
    
    // Check if it's a CORS error
    const video = e.currentTarget as HTMLVideoElement
    if (video.error?.code === 2) {
      console.warn("CORS error - this is expected for some external video URLs")
      // Don't show as error, video might still be playable
      setHasError(false)
    }
  }

  if (!videoUrl) {
    return (
      <div className={cn("relative aspect-video bg-black rounded-lg overflow-hidden", className)}>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center">
            <IconVideo className="h-16 w-16 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">No video available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative aspect-video bg-black rounded-lg overflow-hidden group", className)}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center">
            <IconLoader2 className="h-12 w-12 animate-spin text-white/80 mx-auto" />
            <p className="text-white/60 text-sm mt-3 font-medium">Loading video...</p>
          </div>
        </div>
      )}

      {/* Thumbnail/Poster Overlay with Play Button */}
      {showOverlay && !isPlaying && posterImage && !hasError && (
        <div 
          className="absolute inset-0 z-20 cursor-pointer"
          onClick={handlePlayClick}
        >
          <img 
            src={posterImage} 
            alt="Video thumbnail" 
            className="w-full h-full object-cover"
            onError={() => {
              // If thumbnail fails to load, remove it
              setPosterImage("")
            }}
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-200" />
          
          {/* Centered Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="transform transition-transform duration-200 group-hover:scale-110">
              <div className="bg-white/95 backdrop-blur-md rounded-full p-5 shadow-2xl">
                <IconPlayerPlay className="h-10 w-10 text-slate-900 ml-1" />
              </div>
            </div>
          </div>
          
          {/* Optional: Add "Click to play" text on hover */}
          <div className="absolute bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="text-white/90 text-sm font-medium bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
              Click to play
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-br from-red-950/20 to-slate-900">
          <div className="text-center p-6">
            <IconVideo className="h-16 w-16 text-red-400/60 mx-auto mb-3" />
            <p className="text-red-400 text-sm font-medium">Failed to load video</p>
            <p className="text-slate-500 text-xs mt-2">The video might be unavailable or corrupted</p>
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={internalVideoRef}
        src={videoUrl}
        poster={posterImage || undefined}
        className="w-full h-full object-contain"
        controls
        controlsList="nodownload"
        crossOrigin="anonymous"
        playsInline
        preload="metadata"
        onLoadStart={() => setIsLoading(true)}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlayThrough={() => setIsLoading(false)}
        onWaiting={() => isPlaying && setIsLoading(true)}
        onPlaying={handleVideoPlay}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onEnded={handleVideoEnded}
        onError={handleError}
      />
    </div>
  )
})

EnhancedVideoPlayer.displayName = "EnhancedVideoPlayer"
