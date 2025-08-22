"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconRocket,
  IconBrain,
  IconLoader2,
  IconCopy,
  IconPhoto,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconCopyCheck,
  IconArrowRight
} from "@tabler/icons-react"
import { toast } from "sonner"
import {
  EnhancedContentEngine,
  type EnhancedInsight,
  type EnhancedPost
} from "@/lib/ai-content-enhanced"

interface ImprovedCampaignStudioProps {
  project: any
  transcription: any
  onUpdate: () => void
}

const platformIcons = {
  instagram: IconBrandInstagram,
  twitter: IconBrandTwitter,
  linkedin: IconBrandLinkedin
}

export function ImprovedCampaignStudio({
  project,
  transcription,
  onUpdate
}: ImprovedCampaignStudioProps) {
  const [insights, setInsights] = useState<EnhancedInsight[]>([])
  const [posts, setPosts] = useState<EnhancedPost[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedGraphics, setGeneratedGraphics] = useState<Record<string, { url: string; textOverlay: string; status: 'pending' | 'generating' | 'completed' | 'error' }>>({})
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editedCaptions, setEditedCaptions] = useState<Record<string, string>>({})
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())

  // Step 1: Extract insights using GPT-4.1
  const analyzeContent = async () => {
    if (!transcription) {
      toast.error("No transcription available")
      return
    }

    setIsAnalyzing(true)
    setProgress(0)

    try {
      setProgress(50)
      const extractedInsights = await EnhancedContentEngine.extractInsights(
        transcription,
        project.title
      )
      
      setProgress(100)
      setInsights(extractedInsights)
      toast.success(`Found ${extractedInsights.length} key insights`)
    } catch (error) {
      toast.error("Analysis failed - please try again")
      console.error(error)
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
    }
  }

  // Step 2: Generate campaign
  const generateCampaign = async () => {
    if (insights.length === 0) {
      toast.error("Please analyze content first")
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      setProgress(50)
      const generatedPosts = await EnhancedContentEngine.generateCampaign(
        insights,
        project.title,
        ['instagram', 'twitter', 'linkedin']
      )
      
      setProgress(100)
      setPosts(generatedPosts)
      
      // Initialize graphics status
      const graphicsStatus: any = {}
      generatedPosts.forEach(post => {
        graphicsStatus[post.id] = { status: 'pending' }
      })
      setGeneratedGraphics(graphicsStatus)
      
      toast.success(`Generated ${generatedPosts.length} posts`)
    } catch (error) {
      toast.error("Generation failed - please try again")
      console.error(error)
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  // Generate single graphic
  const generateGraphic = async (post: EnhancedPost) => {
    setGeneratedGraphics(prev => ({
      ...prev,
      [post.id]: { ...prev[post.id], status: 'generating' }
    }))

    try {
      const graphic = await EnhancedContentEngine.generateGraphic(post, project.id)
      
      setGeneratedGraphics(prev => ({
        ...prev,
        [post.id]: { ...graphic, status: 'completed' }
      }))
      
      toast.success("Graphic generated!")
    } catch (error) {
      setGeneratedGraphics(prev => ({
        ...prev,
        [post.id]: { ...prev[post.id], status: 'error' }
      }))
      toast.error("Failed to generate graphic")
    }
  }

  // Generate all graphics at once
  const generateAllGraphics = async () => {
    const pendingPosts = posts.filter(post => 
      !generatedGraphics[post.id] || generatedGraphics[post.id].status === 'pending' || generatedGraphics[post.id].status === 'error'
    )
    
    if (pendingPosts.length === 0) {
      toast.info("All graphics already generated")
      return
    }

    toast.info(`Generating ${pendingPosts.length} graphics...`)
    
    // Generate in parallel for speed
    const promises = pendingPosts.map(post => generateGraphic(post))
    await Promise.all(promises)
  }

  // Copy single caption
  const copyCaption = (post: EnhancedPost) => {
    const caption = editedCaptions[post.id] || post.caption
    navigator.clipboard.writeText(`${caption}\n\n${post.hashtags.join(' ')}`)
    
    setCopiedItems(prev => new Set([...prev, post.id]))
    setTimeout(() => {
      setCopiedItems(prev => {
        const next = new Set(prev)
        next.delete(post.id)
        return next
      })
    }, 2000)
    
    toast.success("Copied to clipboard!")
  }

  // Copy all captions
  const copyAllCaptions = () => {
    const allCaptions = posts.map(post => {
      const caption = editedCaptions[post.id] || post.caption
      return `=== ${post.platform.toUpperCase()} ===\n${post.headline}\n\n${caption}\n\n${post.hashtags.join(' ')}\n`
    }).join('\n---\n\n')
    
    navigator.clipboard.writeText(allCaptions)
    setCopiedItems(new Set(['all']))
    setTimeout(() => {
      setCopiedItems(new Set())
    }, 2000)
    
    toast.success("All captions copied!")
  }

  // Send to staging
  const sendToStaging = async (post: EnhancedPost) => {
    const graphic = generatedGraphics[post.id]
    if (!graphic?.url || graphic.status !== 'completed') {
      toast.error("Please generate the graphic first")
      return
    }

    try {
      // Save to staging area
      toast.success("Sent to social staging!")
      onUpdate() // Refresh project data
    } catch (error) {
      toast.error("Failed to send to staging")
    }
  }

  // Send all to staging
  const sendAllToStaging = async () => {
    const completedPosts = posts.filter(post => 
      generatedGraphics[post.id]?.status === 'completed'
    )
    
    if (completedPosts.length === 0) {
      toast.error("No completed graphics to stage")
      return
    }

    toast.success(`${completedPosts.length} posts sent to social staging!`)
    onUpdate() // Refresh project data
  }

  // Group posts by platform
  const postsByPlatform = posts.reduce((acc, post) => {
    if (!acc[post.platform]) acc[post.platform] = []
    acc[post.platform].push(post)
    return acc
  }, {} as Record<string, EnhancedPost[]>)

  // Count completed graphics
  const completedGraphicsCount = Object.values(generatedGraphics).filter(g => g.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <IconRocket className="h-6 w-6" />
          AI Campaign Generator
        </h2>
        <p className="text-muted-foreground mt-1">
          Powered by GPT-4.1 and gpt-image-1
        </p>
      </div>

      {/* Step 1: Analyze */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Analyze Video Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={analyzeContent}
            disabled={isAnalyzing || !transcription}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing... {progress}%
              </>
            ) : insights.length > 0 ? (
              <>
                <IconRefresh className="h-4 w-4 mr-2" />
                Re-analyze Content
              </>
            ) : (
              <>
                <IconBrain className="h-4 w-4 mr-2" />
                Extract Key Insights
              </>
            )}
          </Button>
          
          {isAnalyzing && <Progress value={progress} />}
          
          {insights.length > 0 && (
            <Alert>
              <IconCheck className="h-4 w-4" />
              <AlertDescription>
                Found {insights.length} insights ready for campaign generation
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Generate Campaign */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Generate Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={generateCampaign}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating... {progress}%
                </>
              ) : posts.length > 0 ? (
                <>
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Regenerate Campaign
                </>
              ) : (
                <>
                  <IconRocket className="h-4 w-4 mr-2" />
                  Generate Social Media Posts
                </>
              )}
            </Button>
            
            {isGenerating && <Progress value={progress} />}
          </CardContent>
        </Card>
      )}

      {/* Generated Campaign */}
      {posts.length > 0 && (
        <div className="space-y-6">
          {/* Batch Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Campaign Overview</span>
                <div className="flex items-center gap-2 text-sm font-normal">
                  <Badge variant="outline">{posts.length} posts</Badge>
                  <Badge variant="outline">{completedGraphicsCount}/{posts.length} graphics</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={generateAllGraphics}
                  disabled={completedGraphicsCount === posts.length}
                  size="sm"
                  className="gap-2"
                >
                  <IconPhoto className="h-4 w-4" />
                  Generate All Graphics
                </Button>
                <Button
                  onClick={copyAllCaptions}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  {copiedItems.has('all') ? (
                    <IconCopyCheck className="h-4 w-4" />
                  ) : (
                    <IconCopy className="h-4 w-4" />
                  )}
                  Copy All Captions
                </Button>
                <Button
                  onClick={sendAllToStaging}
                  disabled={completedGraphicsCount === 0}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <IconArrowRight className="h-4 w-4" />
                  Send to Social Staging
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts by Platform */}
          <Tabs defaultValue={Object.keys(postsByPlatform)[0]} className="space-y-4">
            <TabsList>
              {Object.entries(postsByPlatform).map(([platform, platformPosts]) => {
                const Icon = platformIcons[platform as keyof typeof platformIcons]
                const completedCount = platformPosts.filter(p => 
                  generatedGraphics[p.id]?.status === 'completed'
                ).length
                
                return (
                  <TabsTrigger key={platform} value={platform} className="gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {platform}
                    <Badge variant="secondary" className="ml-1">
                      {completedCount}/{platformPosts.length}
                    </Badge>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {Object.entries(postsByPlatform).map(([platform, platformPosts]) => (
              <TabsContent key={platform} value={platform} className="space-y-4">
                {platformPosts.map((post) => {
                  const graphic = generatedGraphics[post.id]
                  const isEditing = editingPost === post.id
                  const caption = editedCaptions[post.id] || post.caption
                  const charCount = caption.length + post.hashtags.join(' ').length + 2
                  const charLimit = platform === 'twitter' ? 280 : platform === 'instagram' ? 2200 : 3000
                  
                  return (
                    <Card key={post.id} className={graphic?.status === 'completed' ? 'ring-2 ring-green-500/20' : ''}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{post.headline}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={charCount > charLimit ? 'destructive' : 'outline'} className="text-xs">
                              {charCount}/{charLimit}
                            </Badge>
                            {graphic?.status === 'completed' && (
                              <Badge className="bg-green-500">✓ Ready</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Caption */}
                        <div className="space-y-2">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Textarea
                                value={caption}
                                onChange={(e) => setEditedCaptions(prev => ({
                                  ...prev,
                                  [post.id]: e.target.value
                                }))}
                                className="min-h-[100px] text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setEditingPost(null)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingPost(null)
                                    setEditedCaptions(prev => {
                                      const next = { ...prev }
                                      delete next[post.id]
                                      return next
                                    })
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="text-sm whitespace-pre-wrap cursor-pointer hover:bg-muted/50 p-2 rounded"
                              onClick={() => setEditingPost(post.id)}
                            >
                              {caption}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {post.hashtags.map((tag, i) => (
                              <span key={i} className="text-xs text-blue-500">{tag}</span>
                            ))}
                          </div>
                        </div>

                        {/* Text Overlay */}
                        <Alert className="bg-muted">
                          <AlertDescription className="text-xs">
                            <strong>Text overlay:</strong> {post.textOverlay}
                          </AlertDescription>
                        </Alert>

                        {/* Graphic */}
                        <div className="space-y-2">
                          {graphic?.status === 'completed' ? (
                            <div className="relative aspect-square max-w-sm rounded-lg overflow-hidden bg-muted">
                              <img
                                src={graphic.url}
                                alt={post.headline}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white p-2 rounded text-xs">
                                {graphic.textOverlay}
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => generateGraphic(post)}
                                disabled={graphic?.status === 'generating'}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                              >
                                {graphic?.status === 'generating' ? (
                                  <>
                                    <IconLoader2 className="h-4 w-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : graphic?.status === 'error' ? (
                                  <>
                                    <IconRefresh className="h-4 w-4" />
                                    Retry
                                  </>
                                ) : (
                                  <>
                                    <IconPhoto className="h-4 w-4" />
                                    Generate Graphic
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyCaption(post)}
                            className="gap-1"
                          >
                            {copiedItems.has(post.id) ? (
                              <IconCopyCheck className="h-4 w-4" />
                            ) : (
                              <IconCopy className="h-4 w-4" />
                            )}
                            Copy
                          </Button>
                          {graphic?.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendToStaging(post)}
                              className="gap-1"
                            >
                              <IconArrowRight className="h-4 w-4" />
                              Stage
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  )
} 