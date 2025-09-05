'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  User, Camera, Upload, Trash2, RefreshCw, CheckCircle, 
  AlertCircle, Clock, Sparkles, Download, Eye, X
} from 'lucide-react'
import { PersonaService, Persona, PersonaPhoto, TrainingJob } from '@/lib/services/persona-service'
import { PersonaPhotoCapture } from '@/components/onboarding/persona-photo-capture'

export function PersonaManager() {
  const { user } = useUser()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPhotosDialog, setShowPhotosDialog] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [trainingStatus, setTrainingStatus] = useState<Record<string, TrainingJob>>({})
  
  // Create persona form
  const [personaName, setPersonaName] = useState('')
  const [personaDescription, setPersonaDescription] = useState('')
  const [personaPhotos, setPersonaPhotos] = useState<PersonaPhoto[]>([])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadPersonas()
      checkTrainingStatuses()
    }
  }, [user?.id])

  const loadPersonas = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const userPersonas = await PersonaService.getUserPersonas(user.id)
      setPersonas(userPersonas)
    } catch (error) {
      console.error('Error loading personas:', error)
      toast.error('Failed to load personas')
    } finally {
      setLoading(false)
    }
  }

  const checkTrainingStatuses = async () => {
    if (!user?.id) return

    const userPersonas = await PersonaService.getUserPersonas(user.id)
    
    for (const persona of userPersonas) {
      if (persona.status === 'training' && persona.trainingJobId) {
        const status = await PersonaService.getTrainingStatus(persona.id)
        if (status) {
          setTrainingStatus(prev => ({ ...prev, [persona.id]: status }))
          
          // Monitor progress if still training
          if (status.status === 'processing') {
            PersonaService.monitorTrainingProgress(
              status.id,
              (status, progress) => {
                console.log(`Training ${persona.name}: ${status} - ${progress}%`)
              },
              (result) => {
                loadPersonas() // Reload to show updated status
                setTrainingStatus(prev => ({ ...prev, [persona.id]: result }))
              },
              (error) => {
                toast.error(`Training failed: ${error}`)
                loadPersonas()
              }
            )
          }
        }
      }
    }
  }

  const createPersona = async () => {
    if (!user?.id) return
    if (!personaName || personaPhotos.length < 5) {
      toast.error('Please provide a name and at least 5 photos')
      return
    }

    setIsCreating(true)
    try {
      const newPersona = await PersonaService.createPersona(
        user.id,
        personaName,
        personaDescription,
        personaPhotos
      )

      if (newPersona) {
        toast.success('Persona created successfully!')
        
        if (personaPhotos.length >= 5) {
          toast.info('LoRA training will start automatically')
          
          // Monitor training progress
          if (newPersona.trainingJobId) {
            PersonaService.monitorTrainingProgress(
              newPersona.trainingJobId,
              (status, progress) => {
                console.log(`Training ${newPersona.name}: ${status} - ${progress}%`)
              },
              (result) => {
                loadPersonas()
                toast.success('Training completed! Your persona is ready to use.')
              },
              (error) => {
                toast.error(`Training failed: ${error}`)
                loadPersonas()
              }
            )
          }
        }

        // Reset form
        setPersonaName('')
        setPersonaDescription('')
        setPersonaPhotos([])
        setShowCreateDialog(false)
        
        // Reload personas
        await loadPersonas()
      }
    } catch (error) {
      console.error('Error creating persona:', error)
      toast.error('Failed to create persona')
    } finally {
      setIsCreating(false)
    }
  }

  const deletePersona = async (personaId: string) => {
    if (!user?.id) return
    
    if (!confirm('Are you sure you want to delete this persona? This action cannot be undone.')) {
      return
    }

    const success = await PersonaService.deletePersona(personaId, user.id)
    if (success) {
      await loadPersonas()
    }
  }

  const retryTraining = async (persona: Persona) => {
    if (!user?.id || !persona.metadata?.photoUrls) return
    
    const photos = persona.metadata.photoUrls.map((url: string, idx: number) => ({
      id: `photo-${idx}`,
      url
    }))

    const job = await PersonaService.startTraining(persona.id, user.id, photos)
    
    if (job) {
      toast.success('Training restarted')
      checkTrainingStatuses()
    }
  }

  const getStatusBadge = (persona: Persona) => {
    const jobStatus = trainingStatus[persona.id]?.status
    const personaStatus = persona.status
    
    // Handle both training job status and persona status
    if (jobStatus === 'completed' || personaStatus === 'trained') {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Trained</Badge>
    } else if (jobStatus === 'processing' || personaStatus === 'training') {
      return <Badge className="bg-blue-500"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Training</Badge>
    } else if (personaStatus === 'preparing') {
      return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Preparing</Badge>
    } else if (jobStatus === 'failed' || personaStatus === 'failed') {
      return <Badge className="bg-red-500"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>
    } else {
      return <Badge className="bg-gray-500"><Upload className="w-3 h-3 mr-1" /> Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Personas
              </CardTitle>
              <CardDescription>
                Manage your AI avatars for personalized content generation
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Camera className="w-4 h-4 mr-2" />
              Create Persona
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : personas.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No personas created yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create a persona to generate personalized thumbnails and content
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {personas.map((persona) => (
                <Card key={persona.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{persona.name}</h3>
                        {persona.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {persona.description}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(persona)}
                    </div>

                    {/* Photo preview */}
                    {persona.metadata?.photoUrls && (
                      <div className="flex gap-1 mb-3">
                        {persona.metadata.photoUrls.slice(0, 4).map((url: string, idx: number) => (
                          <div key={idx} className="w-12 h-12 rounded overflow-hidden bg-muted">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {persona.metadata.photoUrls.length > 4 && (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs">
                            +{persona.metadata.photoUrls.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Training progress */}
                    {persona.status === 'training' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Training progress</span>
                          <span>~15 min remaining</span>
                        </div>
                        <Progress value={33} className="h-1" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedPersona(persona)
                          setShowPhotosDialog(true)
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      
                      {persona.status === 'failed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => retryTraining(persona)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      )}
                      
                      {persona.loraModelUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(persona.loraModelUrl, '_blank')}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Model
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deletePersona(persona.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Info */}
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Photos: {persona.metadata?.photoCount || 0}</span>
                        <span>Created: {new Date(persona.createdAt).toLocaleDateString()}</span>
                      </div>
                      {persona.loraTrainedAt && (
                        <div className="mt-1">
                          Trained: {new Date(persona.loraTrainedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Persona Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create AI Persona</DialogTitle>
            <DialogDescription>
              Upload photos to train a personalized AI model for content generation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="persona-name">Persona Name</Label>
                <Input
                  id="persona-name"
                  value={personaName}
                  onChange={(e) => setPersonaName(e.target.value)}
                  placeholder="e.g., Professional John"
                />
              </div>
              <div>
                <Label htmlFor="persona-description">Description (Optional)</Label>
                <Input
                  id="persona-description"
                  value={personaDescription}
                  onChange={(e) => setPersonaDescription(e.target.value)}
                  placeholder="e.g., Business professional look"
                />
              </div>
            </div>

            {/* Photo Upload Component */}
            <PersonaPhotoCapture
              userId={user?.id || ''}
              onComplete={(photos) => {
                setPersonaPhotos(photos.map((photo, idx) => ({
                  id: photo.id || `photo-${idx}`,
                  url: photo.url,
                  file: photo.file
                })))
              }}
              minPhotos={5}
              maxPhotos={20}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false)
                  setPersonaName('')
                  setPersonaDescription('')
                  setPersonaPhotos([])
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={createPersona}
                disabled={isCreating || !personaName || personaPhotos.length < 5}
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create & Train
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Photos Dialog */}
      <Dialog open={showPhotosDialog} onOpenChange={setShowPhotosDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPersona?.name} - Training Photos</DialogTitle>
          </DialogHeader>
          
          {selectedPersona?.metadata?.photoUrls && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {selectedPersona.metadata.photoUrls.map((url: string, idx: number) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
