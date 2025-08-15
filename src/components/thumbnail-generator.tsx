"use client"

import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw, Download, Star, ChevronLeft, ChevronRight, Wand2, ThumbsUp, ThumbsDown, History, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface ThumbnailGeneratorProps {
  projectId: string
  projectTitle?: string
  projectContext?: any
  onThumbnailSelect?: (thumbnailUrl: string, thumbnailId: string) => void
}

interface Thumbnail {
  id: string
  url: string
  prompt: string
  rating?: number
  feedback?: string
  parentId?: string
  iterationNumber?: number
  textSuggestions?: string[]
  chosen?: boolean
  createdAt?: string
}

interface GenerationSettings {
  style: 'modern' | 'classic' | 'minimal' | 'bold' | 'artistic'
  quality: 'standard' | 'hd'
  includePersona: boolean
  personaId?: string
  aspectRatio: '16:9' | '4:3' | '1:1'
}

export function ThumbnailGenerator({ 
  projectId, 
  projectTitle = 'Your Video',
  projectContext,
  onThumbnailSelect 
}: ThumbnailGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isIterating, setIsIterating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([])
  const [selectedThumbnail, setSelectedThumbnail] = useState<Thumbnail | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState(3)
  const [settings, setSettings] = useState<GenerationSettings>({
    style: 'modern',
    quality: 'hd',
    includePersona: false,
    aspectRatio: '16:9'
  })
  const [keepStyle, setKeepStyle] = useState(true)
  const [keepComposition, setKeepComposition] = useState(false)
  const [specificChanges, setSpecificChanges] = useState<string[]>([])

  // Load thumbnail history on mount
  useEffect(() => {
    loadThumbnailHistory()
  }, [projectId])

  const loadThumbnailHistory = async () => {
    try {
      const response = await fetch(`/api/generate-thumbnail/iterate?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setThumbnails(data.thumbnails || [])
        
        // Select the most recent or chosen thumbnail
        const chosen = data.thumbnails?.find((t: Thumbnail) => t.chosen)
        if (chosen) {
          setSelectedThumbnail(chosen)
        } else if (data.thumbnails?.length > 0) {
          setSelectedThumbnail(data.thumbnails[0])
        }
      }
    } catch (error) {
      console.error('Failed to load thumbnail history:', error)
    }
  }

  const generateThumbnail = async () => {
    if (!prompt.trim() && !projectContext) {
      toast.error('Please provide a prompt or project context')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          prompt: prompt || `Create an engaging YouTube thumbnail for: ${projectTitle}`,
          style: settings.style,
          quality: settings.quality,
          projectContext,
          mergeVideoWithPersona: settings.includePersona,
          personaId: settings.personaId
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate thumbnail')
      }

      const newThumbnail: Thumbnail = {
        id: data.thumbnailId || Date.now().toString(),
        url: data.thumbnailUrl,
        prompt: prompt || data.prompt,
        textSuggestions: data.textSuggestions,
        createdAt: new Date().toISOString()
      }

      setThumbnails([newThumbnail, ...thumbnails])
      setSelectedThumbnail(newThumbnail)
      toast.success('Thumbnail generated successfully!')
      
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate thumbnail')
    } finally {
      setIsGenerating(false)
    }
  }

  const iterateThumbnail = async () => {
    if (!selectedThumbnail || !feedback.trim()) {
      toast.error('Please provide feedback for improvement')
      return
    }

    setIsIterating(true)
    try {
      const response = await fetch('/api/generate-thumbnail/iterate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          parentId: selectedThumbnail.id,
          feedback,
          rating,
          keepStyle,
          keepComposition,
          specificChanges,
          personaId: settings.personaId
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to iterate thumbnail')
      }

      const newThumbnail: Thumbnail = {
        id: data.thumbnail.id,
        url: data.thumbnail.url,
        prompt: data.thumbnail.prompt,
        parentId: selectedThumbnail.id,
        iterationNumber: data.thumbnail.iterationNumber,
        textSuggestions: data.thumbnail.textSuggestions,
        createdAt: new Date().toISOString()
      }

      setThumbnails([newThumbnail, ...thumbnails])
      setSelectedThumbnail(newThumbnail)
      setFeedback('')
      setShowFeedback(false)
      toast.success(data.message || 'Iteration created successfully!')
      
      if (data.tip) {
        toast.info(data.tip)
      }
      
    } catch (error) {
      console.error('Iteration error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to iterate thumbnail')
    } finally {
      setIsIterating(false)
    }
  }

  const selectAsFinal = async () => {
    if (!selectedThumbnail) return

    try {
      // Update project with selected thumbnail
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thumbnail_url: selectedThumbnail.url
        })
      })

      if (response.ok) {
        toast.success('Thumbnail set as project thumbnail!')
        if (onThumbnailSelect) {
          onThumbnailSelect(selectedThumbnail.url, selectedThumbnail.id)
        }
      }
    } catch (error) {
      console.error('Failed to set thumbnail:', error)
      toast.error('Failed to set as project thumbnail')
    }
  }

  const downloadThumbnail = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `thumbnail-${projectId}-${Date.now()}.png`
    link.click()
  }

  const changeOptions = [
    'Colors too dark/bright',
    'Text not readable',
    'Face expression',
    'Background busy',
    'Missing key element',
    'Wrong mood/tone',
    'Composition unbalanced',
    'Style inconsistent'
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Thumbnail Generator
          </CardTitle>
          <CardDescription>
            Generate and iterate on thumbnails with AI feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generation Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Style</Label>
              <RadioGroup 
                value={settings.style} 
                onValueChange={(value) => setSettings({...settings, style: value as any})}
              >
                <div className="grid grid-cols-2 gap-2">
                  {['modern', 'classic', 'minimal', 'bold', 'artistic'].map(style => (
                    <label key={style} className="flex items-center space-x-2 cursor-pointer">
                      <RadioGroupItem value={style} />
                      <span className="capitalize text-sm">{style}</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label>Quality</Label>
              <RadioGroup 
                value={settings.quality} 
                onValueChange={(value) => setSettings({...settings, quality: value as any})}
              >
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <RadioGroupItem value="standard" />
                    <span className="text-sm">Standard</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <RadioGroupItem value="hd" />
                    <span className="text-sm">HD (Slower)</span>
                  </label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your thumbnail</Label>
            <Textarea
              id="prompt"
              placeholder={`e.g., "Split screen showing before/after transformation, bright colors, excited expression" or leave blank for AI suggestions based on "${projectTitle}"`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={generateThumbnail} 
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Thumbnail
                </>
              )}
            </Button>
            
            {thumbnails.length > 0 && (
              <Button 
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-4 w-4 mr-2" />
                History ({thumbnails.length})
              </Button>
            )}
          </div>

          {/* Current Thumbnail Display */}
          {selectedThumbnail && (
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                <Image
                  src={selectedThumbnail.url}
                  alt="Generated thumbnail"
                  fill
                  className="object-cover"
                />
                {selectedThumbnail.iterationNumber && (
                  <Badge className="absolute top-2 left-2">
                    Iteration {selectedThumbnail.iterationNumber}
                  </Badge>
                )}
                {selectedThumbnail.rating && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < selectedThumbnail.rating! ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <CardContent className="p-4 space-y-4">
                {/* Text Suggestions */}
                {selectedThumbnail.textSuggestions && selectedThumbnail.textSuggestions.length > 0 && (
                  <div>
                    <Label className="text-sm">Text overlay suggestions:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedThumbnail.textSuggestions.map((text, i) => (
                        <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          {text}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowFeedback(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Improve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadThumbnail(selectedThumbnail.url)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={selectAsFinal}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Use This
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History View */}
          {showHistory && thumbnails.length > 0 && (
            <div className="space-y-2">
              <Label>Generation History</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {thumbnails.map((thumb) => (
                  <Card 
                    key={thumb.id}
                    className={`cursor-pointer transition-all ${selectedThumbnail?.id === thumb.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedThumbnail(thumb)}
                  >
                    <div className="relative aspect-video bg-muted">
                      <Image
                        src={thumb.url}
                        alt="Thumbnail"
                        fill
                        className="object-cover rounded-t"
                      />
                      {thumb.chosen && (
                        <Badge className="absolute top-1 right-1" variant="default">
                          <Check className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Improve This Thumbnail</DialogTitle>
            <DialogDescription>
              Tell us what you'd like to change and we'll generate an improved version
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Rating */}
            <div>
              <Label>How would you rate this thumbnail?</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRating(value)}
                    className="p-2"
                  >
                    <Star 
                      className={`h-6 w-6 ${value <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Changes */}
            <div>
              <Label>What needs improvement?</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {changeOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={specificChanges.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSpecificChanges([...specificChanges, option])
                        } else {
                          setSpecificChanges(specificChanges.filter(c => c !== option))
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Feedback Text */}
            <div>
              <Label htmlFor="feedback">Describe the improvements you want</Label>
              <Textarea
                id="feedback"
                placeholder="e.g., Make the colors more vibrant, add more contrast to the text, change the facial expression to be more excited..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>

            {/* Iteration Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="keep-style">Keep visual style</Label>
                <Switch
                  id="keep-style"
                  checked={keepStyle}
                  onCheckedChange={setKeepStyle}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="keep-composition">Keep layout/composition</Label>
                <Switch
                  id="keep-composition"
                  checked={keepComposition}
                  onCheckedChange={setKeepComposition}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowFeedback(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={iterateThumbnail}
                disabled={isIterating || !feedback.trim()}
                className="flex-1"
              >
                {isIterating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Improving...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Improved Version
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}