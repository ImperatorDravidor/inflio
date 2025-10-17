"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  User, Camera, RefreshCw, Download, Loader2, 
  AlertCircle, HelpCircle, CheckCircle, Image as ImageIcon 
} from 'lucide-react'
import { format } from 'date-fns'

interface PersonaSample {
  style: string
  url: string
  prompt: string
}

interface Persona {
  id: string
  user_id: string
  name: string
  description?: string
  status: 'pending_upload' | 'preparing' | 'training' | 'trained' | 'failed'
  metadata?: {
    photo_count?: number
    lora_trigger_phrase?: string
    lora_model_url?: string
    sample_images?: PersonaSample[]
  }
  retrain_count?: number
  last_retrained_at?: string
  created_at: string
  updated_at: string
}

interface RetrainStatus {
  canRetrain: boolean
  remainingAttempts: number
  lastRetrainedAt?: string
}

const sampleStyles = [
  { key: 'professional_headshot', label: 'Professional', icon: '👔' },
  { key: 'casual_portrait', label: 'Casual', icon: '😊' },
  { key: 'youtube_thumbnail', label: 'YouTube', icon: '🎬' },
  { key: 'social_media_profile', label: 'Social Media', icon: '📱' },
  { key: 'creative_artistic', label: 'Artistic', icon: '🎨' }
]

