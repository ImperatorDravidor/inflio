"use client"

import { useState, useEffect } from "react"
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
import { 
  IconPhoto, 
  IconUpload,
  IconSparkles,
  IconUser,
  IconLoader2,
  IconCheck,
  IconInfoCircle,
  IconDownload,
  IconArrowRight
} from "@tabler/icons-react"
import { toast } from "sonner"
import { predefinedStyles } from "@/lib/ai-image-service"
import { cn } from "@/lib/utils"

interface ThumbnailCreatorProps {
  projectId: string
  projectTitle: string
  contentAnalysis?: any
  currentThumbnail?: string
  onThumbnailUpdate: (thumbnailUrl: string) => void
}

interface Persona {
  id: string
  name: string
  description: string
  style: string
  promptTemplate: string
}

const predefinedPersonas: Persona[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean, corporate style for business content",
    style: "corporate",
    promptTemplate: "Professional YouTube thumbnail featuring {SUBJECT}, clean corporate design, modern typography overlay showing '{TITLE}', high contrast, business aesthetic, premium quality"
  },
  {
    id: "educator",
    name: "Educator",
    description: "Educational and informative design",
    style: "flat-design",
    promptTemplate: "Educational thumbnail design showing {SUBJECT}, clear infographic elements, bold readable text '{TITLE}', bright colors, knowledge-focused imagery, engaging learning aesthetic"
  },
  {
    id: "creator",
    name: "Content Creator",
    description: "Vibrant, eye-catching style for social media",
    style: "gradient",
    promptTemplate: "Viral YouTube thumbnail with {SUBJECT}, dramatic facial expression, bold colorful text overlay '{TITLE}', high energy composition, trending creator style, mobile-optimized"
  },
  {
    id: "tech",
    name: "Tech Reviewer",
    description: "Modern tech aesthetic with futuristic elements",
    style: "cyberpunk",
    promptTemplate: "Tech review thumbnail featuring {SUBJECT}, futuristic neon accents, modern tech aesthetic, bold text '{TITLE}', clean product photography, innovative design elements"
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    description: "Warm, relatable aesthetic for lifestyle content",
    style: "photorealistic",
    promptTemplate: "Lifestyle thumbnail showing {SUBJECT}, warm natural lighting, authentic moment captured, stylish text overlay '{TITLE}', Instagram-worthy aesthetic, aspirational yet relatable"
  }
]

