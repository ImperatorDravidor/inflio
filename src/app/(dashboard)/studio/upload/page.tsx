"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { IconUpload, IconVideo, IconX, IconSparkles, IconFile, IconClock, IconCheck, IconFileUpload, IconArrowRight, IconUser, IconPalette, IconChevronDown, IconLoader2 } from "@tabler/icons-react"
import { ProjectService } from "@/lib/services"
import { extractVideoMetadata, formatDuration, formatFileSize } from "@/lib/video-utils-simple"
import { generateVideoThumbnail } from "@/lib/video-thumbnail-fix"
import { UploadProgress } from "@/components/loading-states"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { VideoMetadata } from "@/lib/project-types"
import { WorkflowSelection, WorkflowOptions } from "@/components/workflow-selection"
import Image from "next/image"
import { APP_CONFIG } from "@/lib/constants"
import { handleError } from "@/lib/error-handler"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

// Types for persona and brand selection
interface PersonaOption {
  id: string
  name: string
  avatar_url?: string
  description?: string
  status?: 'analyzing' | 'training' | 'processing' | 'ready' | 'failed'
  photoCount?: number
  portraitsGenerated?: number
}

interface BrandSettings {
  name?: string
  voice?: string
  colors?: {
    primary: string
    secondary: string
    accent: string
  }
  targetAudience?: string
}

