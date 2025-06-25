"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { retrieveVideo } from "@/lib/services"
import { ProcessingResults } from "@/components/processing-results"
import { ExportManager } from "@/components/export-manager"
import { ErrorBoundary } from "@/components/error-boundary"
import { ThumbnailCreator } from "@/components/thumbnail-creator"
import { 
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconMaximize,
  IconDownload,
  IconShare,
  IconClock,
  IconVideo,
  IconArrowLeft,
  IconSparkles,
  IconWand,
  IconSettings,
  IconBolt,
  IconRocket,
  IconFileText,
  IconScissors,
  IconBulb,
  IconArticle,
  IconBrandTwitter
} from "@tabler/icons-react"

interface ProcessingOption {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  color: string
  estimatedTime: string
}

interface VideoInfo {
  id: string
  title: string
  duration: number
  currentTime: number
  isPlaying: boolean
  volume: number
  metadata: {
    fileName: string
    fileSize: string
    format: string
    resolution: string
    uploadedAt: string
  }
}

interface ProcessingResult {
  status: string
  data: unknown
  timestamp: string
  error?: string
}

export default function VideoEditorPage() {
  const params = useParams()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoId = params.id as string

  const [videoInfo, setVideoInfo] = useState<VideoInfo>({
    id: videoId,
    title: "Untitled Video",
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    volume: 1,
    metadata: {
      fileName: "Loading...",
      fileSize: "0 MB",
      format: "Unknown",
      resolution: "Unknown",
      uploadedAt: new Date().toISOString()
    }
  })

  const [videoUrl, setVideoUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [processingMode, setProcessingMode] = useState<"quick" | "detailed">("quick")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("process")
  const [showExport, setShowExport] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("")
  const [contentAnalysis, setContentAnalysis] = useState<any>(null)

  const [processingOptions, setProcessingOptions] = useState<ProcessingOption[]>([
    {
      id: 'transcription',
      label: 'AI Transcription',
      description: 'Convert speech to text with timestamps',
      icon: <IconFileText className="h-5 w-5" />,
      enabled: true,
      color: "text-blue-500",
      estimatedTime: "2-3 min"
    },
    {
      id: 'clips',
      label: 'Smart Clips',
      description: 'Auto-generate viral short clips',
      icon: <IconScissors className="h-5 w-5" />,
      enabled: true,
      color: "text-purple-500",
      estimatedTime: "3-5 min"
    },
    {
      id: 'ideas',
      label: 'Key Insights',
      description: 'Extract main ideas and quotes',
      icon: <IconBulb className="h-5 w-5" />,
      enabled: false,
      color: "text-yellow-500",
      estimatedTime: "1-2 min"
    },
    {
      id: 'blog',
      label: 'Blog Article',
      description: 'Generate SEO-optimized blog post',
      icon: <IconArticle className="h-5 w-5" />,
      enabled: false,
      color: "text-green-500",
      estimatedTime: "2-3 min"
    },
    {
      id: 'social',
      label: 'Social Posts',
      description: 'Create platform-specific posts',
      icon: <IconBrandTwitter className="h-5 w-5" />,
      enabled: false,
      color: "text-pink-500",
      estimatedTime: "1-2 min"
    }
  ])

  const [results, setResults] = useState<Record<string, ProcessingResult>>({})

  useEffect(() => {
    // Load video data
    const loadVideoData = async () => {
      try {
        const stored = localStorage.getItem(`video_${videoId}`)
        if (stored) {
          let data
          try {
            data = JSON.parse(stored)
          } catch (parseError) {
            console.error('Failed to parse video data:', parseError)
            toast.error('Invalid video data format')
            router.push('/studio/upload')
            return
          }
          
          setVideoInfo((prev: VideoInfo) => ({
            ...prev,
            title: data.metadata?.fileName?.replace(/\.[^/.]+$/, "") || "Untitled Video",
            metadata: data.metadata || {
              fileName: "unknown.mp4",
              fileSize: "Unknown",
              format: "MP4",
              resolution: "Unknown",
              uploadedAt: new Date().toISOString()
            }
          }))
          
          // Load thumbnail if exists
          if (data.thumbnailUrl) {
            setThumbnailUrl(data.thumbnailUrl)
          }
          
          // Load content analysis if exists
          if (data.contentAnalysis) {
            setContentAnalysis(data.contentAnalysis)
          }
          
          // Try to load video from our storage utility
          const videoData = await retrieveVideo(videoId)
          if (videoData) {
            setVideoUrl(videoData)
          } else {
            // If video not found, show error
            toast.error('Video file not found. Please re-upload the video.')
            setVideoUrl("")
          }
          
          if (data.results) {
            setResults(data.results)
          }
        } else {
          toast.error('Video metadata not found')
          router.push('/studio/upload')
        }
      } catch (error) {
        console.error('Failed to load video:', error)
        toast.error('Failed to load video')
      } finally {
        setIsLoading(false)
      }
    }

    loadVideoData()
  }, [videoId, router])

  // Video Controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoInfo.isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setVideoInfo(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoInfo(prev => ({
        ...prev,
        currentTime: videoRef.current!.currentTime
      }))
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoInfo(prev => ({
        ...prev,
        duration: videoRef.current!.duration
      }))
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      setVideoInfo(prev => ({ ...prev, currentTime: value[0] }))
    }
  }

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0]
      setVideoInfo(prev => ({ ...prev, volume: value[0] }))
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleOption = (optionId: string) => {
    setProcessingOptions(prev => 
      prev.map(opt => 
        opt.id === optionId ? { ...opt, enabled: !opt.enabled } : opt
      )
    )
  }

  const handleProcess = async () => {
    const enabledOptions = processingOptions.filter(opt => opt.enabled)
    if (enabledOptions.length === 0) {
      toast.error('Please select at least one processing option')
      return
    }

    setIsProcessing(true)
    setProcessProgress(0)
    setActiveTab("results")

    try {
      // Process each enabled option
      const totalSteps = enabledOptions.length
      let currentStep = 0

      for (const option of enabledOptions) {
        toast.info(`Processing ${option.label}...`)
        
        try {
          // Call the actual process API
          const response = await fetch('/api/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              videoId: videoId,
              processingType: option.id
            })
          })

          if (!response.ok) {
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('text/html')) {
              console.error('Received HTML instead of JSON:', response.status, response.statusText)
              throw new Error(`Server error: ${response.status} ${response.statusText}`)
            }
            const error = await response.json()
            throw new Error(error.error || 'Processing failed')
          }

          const data = await response.json()
          
          // Update progress
          currentStep++
          setProcessProgress((currentStep / totalSteps) * 100)

          // Store results
          setResults((prev: Record<string, ProcessingResult>) => ({
            ...prev,
            [option.id]: {
              status: 'completed',
              data: data.result,
              timestamp: new Date().toISOString()
            }
          }))

          toast.success(`${option.label} completed!`)
        } catch (error) {
          console.error(`Error processing ${option.label}:`, error)
          toast.error(`Failed to process ${option.label}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          
          setResults((prev: Record<string, ProcessingResult>) => ({
            ...prev,
            [option.id]: {
              status: 'failed',
              data: null,
              timestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }))
        }
      }

      // Save results to localStorage (without video data)
      const videoDataStr = localStorage.getItem(`video_${videoId}`)
      if (videoDataStr) {
        try {
          const videoData = JSON.parse(videoDataStr)
          videoData.results = results
          // Make sure we don't save the URL
          delete videoData.url
          localStorage.setItem(`video_${videoId}`, JSON.stringify(videoData))
        } catch (error) {
          console.error('Failed to parse/save video data:', error)
        }
      }

      // Update project status
      const projectsStr = localStorage.getItem('projects')
      if (projectsStr) {
        try {
          const projects = JSON.parse(projectsStr) as Array<{
            id: string
            status: string
            processedAt: string
            outputs: {
              transcription: boolean
              clips: number
              blog: boolean
              social: boolean
              ideas: boolean
            }
          }>
          const projectIndex = projects.findIndex((p) => p.id === videoId)
          if (projectIndex !== -1) {
            projects[projectIndex].status = 'completed'
            projects[projectIndex].processedAt = new Date().toLocaleString()
            projects[projectIndex].outputs = {
              transcription: enabledOptions.some(o => o.id === 'transcription'),
              clips: enabledOptions.some(o => o.id === 'clips') ? 3 : 0,
              blog: enabledOptions.some(o => o.id === 'blog'),
              social: enabledOptions.some(o => o.id === 'social'),
              ideas: enabledOptions.some(o => o.id === 'ideas')
            }
            localStorage.setItem('projects', JSON.stringify(projects))
          }
        } catch (error) {
          console.error('Failed to parse/update projects:', error)
        }
      }
    } catch (error) {
      console.error('Processing error:', error)
      toast.error('Processing failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleThumbnailUpdate = (newThumbnailUrl: string) => {
    setThumbnailUrl(newThumbnailUrl)
    
    // Update in localStorage
    const stored = localStorage.getItem(`video_${videoId}`)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        data.thumbnailUrl = newThumbnailUrl
        localStorage.setItem(`video_${videoId}`, JSON.stringify(data))
      } catch (error) {
        console.error('Failed to update thumbnail in storage:', error)
      }
    }
    
    // Update project if exists
    const projectsStr = localStorage.getItem('projects')
    if (projectsStr) {
      try {
        const projects = JSON.parse(projectsStr)
        const projectIndex = projects.findIndex((p: any) => p.id === videoId)
        if (projectIndex !== -1) {
          projects[projectIndex].thumbnail_url = newThumbnailUrl
          localStorage.setItem('projects', JSON.stringify(projects))
        }
      } catch (error) {
        console.error('Failed to update project thumbnail:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconSparkles className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push('/projects')}
              >
                <IconArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{videoInfo.title}</h1>
                <p className="text-xs text-muted-foreground">
                  Video Editor • {videoInfo.metadata.fileSize} • {videoInfo.metadata.format}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThumbnailCreator
                projectId={videoId}
                projectTitle={videoInfo.title}
                contentAnalysis={contentAnalysis}
                currentThumbnail={thumbnailUrl}
                onThumbnailUpdate={handleThumbnailUpdate}
              />
              <Button variant="outline" size="sm">
                <IconShare className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowExport(true)}
                disabled={Object.keys(results).length === 0}
              >
                <IconDownload className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                {videoUrl ? (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <IconVideo className="h-16 w-16 text-gray-600" />
                  </div>
                )}
                
                {/* Video Overlay Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="space-y-2">
                    {/* Progress Bar */}
                    <Slider
                      value={[videoInfo.currentTime]}
                      max={videoInfo.duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="w-full"
                    />
                    
                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-white hover:bg-white/20"
                          onClick={togglePlayPause}
                        >
                          {videoInfo.isPlaying ? (
                            <IconPlayerPause className="h-4 w-4" />
                          ) : (
                            <IconPlayerPlay className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <span className="text-white text-sm">
                          {formatTime(videoInfo.currentTime)} / {formatTime(videoInfo.duration)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <IconVolume className="h-4 w-4 text-white" />
                          <Slider
                            value={[videoInfo.volume]}
                            max={1}
                            step={0.1}
                            onValueChange={handleVolumeChange}
                            className="w-20"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-white hover:bg-white/20"
                        >
                          <IconMaximize className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Processing/Results Tabs */}
            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="process">
                      <IconWand className="h-4 w-4 mr-2" />
                      Process
                    </TabsTrigger>
                    <TabsTrigger value="results">
                      <IconSparkles className="h-4 w-4 mr-2" />
                      Results
                    </TabsTrigger>
                    <TabsTrigger value="timeline">
                      <IconClock className="h-4 w-4 mr-2" />
                      Timeline
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent>
                  <TabsContent value="process" className="space-y-4">
                    {/* Processing Mode */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h3 className="font-medium">Processing Mode</h3>
                        <p className="text-sm text-muted-foreground">
                          {processingMode === "quick" ? "Fast processing with standard quality" : "Slower processing with best quality"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={processingMode === "quick" ? "default" : "outline"}
                          onClick={() => setProcessingMode("quick")}
                        >
                          <IconBolt className="h-4 w-4 mr-1" />
                          Quick
                        </Button>
                        <Button
                          size="sm"
                          variant={processingMode === "detailed" ? "default" : "outline"}
                          onClick={() => setProcessingMode("detailed")}
                        >
                          <IconRocket className="h-4 w-4 mr-1" />
                          Detailed
                        </Button>
                      </div>
                    </div>

                    {/* Processing Options */}
                    <div className="space-y-3">
                      {processingOptions.map((option) => (
                        <div
                          key={option.id}
                          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                            option.enabled 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-muted-foreground/50'
                          }`}
                          onClick={() => toggleOption(option.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${option.color}`}>
                              {option.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{option.label}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    ~{option.estimatedTime}
                                  </span>
                                  <Switch
                                    checked={option.enabled}
                                    onCheckedChange={() => toggleOption(option.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Process Button */}
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleProcess}
                      disabled={isProcessing || !processingOptions.some(opt => opt.enabled)}
                    >
                      {isProcessing ? (
                        <>
                          <IconSparkles className="h-4 w-4 mr-2 animate-spin" />
                          Processing... {Math.round(processProgress)}%
                        </>
                      ) : (
                        <>
                          <IconRocket className="h-4 w-4 mr-2" />
                          Start Processing
                        </>
                      )}
                    </Button>

                    {isProcessing && (
                      <Progress value={processProgress} className="h-2" />
                    )}
                  </TabsContent>

                  <TabsContent value="results" className="space-y-4">
                    <ProcessingResults 
                      results={results} 
                      videoTitle={videoInfo.title}
                    />
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4">
                    <div className="text-center py-12">
                      <IconClock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Timeline View</h3>
                      <p className="text-muted-foreground">
                        Visual timeline of your video segments coming soon
                      </p>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Video Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Video Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{formatTime(videoInfo.duration)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">File Size</span>
                  <span className="font-medium">{videoInfo.metadata.fileSize}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">{videoInfo.metadata.format}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Resolution</span>
                  <span className="font-medium">{videoInfo.metadata.resolution}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <IconSettings className="h-4 w-4 mr-2" />
                  Video Settings
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <IconWand className="h-4 w-4 mr-2" />
                  Apply AI Enhancement
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <IconScissors className="h-4 w-4 mr-2" />
                  Trim Video
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Get the most out of your video processing
                </p>
                <Button variant="outline" className="w-full" size="sm">
                  View Tutorial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Export Manager Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-auto">
          <div className="container mx-auto p-4 min-h-screen flex items-start justify-center">
            <div className="bg-card border rounded-lg shadow-lg w-full max-w-4xl my-8">
              <div className="p-6">
                <ErrorBoundary>
                  <ExportManager
                    projectId={videoId}
                    projectTitle={videoInfo.title}
                    results={results}
                    onClose={() => setShowExport(false)}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 