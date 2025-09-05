"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  IconUser,
  IconPlus,
  IconTrash,
  IconEdit,
  IconGlobe,
  IconFolder,
  IconCamera,
  IconCheck,
  IconX,
  IconLoader2,
  IconUpload,
  IconCopy
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PersonaService, type Persona, type PersonaPhoto } from '@/lib/services/persona-service'
import { motion } from 'framer-motion'

interface PersonaSelectorProps {
  userId: string
  projectId?: string
  selectedPersonaId?: string
  onSelect: (persona: Persona | null) => void
  showCreateButton?: boolean
  allowGlobalCreation?: boolean
}

export function PersonaSelector({
  userId,
  projectId,
  selectedPersonaId,
  onSelect,
  showCreateButton = true,
  allowGlobalCreation = true
}: PersonaSelectorProps) {
  const [open, setOpen] = useState(false)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // Create form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isGlobal, setIsGlobal] = useState(false)
  const [photos, setPhotos] = useState<PersonaPhoto[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (open) {
      loadPersonas()
    }
  }, [open, userId, projectId])

  const loadPersonas = async () => {
    setLoading(true)
    try {
      const data = await PersonaService.getUserPersonas(userId)
      setPersonas(data)
      
      // Auto-select default persona if none selected
      if (!selectedPersonaId && data.length > 0) {
        const defaultPersona = await PersonaService.getDefaultPersona(userId)
        if (defaultPersona) {
          onSelect(defaultPersona)
        }
      }
    } catch (error) {
      console.error('Error loading personas:', error)
      toast.error('Failed to load personas')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (photos.length >= 5) {
      toast.error('Maximum 5 photos allowed')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploadingPhoto(true)
    try {
      // Convert file to base64 or URL for preview
      const url = URL.createObjectURL(file)
      const photo: PersonaPhoto = {
        id: `photo-${Date.now()}`,
        url,
        file
      }
      setPhotos([...photos, photo])
      toast.success('Photo added')
    } catch (error) {
      console.error('Error adding photo:', error)
      toast.error('Failed to add photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const removePhoto = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId))
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name')
      return
    }

    if (photos.length === 0) {
      toast.error('Please upload at least one photo')
      return
    }

    setCreating(true)
    try {
      const persona = await PersonaService.createPersona(
        userId,
        name,
        description,
        photos
      )

      if (persona) {
        toast.success('Persona created successfully')
        await loadPersonas()
        setShowCreate(false)
        resetForm()
        onSelect(persona)
      }
    } catch (error) {
      console.error('Error creating persona:', error)
      toast.error('Failed to create persona')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (personaId: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) return

    try {
      const success = await PersonaService.deletePersona(personaId, userId)
      if (success) {
        toast.success('Persona deleted')
        await loadPersonas()
        if (selectedPersonaId === personaId) {
          onSelect(null)
        }
      }
    } catch (error) {
      console.error('Error deleting persona:', error)
      toast.error('Failed to delete persona')
    }
  }

  const handleClone = async (persona: Persona) => {
    if (!projectId) return

    try {
      // For now, we'll just select the persona for the project
      // Clone functionality can be added later if needed
      onSelect(persona)
      toast.success('Persona selected for project')
    } catch (error) {
      console.error('Error cloning persona:', error)
      toast.error('Failed to clone persona')
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setIsGlobal(false)
    setPhotos([])
  }

  const selectedPersona = personas.find(p => p.id === selectedPersonaId)

  return (
    <>
      {/* Trigger Button */}
      <div className="flex items-center gap-2">
        {selectedPersona ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-sm">
            <IconUser className="h-4 w-4" />
            <span className="font-medium">{selectedPersona.name}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => onSelect(null)}
            >
              <IconX className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="gap-2"
          >
            <IconUser className="h-4 w-4" />
            Select Persona
          </Button>
        )}
      </div>

      {/* Persona Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Manage Personas</DialogTitle>
            <DialogDescription>
              Create and manage AI personas for personalized content generation
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {showCreate ? (
              /* Create Persona Form */
              <div className="p-6 space-y-6">
                <div>
                  <Label htmlFor="name">Persona Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Professional Me, Casual Style"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe when to use this persona..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {allowGlobalCreation && (
                  <div className="flex items-center gap-3">
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isGlobal}
                        onChange={(e) => setIsGlobal(e.target.checked)}
                        className="rounded"
                      />
                      <span>Make this a global persona</span>
                    </Label>
                    <Badge variant="outline" className="gap-1">
                      {isGlobal ? <IconGlobe className="h-3 w-3" /> : <IconFolder className="h-3 w-3" />}
                      {isGlobal ? 'Available everywhere' : 'Project only'}
                    </Badge>
                  </div>
                )}

                <div>
                  <Label>Photos (min 1, max 5)</Label>
                  <div className="mt-2 space-y-3">
                    <div className="grid grid-cols-5 gap-3">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.url}
                            alt=""
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePhoto(photo.id)}
                          >
                            <IconX className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
                      {photos.length < 5 && (
                        <div className="aspect-square">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhoto}
                            className="hidden"
                            id="photo-upload"
                          />
                          <Label
                            htmlFor="photo-upload"
                            className={cn(
                              "w-full h-full rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors",
                              uploadingPhoto && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {uploadingPhoto ? (
                              <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                              <IconPlus className="h-6 w-6 text-muted-foreground" />
                            )}
                          </Label>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Upload clear photos of yourself from different angles for best results
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreate(false)
                      resetForm()
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={creating || !name.trim() || photos.length === 0}
                    className="flex-1"
                  >
                    {creating ? (
                      <>
                        <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <IconCheck className="h-4 w-4 mr-2" />
                        Create Persona
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Personas List */
              <ScrollArea className="h-[500px]">
                <div className="p-6 space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : personas.length === 0 ? (
                    <div className="text-center py-12">
                      <IconUser className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No personas created yet</p>
                      {showCreateButton && (
                        <Button
                          onClick={() => setShowCreate(true)}
                          className="mt-4"
                        >
                          <IconPlus className="h-4 w-4 mr-2" />
                          Create Your First Persona
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* All Personas */}
                      {personas.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <IconUser className="h-4 w-4" />
                            Your Personas
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {personas.map((persona) => (
                              <PersonaCard
                                key={persona.id}
                                persona={persona}
                                isSelected={selectedPersonaId === persona.id}
                                onSelect={() => {
                                  onSelect(persona)
                                  setOpen(false)
                                }}
                                onDelete={() => handleDelete(persona.id)}
                                onClone={projectId ? () => handleClone(persona) : undefined}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Create Button */}
                  {showCreateButton && personas.length > 0 && !loading && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => setShowCreate(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <IconPlus className="h-4 w-4 mr-2" />
                        Create New Persona
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Persona Card Component
function PersonaCard({
  persona,
  isSelected,
  onSelect,
  onDelete,
  onClone
}: {
  persona: Persona
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onClone?: () => void
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Photos */}
            <div className="flex gap-2">
              {persona.metadata?.photoUrls && persona.metadata.photoUrls.slice(0, 3).map((url: string, idx: number) => (
                <div
                  key={idx}
                  className="w-12 h-12 rounded-lg overflow-hidden"
                >
                  <img
                    src={url}
                    alt={`${persona.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {persona.metadata?.photoUrls && persona.metadata.photoUrls.length > 3 && (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">
                  +{persona.metadata.photoUrls.length - 3}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <h4 className="font-medium">{persona.name}</h4>
              {persona.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {persona.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Badge variant="outline" className="text-xs">
                {persona.metadata?.photoCount || 0} photos
              </Badge>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                {onClone && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={onClone}
                  >
                    <IconCopy className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 hover:text-destructive"
                  onClick={onDelete}
                >
                  <IconTrash className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 