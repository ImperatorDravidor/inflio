"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  IconPhoto, 
  IconUpload,
  IconSparkles,
  IconUser,
  IconLoader2,
  IconCheck,
  IconInfoCircle,
  IconDownload,
  IconArrowRight,
  IconVideo,
  IconCamera,
  IconPlayerPlay,
  IconRefresh,
  IconX,
  IconPlus,
  IconTrash,
  IconEdit,
  IconHistory,
  IconWand,
  IconTrendingUp,
  IconSchool,
  IconDeviceGamepad,
  IconDevices,
  IconCopy
} from "@tabler/icons-react"
import { toast } from "sonner"
import { predefinedStyles } from "@/lib/ai-image-service"
import { cn } from "@/lib/utils"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

interface ThumbnailCreatorProps {
  projectId: string
  projectTitle: string
  projectVideoUrl?: string
  contentAnalysis?: any
  currentThumbnail?: string
  onThumbnailUpdate: (thumbnailUrl: string) => void
}

interface VideoSnippet {
  id: string
  timestamp: number
  thumbnailUrl: string
  selected: boolean
}

interface PersonalPhoto {
  id: string
  url: string
  name: string
  uploadedAt: Date
}

interface ThumbnailHistory {
  imageUrl: string
  prompt: string
  mode: 'generate' | 'edit'
  style: string
  quality: string
  createdAt: string
  metadata?: any
}

interface Persona {
  id: string
  name: string
  description: string
  style: string
  promptTemplate: string
}

// Add UserPersona interface for saved personas
interface UserPersona {
  id: string
  name: string
  description: string
  photos: PersonalPhoto[]
  createdAt: Date
  style: string
  promptTemplate: string
  keywords: string[]
}

const predefinedPersonas: Persona[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean, corporate style for business content",
    style: "photorealistic",
    promptTemplate: "professional headshot merged with {SUBJECT} background, confident business expression, suit/professional attire, bold text '{TITLE}' in corporate font, LinkedIn-style composition, trust-building design"
  },
  {
    id: "educator",
    name: "Educator",
    description: "Educational and informative design",
    style: "photorealistic",
    promptTemplate: "teacher/educator expression explaining {SUBJECT}, whiteboard or classroom background, excited teaching gesture, large readable text '{TITLE}', knowledge-sharing vibe, approachable expert look"
  },
  {
    id: "creator",
    name: "Content Creator",
    description: "Vibrant, eye-catching style for social media",
    style: "photorealistic",
    promptTemplate: "shocked/excited facial expression reacting to {SUBJECT}, mouth open or eyes wide, pointing gesture, HUGE colorful text '{TITLE}', MrBeast style energy, impossible-to-ignore design"
  },
  {
    id: "tech",
    name: "Tech Reviewer",
    description: "Modern tech aesthetic with futuristic elements",
    style: "photorealistic",
    promptTemplate: "tech reviewer holding or pointing at {SUBJECT}, excited but knowledgeable expression, futuristic background, glowing text '{TITLE}', product clearly visible, MKBHD/UnboxTherapy style"
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    description: "Warm, relatable aesthetic for lifestyle content",
    style: "photorealistic",
    promptTemplate: "genuine smile/reaction about {SUBJECT}, lifestyle setting background, warm golden hour lighting, handwritten-style text '{TITLE}', authentic and aspirational, Emma Chamberlain vibe"
  }
]

// Add preset templates
const presetTemplates = [
  {
    id: "viral",
    name: "Viral Style",
    icon: IconTrendingUp,
    description: "High-impact, clickbait-optimized",
    prompt: "VIRAL YouTube thumbnail, shocked expression, bright neon colors, huge bold text saying '{TITLE}', arrows and circles highlighting key elements, maximum visual impact",
    style: "gradient",
    examples: ["MrBeast", "Dude Perfect", "5-Minute Crafts"]
  },
  {
    id: "tutorial",
    name: "Tutorial/How-To",
    icon: IconSchool,
    description: "Clear, informative, step-by-step",
    prompt: "Tutorial YouTube thumbnail, clean professional design, numbered steps visible, '{TITLE}' in clear readable font, before/after comparison, educational aesthetic",
    style: "corporate",
    examples: ["Tech tutorials", "DIY guides", "Educational content"]
  },
  {
    id: "gaming",
    name: "Gaming",
    icon: IconDeviceGamepad,
    description: "Exciting, action-packed, vibrant",
    prompt: "Gaming YouTube thumbnail, epic game screenshot background, intense action moment, '{TITLE}' in gaming font style, explosive effects, vibrant colors",
    style: "cyberpunk",
    examples: ["Let's Plays", "Gaming reviews", "Esports"]
  },
  {
    id: "vlog",
    name: "Vlog/Personal",
    icon: IconUser,
    description: "Personal, authentic, lifestyle",
    prompt: "Vlog YouTube thumbnail, candid photo of person with genuine expression, lifestyle background, '{TITLE}' in friendly font, warm color palette, personal connection",
    style: "photorealistic",
    examples: ["Daily vlogs", "Travel videos", "Lifestyle content"]
  },
  {
    id: "tech",
    name: "Tech Review",
    icon: IconDevices,
    description: "Modern, sleek, professional",
    prompt: "Tech review YouTube thumbnail, product prominently displayed, clean minimal background, '{TITLE}' in modern tech font, comparison elements, professional lighting",
    style: "flat-design",
    examples: ["Product reviews", "Tech news", "Unboxings"]
  }
]

