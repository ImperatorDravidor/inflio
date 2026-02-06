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
  Plus, Trash2, Edit, Download, RefreshCw, ArrowLeft
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
  metadata?: {
    type?: 'user_upload' | 'reference_portrait'
    scenario?: string
    generatedBy?: string
    [key: string]: any
  }
  created_at: string
}

interface Persona {
  id: string
  user_id: string
  name: string
  description?: string
  // Updated status values to match PersonaServiceV2 (Nano Banana Pro - no training)
  status: 'pending_upload' | 'analyzing' | 'ready' | 'failed'
  metadata?: {
    photoCount?: number
    photoUrls?: string[]
    referencePhotoUrls?: string[]
    portraitUrls?: string[]
    analysisQuality?: 'excellent' | 'good' | 'needs_improvement'
    consistencyScore?: number
    [key: string]: any
  }
  created_at: string
  updated_at: string
  images: PersonaImage[]
  // Computed fields
  portraits?: PersonaImage[]
  uploadedPhotos?: PersonaImage[]
}

export default function PersonasPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [defaultPersonaId, setDefaultPersonaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [isReviewed, setIsReviewed] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchPersonas()
      checkReviewStatus()
    }
  }, [userId])

  // Poll for status updates when any persona is in "analyzing" state
  useEffect(() => {
    const hasAnalyzingPersona = personas.some(p => p.status === 'analyzing')

    if (!hasAnalyzingPersona) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/personas/check-persona', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
        if (!response.ok) return

        const data = await response.json()
        const processedPersonas = (data.personas || []).map((persona: Persona) => {
          const portraits = persona.images.filter(img => img.metadata?.type === 'reference_portrait')
          const uploadedPhotos = persona.images.filter(img => img.metadata?.type === 'user_upload' || !img.metadata?.type)
          return { ...persona, portraits, uploadedPhotos }
        })

        setPersonas(processedPersonas)
        setDefaultPersonaId(data.defaultPersonaId)

        // Always update selectedPersona to show new portraits as they come in
        if (selectedPersona) {
          const updated = processedPersonas.find((p: Persona) => p.id === selectedPersona.id)
          if (updated) {
            // Check if portraits count changed or status changed
            const portraitCountChanged = (updated.portraits?.length || 0) !== (selectedPersona.portraits?.length || 0)
            const statusChanged = updated.status !== selectedPersona.status
            
            if (portraitCountChanged || statusChanged) {
              setSelectedPersona(updated)
              
              if (updated.status === 'ready' && statusChanged) {
                toast.success('🎉 All portraits generated!')
              } else if (updated.status === 'failed' && statusChanged) {
                toast.error('Avatar generation failed. Please try again.')
              }
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000) // Poll every 3 seconds for faster updates

    return () => clearInterval(pollInterval)
  }, [personas, selectedPersona])

  const checkReviewStatus = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setIsReviewed(data.profile?.persona_reviewed || false)
      }
    } catch (error) {
      console.error('Error checking review status:', error)
    }
  }

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

      // Process personas to separate portraits from uploaded photos
      const processedPersonas = (data.personas || []).map((persona: Persona) => {
        const portraits = persona.images.filter(img => img.metadata?.type === 'reference_portrait')
        const uploadedPhotos = persona.images.filter(img => img.metadata?.type === 'user_upload' || !img.metadata?.type)
        return {
          ...persona,
          portraits,
          uploadedPhotos
        }
      })

      setPersonas(processedPersonas)
      setDefaultPersonaId(data.defaultPersonaId)

      // Set the first persona as selected if available
      if (processedPersonas.length > 0) {
        setSelectedPersona(processedPersonas[0])
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

  const regeneratePortraits = async (personaId: string) => {
    setRegenerating(true)
    try {
      const response = await fetch('/api/personas/regenerate-portraits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId })
      })

      if (!response.ok) throw new Error('Failed to regenerate portraits')

      toast.success('Portraits regenerated successfully!')
      await fetchPersonas()
    } catch (error) {
      console.error('Error regenerating portraits:', error)
      toast.error('Failed to regenerate portraits')
    } finally {
      setRegenerating(false)
    }
  }

  const markAsReviewed = async () => {
    try {
      const response = await fetch('/api/onboarding/mark-reviewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'persona_reviewed' })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[markAsReviewed] API error:', data)
        throw new Error(data.error || 'Failed to mark as reviewed')
      }

      // Check if any rows were actually updated
      if (data.updated === 0) {
        console.error('[markAsReviewed] No rows updated - user profile may not exist')
        toast.error('Could not save progress. Please try again.')
        return
      }

      console.log('[markAsReviewed] Success, updated rows:', data.updated)
      setIsReviewed(true)
      toast.success('Avatar review complete! Continuing setup...')
      // Force full reload to refresh 5-step setup progress
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error marking as reviewed:', error)
      toast.error('Failed to mark as reviewed')
    }
  }

  // Updated status colors and icons for Nano Banana Pro (instant, no training)
  const getStatusColor = (status: Persona['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-500'
      case 'analyzing': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      case 'pending_upload': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: Persona['status']) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-4 w-4" />
      case 'analyzing': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'failed': return <AlertCircle className="h-4 w-4" />
      case 'pending_upload': return <Upload className="h-4 w-4" />
      default: return <Camera className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: Persona['status']) => {
    switch (status) {
      case 'ready': return 'Ready'
      case 'analyzing': return 'Processing'
      case 'failed': return 'Failed'
      case 'pending_upload': return 'Needs Photos'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Check if any persona is still processing
  const hasProcessingPersona = personas.some(p => p.status === 'analyzing')
  const hasReadyPersona = personas.some(p => p.status === 'ready')
  
  // Only show "Reviewed" if actually reviewed AND has ready personas
  const showReviewedBadge = isReviewed && hasReadyPersona && !hasProcessingPersona

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.location.href = '/dashboard'}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Review Your AI Avatar</h1>
            <p className="text-muted-foreground">
              Review your AI-generated portraits and approve them for content creation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showReviewedBadge ? (
            <>
              <Badge variant="secondary" className="h-9 px-4 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Reviewed
              </Badge>
              {/* Allow re-saving review status if stuck */}
              <Button onClick={markAsReviewed}>
                Continue to Next Step
              </Button>
            </>
          ) : hasReadyPersona && !hasProcessingPersona ? (
            <Button onClick={markAsReviewed}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve & Continue
            </Button>
          ) : (
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              {hasProcessingPersona ? 'Continue (generating in background)' : 'Back to Setup'}
            </Button>
          )}
        </div>
      </div>

      {/* Processing banner - show when portraits are still generating */}
      {hasProcessingPersona && (
        <Alert className="mb-6 border-blue-500/50 bg-blue-500/5">
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          <AlertTitle>Generating Your Portraits</AlertTitle>
          <AlertDescription>
            Your AI portraits are being generated. You can wait here to see them appear in real-time, 
            or continue with setup - generation will continue in the background.
          </AlertDescription>
        </Alert>
      )}

      {/* Review workflow banner - show when ready to review */}
      {!isReviewed && hasReadyPersona && !hasProcessingPersona && (
        <Alert className="mb-6 border-primary/50 bg-primary/5">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle>Step 3 of 5: Review Your AI Avatar</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Check out the AI-generated portraits below. If you're happy with them,
              click "Approve & Continue" to proceed to connecting your social accounts.
            </span>
            <Button onClick={markAsReviewed} className="ml-4 shrink-0">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve & Continue
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {personas.length === 0 ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Setup
            </Button>
          </div>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">No AI Avatar Yet</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Create your AI avatar by uploading a few photos. We'll generate professional portraits for your thumbnails and social content.
                  </p>
                </div>
                <Button onClick={() => router.push('/onboarding?step=3')} size="lg">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create AI Avatar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
                              <span className="ml-1">{getStatusLabel(persona.status)}</span>
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {persona.portraits?.length || 0} portraits
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
                      {selectedPersona.status === 'ready' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => regeneratePortraits(selectedPersona.id)}
                            disabled={regenerating}
                          >
                            {regenerating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Regenerate
                              </>
                            )}
                          </Button>
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
                  <Tabs defaultValue="portraits">
                    <TabsList>
                      <TabsTrigger value="portraits">
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Portraits
                      </TabsTrigger>
                      <TabsTrigger value="photos">
                        <Camera className="h-4 w-4 mr-2" />
                        Reference Photos
                      </TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>

                    {/* AI-Generated Portraits Tab (shown first for review) */}
                    <TabsContent value="portraits" className="space-y-4">
                      {selectedPersona.status === 'ready' && selectedPersona.portraits && selectedPersona.portraits.length > 0 ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            These portraits were generated using your reference photos. They will be used for thumbnails and social media content.
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedPersona.portraits.map((portrait, index) => (
                              <div key={portrait.id} className="relative group">
                                <img
                                  src={portrait.image_url}
                                  alt={`Portrait ${index + 1}`}
                                  className="w-full aspect-[4/5] object-cover rounded-lg border"
                                />
                                <div className="absolute bottom-2 left-2 right-2">
                                  <Badge variant="secondary" className="text-xs bg-black/60 backdrop-blur-sm text-white border-0">
                                    {portrait.metadata?.scenario?.replace('_', ' ').replace('portrait ', 'Style ') || `Style ${index + 1}`}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              Not happy with these? You can regenerate them with different styles.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => regeneratePortraits(selectedPersona.id)}
                              disabled={regenerating}
                            >
                              {regenerating ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                              )}
                              Regenerate All
                            </Button>
                          </div>
                        </>
                      ) : selectedPersona.status === 'analyzing' ? (
                        <div className="space-y-6">
                          {/* Show portraits as they come in */}
                          {selectedPersona.portraits && selectedPersona.portraits.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {selectedPersona.portraits.map((portrait, index) => (
                                <div key={portrait.id} className="relative group">
                                  <img
                                    src={portrait.image_url}
                                    alt={`Portrait ${index + 1}`}
                                    className="w-full aspect-[4/5] object-cover rounded-lg border"
                                  />
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <Badge variant="secondary" className="text-xs bg-black/60 backdrop-blur-sm text-white border-0">
                                      {portrait.metadata?.scenario?.replace('_', ' ').replace('portrait ', 'Style ') || `Style ${index + 1}`}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Progress indicator */}
                          <div className="text-center py-6 border rounded-lg bg-muted/20">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                            <p className="font-medium">
                              Generating portraits... {selectedPersona.portraits?.length || 0}/10
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Each portrait takes ~30 seconds • Total time: ~5 minutes
                            </p>
                            <div className="w-48 h-2 bg-muted rounded-full mx-auto mt-4 overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-500 rounded-full"
                                style={{ width: `${((selectedPersona.portraits?.length || 0) / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No portraits generated yet</p>
                          <p className="text-sm mt-1">Upload reference photos to generate AI portraits</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Reference Photos Tab */}
                    <TabsContent value="photos" className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        These are the reference photos you uploaded. The AI uses these to maintain consistency in generated content.
                      </p>
                      <div className="grid grid-cols-4 gap-3">
                        {/* Show from persona_images if available */}
                        {(selectedPersona.uploadedPhotos && selectedPersona.uploadedPhotos.length > 0) ? (
                          selectedPersona.uploadedPhotos.map((image, index) => (
                            <div key={image.id} className="relative group">
                              <img
                                src={image.image_url}
                                alt={`Reference photo ${index + 1}`}
                                className="w-full aspect-square object-cover rounded-lg"
                              />
                              {image.quality_score && (
                                <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-xs text-white">
                                  {Math.round(image.quality_score * 100)}%
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          /* Fallback: show from metadata.photoUrls for older personas */
                          selectedPersona.metadata?.photoUrls?.map((url, index) => (
                            <div key={`meta-${index}`} className="relative group">
                              <img
                                src={url}
                                alt={`Reference photo ${index + 1}`}
                                className="w-full aspect-square object-cover rounded-lg"
                              />
                            </div>
                          ))
                        )}
                      </div>
                      {(!selectedPersona.uploadedPhotos || selectedPersona.uploadedPhotos.length === 0) &&
                       (!selectedPersona.metadata?.photoUrls || selectedPersona.metadata.photoUrls.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground">
                          No reference photos uploaded
                        </div>
                      )}
                    </TabsContent>

                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Status</p>
                          <Badge className={`${getStatusColor(selectedPersona.status)} text-white`}>
                            {getStatusLabel(selectedPersona.status)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Created</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedPersona.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Reference Photos</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedPersona.uploadedPhotos?.length || selectedPersona.metadata?.photoUrls?.length || 0} photos
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Generated Portraits</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedPersona.portraits?.length || 0} portraits
                          </p>
                        </div>
                        {selectedPersona.metadata?.consistencyScore && (
                          <div>
                            <p className="text-sm font-medium mb-1">Consistency Score</p>
                            <p className="text-sm text-muted-foreground">
                              {Math.round(selectedPersona.metadata.consistencyScore * 100)}%
                            </p>
                          </div>
                        )}
                        {selectedPersona.metadata?.analysisQuality && (
                          <div>
                            <p className="text-sm font-medium mb-1">Photo Quality</p>
                            <Badge variant="outline" className="capitalize">
                              {selectedPersona.metadata.analysisQuality.replace('_', ' ')}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {selectedPersona.status === 'ready' && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertTitle>Ready to Use</AlertTitle>
                          <AlertDescription>
                            Your AI avatar is ready! Use it when creating thumbnails or social media graphics.
                          </AlertDescription>
                        </Alert>
                      )}

                      {selectedPersona.status === 'analyzing' && (
                        <Alert>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <AlertTitle>Processing ({selectedPersona.portraits?.length || 0}/10 portraits)</AlertTitle>
                          <AlertDescription>
                            Generating AI portraits from your photos. Total time: ~5 minutes.
                            Portraits will appear one by one as they're ready.
                          </AlertDescription>
                        </Alert>
                      )}

                      {selectedPersona.status === 'failed' && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Processing Failed</AlertTitle>
                          <AlertDescription>
                            Something went wrong. Please try creating a new persona with different photos.
                          </AlertDescription>
                        </Alert>
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