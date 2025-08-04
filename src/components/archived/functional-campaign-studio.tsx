"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  IconRocket,
  IconBrain,
  IconLoader2,
  IconCopy,
  IconPhoto,
  IconCheck,
  IconAlertCircle
} from "@tabler/icons-react"
import { toast } from "sonner"
import {
  EnhancedContentEngine,
  type EnhancedInsight,
  type EnhancedPost
} from "@/lib/ai-content-enhanced"

interface FunctionalCampaignStudioProps {
  project: any
  transcription: any
  onUpdate: () => void
}

export function FunctionalCampaignStudio({
  project,
  transcription,
  onUpdate
}: FunctionalCampaignStudioProps) {
  const [insights, setInsights] = useState<EnhancedInsight[]>([])
  const [posts, setPosts] = useState<EnhancedPost[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedGraphics, setGeneratedGraphics] = useState<Record<string, { url: string; textOverlay: string }>>({})

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
      
      // Using GPT-4.1 as requested
      const extractedInsights = await EnhancedContentEngine.extractInsights(
        transcription,
        project.title
      )
      
      setProgress(100)
      setInsights(extractedInsights)
      
      toast.success(`Found ${extractedInsights.length} key insights using GPT-4.1`)
    } catch (error) {
      toast.error("Analysis failed")
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
      
      // Generate posts for selected platforms
      const generatedPosts = await EnhancedContentEngine.generateCampaign(
        insights,
        project.title,
        ['instagram', 'twitter', 'linkedin']
      )
      
      setProgress(100)
      setPosts(generatedPosts)
      
      toast.success(`Generated ${generatedPosts.length} posts with GPT-4.1`)
    } catch (error) {
      toast.error("Generation failed")
      console.error(error)
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  // Step 3: Generate graphics with gpt-image-1
  const generateGraphic = async (post: EnhancedPost) => {
    try {
      const graphic = await EnhancedContentEngine.generateGraphic(post, project.id)
      
      setGeneratedGraphics(prev => ({
        ...prev,
        [post.id]: graphic
      }))
      
      toast.success("Graphic generated with gpt-image-1!")
    } catch (error) {
      toast.error("Failed to generate graphic")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <IconRocket className="h-6 w-6" />
          AI Campaign Generator (GPT-4.1)
        </h2>
        <p className="text-muted-foreground mt-1">
          Functional AI-powered campaign generation - no marketing fluff
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <IconAlertCircle className="h-4 w-4" />
        <AlertDescription>
          This uses <strong>GPT-4.1</strong> for content analysis and <strong>gpt-image-1</strong> for graphics. 
          Every post clearly references your original video.
        </AlertDescription>
      </Alert>

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
                Analyzing with GPT-4.1... {progress}%
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
            <div className="space-y-2">
              <p className="text-sm font-medium">Found {insights.length} insights:</p>
              <ScrollArea className="h-48 rounded-md border p-3">
                {insights.map((insight, i) => (
                  <div key={insight.id} className="mb-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        {i + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="text-sm">{insight.content}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {insight.platform}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Score: {insight.score}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
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
                  Generating with GPT-4.1... {progress}%
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

      {/* Generated Posts */}
      {posts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Campaign</h3>
          
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{post.headline}</CardTitle>
                  <Badge>{post.platform}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Caption */}
                <div className="space-y-2">
                  <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs text-blue-500">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Text Overlay */}
                <Alert className="bg-muted">
                  <AlertDescription className="text-xs">
                    <strong>Text Overlay:</strong> {post.textOverlay}
                  </AlertDescription>
                </Alert>

                {/* Graphic */}
                <div className="space-y-2">
                  {generatedGraphics[post.id] ? (
                    <div className="relative aspect-square max-w-sm rounded-lg overflow-hidden bg-muted">
                      <img
                        src={generatedGraphics[post.id].url}
                        alt={post.headline}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white p-2 rounded text-xs">
                        {generatedGraphics[post.id].textOverlay}
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => generateGraphic(post)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <IconPhoto className="h-4 w-4" />
                      Generate Graphic (gpt-image-1)
                    </Button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${post.caption}\n\n${post.hashtags.join(' ')}`
                      )
                      toast.success("Copied to clipboard!")
                    }}
                  >
                    <IconCopy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 