export function ThumbnailCreator({ 
  projectId, 
  projectTitle, 
  projectVideoUrl,
  contentAnalysis,
  currentThumbnail,
  onThumbnailUpdate 
}: ThumbnailCreatorProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"generate" | "upload" | "history">("generate")
  const [selectedPersona, setSelectedPersona] = useState<string>("creator")
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState("photorealistic")
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string>("")
  const [selectedQuality, setSelectedQuality] = useState("high")
  
  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)
  
  // States for video snippets and personal photos
  const [videoSnippets, setVideoSnippets] = useState<VideoSnippet[]>([])
  const [loadingSnippets, setLoadingSnippets] = useState(false)
  const [personalPhotos, setPersonalPhotos] = useState<PersonalPhoto[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [showPersonalUpload, setShowPersonalUpload] = useState(false)
  const [uploadingPersonalPhoto, setUploadingPersonalPhoto] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // States for editing and history
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingThumbnail, setEditingThumbnail] = useState<string | null>(null)
  const [thumbnailHistory, setThumbnailHistory] = useState<ThumbnailHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Add state for user personas
  const [userPersonas, setUserPersonas] = useState<UserPersona[]>([])
  const [showCreatePersona, setShowCreatePersona] = useState(false)
  const [selectedUserPersona, setSelectedUserPersona] = useState<string | null>(null)
  const [personaName, setPersonaName] = useState("")
  const [personaDescription, setPersonaDescription] = useState("")

  // Load personal photos from project metadata
  useEffect(() => {
    loadPersonalPhotos()
    loadThumbnailHistory()
    loadUserPersonas()
  }, [projectId])

    const loadPersonalPhotos = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
      const { data } = await supabase
          .from('projects')
          .select('metadata')
          .eq('id', projectId)
          .single()
        
      if (data?.metadata?.personalPhotos) {
        setPersonalPhotos(data.metadata.personalPhotos.map((p: any) => ({
          ...p,
          uploadedAt: new Date(p.uploadedAt)
        })))
        }
      } catch (error) {
        console.error('Error loading personal photos:', error)
      }
    }
    
  // Load user personas from local storage
  const loadUserPersonas = async () => {
    try {
      const storedPersonas = localStorage.getItem('inflio_user_personas')
      if (storedPersonas) {
        const personas = JSON.parse(storedPersonas)
        setUserPersonas(personas.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt)
        })))
      }
    } catch (error) {
      console.error('Error loading user personas:', error)
    }
  }

  // Save user personas to local storage
  const saveUserPersonas = (personas: UserPersona[]) => {
    try {
      localStorage.setItem('inflio_user_personas', JSON.stringify(personas))
    } catch (error) {
      console.error('Error saving user personas:', error)
    }
  }

  // Create a new persona from selected photos
  const createPersona = async () => {
    if (!personaName.trim()) {
      toast.error("Please enter a persona name")
      return
    }

    if (selectedPhotos.length === 0) {
      toast.error("Please select at least one photo for the persona")
      return
    }

    const selectedPersonalPhotos = personalPhotos.filter(p => selectedPhotos.includes(p.id))
    
    const newPersona: UserPersona = {
      id: crypto.randomUUID(),
      name: personaName,
      description: personaDescription || `${personaName} persona for thumbnail generation`,
      photos: selectedPersonalPhotos,
      createdAt: new Date(),
      style: selectedStyle,
      promptTemplate: `featuring ${personaName} with professional appearance, engaging expression`,
      keywords: contentAnalysis?.keywords || []
    }

    const updatedPersonas = [...userPersonas, newPersona]
    setUserPersonas(updatedPersonas)
    saveUserPersonas(updatedPersonas)
    
    toast.success(`Persona "${personaName}" created successfully!`)
    setShowCreatePersona(false)
    setPersonaName("")
    setPersonaDescription("")
    
    // Auto-select the new persona
    setSelectedUserPersona(newPersona.id)
  }

  // Load persona photos when selected
  const loadPersonaPhotos = (personaId: string) => {
    const persona = userPersonas.find(p => p.id === personaId)
    if (persona) {
      // Replace current photos with persona photos
      setPersonalPhotos(persona.photos)
      setSelectedPhotos(persona.photos.map(p => p.id))
      setSelectedStyle(persona.style)
      toast.success(`Loaded "${persona.name}" persona`)
    }
  }

  // Delete a persona
  const deletePersona = (personaId: string) => {
    const updatedPersonas = userPersonas.filter(p => p.id !== personaId)
    setUserPersonas(updatedPersonas)
    saveUserPersonas(updatedPersonas)
    
    if (selectedUserPersona === personaId) {
      setSelectedUserPersona(null)
    }
    
    toast.success("Persona deleted")
  }

  // Load thumbnail history
  useEffect(() => {
    if (open && activeTab === "history") {
      loadThumbnailHistory()
    }
  }, [open, activeTab])

  // Update style when persona changes
  useEffect(() => {
    const persona = predefinedPersonas.find(p => p.id === selectedPersona)
    if (persona) {
      setSelectedStyle(persona.style)
    }
  }, [selectedPersona])

  // Generate video snippets when dialog opens
  useEffect(() => {
    if (open && projectVideoUrl && videoSnippets.length === 0) {
      generateVideoSnippets()
    }
  }, [open, projectVideoUrl])

  const loadAiSuggestions = async () => {
    setLoadingAiSuggestions(true)
    try {
      const response = await fetch('/api/generate-thumbnail-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      if (!response.ok) {
        throw new Error('Failed to load AI suggestions')
      }

      const data = await response.json()
      setAiSuggestions(data.suggestions || [])
      toast.success("AI suggestions generated!")
    } catch (error) {
      console.error('Error loading AI suggestions:', error)
      toast.error('Failed to load AI suggestions')
    } finally {
      setLoadingAiSuggestions(false)
    }
  }

  const useSuggestion = (suggestion: any) => {
    setCustomPrompt(suggestion.prompt)
    setSelectedStyle(suggestion.style)
    setSelectedSuggestion(suggestion.id)
    toast.success("AI suggestion applied!")
  }

  const loadThumbnailHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/generate-thumbnail?projectId=${projectId}`)
      if (!response.ok) throw new Error('Failed to load history')
      
      const data = await response.json()
      setThumbnailHistory(data.history || [])
    } catch (error) {
      console.error('Error loading thumbnail history:', error)
      toast.error('Failed to load thumbnail history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const generateVideoSnippets = async () => {
    if (!projectVideoUrl || !videoRef.current) return

    setLoadingSnippets(true)
    try {
      const video = videoRef.current
      video.src = projectVideoUrl
      
      await new Promise((resolve) => {
        video.addEventListener('loadedmetadata', resolve, { once: true })
      })

      const duration = video.duration
      const snippetCount = 6
      const snippets: VideoSnippet[] = []

      for (let i = 0; i < snippetCount; i++) {
        // Start from 10% into the video to avoid black frames
        const startOffset = duration * 0.1
        const endOffset = duration * 0.9
        const availableDuration = endOffset - startOffset
        const timestamp = startOffset + (availableDuration / (snippetCount - 1)) * i
        
        video.currentTime = timestamp

        await new Promise((resolve) => {
          video.addEventListener('seeked', resolve, { once: true })
        })

        // Wait longer for frame to render properly
        await new Promise(resolve => setTimeout(resolve, 200))

        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.95)
          
          snippets.push({
            id: `snippet-${i}`,
            timestamp,
            thumbnailUrl,
            selected: i < 3 // Auto-select first 3
          })
        }
      }

      setVideoSnippets(snippets)
    } catch (error) {
      console.error("Error generating video snippets:", error)
      toast.error("Failed to generate video snippets")
    } finally {
      setLoadingSnippets(false)
    }
  }

  const toggleSnippetSelection = (snippetId: string) => {
    setVideoSnippets(prev => 
      prev.map(snippet => 
        snippet.id === snippetId 
          ? { ...snippet, selected: !snippet.selected }
          : snippet
      )
    )
  }

  const handlePersonalPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if already at max photos
    if (personalPhotos.length >= 3) {
      toast.error("Maximum 3 personal photos allowed. Please delete one to upload another.")
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return
    }

    setUploadingPersonalPhoto(true)
    try {
      // Convert file to base64 for storage
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
      
      const newPhoto: PersonalPhoto = {
        id: crypto.randomUUID(),
        url: base64,  // Store base64 directly
        name: file.name,
        uploadedAt: new Date()
      }

      const updatedPhotos = [...personalPhotos, newPhoto]
      setPersonalPhotos(updatedPhotos)
      
      // Save to project metadata
      const supabase = createSupabaseBrowserClient()
      const { data: project } = await supabase
              .from('projects')
              .select('metadata')
              .eq('id', projectId)
              .single()

      await supabase
        .from('projects')
        .update({
          metadata: {
            ...(project?.metadata || {}),
            personalPhotos: updatedPhotos.map(p => ({
              ...p,
              uploadedAt: p.uploadedAt.toISOString()
            }))
          }
        })
        .eq('id', projectId)
      
      toast.success("Personal photo uploaded successfully!")
      setShowPersonalUpload(false)
      
      // Auto-select the new photo
      setSelectedPhotos([...selectedPhotos, newPhoto.id])
    } catch (error) {
      console.error("Error uploading personal photo:", error)
      toast.error("Failed to upload personal photo")
    } finally {
      setUploadingPersonalPhoto(false)
    }
  }

  const deletePersonalPhoto = async (photoId: string) => {
    const updatedPhotos = personalPhotos.filter(p => p.id !== photoId)
    setPersonalPhotos(updatedPhotos)
    setSelectedPhotos(prev => prev.filter(id => id !== photoId))
    
    // Save to project metadata
    const supabase = createSupabaseBrowserClient()
    await supabase
      .from('projects')
      .update({
        metadata: {
          ...(await supabase
            .from('projects')
            .select('metadata')
            .eq('id', projectId)
            .single()
            .then(res => res.data?.metadata || {})),
          personalPhotos: updatedPhotos
        }
      })
      .eq('id', projectId)
    
    toast.success("Photo deleted")
  }

  const generatePromptFromContent = async () => {
    try {
      const persona = predefinedPersonas.find(p => p.id === selectedPersona)
      if (!persona) return

      const mainTopic = contentAnalysis?.topics?.[0] || projectTitle
      const keywords = contentAnalysis?.keywords?.slice(0, 3).join(", ") || ""
      const sentiment = contentAnalysis?.sentiment || "engaging"
      
      // YouTube thumbnail specific prompt structure
      let prompt = `YouTube thumbnail, 1920x1080, ultra HD quality, `
      
      // If user has personal photos or persona, make them the focal point
      if (selectedPhotos.length > 0 || selectedUserPersona) {
        const personaInfo = selectedUserPersona ? userPersonas.find(p => p.id === selectedUserPersona) : null
        const personaName = personaInfo?.name || "person"
        
        prompt += `PROMINENTLY featuring ${personaName}'s face from the reference photo with ${sentiment} expression, `
        prompt += `${personaName} should be looking at camera or slightly off-camera with engaging eye contact, `
        prompt += `face takes up 30-40% of frame, clear and sharp facial features, `
        
        // Merge with video snippets if available
        const selectedSnippets = videoSnippets.filter(s => s.selected)
        if (selectedSnippets.length > 0) {
          prompt += `composite image with ${personaName} overlaid on video scene elements, `
          prompt += `background shows key moments from the video, `
          prompt += `professional compositing with natural lighting integration, `
        }
      }
      
      // Add the main content
      prompt += persona.promptTemplate
        .replace("{SUBJECT}", mainTopic)
        .replace("{TITLE}", projectTitle.length > 40 ? projectTitle.substring(0, 37) + "..." : projectTitle)
      
      // YouTube-specific requirements
      prompt += `, bright saturated colors, high contrast, `
      prompt += `bold readable text overlay, clickbait style but professional, `
      prompt += `rule of thirds composition, dramatic lighting, `
      
      if (keywords) {
        prompt += `visual elements representing: ${keywords}, `
      }
      
      // Final quality markers
      prompt += `YouTube thumbnail best practices, viral thumbnail style, `
      prompt += `professional photography quality, eye-catching design that stands out in feed, `
      prompt += `no blur, sharp focus on face and text, vibrant and engaging, `
      prompt += `photorealistic face integration, seamless composite`
      
      setGeneratedPrompt(prompt)
      toast.success("YouTube thumbnail prompt generated!")
    } catch (error) {
      console.error("Error generating prompt:", error)
      toast.error("Failed to generate prompt")
    }
  }

  const handleGenerateThumbnail = async () => {
    const finalPrompt = customPrompt || generatedPrompt
    if (!finalPrompt.trim()) {
      toast.error("Please generate or enter a prompt first")
      return
    }

    setIsGenerating(true)
    try {
      // Prepare video snippets data
      const selectedSnippetData = videoSnippets
        .filter(s => s.selected)
        .map(s => ({ 
          timestamp: s.timestamp, 
          thumbnail: s.thumbnailUrl,
          isBase64: true  // Mark as base64 for API handling
        }))

      // Prepare personal photos data - use base64 directly
      const selectedPhotoUrls = personalPhotos
        .filter(p => selectedPhotos.includes(p.id))
        .map(p => p.url)  // Already base64

      // Get current persona info
      const currentPersona = selectedUserPersona 
        ? userPersonas.find(p => p.id === selectedUserPersona)
        : null

      const response = await fetch('/api/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          prompt: finalPrompt,
          mode: isEditMode ? 'edit' : 'generate',
          videoSnippets: selectedSnippetData,
          personalPhotos: selectedPhotoUrls,
          referenceImageUrl: editingThumbnail,
          style: selectedStyle,
          quality: selectedQuality,
          // Merge video background with persona
          mergeVideoWithPersona: selectedSnippetData.length > 0 && selectedPhotoUrls.length > 0,
          // Additional context for better generation
          projectContext: {
            title: projectTitle,
            topics: contentAnalysis?.topics || [],
            keywords: contentAnalysis?.keywords || [],
            summary: contentAnalysis?.summary || '',
            sentiment: contentAnalysis?.sentiment || 'neutral',
            selectedPersona: selectedPersona,
            currentPersona: currentPersona ? {
              name: currentPersona.name,
              style: currentPersona.style
            } : null
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        
        // Check for specific error types and provide helpful messages
        if (response.status === 422 || error.error?.includes('unprocessable')) {
          // Show a more helpful error dialog for unprocessable errors
          toast.error(
            "AI Service Error: The combination of persona photos and video snippets couldn't be processed.",
            {
              description: "Try one of these options:\n• Generate without personal photos first\n• Use only personal photos without video snippets\n• Upload a custom image instead",
              duration: 10000 // Show for longer
            }
          )
          
          // Optionally clear selections to help user
          if (window.confirm("Would you like to clear the personal photos and try again?")) {
            setSelectedPhotos([])
            toast.info("Personal photos cleared. Try generating again.")
          }
          
          throw new Error("Complex image processing failed")
        }
        
        throw new Error(error.error || error.details || 'Failed to generate thumbnail')
      }

      const data = await response.json()
      if (data.imageUrl) {
        setThumbnailUrl(data.imageUrl)
        toast.success("Thumbnail generated successfully!")
        
        // Save the successful generation with the persona if applicable
        if (currentPersona) {
          toast.success(`Generated with "${currentPersona.name}" persona`)
        }
      }
    } catch (error) {
      console.error("Error generating thumbnail:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate thumbnail")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditThumbnail = (thumbnailUrl: string) => {
    setIsEditMode(true)
    setEditingThumbnail(thumbnailUrl)
    setThumbnailUrl(thumbnailUrl)
    setActiveTab("generate")
    toast.info("Edit mode activated. Modify the prompt to refine this thumbnail.")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setUploadedFile(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleConfirmThumbnail = async () => {
    let finalThumbnailUrl = ""

    if (activeTab === "generate" && thumbnailUrl) {
      finalThumbnailUrl = thumbnailUrl
    } else if (activeTab === "upload" && uploadedFile) {
      try {
        const formData = new FormData()
        formData.append('file', uploadedFile)
        formData.append('projectId', projectId)
        formData.append('type', 'thumbnail')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Failed to upload thumbnail')
        }

        const data = await response.json()
        finalThumbnailUrl = data.url
      } catch (error) {
        console.error("Error uploading thumbnail:", error)
        toast.error("Failed to upload thumbnail")
        return
      }
    }

    if (finalThumbnailUrl) {
      onThumbnailUpdate(finalThumbnailUrl)
      toast.success("Thumbnail updated successfully!")
      setOpen(false)
      
      // Reset state
      setGeneratedPrompt("")
      setCustomPrompt("")
      setThumbnailUrl("")
      setUploadedFile(null)
      setUploadPreview("")
      setVideoSnippets([])
      setSelectedPhotos([])
      setIsEditMode(false)
      setEditingThumbnail(null)
    }
  }

  const selectedSnippetCount = videoSnippets.filter(s => s.selected).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={currentThumbnail ? "outline" : "default"} 
          size="sm" 
          className={cn(
            "gap-2 transition-all",
            !currentThumbnail && "animate-pulse shadow-lg"
          )}
        >
          <IconPhoto className="h-4 w-4" />
          {currentThumbnail ? "Update Thumbnail" : "Generate Thumbnail"}
          {!currentThumbnail && (
            <Badge variant="secondary" className="ml-1 text-xs">New</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[75vh] flex flex-col p-0 overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b flex-shrink-0">
        <DialogHeader>
          <DialogTitle>Create Video Thumbnail</DialogTitle>
          <DialogDescription>
              Use FAL AI to generate professional thumbnails or upload your own
          </DialogDescription>
        </DialogHeader>
        </div>

        {/* Hidden video element for snippet generation */}
        <video ref={videoRef} className="hidden" crossOrigin="anonymous" />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "generate" | "upload" | "history")} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-3 grid w-auto grid-cols-3 flex-shrink-0">
            <TabsTrigger value="generate" className="gap-2">
              <IconSparkles className="h-4 w-4" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <IconUpload className="h-4 w-4" />
              Upload Custom
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <IconHistory className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
            <TabsContent value="generate" className="space-y-4 mt-0">
              {/* YouTube Thumbnail Best Practices Alert */}
              {!isEditMode && selectedPhotos.length === 0 && (
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <IconInfoCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> YouTube thumbnails with faces get 38% more clicks! Upload a personal photo below to create high-converting thumbnails with your face prominently featured.
                  </AlertDescription>
                </Alert>
              )}

              {/* Edit Mode Indicator */}
              {isEditMode && (
                <Alert>
                  <IconEdit className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>You are editing an existing thumbnail. Modify the prompt to refine it.</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsEditMode(false)
                        setEditingThumbnail(null)
                        setThumbnailUrl("")
                      }}
                    >
                      <IconX className="h-4 w-4 mr-1" />
                      Cancel Edit
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Preset Templates Section - NEW */}
              {!isEditMode && (
                <div className="space-y-2">
                  <Label className="text-sm">Quick Templates</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {presetTemplates.slice(0, 3).map((template) => {
                      const Icon = template.icon
                      return (
                        <Button
                          key={template.id}
                          variant={selectedStyle === template.style && generatedPrompt.includes(template.prompt.substring(0, 20)) ? "default" : "outline"}
                          size="sm"
                          className="h-auto p-3 justify-start"
                          onClick={() => {
                            const adaptedPrompt = template.prompt.replace('{TITLE}', projectTitle)
                            setGeneratedPrompt(adaptedPrompt)
                            setSelectedStyle(template.style)
                            toast.success(`${template.name} template applied!`)
                          }}
                        >
                          <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="text-xs">{template.name}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Video Snippets Section */}
              {projectVideoUrl && !isEditMode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Video Frames</Label>
                    <div className="flex items-center gap-2">
                      {selectedSnippetCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {selectedSnippetCount} selected
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={generateVideoSnippets}
                        disabled={loadingSnippets}
                        className="h-7 px-2"
                      >
                        <IconRefresh className={cn("h-3 w-3", loadingSnippets && "animate-spin")} />
                      </Button>
                    </div>
                  </div>
                  
                  {loadingSnippets ? (
                    <div className="flex items-center justify-center h-32 border rounded-lg bg-muted/30">
                      <div className="flex flex-col items-center gap-2">
                        <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Extracting video frames...</span>
                      </div>
                    </div>
                  ) : videoSnippets.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {videoSnippets.map((snippet) => (
                        <div
                          key={snippet.id}
                          className={cn(
                            "relative cursor-pointer rounded-lg overflow-hidden transition-all border-2",
                            snippet.selected 
                              ? "border-primary shadow-md scale-[1.02]" 
                              : "border-transparent hover:border-muted-foreground/30"
                          )}
                          onClick={() => toggleSnippetSelection(snippet.id)}
                        >
                          <div className="aspect-video relative">
                            <img
                              src={snippet.thumbnailUrl}
                              alt={`Frame ${snippet.id}`}
                              className="w-full h-full object-cover"
                            />
                            {snippet.selected && (
                              <div className="absolute inset-0 bg-primary/10">
                                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                                  <IconCheck className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <IconVideo className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No video frames available</p>
                    </div>
                  )}
                </div>
              )}

              {/* Personal Photos Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Personal Photos</Label>
                  <div className="flex items-center gap-2">
                    {userPersonas.length > 0 && (
                      <Select value={selectedUserPersona || ""} onValueChange={(value) => {
                        setSelectedUserPersona(value)
                        if (value) loadPersonaPhotos(value)
                      }}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Load persona" />
                        </SelectTrigger>
                        <SelectContent>
                          {userPersonas.map((persona) => (
                            <SelectItem key={persona.id} value={persona.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{persona.name}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {persona.photos.length} photos
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPersonalUpload(true)}
                      disabled={personalPhotos.length >= 3}
                  >
                    <IconPlus className="h-4 w-4 mr-1" />
                    Add Photo
                  </Button>
                  </div>
                </div>
                
                {/* Tips for Personal Photos */}
                {personalPhotos.length === 0 && (
                  <Alert className="border-blue-500/50 bg-blue-500/10">
                    <IconInfoCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      <strong>Photo Tips for Best Results:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Use high-quality headshots with clear facial features</li>
                        <li>• Ensure good lighting - natural light works best</li>
                        <li>• Include variety: smiling, serious, and engaging expressions</li>
                        <li>• Avoid sunglasses or heavy shadows on face</li>
                        <li>• Professional or casual attire depending on your brand</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {personalPhotos.length > 0 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                    {personalPhotos.map((photo) => (
                      <div
                        key={photo.id}
                          className={cn(
                            "relative cursor-pointer rounded-lg overflow-hidden transition-all border-2",
                            selectedPhotos.includes(photo.id) 
                              ? "border-primary shadow-md scale-[1.02]"
                              : "border-transparent hover:border-muted-foreground/30"
                          )}
                          onClick={() => {
                            if (selectedPhotos.includes(photo.id)) {
                              setSelectedPhotos(prev => prev.filter(id => id !== photo.id))
                            } else {
                              setSelectedPhotos(prev => [...prev, photo.id])
                            }
                          }}
                        >
                          <div className="aspect-square relative">
                            <img
                              src={photo.url}
                              alt={photo.name}
                              className="w-full h-full object-cover"
                            />
                            {selectedPhotos.includes(photo.id) && (
                              <div className="absolute inset-0 bg-primary/10">
                                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                                  <IconCheck className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                        <Button
                          size="icon"
                              variant="destructive"
                              className="absolute bottom-2 right-2 h-6 w-6 opacity-0 hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePersonalPhoto(photo.id)
                          }}
                        >
                              <IconTrash className="h-3 w-3" />
                        </Button>
                          </div>
                          <p className="text-xs text-center mt-1 truncate px-1">
                            {photo.name}
                          </p>
                      </div>
                    ))}
                      {personalPhotos.length < 3 && (
                        <div
                          className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                          onClick={() => setShowPersonalUpload(true)}
                        >
                          <div className="text-center">
                            <IconPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Add Photo</p>
                  </div>
                        </div>
                      )}
                    </div>

                    {/* Create Persona Button */}
                    {selectedPhotos.length > 0 && (
                      <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                          className="w-full"
                          onClick={() => setShowCreatePersona(true)}
                        >
                          <IconUser className="h-4 w-4 mr-2" />
                          Save as Persona
                        </Button>
                        {selectedPhotos.length > 0 && (
                          <Badge variant="secondary">
                            {selectedPhotos.length} selected
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {personalPhotos.length === 0 && (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <IconCamera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">No Personal Photos Yet</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upload photos to create AI thumbnails with your face
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setShowPersonalUpload(true)}
                    >
                      <IconUpload className="h-4 w-4 mr-2" />
                      Upload Your First Photo
                    </Button>
                  </div>
                )}
              </div>

              {/* AI Suggestions Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <IconSparkles className="h-3 w-3 text-primary" />
                    AI Suggestions
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAiSuggestions}
                    disabled={loadingAiSuggestions}
                    className="h-7 text-xs"
                  >
                    {loadingAiSuggestions ? (
                      <>
                        <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <IconWand className="h-4 w-4 mr-1" />
                        Get Suggestions
                      </>
                    )}
                  </Button>
                </div>

                {aiSuggestions.length > 0 && (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto rounded-md border p-2">
                    {aiSuggestions.slice(0, 3).map((suggestion) => (
                      <Card
                        key={suggestion.id}
                        className={cn(
                          "cursor-pointer transition-all p-3",
                          selectedSuggestion === suggestion.id && "border-primary shadow-md"
                        )}
                        onClick={() => useSuggestion(suggestion)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {suggestion.emotion}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <IconSparkles className="h-3 w-3" />
                                {suggestion.clickabilityScore}/10
                              </div>
                            </div>
                            
                            <p className="text-sm font-medium line-clamp-1">
                              {suggestion.prompt}
                            </p>
                            
                            {suggestion.textOverlay && (
                              <Badge variant="outline" className="text-xs font-bold">
                                {suggestion.textOverlay}
                              </Badge>
                            )}
                          </div>
                          
                          {selectedSuggestion === suggestion.id && (
                            <IconCheck className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {!loadingAiSuggestions && aiSuggestions.length === 0 && (
                  <div className="border rounded-lg p-6 text-center bg-muted/30">
                    <IconWand className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click "Get Suggestions" to receive AI-powered thumbnail ideas
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Powered by GPT-4.1 for intelligent, high-converting thumbnails
                    </p>
                  </div>
                )}
              </div>

              {/* Saved Personas Section */}
              {userPersonas.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Saved Personas</Label>
                      <p className="text-sm text-muted-foreground">Your reusable thumbnail personas</p>
                    </div>
                    <Badge variant="secondary">{userPersonas.length} personas</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {userPersonas.map((persona) => (
                      <Card
                        key={persona.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          selectedUserPersona === persona.id && "border-primary ring-2 ring-primary/20"
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{persona.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">{persona.description}</p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                deletePersona(persona.id)
                              }}
                            >
                              <IconTrash className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-1 mb-2">
                            {persona.photos.slice(0, 3).map((photo, idx) => (
                              <div key={idx} className="w-8 h-8 rounded overflow-hidden">
                                <img
                                  src={photo.url}
                                  alt={`${persona.name} ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            <Badge variant="outline" className="text-xs ml-auto">
                              {persona.photos.length} photos
                            </Badge>
                          </div>
                          
                          <Button
                            size="sm"
                            variant={selectedUserPersona === persona.id ? "default" : "outline"}
                            className="w-full"
                            onClick={() => {
                              setSelectedUserPersona(persona.id)
                              loadPersonaPhotos(persona.id)
                            }}
                          >
                            {selectedUserPersona === persona.id ? (
                              <>
                                <IconCheck className="h-3 w-3 mr-1" />
                                Selected
                              </>
                            ) : (
                              <>
                                <IconUser className="h-3 w-3 mr-1" />
                                Use Persona
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Style Selection */}
              <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                  <Label>Thumbnail Style</Label>
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {predefinedPersonas.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                        <div>
                          <div className="font-medium">{persona.name}</div>
                            <div className="text-xs text-muted-foreground">{persona.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
                  <Label>Quality</Label>
                  <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">
                        <div>
                          <div className="font-medium">High Quality</div>
                          <div className="text-xs text-muted-foreground">Best results, slower generation</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div>
                          <div className="font-medium">Medium Quality</div>
                          <div className="text-xs text-muted-foreground">Balanced speed and quality</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* AI Prompt Section */}
              <div className="space-y-3">
              <div className="flex items-center justify-between">
                  <Label>AI Prompt</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePromptFromContent}
                  >
                    <IconWand className="h-4 w-4 mr-2" />
                    Auto Generate
                </Button>
              </div>
              
              {generatedPrompt && (
                <Alert>
                  <IconInfoCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {generatedPrompt}
                  </AlertDescription>
                </Alert>
              )}
              
              <Textarea
                  placeholder={isEditMode ? "Describe how you want to modify this thumbnail..." : "Describe your ideal thumbnail..."}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                className="resize-none"
              />
            </div>

            {/* Generate Button */}
            <div className="flex gap-2">
            <Button
                className="flex-1"
                size="lg"
              onClick={handleGenerateThumbnail}
                disabled={isGenerating || (!generatedPrompt && !customPrompt)}
            >
                {isGenerating ? (
                <>
                    <IconLoader2 className="h-5 w-5 mr-2 animate-spin" />
                    {isEditMode ? 'Editing Thumbnail...' : 'Generating Thumbnail...'}
                </>
              ) : (
                <>
                    <IconSparkles className="h-5 w-5 mr-2" />
                    {isEditMode ? 'Apply Edits' : 'Generate Thumbnail'}
                </>
              )}
            </Button>
              
              {/* Batch Generate Button */}
              {!isEditMode && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={async () => {
                    const finalPrompt = customPrompt || generatedPrompt
                    if (!finalPrompt.trim()) {
                      toast.error("Please generate or enter a prompt first")
                      return
                    }

                    setIsGenerating(true)
                    try {
                      const response = await fetch('/api/generate-thumbnail/batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          projectId,
                          basePrompt: finalPrompt,
                          count: 3,
                          styles: ['photorealistic', 'gradient', 'corporate'],
                          quality: selectedQuality,
                          projectContext: {
                            title: projectTitle,
                            topics: contentAnalysis?.topics || [],
                            keywords: contentAnalysis?.keywords || []
                          }
                        })
                      })

                      if (!response.ok) {
                        throw new Error('Failed to generate batch thumbnails')
                      }

                      const data = await response.json()
                      toast.success(`Generated ${data.count} thumbnail variations!`)
                      
                      // Refresh history
                      await loadThumbnailHistory()
                      setActiveTab('history')
                    } catch (error) {
                      console.error("Error generating batch thumbnails:", error)
                      toast.error("Failed to generate thumbnail variations")
                    } finally {
                      setIsGenerating(false)
                    }
                  }}
                  disabled={isGenerating || (!generatedPrompt && !customPrompt)}
                >
                  <IconCopy className="h-5 w-5 mr-2" />
                  Generate 3 Variations
                </Button>
              )}
            </div>

              {/* Generated Thumbnail Preview */}
            {thumbnailUrl && (
              <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {isEditMode ? 'Edited Thumbnail' : 'Generated Thumbnail'}
                    </CardTitle>
                </CardHeader>
                  <CardContent className="space-y-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={thumbnailUrl}
                      alt="Generated thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                    <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(thumbnailUrl, '_blank')}
                    >
                      <IconDownload className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEditThumbnail(thumbnailUrl)}
                      >
                        <IconEdit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                      className="flex-1"
                      onClick={handleConfirmThumbnail}
                    >
                      <IconCheck className="h-4 w-4 mr-2" />
                        Use This
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-0">
            <div className="space-y-4">
                <div>
                  <Label className="text-base">Upload Custom Thumbnail</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your own thumbnail image
                  </p>
                </div>
                
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <Label
                  htmlFor="thumbnail-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                >
                    <div className="p-3 rounded-full bg-muted">
                  <IconUpload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  <div>
                    <p className="font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground">PNG or JPG (max 5MB)</p>
                      <p className="text-xs text-muted-foreground mt-1">Recommended: 1280×720</p>
                  </div>
                </Label>
              </div>

              {/* Upload Preview */}
              {uploadPreview && (
                <Card>
                    <CardHeader className="pb-3">
                    <CardTitle className="text-base">Uploaded Thumbnail</CardTitle>
                  </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={uploadPreview}
                        alt="Uploaded thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                        className="w-full"
                        size="lg"
                      onClick={handleConfirmThumbnail}
                    >
                      <IconCheck className="h-4 w-4 mr-2" />
                      Use This Thumbnail
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Thumbnail History</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    View and reuse previously generated thumbnails
                  </p>
                  </div>
                  {thumbnailHistory.length > 0 && (
                    <Badge variant="secondary">
                      {thumbnailHistory.length} thumbnails
                    </Badge>
                  )}
                </div>

                {loadingHistory ? (
                  <div className="flex items-center justify-center h-32">
                    <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : thumbnailHistory.length > 0 ? (
                  <div className="space-y-6">
                    {/* Group thumbnails by batch */}
                    {(() => {
                      const grouped = thumbnailHistory.reduce((acc: any, item: any) => {
                        const batchId = item.metadata?.batchId || 'single'
                        if (!acc[batchId]) acc[batchId] = []
                        acc[batchId].push(item)
                        return acc
                      }, {})

                      return Object.entries(grouped).map(([batchId, items]: [string, any]) => (
                        <div key={batchId} className="space-y-3">
                          {batchId !== 'single' && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                Batch
                              </Badge>
                              <span>{items.length} variations</span>
                              <span>•</span>
                              <span>{new Date(items[0].createdAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {items.map((item: any, index: number) => (
                              <Card 
                                key={`${batchId}-${index}`} 
                                className={cn(
                                  "overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                                  thumbnailUrl === item.imageUrl && "ring-2 ring-primary"
                                )}
                              >
                                <div className="aspect-video relative group">
              <img
                            src={item.imageUrl}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                                  
                                  {/* Overlay with actions */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                                        variant="secondary"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditThumbnail(item.imageUrl)
                                        }}
                            >
                                        <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                                        variant="secondary"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          window.open(item.imageUrl, '_blank')
                                        }}
                                      >
                                        <IconDownload className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Badges */}
                                  <div className="absolute top-2 left-2 flex gap-1">
                                    {item.mode === 'batch' && (
                                      <Badge className="text-xs" variant="secondary">
                                        Batch
                                      </Badge>
                                    )}
                                    {item.style && (
                                      <Badge className="text-xs" variant="outline">
                                        {item.style}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {currentThumbnail === item.imageUrl && (
                                    <div className="absolute top-2 right-2">
                                      <Badge className="text-xs bg-green-500">
                                        Current
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                
                                <CardContent className="p-3">
                                  <Button
                                    className="w-full"
                                    size="sm"
                                    variant={thumbnailUrl === item.imageUrl ? "default" : "outline"}
                              onClick={() => {
                                setThumbnailUrl(item.imageUrl)
                                      toast.success("Thumbnail selected!")
                              }}
                            >
                                    {thumbnailUrl === item.imageUrl ? (
                                      <>
                              <IconCheck className="h-3 w-3 mr-1" />
                                        Selected
                                      </>
                                    ) : (
                                      <>
                                        <IconPhoto className="h-3 w-3 mr-1" />
                                        Use This
                                      </>
                                    )}
                            </Button>
                        </CardContent>
                      </Card>
                    ))}
                          </div>
                        </div>
                      ))
                    })()}
                    
                    {/* Use Selected Button */}
                    {thumbnailUrl && (
                      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t rounded-lg">
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handleConfirmThumbnail}
                        >
                          <IconCheck className="h-5 w-5 mr-2" />
                          Use Selected Thumbnail
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconHistory className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No thumbnail history yet</p>
                    <p className="text-sm">Generated thumbnails will appear here</p>
          </div>
        )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Personal Photo Upload Dialog */}
        <Dialog open={showPersonalUpload} onOpenChange={setShowPersonalUpload}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Personal Photo</DialogTitle>
              <DialogDescription>
                Add a photo of yourself for personalized AI thumbnails (max 3 photos)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="border-green-500/50 bg-green-500/10">
                <IconInfoCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>Best Photo Guidelines:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>✓ High-resolution headshot (min 500x500px)</li>
                    <li>✓ Face clearly visible, centered in frame</li>
                    <li>✓ Good lighting - avoid harsh shadows</li>
                    <li>✓ Neutral background preferred</li>
                    <li>✓ Natural expression, looking at camera</li>
                    <li>✓ No sunglasses or face obstructions</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              {personalPhotos.length >= 3 ? (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <IconInfoCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    You've reached the maximum of 3 photos. Please delete an existing photo to upload a new one.
                  </AlertDescription>
                </Alert>
              ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePersonalPhotoUpload}
                    disabled={uploadingPersonalPhoto || personalPhotos.length >= 3}
                  className="hidden"
                  id="personal-photo-upload"
                />
                <Label
                  htmlFor="personal-photo-upload"
                  className={cn(
                    "cursor-pointer flex flex-col items-center gap-3",
                      (uploadingPersonalPhoto || personalPhotos.length >= 3) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {uploadingPersonalPhoto ? (
                    <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <IconCamera className="h-8 w-8 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {uploadingPersonalPhoto ? "Uploading..." : "Click to upload"}
                    </p>
                    <p className="text-sm text-muted-foreground">PNG or JPG (max 10MB)</p>
                  </div>
                </Label>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground text-center">
                <p>💡 <strong>Pro tip:</strong> Upload 3 different expressions (happy, serious, surprised) for more thumbnail variety</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Persona Dialog */}
        <Dialog open={showCreatePersona} onOpenChange={setShowCreatePersona}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Persona</DialogTitle>
              <DialogDescription>
                Save your selected photos as a reusable persona for future thumbnails
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="persona-name">Persona Name</Label>
                <Input
                  id="persona-name"
                  placeholder="e.g., Professional Me, Casual Me, etc."
                  value={personaName}
                  onChange={(e) => setPersonaName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="persona-description">Description (optional)</Label>
                <Textarea
                  id="persona-description"
                  placeholder="Describe when to use this persona..."
                  value={personaDescription}
                  onChange={(e) => setPersonaDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Selected Photos</Label>
                <div className="grid grid-cols-3 gap-2">
                  {personalPhotos
                    .filter(p => selectedPhotos.includes(p.id))
                    .map((photo) => (
                      <div key={photo.id} className="aspect-square rounded overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              
              <Alert>
                <IconInfoCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Personas are saved locally and can be reused across all your projects for consistent branding.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreatePersona(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={createPersona}
                  disabled={!personaName.trim() || selectedPhotos.length === 0}
                >
                  <IconCheck className="h-4 w-4 mr-2" />
                  Create Persona
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
} 