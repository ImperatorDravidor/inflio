"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Image, TrendingUp, Target, Brain, Palette, 
  Lightbulb, ChevronRight, ChevronDown, Copy, Download,
  Eye, Share2, BarChart3, Users, Zap, Hash, Clock,
  MessageSquare, BookOpen, Video, CheckCircle2, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AIContentInsightsProps {
  projectId: string
  contentAnalysis?: any
  onRefresh?: () => void
  onThumbnailSelect?: (concept: any) => void
  onPostSelect?: (post: any) => void
}

export function AIContentInsights({ 
  projectId, 
  contentAnalysis, 
  onRefresh,
  onThumbnailSelect,
  onPostSelect
}: AIContentInsightsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    thumbnails: true,
    viral: false,
    posts: false,
    strategy: false
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleDeepAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/analyze-deep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          forceRegenerate: true, 
          modelVersion: 'gpt-5' 
        })
      })

      if (!response.ok) throw new Error('Analysis failed')
      
      const data = await response.json()
      toast.success(`Deep analysis complete! Found ${data.thumbnailIdeasCount} thumbnail ideas and ${data.customPostsCount} custom posts.`)
      
      if (onRefresh) onRefresh()
    } catch (error) {
      toast.error('Failed to perform deep analysis')
      console.error('Deep analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const hasDeepAnalysis = contentAnalysis?.deepAnalysis
  const hasThumbnailIdeas = contentAnalysis?.thumbnailIdeas

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with AI Model Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <Brain className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI Content Insights</h3>
              <p className="text-sm text-muted-foreground">
                Deep analysis powered by {contentAnalysis?.modelVersion || 'GPT-4'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contentAnalysis?.analyzedAt && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(contentAnalysis.analyzedAt).toLocaleDateString()}
              </Badge>
            )}
            <Button
              size="sm"
              onClick={handleDeepAnalysis}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              {isAnalyzing ? (
                <>
                  <motion.div
                    className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {hasDeepAnalysis ? 'Regenerate' : 'Deep Analysis'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="thumbnails" className="flex items-center gap-1">
              <Image className="h-3 w-3" />
              Thumbnails
              {hasThumbnailIdeas && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {contentAnalysis.thumbnailIdeas.concepts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Posts
              {hasDeepAnalysis && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {contentAnalysis.deepAnalysis.customPostIdeas.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Strategy
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Viral Potential Score */}
            {hasDeepAnalysis && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Viral Potential Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Viral Score</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={contentAnalysis.deepAnalysis.viralPotential.score} 
                        className="w-32 h-2"
                      />
                      <span className="text-lg font-bold">
                        {contentAnalysis.deepAnalysis.viralPotential.score}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Key Factors:</p>
                    <div className="flex flex-wrap gap-2">
                      {contentAnalysis.deepAnalysis.viralPotential.factors.map((factor: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Recommendations:</p>
                    <ul className="space-y-1">
                      {contentAnalysis.deepAnalysis.viralPotential.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Pillars & Demographics */}
            {hasDeepAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Content Pillars
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {contentAnalysis.deepAnalysis.contentPillars.map((pillar: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            idx === 0 ? "bg-purple-500" : "bg-purple-300"
                          )} />
                          <span className="text-sm">{pillar}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Target Demographics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Primary Audience</p>
                        <p className="text-sm font-medium">{contentAnalysis.deepAnalysis.targetDemographics.primary}</p>
                      </div>
                      {contentAnalysis.deepAnalysis.targetDemographics.secondary && (
                        <div>
                          <p className="text-xs text-muted-foreground">Secondary Audience</p>
                          <p className="text-sm">{contentAnalysis.deepAnalysis.targetDemographics.secondary}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Interests</p>
                        <div className="flex flex-wrap gap-1">
                          {contentAnalysis.deepAnalysis.targetDemographics.interests.map((interest: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{hasThumbnailIdeas ? contentAnalysis.thumbnailIdeas.concepts.length : 0}</p>
                    <p className="text-xs text-muted-foreground">Thumbnail Ideas</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{hasDeepAnalysis ? contentAnalysis.deepAnalysis.customPostIdeas.length : 0}</p>
                    <p className="text-xs text-muted-foreground">Custom Posts</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{contentAnalysis?.keywords?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Keywords</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{contentAnalysis?.topics?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Topics</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Thumbnails Tab */}
          <TabsContent value="thumbnails" className="space-y-4 mt-4">
            {hasThumbnailIdeas ? (
              <>
                {/* Platform Optimization Tips */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Platform Optimization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(contentAnalysis.thumbnailIdeas.platformOptimized).map(([platform, tip]) => (
                        <div key={platform} className="p-3 rounded-lg bg-muted/50 border">
                          <p className="font-medium text-sm capitalize mb-1">{platform}</p>
                          <p className="text-xs text-muted-foreground">{tip as string}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Thumbnail Concepts */}
                <div className="space-y-3">
                  {contentAnalysis.thumbnailIdeas.concepts.map((concept: any) => (
                    <motion.div
                      key={concept.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card 
                        className={cn(
                          "cursor-pointer transition-all",
                          selectedThumbnail === concept.id && "ring-2 ring-purple-500"
                        )}
                        onClick={() => setSelectedThumbnail(concept.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{concept.title}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {concept.description}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {concept.style}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (onThumbnailSelect) onThumbnailSelect(concept)
                                }}
                              >
                                Use This
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <AnimatePresence>
                          {selectedThumbnail === concept.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <CardContent className="space-y-3 pt-0">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Visual Elements</p>
                                    <div className="flex flex-wrap gap-1">
                                      {concept.visualElements.map((element: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {element}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Color Scheme</p>
                                    <div className="flex gap-1">
                                      {concept.colorScheme.map((color: string, idx: number) => (
                                        <div
                                          key={idx}
                                          className="h-6 w-6 rounded border"
                                          style={{ backgroundColor: color }}
                                          title={color}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Key Text Overlay</p>
                                  <p className="text-sm font-bold">{concept.keyText}</p>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Composition</p>
                                  <p className="text-xs">{concept.composition}</p>
                                </div>

                                {concept.aiPrompt && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">AI Generation Prompt</p>
                                    <div className="p-2 rounded bg-muted/50 text-xs font-mono relative group">
                                      {concept.aiPrompt}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          copyToClipboard(concept.aiPrompt, 'Prompt')
                                        }}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    Mood: {concept.mood}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    Target: {concept.targetAudience}
                                  </Badge>
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Best Practices */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {contentAnalysis.thumbnailIdeas.bestPractices.map((practice: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500" />
                          <span>{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-500/10">
                    <Image className="h-8 w-8 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">No Thumbnail Ideas Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Run deep analysis to generate AI-powered thumbnail concepts
                    </p>
                    <Button onClick={handleDeepAnalysis} disabled={isAnalyzing}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Thumbnail Ideas
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4 mt-4">
            {hasDeepAnalysis && contentAnalysis.deepAnalysis.customPostIdeas ? (
              <div className="space-y-3">
                {contentAnalysis.deepAnalysis.customPostIdeas.map((post: any) => (
                  <Card key={post.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {post.type}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                post.estimatedEngagement === 'high' && "border-green-500 text-green-600",
                                post.estimatedEngagement === 'medium' && "border-yellow-500 text-yellow-600",
                                post.estimatedEngagement === 'low' && "border-red-500 text-red-600"
                              )}
                            >
                              {post.estimatedEngagement} engagement
                            </Badge>
                          </div>
                          <CardTitle className="text-base">{post.hook}</CardTitle>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onPostSelect && onPostSelect(post)}
                        >
                          Use This
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm">{post.mainContent}</p>
                      </div>
                      
                      <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                        <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Call to Action</p>
                        <p className="text-sm font-medium">{post.callToAction}</p>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.bestTimeToPost || 'Anytime'}
                        </div>
                        <div className="flex items-center gap-1">
                          Platforms:
                          {post.platform.map((p: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs ml-1">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {post.synergies && post.synergies.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Content Synergies</p>
                          <div className="flex flex-wrap gap-1">
                            {post.synergies.map((synergy: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {synergy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-500/10">
                    <MessageSquare className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">No Custom Posts Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Run deep analysis to generate platform-specific post ideas
                    </p>
                    <Button onClick={handleDeepAnalysis} disabled={isAnalyzing}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Post Ideas
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-4 mt-4">
            {hasDeepAnalysis && contentAnalysis.deepAnalysis.contentStrategy ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Content Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Primary Theme</p>
                      <Badge className="text-sm px-3 py-1">
                        {contentAnalysis.deepAnalysis.contentStrategy.primaryTheme}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Secondary Themes</p>
                      <div className="flex flex-wrap gap-2">
                        {contentAnalysis.deepAnalysis.contentStrategy.secondaryThemes.map((theme: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {contentAnalysis.deepAnalysis.contentStrategy.contentSeries && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Content Series Ideas</p>
                        <div className="space-y-2">
                          {contentAnalysis.deepAnalysis.contentStrategy.contentSeries.map((series: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                              <Video className="h-4 w-4 text-purple-500" />
                              <span className="text-sm">{series}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Cross-Promotion Opportunities</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {contentAnalysis.deepAnalysis.contentStrategy.crossPromotionOpportunities.map((opp: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded border">
                            <Share2 className="h-3 w-3 text-blue-500" />
                            <span className="text-xs">{opp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Emotional Journey */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Emotional Journey</CardTitle>
                    <CardDescription className="text-xs">
                      {contentAnalysis.deepAnalysis.narrativeArc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      {contentAnalysis.deepAnalysis.emotionalJourney.map((emotion: string, idx: number) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                            idx === 0 && "bg-blue-500",
                            idx === 1 && "bg-purple-500",
                            idx === 2 && "bg-green-500",
                            idx > 2 && "bg-gray-500"
                          )}>
                            {idx + 1}
                          </div>
                          <p className="text-xs mt-2">{emotion}</p>
                          {idx < contentAnalysis.deepAnalysis.emotionalJourney.length - 1 && (
                            <ChevronRight className="h-3 w-3 text-muted-foreground mt-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/10">
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">No Strategy Analysis Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Run deep analysis to generate content strategy recommendations
                    </p>
                    <Button onClick={handleDeepAnalysis} disabled={isAnalyzing}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Strategy
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}