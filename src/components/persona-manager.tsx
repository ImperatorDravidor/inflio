"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { usePersonas, type PersonaPhoto } from "@/contexts/persona-context"
import { 
  IconUser, 
  IconCamera, 
  IconUpload, 
  IconTrash, 
  IconEdit, 
  IconCheck, 
  IconX, 
  IconPlus,
  IconInfoCircle,
  IconSparkles,
  IconPhoto,
  IconUsers,
  IconBulb,
  IconWand,
  IconStar,
  IconDownload,
  IconFileImport
} from "@tabler/icons-react"

interface PersonaManagerProps {
  onPersonaSelect?: (persona: any) => void
  className?: string
}

export function PersonaManager({ onPersonaSelect, className }: PersonaManagerProps) {
  const { 
    personas, 
    activePersona, 
    addPersona, 
    deletePersona, 
    setActivePersona,
    exportPersonas,
    importPersonas 
  } = usePersonas()
  
  const [isCreating, setIsCreating] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [captureMode, setCaptureMode] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importData, setImportData] = useState("")
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state for new persona
  const [newPersonaName, setNewPersonaName] = useState("")
  const [newPersonaDescription, setNewPersonaDescription] = useState("")
  const [tempPhotos, setTempPhotos] = useState<PersonaPhoto[]>([])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCaptureMode(true)
      }
    } catch (error) {
      console.error("Camera access error:", error)
      toast.error("Unable to access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCaptureMode(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0)
        
        // Convert to blob and create photo
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const photo: PersonaPhoto = {
              id: `photo_${Date.now()}`,
              url,
              name: `Capture ${tempPhotos.length + 1}`,
              uploadedAt: new Date()
            }
            setTempPhotos([...tempPhotos, photo])
            toast.success("Photo captured!")
          }
        }, 'image/jpeg', 0.9)
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const photo: PersonaPhoto = {
              id: `photo_${Date.now()}_${Math.random()}`,
              url: e.target?.result as string,
              name: file.name,
              uploadedAt: new Date()
            }
            setTempPhotos(prev => [...prev, photo])
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }

  const removePhoto = (photoId: string) => {
    setTempPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  const createPersona = async () => {
    if (!newPersonaName.trim()) {
      toast.error("Please enter a persona name")
      return
    }
    
    if (tempPhotos.length === 0) {
      toast.error("Please add at least one photo")
      return
    }

    await addPersona({
      name: newPersonaName,
      description: newPersonaDescription,
      photos: tempPhotos
    })
    
    // Reset form
    setNewPersonaName("")
    setNewPersonaDescription("")
    setTempPhotos([])
    setIsCreating(false)
    stopCamera()
  }

  const handleDeletePersona = (personaId: string) => {
    deletePersona(personaId)
  }

  const selectPersona = (persona: any) => {
    setActivePersona(persona)
    onPersonaSelect?.(persona)
  }

  const handleExportPersonas = () => {
    const data = exportPersonas()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inflio-personas-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Personas exported successfully')
  }

  const handleImportPersonas = async () => {
    if (!importData.trim()) {
      toast.error('Please paste or upload persona data')
      return
    }
    
    await importPersonas(importData)
    setShowImportDialog(false)
    setImportData("")
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImportData(e.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconUsers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>AI Persona Hub</CardTitle>
              <CardDescription className="mt-1">
                Create personas for consistent AI-generated content
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {personas.length} personas
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleExportPersonas}
              disabled={personas.length === 0}
            >
              <IconDownload className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setShowImportDialog(true)}
            >
              <IconFileImport className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Guide Banner */}
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <IconBulb className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong>Pro Tips for Best Results:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Use clear, well-lit photos with your face fully visible</li>
              <li>• Include 3-5 photos with different expressions and angles</li>
              <li>• Avoid sunglasses, heavy shadows, or obstructed faces</li>
              <li>• Higher quality photos = better AI generation results</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Personas Grid */}
        {personas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {personas.map((persona) => (
              <Card 
                key={persona.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg",
                  activePersona?.id === persona.id && "border-primary ring-2 ring-primary/20"
                )}
                onClick={() => selectPersona(persona)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        {persona.name}
                        {persona.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {persona.description || "No description"}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePersona(persona.id)
                      }}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Photo Grid Preview */}
                  <div className="grid grid-cols-3 gap-1 mb-3">
                    {persona.photos.slice(0, 6).map((photo, idx) => (
                      <div key={idx} className="aspect-square rounded overflow-hidden bg-muted">
                        <img
                          src={photo.url}
                          alt={`${persona.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {persona.photos.length > 6 && (
                      <div className="aspect-square rounded bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          +{persona.photos.length - 6}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      <IconPhoto className="h-3 w-3 mr-1" />
                      {persona.photos.length} photos
                    </Badge>
                    {activePersona?.id === persona.id && (
                      <Badge className="text-xs">
                        <IconCheck className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-6 border-2 border-dashed rounded-lg">
            <IconUser className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-medium text-lg mb-1">No personas yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first persona to use in thumbnails and social graphics
            </p>
          </div>
        )}

        {/* Create/Edit Persona Section */}
        <Dialog open={isCreating} onOpenChange={(open) => {
          setIsCreating(open)
          if (!open) {
            stopCamera()
            setTempPhotos([])
            setNewPersonaName("")
            setNewPersonaDescription("")
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <IconPlus className="h-5 w-5 mr-2" />
              Create New Persona
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create AI Persona</DialogTitle>
              <DialogDescription>
                Add photos and details to create a reusable persona for AI-generated content
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="persona-name">Persona Name *</Label>
                  <Input
                    id="persona-name"
                    placeholder="e.g., Professional Headshot, Casual Look"
                    value={newPersonaName}
                    onChange={(e) => setNewPersonaName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="persona-description">Description (Optional)</Label>
                  <Textarea
                    id="persona-description"
                    placeholder="Describe this persona's style, mood, or use case..."
                    value={newPersonaDescription}
                    onChange={(e) => setNewPersonaDescription(e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Photo Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Photos ({tempPhotos.length}/10)</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <IconUpload className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={captureMode ? stopCamera : startCamera}
                    >
                      <IconCamera className="h-4 w-4 mr-1" />
                      {captureMode ? 'Stop Camera' : 'Take Photo'}
                    </Button>
                  </div>
                </div>
                
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Camera Capture */}
                {captureMode && (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="flex justify-center gap-4">
                      <Button onClick={capturePhoto} size="lg">
                        <IconCamera className="h-5 w-5 mr-2" />
                        Capture Photo
                      </Button>
                      <Button onClick={stopCamera} variant="outline">
                        <IconX className="h-4 w-4 mr-2" />
                        Close Camera
                      </Button>
                    </div>
                  </div>
                )}

                {/* Photo Grid */}
                {tempPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {tempPhotos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={photo.url}
                            alt={photo.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(photo.id)}
                        >
                          <IconX className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Guidelines */}
                <Alert className="border-blue-500/50 bg-blue-500/10">
                  <IconInfoCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <strong>Photo Guidelines for Best AI Results:</strong>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <strong className="text-green-600">✓ Do:</strong>
                        <ul className="mt-1 space-y-0.5">
                          <li>• Clear, well-lit face shots</li>
                          <li>• Multiple angles & expressions</li>
                          <li>• High resolution photos</li>
                          <li>• Natural lighting preferred</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-red-600">✗ Don't:</strong>
                        <ul className="mt-1 space-y-0.5">
                          <li>• Blurry or dark photos</li>
                          <li>• Sunglasses or face masks</li>
                          <li>• Heavy filters or effects</li>
                          <li>• Group photos</li>
                        </ul>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createPersona}
                  disabled={!newPersonaName.trim() || tempPhotos.length === 0}
                >
                  <IconSparkles className="h-4 w-4 mr-2" />
                  Create Persona
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Import Personas Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Personas</DialogTitle>
              <DialogDescription>
                Import personas from a JSON file or paste the data directly
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Upload File</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    ref={fileInputRef}
                  />
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              <div>
                <Label>Paste JSON Data</Label>
                <Textarea
                  placeholder="Paste your exported personas JSON here..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={10}
                  className="mt-2 font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportDialog(false)
                    setImportData("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImportPersonas}
                  disabled={!importData.trim()}
                >
                  <IconFileImport className="h-4 w-4 mr-2" />
                  Import Personas
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 