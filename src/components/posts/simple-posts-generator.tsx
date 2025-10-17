'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles, Image as ImageIcon, Copy, Check, RefreshCw, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface SimplifiedPostSuggestion {
  id: string
  type?: string
  status?: string
  images?: Array<{
    id: string
    prompt: string
    url?: string
  }>
  platform_copy?: Record<string, any>
  copy_variants?: Record<string, any>
  eligibility?: Record<string, any>
  metadata?: Record<string, any>
  [key: string]: any
}

interface SimplePostsGeneratorProps {
  projectId: string
  projectTitle: string
  contentAnalysis?: any
  transcript?: string
}

export function SimplePostsGenerator({
  projectId,
  projectTitle,
  contentAnalysis,
  transcript
}: SimplePostsGeneratorProps) {
  const [suggestions, setSuggestions] = useState<SimplifiedPostSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<SimplifiedPostSuggestion | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Load existing suggestions
  useEffect(() => {
    loadSuggestions()
  }, [projectId])

  const loadSuggestions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/posts/suggestions?projectId=${projectId}`)
      const data = await response.json()
      
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions)
        if (data.suggestions.length > 0 && !selectedSuggestion) {
          setSelectedSuggestion(data.suggestions[0])
        }
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
      toast.error('Failed to load post suggestions')
    } finally {
      setLoading(false)
    }
  }

  const generateSuggestions = async () => {
    try {
      setGenerating(true)
      toast.info('Generating AI post suggestions...')
      
      const response = await fetch('/api/posts/generate-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectTitle,
          contentAnalysis,
          transcript: transcript?.substring(0, 3000),
          settings: {
            contentTypes: ['single', 'carousel', 'quote'],
            platforms: ['instagram', 'twitter', 'linkedin'],
            creativity: 0.8,
            tone: 'professional',
            includeEmojis: true,
            includeHashtags: true,
            optimizeForEngagement: true,
            usePersona: false
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Generated ${data.suggestions?.length || 0} post suggestions!`)
        await loadSuggestions()
      } else {
        toast.error('Failed to generate suggestions')
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
      toast.error('Failed to generate post suggestions')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, suggestionId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(suggestionId)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const generateImages = async (suggestion: SimplifiedPostSuggestion) => {
    toast.info('Generating images for this post...')
    // TODO: Implement image generation
  }

  // Helper to safely get data from suggestion
  const getSuggestionData = (suggestion: SimplifiedPostSuggestion) => {
    const type = suggestion.type || suggestion.content_type || 'post'
    const title = suggestion.title || suggestion.metadata?.title || `${type} suggestion`
    const description = suggestion.description || suggestion.metadata?.description || ''
    const platforms = suggestion.eligible_platforms || 
                     suggestion.metadata?.eligible_platforms || 
                     (suggestion.eligibility ? Object.keys(suggestion.eligibility) : []) ||
                     []
    
    // Get copy content from either field
    const copyData = suggestion.platform_copy || suggestion.copy_variants || {}
    
    // Get image prompts
    const imagePrompts = suggestion.images?.map(img => ({
      id: img.id || Math.random().toString(),
      prompt: img.prompt || 'No prompt available',
      url: img.url
    })) || []

    return { type, title, description, platforms, copyData, imagePrompts }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Post Suggestions</h3>
          <p className="text-sm text-muted-foreground">
            {suggestions.length > 0 
              ? `${suggestions.length} suggestions available`
              : 'No suggestions yet - generate some!'}
          </p>
        </div>
        <Button
          onClick={generateSuggestions}
          disabled={generating}
          className="gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Posts
            </>
          )}
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No Post Suggestions Yet</h4>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Click "Generate Posts" to create AI-powered social media content based on your video analysis
            </p>
            <Button onClick={generateSuggestions} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Your First Posts'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Suggestions List */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Select a Post</h4>
            {suggestions.map((suggestion) => {
              const { type, title, platforms } = getSuggestionData(suggestion)
              const isSelected = selectedSuggestion?.id === suggestion.id
              
              return (
                <Card
                  key={suggestion.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm line-clamp-1">{title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {type}
                          </Badge>
                          {platforms.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {platforms.length} platforms
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>

          {/* Selected Post Details */}
          {selectedSuggestion && (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Post Details</CardTitle>
                  <CardDescription>
                    Review and copy content for your social media posts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                    const { type, title, description, platforms, copyData, imagePrompts } = getSuggestionData(selectedSuggestion)
                    
                    return (
                      <>
                        {/* Image Prompts Section */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Visual Content Prompts</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateImages(selectedSuggestion)}
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Generate Images
                            </Button>
                          </div>
                          
                          {imagePrompts.length > 0 ? (
                            <div className="space-y-2">
                              {imagePrompts.map((image, idx) => (
                                <div key={image.id} className="p-3 bg-muted rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium mb-1">Image {idx + 1}</p>
                                      <p className="text-sm text-muted-foreground">{image.prompt}</p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(image.prompt, `prompt-${image.id}`)}
                                    >
                                      {copiedId === `prompt-${image.id}` ? (
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                  {image.url && (
                                    <img 
                                      src={image.url} 
                                      alt={`Generated image ${idx + 1}`}
                                      className="mt-2 rounded-md w-full max-w-xs"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 bg-muted rounded-lg text-center">
                              <p className="text-sm text-muted-foreground">
                                No image prompts available. Click "Generate Images" to create visual content.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Platform Content Tabs */}
                        {Object.keys(copyData).length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Platform Content</h4>
                            <Tabs defaultValue={Object.keys(copyData)[0]} className="w-full">
                              <TabsList className="grid grid-cols-3 w-full">
                                {Object.keys(copyData).map(platform => (
                                  <TabsTrigger key={platform} value={platform} className="capitalize">
                                    {platform}
                                  </TabsTrigger>
                                ))}
                              </TabsList>
                              
                              {Object.entries(copyData).map(([platform, content]: [string, any]) => (
                                <TabsContent key={platform} value={platform} className="space-y-4">
                                  {/* Caption */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-sm font-medium">Caption</label>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(content?.caption || '', `caption-${platform}`)}
                                      >
                                        {copiedId === `caption-${platform}` ? (
                                          <Check className="h-4 w-4" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                    <Textarea
                                      value={content?.caption || ''}
                                      readOnly
                                      className="min-h-[100px]"
                                    />
                                  </div>

                                  {/* Hashtags */}
                                  {content?.hashtags && content.hashtags.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">Hashtags</label>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => copyToClipboard(content.hashtags.join(' '), `tags-${platform}`)}
                                        >
                                          {copiedId === `tags-${platform}` ? (
                                            <Check className="h-4 w-4" />
                                          ) : (
                                            <Copy className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {content.hashtags.map((tag: string, idx: number) => (
                                          <Badge key={idx} variant="secondary">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* CTA */}
                                  {content?.cta && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Call to Action</label>
                                      <div className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm">{content.cta}</p>
                                      </div>
                                    </div>
                                  )}
                                </TabsContent>
                              ))}
                            </Tabs>
                          </div>
                        ) : (
                          <div className="p-4 bg-muted rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">
                              No platform content available yet.
                            </p>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}