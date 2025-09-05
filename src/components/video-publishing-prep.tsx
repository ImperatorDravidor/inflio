"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Video, 
  Subtitles, 
  Image, 
  CheckCircle2, 
  AlertCircle, 
  Upload,
  Loader2,
  Youtube,
  Play
} from 'lucide-react'
import { ThumbnailCreatorV2 } from './thumbnail-creator-v2'
import { cn } from '@/lib/utils'

interface VideoPublishingPrepProps {
  projectId: string
  projectTitle: string
  videoUrl: string
  currentThumbnail?: string
  hasTranscription?: boolean
  hasSubtitles?: boolean
  selectedPersona?: any
  onReady?: (data: {
    videoUrl: string
    thumbnailUrl: string
    hasSubtitles: boolean
  }) => void
}

export function VideoPublishingPrep({
  projectId,
  projectTitle,
  videoUrl,
  currentThumbnail,
  hasTranscription,
  hasSubtitles: initialHasSubtitles,
  selectedPersona,
  onReady
}: VideoPublishingPrepProps) {
  const [thumbnail, setThumbnail] = useState(currentThumbnail || '')
  const [isBurningSubtitles, setIsBurningSubtitles] = useState(false)
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null)
  const [hasSubtitles, setHasSubtitles] = useState(initialHasSubtitles || false)
  const [burnSubtitles, setBurnSubtitles] = useState(true)
  const [progress, setProgress] = useState(0)

  const handleBurnSubtitles = async () => {
    if (!hasTranscription) {
      toast.error('No transcription available for subtitles')
      return
    }

    setIsBurningSubtitles(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 500)

    try {
      const response = await fetch('/api/burn-subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          videoUrl,
          style: {
            fontFamily: 'Arial',
            fontSize: '24',
            fontColor: 'white',
            backgroundColor: 'black@0.7',
            position: 'bottom',
            outline: true
          }
        })
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error('Failed to burn subtitles')
      }

      const data = await response.json()
      setProcessedVideoUrl(data.processedVideoUrl)
      setHasSubtitles(true)
      
      toast.success('Subtitles burned successfully!')
      
      // Notify parent
      if (onReady) {
        onReady({
          videoUrl: data.processedVideoUrl,
          thumbnailUrl: thumbnail,
          hasSubtitles: true
        })
      }
    } catch (error) {
      console.error('Error burning subtitles:', error)
      toast.error('Failed to burn subtitles')
    } finally {
      clearInterval(progressInterval)
      setIsBurningSubtitles(false)
      setProgress(0)
    }
  }

  const handleThumbnailUpdate = (url: string) => {
    setThumbnail(url)
    toast.success('Thumbnail updated!')
  }

  const isReadyToPublish = thumbnail && (processedVideoUrl || videoUrl)

  // Calculate readiness status
  const readinessItems = [
    { 
      label: 'Video', 
      ready: true, 
      icon: Video 
    },
    { 
      label: 'Thumbnail', 
      ready: !!thumbnail, 
      icon: Image,
      action: !thumbnail ? 'Add thumbnail' : undefined
    },
    { 
      label: 'Subtitles', 
      ready: hasSubtitles || !burnSubtitles, 
      icon: Subtitles,
      action: burnSubtitles && !hasSubtitles ? 'Burn subtitles' : undefined
    }
  ]

  const readyCount = readinessItems.filter(item => item.ready).length

  return (
    <div className="space-y-6">
      {/* Publishing Readiness Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Video Publishing Preparation</CardTitle>
              <CardDescription>Prepare your video for YouTube and other platforms</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-600" />
              <Badge variant={isReadyToPublish ? "default" : "secondary"}>
                {readyCount}/3 Ready
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-3">
            {readinessItems.map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      item.ready ? "bg-green-500/10" : "bg-yellow-500/10"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        item.ready ? "text-green-600" : "text-yellow-600"
                      )} />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.ready ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        {item.action && (
                          <span className="text-sm text-muted-foreground">{item.action}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Thumbnail Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Thumbnail</Label>
            <div className="flex items-center gap-4">
              {thumbnail ? (
                <div className="relative group">
                  <img 
                    src={thumbnail} 
                    alt="Thumbnail" 
                    className="w-32 h-20 object-cover rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button size="sm" variant="secondary" className="text-xs">
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-32 h-20 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              <ThumbnailCreatorV2
                projectId={projectId}
                projectTitle={projectTitle}
                projectVideoUrl={videoUrl}
                currentThumbnail={thumbnail}
                onThumbnailUpdate={handleThumbnailUpdate}
                selectedPersona={selectedPersona}
              />
            </div>
          </div>

          {/* Subtitles Section */}
          {hasTranscription && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Subtitles</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="burn-subtitles" className="text-sm">
                    Burn into video
                  </Label>
                  <Switch
                    id="burn-subtitles"
                    checked={burnSubtitles}
                    onCheckedChange={setBurnSubtitles}
                    disabled={hasSubtitles}
                  />
                </div>
              </div>
              
              {burnSubtitles && !hasSubtitles && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Burning subtitles makes them permanently visible in the video, improving accessibility and engagement.
                  </p>
                  
                  {isBurningSubtitles && (
                    <Progress value={progress} className="h-2" />
                  )}
                  
                  <Button 
                    onClick={handleBurnSubtitles}
                    disabled={isBurningSubtitles || hasSubtitles}
                    className="w-full"
                  >
                    {isBurningSubtitles ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing... {progress}%
                      </>
                    ) : hasSubtitles ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Subtitles Ready
                      </>
                    ) : (
                      <>
                        <Subtitles className="h-4 w-4 mr-2" />
                        Burn Subtitles
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {hasSubtitles && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    Subtitles have been burned into the video
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Final Video Preview */}
          {isReadyToPublish && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Preview</Label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video 
                  src={processedVideoUrl || videoUrl}
                  poster={thumbnail}
                  controls
                  className="w-full h-full"
                />
              </div>
              
              <Button className="w-full" size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Publish to YouTube
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

