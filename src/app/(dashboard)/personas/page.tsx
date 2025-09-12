"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  User, Camera, Sparkles, CheckCircle, AlertCircle, 
  Loader2, Upload, Wand2, Image as ImageIcon, Settings,
  Plus, Trash2, Edit, Download, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PersonaImage {
  id: string
  persona_id: string
  user_id: string
  image_url: string
  file_size?: number
  quality_score?: number
  metadata?: any
  created_at: string
}

interface Persona {
  id: string
  user_id: string
  name: string
  description?: string
  status: 'pending_upload' | 'preparing' | 'training' | 'trained' | 'failed'
  model_ref?: string
  training_job_id?: string
  metadata?: any
  created_at: string
  updated_at: string
  images: PersonaImage[]
}

export default function PersonasPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [defaultPersonaId, setDefaultPersonaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)

  useEffect(() => {
    if (userId) {
      fetchPersonas()
    }
  }, [userId])

  const fetchPersonas = async () => {
    try {
      const response = await fetch('/api/personas/check-persona', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch personas')
      
      const data = await response.json()
      setPersonas(data.personas || [])
      setDefaultPersonaId(data.defaultPersonaId)
      
      // Set the first persona as selected if available
      if (data.personas && data.personas.length > 0) {
        setSelectedPersona(data.personas[0])
      }
    } catch (error) {
      console.error('Error fetching personas:', error)
      toast.error('Failed to load personas')
    } finally {
      setLoading(false)
    }
  }

  const testThumbnailGeneration = async (personaId: string) => {
    setGenerating(true)
    try {
      const response = await fetch('/api/generate-thumbnail/test-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId,
          prompt: 'Professional YouTube thumbnail, looking confident and engaging, tech content creator style',
          title: 'Test Thumbnail with Persona'
        })
      })

      if (!response.ok) throw new Error('Failed to generate thumbnail')
      
      const data = await response.json()
      toast.success('Thumbnail generated successfully!')
      
      // Open the generated thumbnail in a new tab
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error)
      toast.error('Failed to generate thumbnail')
    } finally {
      setGenerating(false)
    }
  }

  const setAsDefault = async (personaId: string) => {
    try {
      const response = await fetch('/api/personas/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId })
      })

      if (!response.ok) throw new Error('Failed to set default persona')
      
      setDefaultPersonaId(personaId)
      toast.success('Default persona updated')
    } catch (error) {
      console.error('Error setting default persona:', error)
      toast.error('Failed to set default persona')
    }
  }

  const deletePersona = async (personaId: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) return

    try {
      const response = await fetch(`/api/personas/${personaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete persona')
      
      await fetchPersonas()
      toast.success('Persona deleted')
    } catch (error) {
      console.error('Error deleting persona:', error)
      toast.error('Failed to delete persona')
    }
  }

  const getStatusColor = (status: Persona['status']) => {
    switch (status) {
      case 'trained': return 'bg-green-500'
      case 'training': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      case 'preparing': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: Persona['status']) => {
    switch (status) {
      case 'trained': return <CheckCircle className="h-4 w-4" />
      case 'training': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'failed': return <AlertCircle className="h-4 w-4" />
      default: return <Camera className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Personas</h1>
        <p className="text-muted-foreground">
          Manage your AI avatars for personalized content generation
        </p>
      </div>

      {personas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Personas Yet</h2>
            <p className="text-muted-foreground text-center mb-6">
              Create your first AI persona to generate personalized thumbnails and content
            </p>
            <Button onClick={() => router.push('/onboarding')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Persona
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personas List */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Personas</CardTitle>
                <CardDescription>
                  Select a persona to view details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {personas.map((persona) => (
                  <div
                    key={persona.id}
                    onClick={() => setSelectedPersona(persona)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPersona?.id === persona.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{persona.name}</p>
                            {defaultPersonaId === persona.id && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor(persona.status)} bg-opacity-10`}
                            >
                              {getStatusIcon(persona.status)}
                              <span className="ml-1">{persona.status}</span>
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {persona.images.length} photos
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => router.push('/onboarding')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Persona
            </Button>
          </div>

          {/* Selected Persona Details */}
          {selectedPersona && (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedPersona.name}</CardTitle>
                      <CardDescription>
                        {selectedPersona.description || 'AI Avatar for content generation'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {selectedPersona.status === 'trained' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAsDefault(selectedPersona.id)}
                            disabled={defaultPersonaId === selectedPersona.id}
                          >
                            {defaultPersonaId === selectedPersona.id ? 'Default' : 'Set as Default'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => testThumbnailGeneration(selectedPersona.id)}
                            disabled={generating}
                          >
                            {generating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Wand2 className="h-4 w-4 mr-2" />
                                Test Generate
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePersona(selectedPersona.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="details">
                    <TabsList>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="photos">Photos</TabsTrigger>
                      <TabsTrigger value="usage">Usage</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Status</p>
                          <Badge className={`${getStatusColor(selectedPersona.status)} text-white`}>
                            {selectedPersona.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Created</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedPersona.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Photo Count</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedPersona.images.length} photos
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Model ID</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {selectedPersona.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>

                      {selectedPersona.status === 'trained' && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertTitle>Ready to Use</AlertTitle>
                          <AlertDescription>
                            This persona is trained and ready for thumbnail generation. 
                            Use it when creating thumbnails or social media graphics.
                          </AlertDescription>
                        </Alert>
                      )}

                      {selectedPersona.status === 'training' && (
                        <Alert>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <AlertTitle>Training in Progress</AlertTitle>
                          <AlertDescription>
                            Your AI avatar is being trained. This usually takes 10-30 minutes.
                            You'll be notified when it's ready.
                          </AlertDescription>
                        </Alert>
                      )}

                      {selectedPersona.status === 'failed' && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Training Failed</AlertTitle>
                          <AlertDescription>
                            Something went wrong during training. Please try creating a new persona.
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    <TabsContent value="photos" className="space-y-4">
                      <div className="grid grid-cols-4 gap-3">
                        {selectedPersona.images.map((image, index) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.image_url}
                              alt={`Training photo ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                            {image.quality_score && (
                              <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-xs text-white">
                                {Math.round(image.quality_score * 100)}%
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {selectedPersona.images.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No training photos uploaded
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="usage" className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-sm font-medium">Thumbnails Generated</span>
                          <span className="text-sm text-muted-foreground">Coming soon</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-sm font-medium">Social Graphics</span>
                          <span className="text-sm text-muted-foreground">Coming soon</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-sm font-medium">Last Used</span>
                          <span className="text-sm text-muted-foreground">Coming soon</span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}