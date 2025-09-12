"use client"

import { useState, useEffect, useRef } from "react"
import { IconVideo } from "@tabler/icons-react"

interface VideoPreviewWithCaptureProps {
  videoUrl?: string
  thumbnailUrl?: string
  title: string
  className?: string
}

export function VideoPreviewWithCapture({
  videoUrl,
  thumbnailUrl,
  title,
  className = "w-full h-full object-cover"
}: VideoPreviewWithCaptureProps) {
  const [capturedFrame, setCapturedFrame] = useState<string>("")
  const [isCapturing, setIsCapturing] = useState(false)
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!videoUrl || thumbnailUrl) return

    const captureVideoFrame = async () => {
      try {
        setIsCapturing(true)
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          console.error('Failed to get canvas context')
          setHasError(true)
          return
        }

        // Set up video element
        video.crossOrigin = 'anonymous'
        video.muted = true
        video.playsInline = true
        
        // Create a promise to handle video loading
        const videoLoaded = new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            
            // Seek to 1 second or 10% of duration
            const seekTime = Math.min(1, video.duration * 0.1)
            video.currentTime = seekTime
          }
          
          video.onseeked = () => {
            // Draw the current frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            
            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
            setCapturedFrame(dataUrl)
            setIsCapturing(false)
            
            // Clean up
            video.remove()
            resolve()
          }
          
          video.onerror = (e) => {
            console.error('Video load error:', e)
            reject(e)
          }
        })

        // Load the video
        video.src = videoUrl
        video.load()
        
        await videoLoaded
      } catch (error) {
        console.error('Failed to capture video frame:', error)
        setHasError(true)
        setIsCapturing(false)
      }
    }

    captureVideoFrame()
  }, [videoUrl, thumbnailUrl])

  // If we have a thumbnail URL, use it
  if (thumbnailUrl) {
    return (
      <img
        src={thumbnailUrl}
        alt={title}
        className={className}
        onError={() => setHasError(true)}
      />
    )
  }

  // If we captured a frame, display it
  if (capturedFrame) {
    return (
      <img
        src={capturedFrame}
        alt={title}
        className={className}
      />
    )
  }

  // While capturing or if no video URL, show placeholder
  if (isCapturing || !videoUrl || hasError) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
        <div className={`p-4 rounded-full bg-white/80 dark:bg-black/40 shadow-lg ${isCapturing ? 'animate-pulse' : ''}`}>
          <IconVideo className="h-10 w-10 text-slate-600 dark:text-slate-400" />
        </div>
      </div>
    )
  }

  // Fallback: show video element
  return (
    <video
      ref={videoRef}
      src={videoUrl}
      className={className}
      muted
      playsInline
      preload="metadata"
      onError={() => setHasError(true)}
    />
  )
}