export function PersonaProfileTab() {
  const { userId } = useAuth()
  const [persona, setPersona] = useState<Persona | null>(null)
  const [samples, setSamples] = useState<PersonaSample[]>([])
  const [retrainStatus, setRetrainStatus] = useState<RetrainStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingSamples, setGeneratingSamples] = useState(false)
  const [downloadingSample, setDownloadingSample] = useState<string | null>(null)
  const [showRetrainDialog, setShowRetrainDialog] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchPersonaData()
    }
  }, [userId])

  const fetchPersonaData = async () => {
    try {
      setLoading(true)
      
      // Fetch persona with samples
      const response = await fetch('/api/personas/profile-data', {
        credentials: 'include'
      })
      
      if (!response.ok) throw new Error('Failed to fetch persona data')
      
      const data = await response.json()
      
      if (data.persona) {
        setPersona(data.persona)
        setSamples(data.persona.metadata?.sample_images || [])
        
        // Calculate retrain status
        const retrainCount = data.persona.retrain_count || 0
        setRetrainStatus({
          canRetrain: retrainCount < 3,
          remainingAttempts: 3 - retrainCount,
          lastRetrainedAt: data.persona.last_retrained_at
        })
      }
    } catch (error) {
      console.error('Error fetching persona data:', error)
      toast.error('Failed to load persona information')
    } finally {
      setLoading(false)
    }
  }

  const generateDisplaySamples = async () => {
    if (!persona) return
    
    setGeneratingSamples(true)
    try {
      const response = await fetch('/api/personas/generate-display-samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId: persona.id })
      })

      if (!response.ok) throw new Error('Failed to generate samples')
      
      const data = await response.json()
      setSamples(data.samples)
      toast.success('Display samples generated successfully!')
      
      // Refresh persona data to get updated samples
      await fetchPersonaData()
    } catch (error) {
      console.error('Error generating samples:', error)
      toast.error('Failed to generate display samples')
    } finally {
      setGeneratingSamples(false)
    }
  }

  const downloadSample = async (sampleUrl: string, style: string) => {
    setDownloadingSample(style)
    try {
      const response = await fetch(sampleUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `persona-${style}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Sample downloaded!')
    } catch (error) {
      console.error('Error downloading sample:', error)
      toast.error('Failed to download sample')
    } finally {
      setDownloadingSample(null)
    }
  }

  const initiateRetrain = async () => {
    if (!persona || !retrainStatus?.canRetrain) return
    
    // This would open a file upload dialog or redirect to retrain flow
    setShowRetrainDialog(true)
  }

  const contactSupport = () => {
    window.open('mailto:support@inflio.com?subject=Persona Retrain Request', '_blank')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!persona) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Persona Created</h3>
          <p className="text-muted-foreground mb-4">
            Create your AI persona during onboarding to generate personalized content
          </p>
          <Button onClick={() => window.location.href = '/onboarding'}>
            Create Persona
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Section with Main Sample */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{persona.name}'s AI Persona</CardTitle>
              <CardDescription>
                Your trained AI model for personalized content generation
              </CardDescription>
            </div>
            <Badge variant={persona.status === 'trained' ? 'default' : 'secondary'}>
              {persona.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {samples.length > 0 ? (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img 
                src={samples[0]?.url} 
                alt="Main persona preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => downloadSample(samples[0].url, samples[0].style)}
                  disabled={downloadingSample === samples[0].style}
                >
                  {downloadingSample === samples[0].style ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No display samples generated yet</p>
                <Button 
                  onClick={generateDisplaySamples}
                  disabled={generatingSamples}
                >
                  {generatingSamples ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Samples...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Generate Display Samples
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid of Additional Samples */}
      {samples.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {samples.slice(1).map((sample, index) => {
            const style = sampleStyles[index + 1] || sampleStyles[0]
            return (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-square relative group">
                  <img 
                    src={sample.url} 
                    alt={sample.style}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadSample(sample.url, sample.style)}
                      disabled={downloadingSample === sample.style}
                    >
                      {downloadingSample === sample.style ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{style.icon}</span>
                    <span className="text-sm font-medium">{style.label}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Retrain Section */}
      <Card>
        <CardHeader>
          <CardTitle>Persona Quality</CardTitle>
        </CardHeader>
        <CardContent>
          {retrainStatus?.canRetrain ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-3">
                <p className="font-medium">
                  Don't like the persona we trained?
                </p>
                <p>
                  Retrain up to 3 times for free, or reach out to support for free guidance!
                </p>
                <div className="flex gap-3 mt-4">
                  <Dialog open={showRetrainDialog} onOpenChange={setShowRetrainDialog}>
                    <DialogTrigger asChild>
                      <Button variant="default">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retrain Persona ({retrainStatus.remainingAttempts} attempts left)
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Retrain Your Persona</DialogTitle>
                        <DialogDescription>
                          Upload new photos to retrain your AI persona. This will replace your current model.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-6">
                        <p className="text-sm text-muted-foreground mb-4">
                          You have {retrainStatus.remainingAttempts} free retrain attempts remaining.
                        </p>
                        <Button 
                          className="w-full"
                          onClick={() => window.location.href = '/onboarding?retrain=true'}
                        >
                          Continue to Photo Upload
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" onClick={contactSupport}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Contact Support
                  </Button>
                </div>
                
                {retrainStatus.lastRetrainedAt && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Last retrained: {format(new Date(retrainStatus.lastRetrainedAt), 'PPP')}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="space-y-3">
                <p className="font-medium">
                  Maximum retrain attempts reached
                </p>
                <p>
                  You've used all 3 free retrain attempts. Contact our support team for additional guidance on improving your persona.
                </p>
                <Button variant="outline" onClick={contactSupport} className="mt-3">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Contact Support for Guidance
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Persona Information */}
      <Card>
        <CardHeader>
          <CardTitle>Persona Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd className="text-sm mt-1">{persona.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Trigger Phrase</dt>
              <dd className="text-sm mt-1 font-mono bg-muted px-2 py-1 rounded">
                {persona.metadata?.lora_trigger_phrase || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Training Date</dt>
              <dd className="text-sm mt-1">
                {format(new Date(persona.created_at), 'PPP')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Photos Used</dt>
              <dd className="text-sm mt-1">{persona.metadata?.photo_count || 0} photos</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd className="text-sm mt-1">
                <Badge variant={persona.status === 'trained' ? 'default' : 'secondary'}>
                  {persona.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Retrain Attempts</dt>
              <dd className="text-sm mt-1">
                {persona.retrain_count || 0} of 3 used
              </dd>
            </div>
          </dl>
          
          {persona.description && (
            <div className="mt-4 pt-4 border-t">
              <dt className="text-sm font-medium text-muted-foreground mb-2">Description</dt>
              <dd className="text-sm">{persona.description}</dd>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}