export default function UploadPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [projectTitle, setProjectTitle] = useState("")
  const [videoPreview, setVideoPreview] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState("")
  const [thumbnail, setThumbnail] = useState<string>("")
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const [showWorkflowSelection, setShowWorkflowSelection] = useState(false)
  const [workflowOptions, setWorkflowOptions] = useState<WorkflowOptions>({
    transcription: true,
    clips: true,  // Changed from false to true
    blog: false,
    social: false
  })
  const [submittingWorkflow, setSubmittingWorkflow] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState("")

  // Persona and brand selection state
  const [personas, setPersonas] = useState<PersonaOption[]>([])
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null)
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false)

  // Fetch personas and brand settings on mount
  useEffect(() => {
    const fetchPersonasAndBrand = async () => {
      setLoadingPersonas(true)
      try {
        // Fetch personas
        const personasRes = await fetch('/api/personas')
        if (personasRes.ok) {
          const data = await personasRes.json()
          setPersonas(data.personas || [])
          // Auto-select first ready persona if available
          const readyPersonas = (data.personas || []).filter((p: PersonaOption & { status?: string }) => p.status === 'ready')
          if (readyPersonas.length > 0) {
            setSelectedPersonaId(readyPersonas[0].id)
          }
        }

        // Fetch user profile for brand settings
        const profileRes = await fetch('/api/user/profile')
        if (profileRes.ok) {
          const { profile } = await profileRes.json()
          if (profile) {
            // Extract brand from brand_identity or brand_analysis
            const brand = profile.brand_identity || profile.brand_analysis

            // Build brand settings from the correct structure
            const extractedBrand: BrandSettings = {
              name: profile.company_name,
            }

            if (brand) {
              // Extract voice from brand.voice.tone array
              if (brand.voice?.tone && Array.isArray(brand.voice.tone)) {
                extractedBrand.voice = brand.voice.tone.join(', ')
              }

              // Extract colors from brand.colors structure
              if (brand.colors) {
                extractedBrand.colors = {
                  primary: brand.colors.primary?.hex?.[0] || '',
                  secondary: brand.colors.secondary?.hex?.[0] || '',
                  accent: brand.colors.accent?.hex?.[0] || ''
                }
              }

              // Extract target audience from brand.targetAudience
              if (brand.targetAudience) {
                const audienceParts: string[] = []
                if (brand.targetAudience.demographics?.age) {
                  audienceParts.push(`Age: ${brand.targetAudience.demographics.age}`)
                }
                if (brand.targetAudience.psychographics?.length > 0) {
                  audienceParts.push(brand.targetAudience.psychographics.slice(0, 3).join(', '))
                }
                if (brand.targetAudience.needs?.length > 0) {
                  audienceParts.push(brand.targetAudience.needs.slice(0, 2).join(', '))
                }
                extractedBrand.targetAudience = audienceParts.join(' | ')
              }
            }

            setBrandSettings(extractedBrand)
          }
        }
      } catch (error) {
        console.error('Failed to fetch personas/brand:', error)
      } finally {
        setLoadingPersonas(false)
      }
    }

    fetchPersonasAndBrand()
  }, [])

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
    if (!APP_CONFIG.SUPPORTED_VIDEO_TYPES.includes(file.type as typeof APP_CONFIG.SUPPORTED_VIDEO_TYPES[number])) {
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
      console.log('Created video preview URL:', url)
      setVideoPreview(url)
      
      // Extract video metadata
      const metadata = await extractVideoMetadata(file)
      
      // Convert to our VideoMetadata type
      const formattedMetadata: VideoMetadata = {
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        fps: 30, // Default FPS - browser doesn't provide this
        codec: 'h264', // Default codec - browser doesn't provide this
        bitrate: 0, // Browser doesn't provide bitrate
        size: file.size,
        format: metadata.format
      }
      
      setVideoMetadata(formattedMetadata)
      
      // Generate thumbnail - simple and reliable
      const thumbnailUrl = await generateVideoThumbnail(file)
      setThumbnail(thumbnailUrl)
      
      // If no thumbnail was generated, that's okay - we'll show the video preview instead
      if (!thumbnailUrl) {
        console.log('No thumbnail generated, will use video preview')
      }
      
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
    setThumbnail("")
    setVideoMetadata(null)
    setProcessing(false)
    setProjectTitle("")
    setShowMetadata(false)
    setShowWorkflowSelection(false)
    setWorkflowOptions({
      transcription: true,
      clips: true,  // Changed from false to true
      blog: false,
      social: false
    })
    // Reset persona selection to first ready persona
    const readyPersonas = personas.filter((p: PersonaOption & { status?: string }) => (p as PersonaOption & { status?: string }).status === 'ready')
    if (readyPersonas.length > 0) {
      setSelectedPersonaId(readyPersonas[0].id)
    } else {
      setSelectedPersonaId(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    // Clean up video preview URL to prevent memory leaks
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
    }
  }

  const selectedPersona = personas.find(p => p.id === selectedPersonaId)

  const handleContinueToWorkflows = () => {
    if (!projectTitle.trim()) {
      toast.error("Please enter a project title")
      return
    }
    setShowWorkflowSelection(true)
  }

  const handleUpload = async () => {
    if (!file || !videoMetadata || !userId) return;

    // Server-side usage check will happen during project creation
    // Remove client-side check to prevent bypass

    setUploading(true);
    setSubmittingWorkflow(true);
    setSubmissionStatus("Uploading video to cloud storage...");
    setUploadProgress(0);
    const toastId = toast.loading("Uploading video to cloud storage...");

    // Set upload timeout based on file size (5 min base + 1 min per 100MB)
    const fileSizeMB = file.size / (1024 * 1024);
    const timeoutMs = Math.max(5 * 60 * 1000, (5 + Math.ceil(fileSizeMB / 100)) * 60 * 1000);
    let uploadTimedOut = false;

    // Simulated progress interval (since Supabase doesn't provide upload progress)
    // Progress goes from 0-80% during upload, then jumps to 100% on completion
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 80) return prev; // Cap at 80% until actual completion
        // Slower progress for larger files
        const increment = Math.max(0.5, 5 - (fileSizeMB / 200));
        return Math.min(80, prev + increment);
      });
    }, 500);

    // Create a timeout promise for upload
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        uploadTimedOut = true;
        clearInterval(progressInterval);
        reject(new Error(`Upload timed out. Large videos (${Math.round(fileSizeMB)}MB) may take longer. Please try again or check your connection.`));
      }, timeoutMs);
    });

    try {
      // Generate unique filename
      const timestamp = Date.now();
      
      // Extract file extension
      const lastDotIndex = file.name.lastIndexOf('.');
      const extension = lastDotIndex > 0 ? file.name.substring(lastDotIndex) : '.mp4';
      const nameWithoutExt = lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
      
      // Sanitize the name part only (preserve extension)
      const sanitizedName = nameWithoutExt
        .replace(/[｜|]/g, '-')
        .replace(/[^\w-]/g, '') // Remove all non-alphanumeric except hyphens (more strict)
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() // Convert to lowercase for consistency
        .substring(0, 50); // Limit name length to 50 chars
      
      // Ensure we have a valid name
      const finalName = sanitizedName || 'video';
      
      // Create a more conservative file name for production
      const fileName = `${timestamp}-${finalName}${extension.toLowerCase()}`;
      
      // Upload directly using Supabase client (handles CORS properly)
      const supabase = createSupabaseBrowserClient();

      console.log('[Upload] Starting Supabase upload:', { fileName, fileSize: file.size, timeoutMs });

      // Race the upload against the timeout
      const uploadPromise = supabase.storage
        .from('videos')
        .upload(fileName, file, {
          contentType: file.type || 'video/mp4',
          upsert: true,
        });

      const { data: uploadData, error: uploadError } = await Promise.race([
        uploadPromise,
        timeoutPromise
      ]) as Awaited<typeof uploadPromise>;

      if (uploadError) {
        console.error('Supabase upload failed:', uploadError);
        // More specific error messages
        if (uploadError.message?.includes('row-level security')) {
          throw new Error('Storage permission error. Please contact support.');
        } else if (uploadError.message?.includes('exceeded')) {
          throw new Error('File size exceeds the maximum allowed (2GB).');
        }
        throw new Error(uploadError.message || 'Failed to upload video to storage');
      }

      if (!uploadData?.path) {
        throw new Error('Upload completed but no path returned. Please try again.');
      }

      console.log('[Upload] Supabase upload success:', uploadData.path);
      clearInterval(progressInterval);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(uploadData.path);

      const supabaseVideoUrl = urlData.publicUrl;
      
      if (!supabaseVideoUrl) {
        throw new Error("Failed to get video URL from storage.");
      }
      
      toast.success("Video uploaded successfully!", { id: toastId });
      setUploadProgress(100);

      // Step 2: Create the project with selected workflow options via API
      setSubmissionStatus("Creating your project...");
      toast.info("Creating project...");
      
      const createResponse = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: projectTitle || file.name.replace(/\.[^/.]+$/, ""),
          videoUrl: supabaseVideoUrl,
          thumbnailUrl: thumbnail,
          metadata: videoMetadata,
          workflowOptions,
          // Enhanced content generation settings
          personaId: selectedPersonaId,
          brandSettings: brandSettings
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const { project, usage } = await createResponse.json();
      toast.success('Project created successfully!');
      
      // Show usage warning if approaching limit
      if (usage && usage.limit !== -1 && usage.used >= usage.limit * 0.8) {
        const remaining = usage.limit - usage.used;
        toast.warning(`You have ${remaining} video${remaining !== 1 ? 's' : ''} remaining this month.`);
      }

      // Step 3: Redirect to processing page (processing will auto-start there)
      setSubmissionStatus("Redirecting to processing page...");
      toast.success("Project created! Starting processing...");

      // Redirect immediately - processing page will auto-start workflows
      router.push(`/studio/processing/${project.id}`);

    } catch (err) {
      console.error('Upload error:', err);
      clearInterval(progressInterval);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload and create project.';
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage);
      setUploading(false);
      setUploadProgress(0);
      setSubmittingWorkflow(false);
      setSubmissionStatus("");
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
          Start with AI transcription and smart clips. Generate blog posts, images, and more after processing.
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
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] animate-pulse" />
                </div>
              )}

              {!file ? (
                <div className="relative">
                  <IconUpload className="h-16 w-16 text-muted-foreground mb-6 mx-auto relative z-10" />
                  <h3 className="text-xl font-semibold mb-2">
                    {dragActive ? "Drop it here!" : "Drag & drop your video"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    or click to browse from your computer
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
                  {/* Video Preview */}
                  {videoPreview && (
                    <div className="relative mx-auto max-w-3xl">
                      <div className="grid gap-4">
                        {/* Simple Video Player */}
                        <div className="relative group aspect-video rounded-xl overflow-hidden bg-gray-900">
                          <video
                            key={`video-${videoPreview}`}
                            ref={videoRef}
                            className="w-full h-full"
                            style={{ backgroundColor: '#000' }}
                            controls
                            muted
                            playsInline
                            poster={thumbnail || undefined}
                          >
                            <source src={videoPreview} type={file?.type || 'video/mp4'} />
                            Your browser does not support the video tag.
                          </video>
                          
                          {/* Remove button */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-3 right-3 bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity z-10"
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

                              {/* Persona Selection */}
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                  <IconUser className="h-4 w-4" />
                                  AI Persona (for thumbnails & content)
                                </Label>
                                {loadingPersonas ? (
                                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                                    <LoadingSpinner size="sm" />
                                    <span className="text-sm text-muted-foreground">Loading personas...</span>
                                  </div>
                                ) : personas.length === 0 ? (
                                  <div className="p-3 border rounded-lg bg-muted/50">
                                    <p className="text-sm text-muted-foreground">
                                      No personas created yet.{' '}
                                      <a href="/personas" className="text-primary hover:underline">
                                        Create one
                                      </a>{' '}
                                      for personalized AI-generated thumbnails.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
                                      className="w-full flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        {selectedPersona ? (
                                          <>
                                            <div className="relative">
                                              {selectedPersona.avatar_url ? (
                                                <Image
                                                  src={selectedPersona.avatar_url}
                                                  alt={selectedPersona.name}
                                                  width={32}
                                                  height={32}
                                                  className="rounded-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                  <IconUser className="h-4 w-4 text-primary" />
                                                </div>
                                              )}
                                              {(selectedPersona.status === 'analyzing' || selectedPersona.status === 'training' || selectedPersona.status === 'processing') && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center">
                                                  <IconLoader2 className="h-2 w-2 text-white animate-spin" />
                                                </div>
                                              )}
                                            </div>
                                            <span className="font-medium">{selectedPersona.name}</span>
                                            {selectedPersona.status === 'ready' && (
                                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/30">
                                                Ready
                                              </Badge>
                                            )}
                                            {(selectedPersona.status === 'analyzing' || selectedPersona.status === 'training' || selectedPersona.status === 'processing') && (
                                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-500/30 flex items-center gap-1">
                                                <IconLoader2 className="h-2.5 w-2.5 animate-spin" />
                                                {selectedPersona.portraitsGenerated !== undefined && selectedPersona.portraitsGenerated > 0 
                                                  ? `${selectedPersona.portraitsGenerated}/10` 
                                                  : 'Training'}
                                              </Badge>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                              <IconUser className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <span className="text-muted-foreground">Select a persona</span>
                                          </>
                                        )}
                                      </div>
                                      <IconChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showPersonaDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showPersonaDropdown && (
                                      <div className="absolute z-10 w-full mt-1 border rounded-lg bg-background shadow-lg max-h-60 overflow-auto">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedPersonaId(null)
                                            setShowPersonaDropdown(false)
                                          }}
                                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                                        >
                                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                            <IconUser className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                          <span className="text-muted-foreground">No persona (generic content)</span>
                                        </button>
                                        {personas.map((persona) => {
                                          const isTraining = persona.status === 'analyzing' || persona.status === 'training' || persona.status === 'processing'
                                          const isReady = persona.status === 'ready'
                                          const isFailed = persona.status === 'failed'
                                          
                                          return (
                                            <button
                                              key={persona.id}
                                              type="button"
                                              onClick={() => {
                                                setSelectedPersonaId(persona.id)
                                                setShowPersonaDropdown(false)
                                              }}
                                              className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left ${selectedPersonaId === persona.id ? 'bg-primary/5' : ''}`}
                                            >
                                              <div className="relative">
                                                {persona.avatar_url ? (
                                                  <Image
                                                    src={persona.avatar_url}
                                                    alt={persona.name}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full object-cover"
                                                  />
                                                ) : (
                                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <IconUser className="h-4 w-4 text-primary" />
                                                  </div>
                                                )}
                                                {isTraining && (
                                                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center">
                                                    <IconLoader2 className="h-2 w-2 text-white animate-spin" />
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <p className="font-medium truncate">{persona.name}</p>
                                                  {isReady && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/30">
                                                      Ready
                                                    </Badge>
                                                  )}
                                                  {isTraining && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-500/30 flex items-center gap-1">
                                                      <IconLoader2 className="h-2.5 w-2.5 animate-spin" />
                                                      {persona.portraitsGenerated !== undefined && persona.portraitsGenerated > 0 
                                                        ? `${persona.portraitsGenerated}/10` 
                                                        : 'Training'}
                                                    </Badge>
                                                  )}
                                                  {isFailed && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-red-500/10 text-red-600 border-red-500/30">
                                                      Failed
                                                    </Badge>
                                                  )}
                                                </div>
                                                {isTraining && persona.portraitsGenerated !== undefined && persona.portraitsGenerated > 0 && (
                                                  <p className="text-xs text-amber-600">Generating portraits ({persona.portraitsGenerated}/10 done)</p>
                                                )}
                                                {!isTraining && persona.description && (
                                                  <p className="text-xs text-muted-foreground truncate max-w-[250px]">{persona.description}</p>
                                                )}
                                              </div>
                                            </button>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Brand Settings Display */}
                              {brandSettings && (brandSettings.voice || brandSettings.colors) && (
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    <IconPalette className="h-4 w-4" />
                                    Brand Settings
                                  </Label>
                                  <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
                                    {brandSettings.name && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Brand:</span>
                                        <span className="font-medium">{brandSettings.name}</span>
                                      </div>
                                    )}
                                    {brandSettings.voice && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Voice:</span>
                                        <span className="font-medium">{brandSettings.voice}</span>
                                      </div>
                                    )}
                                    {brandSettings.colors && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Colors:</span>
                                        <div className="flex gap-1">
                                          <div
                                            className="w-5 h-5 rounded-full border border-border"
                                            style={{ backgroundColor: brandSettings.colors.primary }}
                                            title="Primary"
                                          />
                                          <div
                                            className="w-5 h-5 rounded-full border border-border"
                                            style={{ backgroundColor: brandSettings.colors.secondary }}
                                            title="Secondary"
                                          />
                                          <div
                                            className="w-5 h-5 rounded-full border border-border"
                                            style={{ backgroundColor: brandSettings.colors.accent }}
                                            title="Accent"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                      These settings will guide AI-generated content.{' '}
                                      <a href="/settings/brand" className="text-primary hover:underline">
                                        Edit in settings
                                      </a>
                                    </p>
                                  </div>
                                </div>
                              )}

                              <Button
                                onClick={handleContinueToWorkflows}
                                className="w-full"
                                disabled={!projectTitle.trim()}
                              >
                                Next: Processing Options
                                <IconArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Workflow Selection */}
                        {showWorkflowSelection && (
                          <div className="space-y-4">
                            <WorkflowSelection
                              options={workflowOptions}
                              onChange={setWorkflowOptions}
                              disabled={uploading}
                              variant="grid"
                            />
                          </div>
                        )}
                        
                        {/* Thumbnail Preview */}
                        {thumbnail ? (
                          <div className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-white/80 dark:bg-background rounded-2xl border border-primary/10 shadow-lg">
                            <div className="flex-shrink-0">
                              <Image 
                                src={thumbnail} 
                                alt="Video thumbnail" 
                                width={120}
                                height={80}
                                className="w-28 h-20 object-cover rounded-xl border border-border shadow-md"
                              />
                            </div>
                            <div className="flex flex-col items-center sm:items-start text-center sm:text-left mt-2 sm:mt-0">
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold mb-2 shadow-sm">
                                <IconCheck className="h-4 w-4" />
                                Thumbnail ready
                              </span>
                              <span className="text-base text-muted-foreground font-medium">Natural thumbnail extracted from video</span>
                            </div>
                          </div>
                        ) : null}
                        
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
                        disabled={!projectTitle.trim() || submittingWorkflow}
                      >
                        <IconSparkles className="h-5 w-5 mr-2" />
                        Start Processing
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowWorkflowSelection(false)}
                        size="lg"
                        disabled={submittingWorkflow}
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

        {/* Processing Overlay */}
        {submittingWorkflow && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="max-w-md w-full mx-4">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20 animate-pulse" />
                    <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Submitting Your Project</h3>
                    <p className="text-muted-foreground">{submissionStatus || "Please wait while we process your request..."}</p>
                  </div>
                  {file && (
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>This may take a few moments. Please don't close this page.</p>
                    {file && submissionStatus === "Uploading video to cloud storage..." && (
                      <p className="text-xs">
                        Large videos may take several minutes to upload.
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setSubmittingWorkflow(false);
                      setUploading(false);
                      setUploadProgress(0);
                      setSubmissionStatus("");
                      toast.info("Upload cancelled. You can try again.");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
              <p className="text-xs text-muted-foreground">Usually 15-30 minutes per video</p>
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