export function ThumbnailCreator({ 
  projectId, 
  projectTitle, 
  contentAnalysis,
  currentThumbnail,
  onThumbnailUpdate 
}: ThumbnailCreatorProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"generate" | "upload">("generate")
  const [selectedPersona, setSelectedPersona] = useState<string>("professional")
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState("corporate")
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string>("")
  const [selectedQuality] = useState("high")
  const [selectedSize] = useState("1536x1024") // YouTube thumbnail aspect ratio

  // Update style when persona changes
  useEffect(() => {
    const persona = predefinedPersonas.find(p => p.id === selectedPersona)
    if (persona) {
      setSelectedStyle(persona.style)
    }
  }, [selectedPersona])

  const generatePromptFromContent = async () => {
    if (!contentAnalysis) {
      toast.error("Content analysis is required to generate prompts")
      return
    }

    setIsGeneratingPrompt(true)
    try {
      const persona = predefinedPersonas.find(p => p.id === selectedPersona)
      if (!persona) return

      // Extract key elements from content analysis
      const mainTopic = contentAnalysis.topics?.[0] || projectTitle
      const keywords = contentAnalysis.keywords?.slice(0, 3).join(", ") || ""
      const sentiment = contentAnalysis.sentiment || "engaging"
      
      // Generate prompt based on persona template
      let prompt = persona.promptTemplate
        .replace("{SUBJECT}", mainTopic)
        .replace("{TITLE}", projectTitle.length > 50 ? projectTitle.substring(0, 47) + "..." : projectTitle)
      
      // Add content-specific enhancements
      if (keywords) {
        prompt += `, incorporating visual elements related to ${keywords}`
      }
      
      prompt += `, ${sentiment} emotional tone, YouTube thumbnail dimensions, optimized for high CTR`
      
      setGeneratedPrompt(prompt)
      toast.success("Prompt generated from content!")
    } catch (error) {
      console.error("Error generating prompt:", error)
      toast.error("Failed to generate prompt")
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const handleGenerateThumbnail = async () => {
    const finalPrompt = customPrompt || generatedPrompt
    if (!finalPrompt.trim()) {
      toast.error("Please generate or enter a prompt first")
      return
    }

    setIsGeneratingThumbnail(true)
    try {
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          prompt: finalPrompt,
          quality: selectedQuality,
          size: selectedSize,
          style: selectedStyle,
          type: 'thumbnail'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate thumbnail')
      }

      const data = await response.json()
      if (data.imageUrl) {
        setThumbnailUrl(data.imageUrl)
        toast.success("Thumbnail generated successfully!")
      }
    } catch (error) {
      console.error("Error generating thumbnail:", error)
      toast.error("Failed to generate thumbnail")
    } finally {
      setIsGeneratingThumbnail(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setUploadedFile(file)
    
    // Create preview
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
      // Upload the file to storage
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
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconPhoto className="h-4 w-4 mr-2" />
          Create Thumbnail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Video Thumbnail</DialogTitle>
          <DialogDescription>
            Generate an AI thumbnail or upload your own custom image
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "generate" | "upload")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">
              <IconSparkles className="h-4 w-4 mr-2" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="upload">
              <IconUpload className="h-4 w-4 mr-2" />
              Upload Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            {/* Persona Selection */}
            <div className="space-y-2">
              <Label>Select Persona</Label>
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {predefinedPersonas.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      <div className="flex items-center gap-2">
                        <IconUser className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{persona.name}</div>
                          <div className="text-sm text-muted-foreground">{persona.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Prompt Button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Thumbnail Prompt</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePromptFromContent}
                  disabled={isGeneratingPrompt || !contentAnalysis}
                >
                  {isGeneratingPrompt ? (
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <IconSparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate from Content
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
                placeholder="Enter custom prompt or modify the generated one..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Style Selection */}
            <div className="space-y-2">
              <Label>Visual Style</Label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {predefinedStyles.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      <div>
                        <div className="font-medium">{style.name}</div>
                        <div className="text-sm text-muted-foreground">{style.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button
              className="w-full"
              onClick={handleGenerateThumbnail}
              disabled={isGeneratingThumbnail || (!generatedPrompt && !customPrompt)}
            >
              {isGeneratingThumbnail ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Thumbnail...
                </>
              ) : (
                <>
                  <IconSparkles className="h-4 w-4 mr-2" />
                  Generate Thumbnail
                </>
              )}
            </Button>

            {/* Preview */}
            {thumbnailUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Generated Thumbnail</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={thumbnailUrl}
                      alt="Generated thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(thumbnailUrl, '_blank')}
                    >
                      <IconDownload className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleConfirmThumbnail}
                    >
                      <IconCheck className="h-4 w-4 mr-2" />
                      Use This Thumbnail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <Label>Upload Custom Thumbnail</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <Label
                  htmlFor="thumbnail-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <IconUpload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
                    <p className="text-xs text-muted-foreground mt-1">Recommended: 1280x720 or 1920x1080</p>
                  </div>
                </Label>
              </div>

              {/* Upload Preview */}
              {uploadPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Uploaded Thumbnail</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={uploadPreview}
                        alt="Uploaded thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      className="w-full mt-4"
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
        </Tabs>

        {/* Current Thumbnail */}
        {currentThumbnail && (
          <div className="mt-4 pt-4 border-t">
            <Label className="text-sm text-muted-foreground">Current Thumbnail</Label>
            <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={currentThumbnail}
                alt="Current thumbnail"
                className="w-full h-full object-cover opacity-50"
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 