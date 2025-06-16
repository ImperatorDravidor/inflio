"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { IconUpload, IconVideo, IconX, IconSparkles, IconFile, IconClock, IconCheck, IconFileUpload, IconCloud, IconEdit, IconArrowRight } from "@tabler/icons-react"
import { ProjectService, UsageService } from "@/lib/services"
import { generateVideoThumbnail, extractVideoMetadata, formatDuration, formatFileSize } from "@/lib/video-utils"
import { UploadProgress } from "@/components/loading-states"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { VideoMetadata } from "@/lib/project-types"
import { WorkflowSelection, WorkflowOptions } from "@/components/workflow-selection"
import { v4 as uuidv4 } from 'uuid'
import Image from "next/image"
import { APP_CONFIG, ROUTES } from "@/lib/constants"
import { useProjectNavigation } from "@/hooks/use-project-navigation"
import { handleError } from "@/lib/error-handler"

export default function UploadPage() {
  const router = useRouter()
  const { navigateToProject } = useProjectNavigation()
  const { userId } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [projectTitle, setProjectTitle] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [videoPreview, setVideoPreview] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState("")
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [thumbnail, setThumbnail] = useState<string>("")
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const [showWorkflowSelection, setShowWorkflowSelection] = useState(false)
  const [workflowOptions, setWorkflowOptions] = useState<WorkflowOptions>({
    transcription: true,
    clips: true,
    blog: false,
    social: false,
    podcast: false
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const validateFile = (file: File) => {
    if (!APP_CONFIG.SUPPORTED_VIDEO_TYPES.includes(file.type as any)) {
      throw new Error('Invalid file type. Please upload MP4, MOV, AVI, or WebM files.')
    }

    if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum size is 2GB.')
    }
  }

  const handleFile = async (file: File) => {
    try {
      setError("")
      setProcessing(true)
      validateFile(file)
      setFile(file)
      
      // Set default project title from filename
      const defaultTitle = file.name.replace(/\.[^/.]+$/, "")
      setProjectTitle(defaultTitle)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
      setVideoUrl(url)
      
      // Extract video metadata
      toast.info("Extracting video metadata...")
      const metadata = await extractVideoMetadata(file)
      
      // Convert to our VideoMetadata type
      const formattedMetadata: VideoMetadata = {
        duration: metadata.duration || 0,
        width: metadata.width || 1920,
        height: metadata.height || 1080,
        fps: 30, // Default FPS - browser doesn't provide this
        codec: 'h264', // Default codec - browser doesn't provide this
        bitrate: 0, // Browser doesn't provide bitrate
        size: file.size,
        format: file.type.split('/')[1] || 'mp4'
      }
      
      setVideoMetadata(formattedMetadata)
      
      // Generate thumbnail
      toast.info("Generating thumbnail...")
      const thumbnailUrl = await generateVideoThumbnail(file)
      setThumbnail(thumbnailUrl)
      
      toast.success("Video processed successfully!")
      setShowMetadata(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const removeFile = () => {
    setFile(null)
    setVideoPreview("")
    setError("")
    setVideoUrl(null)
    setThumbnail("")
    setVideoMetadata(null)
    setProcessing(false)
    setProjectTitle("")
    setProjectDescription("")
    setShowMetadata(false)
    setShowWorkflowSelection(false)
    setWorkflowOptions({
      transcription: true,
      clips: true,
      blog: false,
      social: false,
      podcast: false
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleContinueToWorkflows = () => {
    if (!projectTitle.trim()) {
      toast.error("Please enter a project title")
      return
    }
    setShowWorkflowSelection(true)
  }

  const handleUpload = async () => {
    if (!file || !videoMetadata) return;

    const hasSelectedWorkflow = Object.values(workflowOptions).some(v => v);
    if (!hasSelectedWorkflow) {
      toast.error("Please select at least one workflow");
      return;
    }

    // Check usage limits before processing
    if (!UsageService.canProcessVideo()) {
      const usage = UsageService.getUsage();
      toast.error(`You've reached your monthly limit of ${usage.limit} videos. Please upgrade your plan to continue.`);
      router.push('/settings#upgrade');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const toastId = toast.loading("Uploading video... Please wait.");

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Step 1: Upload the file to our backend.
      // The backend will handle storing it in Supabase and return the public URL.
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      const supabaseVideoUrl = result.url;
      if (!supabaseVideoUrl) {
        throw new Error("Did not receive a valid video URL from the server.");
      }
      
      toast.success("Video uploaded successfully!", { id: toastId });
      setUploadProgress(100);

      // Step 2: Create the project in our database with the returned URL.
      toast.info("Creating project...");
      const project = await ProjectService.createProject(
        projectTitle || file.name.replace(/\.[^/.]+$/, ""),
        file,
        supabaseVideoUrl,
        thumbnail, // Use the locally generated thumbnail for now
        videoMetadata,
        workflowOptions,
        userId || undefined
      );

      if (projectDescription) {
        await ProjectService.updateProject(project.id, { 
          description: projectDescription 
        });
      }

      toast.success('Project created successfully!');
      
      // Increment usage after successful project creation
      const incrementSuccess = UsageService.incrementUsage();
      if (!incrementSuccess) {
        // This shouldn't happen as we checked earlier, but just in case
        toast.warning("Usage limit reached. This may be your last video for this month.");
      }
      
      // Step 3: Start the main processing workflows
      toast.info('Starting AI processing workflows...');
      await ProjectService.startProcessing(project.id);
      
      toast.success("Processing started! Redirecting to your project dashboard.");
      router.push(`/studio/processing/${project.id}`);

    } catch (err) {
      handleError(err, "Failed to upload and create project.")
      setUploading(false)
      setUploadProgress(0)
    }
  };

  return (
    <div className="mx-auto max-w-5xl animate-in">
      {/* Header Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">
          Upload Your <span className="gradient-text">Video</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Transform your video content into transcriptions, clips, blog posts, and more with AI
        </p>
      </div>

      <div className="grid gap-8">
        {/* Upload Area */}
        <Card className={`overflow-hidden transition-all duration-300 ${dragActive ? "border-primary shadow-xl scale-[1.02]" : ""}`}>
          <div className="h-1 gradient-premium" />
          <CardContent className="p-0">
            <div
              className={`relative border-2 border-dashed rounded-lg p-16 text-center transition-all ${
                dragActive 
                  ? "border-primary bg-gradient-to-br from-primary/10 to-accent/10" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              } ${file ? "border-solid bg-muted/30" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Animated background pattern */}
              {!file && (
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] animate-pulse" />
                </div>
              )}

              {!file ? (
                <div className="relative">
                  <IconUpload className="h-16 w-16 text-muted-foreground mb-6 mx-auto" />
                  <h3 className="text-xl font-semibold mb-2">
                    Drop your video here
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    or click to browse
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    size="lg"
                    className="gradient-premium hover:opacity-90 transition-opacity"
                  >
                    <IconFileUpload className="h-5 w-5 mr-2" />
                    Select Video
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    onChange={handleChange}
                    aria-label="Select video file"
                  />
                  <p className="text-sm text-muted-foreground mt-4">
                    MP4, MOV, AVI, WebM • Max 2GB
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Video Preview with Thumbnail */}
                  {videoPreview && (
                    <div className="relative mx-auto max-w-3xl">
                      <div className="grid gap-4">
                        {/* Video */}
                        <div className="relative group">
                          <video
                            ref={videoRef}
                            src={videoPreview}
                            className="w-full rounded-xl bg-black shadow-2xl"
                            controls
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-3 right-3 bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={removeFile}
                            disabled={uploading || processing}
                          >
                            <IconX className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Project Details Form */}
                        {showMetadata && !showWorkflowSelection && (
                          <div className="space-y-4 p-6 bg-muted/30 rounded-lg">
                            <h3 className="font-semibold text-lg">Project Details</h3>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="project-title">Title</Label>
                                <Input
                                  id="project-title"
                                  value={projectTitle}
                                  onChange={(e) => setProjectTitle(e.target.value)}
                                  placeholder="Give your project a title"
                                  className="text-base"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="project-description">Description (optional)</Label>
                                <Textarea
                                  id="project-description"
                                  value={projectDescription}
                                  onChange={(e) => setProjectDescription(e.target.value)}
                                  placeholder="What's this video about?"
                                  rows={2}
                                />
                              </div>
                              <Button 
                                onClick={handleContinueToWorkflows}
                                className="w-full"
                                disabled={!projectTitle.trim()}
                              >
                                Next: Select Workflows
                                <IconArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Workflow Selection */}
                        {showWorkflowSelection && (
                          <WorkflowSelection
                            options={workflowOptions}
                            onChange={setWorkflowOptions}
                            disabled={uploading}
                          />
                        )}
                        
                        {/* Thumbnail Preview */}
                        {thumbnail && (
                          <div className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-white/80 dark:bg-background rounded-2xl border border-primary/10 shadow-lg">
                            <div className="flex-shrink-0">
                              <Image 
                                src={thumbnail} 
                                alt="Generated thumbnail" 
                                width={120}
                                height={80}
                                className="w-28 h-20 object-cover rounded-xl border border-border shadow-md"
                              />
                            </div>
                            <div className="flex flex-col items-center sm:items-start text-center sm:text-left mt-2 sm:mt-0">
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold mb-2 shadow-sm">
                                <IconCheck className="h-4 w-4" />
                                Thumbnail generated
                              </span>
                              <span className="text-base text-muted-foreground font-medium">This will be used as your project thumbnail</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Processing indicator */}
                        {processing && (
                          <div className="flex items-center justify-center gap-3 p-4 bg-primary/5 rounded-xl">
                            <LoadingSpinner size="sm" />
                            <span className="font-medium">Processing video metadata...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconFile className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Video Metadata */}
                    {videoMetadata && (
                      <div className="flex items-center justify-center gap-6 p-3 bg-secondary/50 rounded-lg">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Resolution</p>
                          <p className="font-medium">{videoMetadata.width}x{videoMetadata.height}</p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-medium">{formatDuration(videoMetadata.duration)}</p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Format</p>
                          <p className="font-medium">{videoMetadata.format.toUpperCase()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  {!uploading && showMetadata && showWorkflowSelection && (
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={handleUpload} 
                        size="lg" 
                        className="gradient-premium hover:opacity-90 transition-opacity px-8"
                        disabled={!projectTitle.trim() || !Object.values(workflowOptions).some(v => v)}
                      >
                        <IconSparkles className="h-5 w-5 mr-2" />
                        Start Processing
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowWorkflowSelection(false)}
                        size="lg"
                      >
                        Back
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Progress */}
              {uploading && file && (
                <div className="mt-6">
                  <UploadProgress 
                    progress={uploadProgress}
                    fileName={file.name}
                    fileSize={formatFileSize(file.size)}
                    onCancel={() => {
                      setUploading(false)
                      setUploadProgress(0)
                    }}
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive" className="mt-6 max-w-md mx-auto">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Info */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <IconVideo className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">High Quality</p>
              <p className="text-xs text-muted-foreground">Better quality = better results</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <IconClock className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Processing Time</p>
              <p className="text-xs text-muted-foreground">Usually 2-5 minutes per video</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <IconSparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">AI Powered</p>
              <p className="text-xs text-muted-foreground">Advanced AI analyzes your content</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
