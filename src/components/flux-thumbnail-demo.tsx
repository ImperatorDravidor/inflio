'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Image as ImageIcon, Zap, Palette } from 'lucide-react'
import { toast } from 'sonner'

interface GeneratedThumbnail {
  url: string
  seed: number
  timestamp: number
  prompt: string
  style: string
  quality: string
}

export function FluxThumbnailDemo() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<'realistic' | 'illustration' | 'anime' | 'watercolor'>('realistic')
  const [quality, setQuality] = useState<'fast' | 'balanced' | 'high'>('balanced')
  const [aspectRatio, setAspectRatio] = useState<'landscape_16_9' | 'square' | 'portrait_16_9'>('landscape_16_9')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedThumbnails, setGeneratedThumbnails] = useState<GeneratedThumbnail[]>([])
  const [selectedThumbnail, setSelectedThumbnail] = useState<GeneratedThumbnail | null>(null)

  // Example prompts for different use cases
  const examplePrompts = {
    youtube: "Tech reviewer unboxing latest smartphone, excited expression, colorful LED background, professional studio lighting",
    product: "Minimalist wireless headphones on marble surface, soft shadows, premium feel, clean aesthetic",
    tutorial: "Person coding on laptop, coffee cup nearby, cozy home office, warm lighting, productive atmosphere",
    gaming: "Epic gaming moment, vibrant neon colors, action-packed scene, dramatic lighting effects"
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    
    try {
      // In a real implementation, this would call your API
      const response = await fetch('/api/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'demo-project', // This would be a real project ID
          prompt,
          style,
          quality,
          // Additional Flux-specific parameters
          useFlux: true,
          fluxOptions: {
            aspectRatio,
            enhanceForThumbnail: true
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate thumbnail')
      }

      const data = await response.json()
      
      const newThumbnail: GeneratedThumbnail = {
        url: data.url,
        seed: data.seed || Math.floor(Math.random() * 1000000),
        timestamp: Date.now(),
        prompt,
        style,
        quality
      }

      setGeneratedThumbnails(prev => [newThumbnail, ...prev])
      setSelectedThumbnail(newThumbnail)
      toast.success('Thumbnail generated successfully!')
      
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate thumbnail')
    } finally {
      setIsGenerating(false)
    }
  }

  const costEstimate = {
    fast: '$0.003',
    balanced: '$0.025',
    high: '$0.05'
  }

  const qualityDescriptions = {
    fast: 'Schnell model - 4 steps, ultra-fast generation',
    balanced: 'Dev model - 20 steps, great quality/speed ratio',
    high: 'Pro model - 50 steps, maximum quality'
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Flux AI Thumbnail Generation</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create stunning thumbnails with state-of-the-art AI. Powered by Flux's 12B parameter model.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generation Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Thumbnail</CardTitle>
            <CardDescription>
              Describe your ideal thumbnail and let Flux AI bring it to life
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <textarea
                id="prompt"
                className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                placeholder="Describe your thumbnail in detail..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {/* Example Prompts */}
            <div className="space-y-2">
              <Label>Quick Examples</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(examplePrompts).map(([key, example]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(example)}
                    className="justify-start text-left h-auto py-2 px-3"
                  >
                    <span className="capitalize">{key}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Style Selection */}
            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select value={style} onValueChange={(value: any) => setStyle(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Photorealistic
                    </div>
                  </SelectItem>
                  <SelectItem value="illustration">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Illustration
                    </div>
                  </SelectItem>
                  <SelectItem value="anime">Anime/Manga</SelectItem>
                  <SelectItem value="watercolor">Watercolor Art</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quality Selection */}
            <div className="space-y-2">
              <Label htmlFor="quality">Quality & Speed</Label>
              <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Fast
                      </div>
                      <span className="text-xs text-muted-foreground">{costEstimate.fast}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="balanced">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Balanced
                      </div>
                      <span className="text-xs text-muted-foreground">{costEstimate.balanced}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        High Quality
                      </div>
                      <span className="text-xs text-muted-foreground">{costEstimate.high}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {qualityDescriptions[quality]}
              </p>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label htmlFor="aspect">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={(value: any) => setAspectRatio(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landscape_16_9">16:9 Landscape (YouTube)</SelectItem>
                  <SelectItem value="square">1:1 Square (Instagram)</SelectItem>
                  <SelectItem value="portrait_16_9">9:16 Portrait (TikTok)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating with Flux...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Thumbnail
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview and History */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Thumbnails</CardTitle>
            <CardDescription>
              Your AI-generated thumbnails appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">Current</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="space-y-4">
                {selectedThumbnail ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={selectedThumbnail.url}
                        alt="Generated thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Style:</span>
                        <span className="capitalize">{selectedThumbnail.style}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quality:</span>
                        <span className="capitalize">{selectedThumbnail.quality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seed:</span>
                        <span>{selectedThumbnail.seed}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigator.clipboard.writeText(selectedThumbnail.url)}
                    >
                      Copy Image URL
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Generated thumbnails will appear here
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {generatedThumbnails.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {generatedThumbnails.map((thumb, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedThumbnail(thumb)}
                        className="relative aspect-video rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
                      >
                        <img
                          src={thumb.url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-xs text-white truncate">
                            {thumb.style} • {thumb.quality}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No thumbnails generated yet
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Superior Photorealism</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Flux's 12B parameters deliver unmatched realism, especially for human faces and hands
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Text Rendering</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Unlike other models, Flux can accurately render text in your thumbnails
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Multiple Styles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Choose from photorealistic, illustration, anime, or watercolor styles with LoRA models
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 