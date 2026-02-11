'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles, Image as ImageIcon, Copy, Check, RefreshCw, Eye, AlertCircle } from 'lucide-react'
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
  const [generationStatus, setGenerationStatus] = useState<string>('')
  const [selectedSuggestion, setSelectedSuggestion] = useState<SimplifiedPostSuggestion | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const activeJobIdRef = useRef<string | null>(null)

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Load existing suggestions + check for in-progress jobs on mount
  useEffect(() => {
    loadSuggestionsAndCheckStatus()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSuggestionsAndCheckStatus = async () => {
    setLoading(true)
    try {
      // Load suggestions
      const suggestionsResponse = await fetch(`/api/posts/suggestions?projectId=${projectId}`)
      if (suggestionsResponse.ok) {
        const data = await suggestionsResponse.json()
        const loaded = data.suggestions || []
        setSuggestions(loaded)
        if (loaded.length > 0 && !selectedSuggestion) {
          setSelectedSuggestion(loaded[0])
        }
      }

      // Check if there's already a running/pending job
      const statusResponse = await fetch(`/api/posts/generation-status?projectId=${projectId}`)
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        if (statusData.status === 'pending' || statusData.status === 'running') {
          // Resume polling for this job
          activeJobIdRef.current = statusData.jobId
          setGenerating(true)
          setGenerationStatus(statusData.status === 'pending' ? 'Queued...' : 'AI is generating posts...')
          startPolling(statusData.jobId)
        }
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSuggestions = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/suggestions?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        const loaded = data.suggestions || []
        setSuggestions(loaded)
        if (loaded.length > 0) {
          setSelectedSuggestion(loaded[0])
        }
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }, [projectId])

  // ── Polling ──────────────────────────────────────────────────────────────

  const startPolling = useCallback((jobId: string) => {
    // Clear any existing poll
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    const poll = async () => {
      try {
        const response = await fetch(`/api/posts/generation-status?jobId=${jobId}`)
        if (!response.ok) return

        const data = await response.json()

        if (data.status === 'completed') {
          // Done! Load results
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          activeJobIdRef.current = null
          setGenerating(false)
          setGenerationStatus('')
          setGenerationError(null)
          await loadSuggestions()
          toast.success(`Generated ${data.completedItems || 5} post suggestions!`)
        } else if (data.status === 'failed') {
          // Failed
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          activeJobIdRef.current = null
          setGenerating(false)
          setGenerationStatus('')
          setGenerationError(data.error || 'Generation failed. Please try again.')
          toast.error(data.error || 'Post generation failed.')
        } else if (data.status === 'running') {
          setGenerationStatus('AI is generating your posts...')
        } else if (data.status === 'pending') {
          setGenerationStatus('Queued — starting shortly...')
        }
      } catch (err) {
        console.error('Polling error:', err)
        // Don't stop polling on transient network errors
      }
    }

    // Poll immediately, then every 3 seconds
    poll()
    pollIntervalRef.current = setInterval(poll, 3000)
  }, [loadSuggestions])

  // ── Generation trigger ───────────────────────────────────────────────────

  const generateSuggestions = async () => {
    try {
      setGenerating(true)
      setGenerationError(null)
      setGenerationStatus('Starting generation...')

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

      if (!response.ok) {
        let errorMessage = 'Failed to start generation'
        try {
          const errorData = await response.json()
          if (errorData?.error) errorMessage = errorData.error
        } catch {}
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.jobId) {
        // Job created — start polling
        activeJobIdRef.current = data.jobId
        setGenerationStatus(data.status === 'running' ? 'Already generating...' : 'Generation started...')
        toast.info('AI is creating your posts — this takes about a minute', { duration: 4000 })
        startPolling(data.jobId)
      } else {
        // Shouldn't happen with the new flow, but handle gracefully
        setGenerating(false)
        setGenerationStatus('')
        await loadSuggestions()
      }
    } catch (error) {
      console.error('Error triggering generation:', error)
      setGenerating(false)
      setGenerationStatus('')
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate posts')
      toast.error('Failed to start post generation. Please try again.')
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

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

  const getSuggestionData = (suggestion: SimplifiedPostSuggestion) => {
    const type = suggestion.type || suggestion.content_type || 'post'
    const title = suggestion.title || suggestion.metadata?.title || `${type} suggestion`
    const description = suggestion.description || suggestion.metadata?.description || ''
    const platforms = suggestion.eligible_platforms || 
                     suggestion.metadata?.eligible_platforms || 
                     (suggestion.eligibility ? Object.keys(suggestion.eligibility) : []) ||
                     []
    const copyData = suggestion.platform_copy || suggestion.copy_variants || {}
    const imagePrompts = suggestion.images?.map(img => ({
      id: img.id || Math.random().toString(),
      prompt: img.prompt || 'No prompt available',
      url: img.url
    })) || []

    return { type, title, description, platforms, copyData, imagePrompts }
  }

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Post Suggestions</h3>
          <p className="text-sm text-muted-foreground">
            {suggestions.length > 0 
              ? `${suggestions.length} suggestions available`
              : 'No suggestions yet — generate some!'}
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
              {suggestions.length > 0 ? 'Regenerate' : 'Generate Posts'}
            </>
          )}
        </Button>
      </div>

      {/* Generation progress indicator */}
      {generating && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <p className="font-medium text-sm">Creating AI-powered posts</p>
              <p className="text-xs text-muted-foreground">{generationStatus || 'Working...'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state with retry */}
      {generationError && !generating && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-destructive">Generation failed</p>
                <p className="text-xs text-muted-foreground">{generationError}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setGenerationError(null)
                generateSuggestions()
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {suggestions.length === 0 && !generating ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No Post Suggestions Yet</h4>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Click &quot;Generate Posts&quot; to create AI-powered social media content based on your video analysis
            </p>
            <Button onClick={generateSuggestions} disabled={generating}>
              Generate Your First Posts
            </Button>
          </CardContent>
        </Card>
      ) : suggestions.length > 0 && (
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
                                No image prompts available. Click &quot;Generate Images&quot; to create visual content.
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
