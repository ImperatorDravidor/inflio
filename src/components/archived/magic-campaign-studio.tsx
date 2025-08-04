"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  IconWand,
  IconSparkles,
  IconBrain,
  IconRocket,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconBrandTiktok,
  IconCalendar,
  IconTrendingUp,
  IconBulb,
  IconTarget,
  IconClock,
  IconHash,
  IconEye,
  IconCopy,
  IconDownload,
  IconChevronRight,
  IconCheck,
  IconAlertCircle,
  IconFlame,
  IconChartBar,
  IconUsers,
  IconArrowRight,
  IconWand as IconMagic,
  IconStars,
  IconBolt,
  IconDiamond,
  IconLoader2,
  IconPhoto,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { 
  AIContentIntelligence, 
  type ContentInsight, 
  type SocialPost, 
  type ContentCampaign 
} from "@/lib/ai-content-intelligence"
import {
  PremiumContentEngine,
  type PremiumInsight,
  type PremiumPost,
  type PremiumCampaign
} from "@/lib/ai-content-premium-engine"
import { format } from "date-fns"

interface MagicCampaignStudioProps {
  project: any
  transcription: any
  contentAnalysis: any
  selectedPersona?: any
  onUpdate: () => void
}

const platformIcons = {
  instagram: IconBrandInstagram,
  twitter: IconBrandTwitter,
  linkedin: IconBrandLinkedin,
  youtube: IconBrandYoutube,
  tiktok: IconBrandTiktok
}

const platformColors = {
  instagram: 'from-purple-600 to-pink-600',
  twitter: 'from-blue-500 to-blue-600',
  linkedin: 'from-blue-700 to-blue-800',
  youtube: 'from-red-500 to-red-600',
  tiktok: 'from-gray-800 to-black'
}

const impactColors = {
  viral: 'from-red-500 to-orange-500',
  high: 'from-purple-500 to-pink-500',
  medium: 'from-blue-500 to-cyan-500',
  low: 'from-gray-500 to-gray-600'
}

export function MagicCampaignStudio({
  project,
  transcription,
  contentAnalysis,
  selectedPersona,
  onUpdate
}: MagicCampaignStudioProps) {
  const [activeTab, setActiveTab] = useState<"magic" | "insights" | "campaign" | "calendar">("magic")
  const [insights, setInsights] = useState<ContentInsight[]>([])
  const [campaign, setCampaign] = useState<ContentCampaign | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'twitter', 'linkedin'])
  const [generatedGraphics, setGeneratedGraphics] = useState<Record<string, { url: string; textOverlay: string }>>({})
  const [calendar, setCalendar] = useState<any>(null)

  // Auto-analyze on mount if we have content
  useEffect(() => {
    if (transcription && contentAnalysis && insights.length === 0) {
      analyzeContent()
    }
  }, [transcription, contentAnalysis])

  const analyzeContent = async () => {
    if (!transcription || !contentAnalysis) {
      toast.error("Please wait for content analysis to complete")
      return
    }

    setIsAnalyzing(true)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const extractedInsights = await AIContentIntelligence.extractDeepInsights(
        transcription,
        contentAnalysis,
        project.title
      )
      
      clearInterval(progressInterval)
      setProgress(100)
      setInsights(extractedInsights)
      
      // Celebrate viral insights
      const viralCount = extractedInsights.filter(i => i.impact === 'viral').length
      if (viralCount > 0) {
        toast.success(`Found ${viralCount} viral opportunities!`, {
          icon: <IconFlame className="h-4 w-4 text-orange-500" />
        })
      } else {
        toast.success(`Discovered ${extractedInsights.length} powerful insights!`)
      }
      
      setActiveTab("insights")
    } catch (error) {
      toast.error("Failed to analyze content")
      console.error(error)
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
    }
  }

  const generateMagicCampaign = async () => {
    if (insights.length === 0) {
      toast.error("Please analyze content first")
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 95))
      }, 300)

      // Generate campaign
      const generatedCampaign = await AIContentIntelligence.generateSmartCampaign(
        insights,
        project.title,
        contentAnalysis,
        selectedPlatforms
      )
      
      setCampaign(generatedCampaign)

      // Generate calendar
      const calendarData = await AIContentIntelligence.generateContentCalendar(generatedCampaign)
      setCalendar(calendarData)
      
      clearInterval(progressInterval)
      setProgress(100)
      
      // Celebration message
      
      toast.success("Your campaign is ready! 🚀", {
        description: `${generatedCampaign.totalPosts} posts across ${selectedPlatforms.length} platforms`,
        duration: 5000
      })
      
      setActiveTab("campaign")
    } catch (error) {
      toast.error("Failed to generate campaign")
      console.error(error)
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  const generateGraphicForPost = async (post: SocialPost) => {
    try {
      // Find the insight that this post is based on
      const relatedInsight = insights.find(i => 
        post.caption.includes(i.content.substring(0, 50)) || 
        post.headline.includes(i.content.substring(0, 30))
      )
      
      const visualConcept = await AIContentIntelligence.generateVisualConcepts(
        post,
        transcription?.text || '',
        relatedInsight?.content || post.headline,
        selectedPersona?.photos
      )
      
      const response = await fetch('/api/generate-social-graphics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          prompt: visualConcept.primary,
          platform: post.platform,
          size: visualConcept.designSpecs.dimensions,
          quality: 'hd',  // High quality for gpt-image-1
          style: 'natural',  // Natural style for gpt-image-1
          model: 'gpt-image-1',  // Explicitly use gpt-image-1
          textOverlay: visualConcept.textOverlay,
          customText: visualConcept.textOverlay,  // Ensure text is in the image
          colorScheme: visualConcept.designSpecs.colorScheme,
          metadata: {
            postId: post.id,
            campaignId: campaign?.id,
            engagement: post.estimatedEngagement,
            textPlacement: visualConcept.designSpecs.textPlacement
          }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.graphics?.[0]) {
          setGeneratedGraphics(prev => ({
            ...prev,
            [post.id]: {
              url: result.graphics[0].url,
              textOverlay: visualConcept.textOverlay
            }
          }))
          toast.success("High-quality graphic generated with text overlay!")
        }
      }
    } catch (error) {
      toast.error("Failed to generate graphic")
    }
  }

  const downloadCampaign = () => {
    if (!campaign) return
    
    const campaignData = {
      campaign,
      insights,
      calendar,
      generatedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(campaignData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.title}-campaign-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success("Campaign downloaded!")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1">
        <div className="bg-background rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <IconRocket className="h-6 w-6 text-blue-500" />
                AI Campaign Generator
              </h2>
              <p className="text-muted-foreground mt-1">
                Generate a complete 2-week social media campaign from your video content
              </p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <IconStars className="h-3 w-3" />
              GPT-4 Powered
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="magic" className="gap-2">
            <IconWand className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <IconBulb className="h-4 w-4" />
            Insights
            {insights.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1">
                {insights.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="campaign" className="gap-2">
            <IconRocket className="h-4 w-4" />
            Campaign
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <IconCalendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="magic" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <Card className="border-2 border-dashed border-blue-500/50 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
              <CardContent className="p-12 space-y-6">
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <IconRocket className="h-24 w-24 text-blue-500 mx-auto" />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Generate Complete Campaign</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    AI analyzes your video to create 15-20 ready-to-post social media 
                    posts with captions, hashtags, and optimal posting times.
                  </p>
                </div>

                {/* Platform Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Platforms</Label>
                  <div className="flex justify-center gap-3 flex-wrap">
                    {Object.entries(platformIcons).map(([platform, Icon]) => {
                      const isSelected = selectedPlatforms.includes(platform)
                      return (
                        <motion.button
                          key={platform}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
                            } else {
                              setSelectedPlatforms([...selectedPlatforms, platform])
                            }
                          }}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-all",
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-muted hover:border-primary/50"
                          )}
                        >
                          <Icon className={cn(
                            "h-6 w-6",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {insights.length === 0 ? (
                    <Button
                      size="lg"
                      onClick={analyzeContent}
                      disabled={isAnalyzing}
                      className="gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <IconLoader2 className="h-5 w-5 animate-spin" />
                          Analyzing Content... {progress}%
                        </>
                      ) : (
                        <>
                          <IconBrain className="h-5 w-5" />
                          Step 1: Analyze Video
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={generateMagicCampaign}
                      disabled={isGenerating || selectedPlatforms.length === 0}
                      className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isGenerating ? (
                        <>
                          <IconLoader2 className="h-5 w-5 animate-spin" />
                          Generating Campaign... {progress}%
                        </>
                      ) : (
                        <>
                          <IconRocket className="h-5 w-5" />
                          Step 2: Generate Campaign
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {(isAnalyzing || isGenerating) && (
                  <Progress value={progress} className="w-full max-w-xs mx-auto" />
                )}
              </CardContent>
            </Card>

            {/* What You'll Get */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center space-y-2">
                  <IconBulb className="h-8 w-8 text-yellow-500 mx-auto" />
                  <h4 className="font-semibold">Viral Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    AI extracts the most shareable moments from your content
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center space-y-2">
                  <IconRocket className="h-8 w-8 text-purple-500 mx-auto" />
                  <h4 className="font-semibold">Complete Campaign</h4>
                  <p className="text-sm text-muted-foreground">
                    Ready-to-post content with captions, hashtags, and visuals
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center space-y-2">
                  <IconCalendar className="h-8 w-8 text-blue-500 mx-auto" />
                  <h4 className="font-semibold">2-Week Calendar</h4>
                  <p className="text-sm text-muted-foreground">
                    Optimal posting schedule for maximum engagement
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {insights.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Content Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-extracted viral opportunities from your content
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {['viral', 'high', 'medium'].map(impact => {
                    const count = insights.filter(i => i.impact === impact).length
                    if (count === 0) return null
                    
                    return (
                      <Badge
                        key={impact}
                        variant="secondary"
                        className={cn(
                          "gap-1",
                          impact === 'viral' && "bg-red-500/20 text-red-500",
                          impact === 'high' && "bg-purple-500/20 text-purple-500"
                        )}
                      >
                        {impact === 'viral' && <IconFlame className="h-3 w-3" />}
                        {count} {impact}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        "overflow-hidden",
                        insight.impact === 'viral' && "ring-2 ring-red-500/50"
                      )}>
                        <div className={cn(
                          "h-1 bg-gradient-to-r",
                          impactColors[insight.impact]
                        )} />
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                insight.impact === 'viral' ? "bg-red-500/10" :
                                insight.impact === 'high' ? "bg-purple-500/10" :
                                insight.impact === 'medium' ? "bg-blue-500/10" :
                                "bg-gray-500/10"
                              )}>
                                {insight.type === 'hook' && <IconBolt className="h-5 w-5" />}
                                {insight.type === 'story' && <IconUsers className="h-5 w-5" />}
                                {insight.type === 'lesson' && <IconBulb className="h-5 w-5" />}
                                {insight.type === 'statistic' && <IconChartBar className="h-5 w-5" />}
                                {insight.type === 'quote' && <IconHash className="h-5 w-5" />}
                                {insight.type === 'controversy' && <IconFlame className="h-5 w-5" />}
                                {insight.type === 'transformation' && <IconTrendingUp className="h-5 w-5" />}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {insight.type}
                                  </Badge>
                                  <Badge 
                                    variant={insight.impact === 'viral' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {insight.impact} impact
                                  </Badge>
                                </div>
                                
                                <p className="font-medium">{insight.content}</p>
                                
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <IconTarget className="h-3 w-3" />
                                    {insight.audience.join(', ')}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    {insight.emotionalTrigger}
                                  </span>
                                </div>
                                
                                <div className="flex gap-2 mt-2">
                                  {insight.platforms.map(platform => {
                                    const Icon = platformIcons[platform as keyof typeof platformIcons]
                                    return Icon ? (
                                      <Icon key={platform} className="h-4 w-4 text-muted-foreground" />
                                    ) : null
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <Card className="p-12 text-center">
              <IconBrain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
              <p className="text-muted-foreground mb-4">
                Analyze your content to discover viral opportunities
              </p>
              <Button onClick={() => setActiveTab("magic")}>
                <IconArrowRight className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Campaign Tab */}
        <TabsContent value="campaign" className="space-y-6">
          {campaign ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{campaign.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {campaign.objective} • {campaign.duration} • {campaign.totalPosts} posts
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCampaign}
                >
                  <IconDownload className="h-4 w-4 mr-2" />
                  Export Campaign
                </Button>
              </div>

              {/* Campaign Overview */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Reach</p>
                        <p className="text-2xl font-bold">
                          {campaign.platforms.reduce((sum, p) => sum + p.kpis.reach, 0).toLocaleString()}
                        </p>
                      </div>
                      <IconUsers className="h-8 w-8 text-green-500/20" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Engagement</p>
                        <p className="text-2xl font-bold">
                          {campaign.platforms.reduce((sum, p) => sum + p.kpis.engagement, 0).toLocaleString()}
                        </p>
                      </div>
                      <IconTrendingUp className="h-8 w-8 text-blue-500/20" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Conversions</p>
                        <p className="text-2xl font-bold">
                          {campaign.platforms.reduce((sum, p) => sum + p.kpis.conversions, 0).toLocaleString()}
                        </p>
                      </div>
                      <IconTarget className="h-8 w-8 text-purple-500/20" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Platform Posts */}
              <Tabs defaultValue={campaign.platforms[0]?.platform} className="space-y-4">
                <TabsList>
                  {campaign.platforms.map(platform => {
                    const Icon = platformIcons[platform.platform as keyof typeof platformIcons]
                    return (
                      <TabsTrigger
                        key={platform.platform}
                        value={platform.platform}
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {platform.platform}
                        <Badge variant="secondary" className="ml-1">
                          {platform.posts.length}
                        </Badge>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {campaign.platforms.map(platform => (
                  <TabsContent
                    key={platform.platform}
                    value={platform.platform}
                    className="space-y-4"
                  >
                    <Alert>
                      <IconBulb className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Strategy:</strong> {platform.strategy}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      {platform.posts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "p-2 rounded-lg bg-gradient-to-br",
                                    platformColors[platform.platform as keyof typeof platformColors]
                                  )}>
                                    <IconRocket className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">
                                      {post.headline}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {post.type}
                                      </Badge>
                                      <span className="text-xs">
                                        {post.bestTime} • {post.contentPillars.join(', ')}
                                      </span>
                                    </CardDescription>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 text-xs">
                                          <IconTrendingUp className="h-4 w-4 text-green-500" />
                                          <span className="font-medium">{post.estimatedEngagement}%</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Estimated engagement rate</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Caption Preview */}
                              <div className="space-y-2">
                                <Label className="text-xs">Caption</Label>
                                <div className="p-3 bg-muted rounded-lg text-sm">
                                  <p className="whitespace-pre-wrap">{post.caption}</p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {post.hashtags.map((tag, i) => (
                                      <span key={i} className="text-blue-500">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Visual Preview */}
                              <div className="space-y-2">
                                <Label className="text-xs">Visual</Label>
                                                              {generatedGraphics[post.id] ? (
                                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={generatedGraphics[post.id].url}
                                    alt={post.headline}
                                    className="w-full h-full object-cover"
                                  />
                                  {generatedGraphics[post.id].textOverlay && (
                                    <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white p-2 rounded text-xs">
                                      <strong>Text overlay:</strong> {generatedGraphics[post.id].textOverlay}
                                    </div>
                                  )}
                                </div>
                                ) : (
                                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                      <IconPhoto className="h-8 w-8 text-muted-foreground mb-2" />
                                      <p className="text-xs text-muted-foreground mb-2">
                                        {post.visualPrompt}
                                      </p>
                                      <Button
                                        size="sm"
                                        onClick={() => generateGraphicForPost(post)}
                                      >
                                        <IconSparkles className="h-4 w-4 mr-2" />
                                        Generate Visual
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between pt-2">
                                <div className="text-xs text-muted-foreground">
                                  <strong>CTA:</strong> {post.cta}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      navigator.clipboard.writeText(post.caption + '\n\n' + post.hashtags.join(' '))
                                      toast.success("Copied to clipboard!")
                                    }}
                                  >
                                    <IconCopy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                  >
                                    <IconEye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          ) : (
            <Card className="p-12 text-center">
              <IconRocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaign yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your viral campaign with one click
              </p>
              <Button onClick={() => setActiveTab("magic")}>
                <IconArrowRight className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          {calendar ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Content Calendar</h3>
                <Badge variant="secondary">
                  {calendar.week1.length + calendar.week2.length} posts scheduled
                </Badge>
              </div>

              <div className="space-y-6">
                {/* Week 1 */}
                <div className="space-y-4">
                  <h4 className="font-medium">Week 1</h4>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      const dayPosts = calendar.week1.filter((p: any) => 
                        p.dayOfWeek === ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index]
                      )
                      
                      return (
                        <Card key={day} className="overflow-hidden">
                          <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-sm">{day}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            {dayPosts.length > 0 ? (
                              <div className="space-y-2">
                                {dayPosts.map((post: any, i: number) => {
                                  const Icon = platformIcons[post.platform as keyof typeof platformIcons]
                                  return (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2 p-2 bg-muted rounded text-xs"
                                    >
                                      <Icon className="h-3 w-3" />
                                      <span className="truncate">{post.post.headline}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No posts</p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {/* Week 2 */}
                <div className="space-y-4">
                  <h4 className="font-medium">Week 2</h4>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      const dayPosts = calendar.week2.filter((p: any) => 
                        p.dayOfWeek === ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index]
                      )
                      
                      return (
                        <Card key={day} className="overflow-hidden">
                          <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-sm">{day}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            {dayPosts.length > 0 ? (
                              <div className="space-y-2">
                                {dayPosts.map((post: any, i: number) => {
                                  const Icon = platformIcons[post.platform as keyof typeof platformIcons]
                                  return (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2 p-2 bg-muted rounded text-xs"
                                    >
                                      <Icon className="h-3 w-3" />
                                      <span className="truncate">{post.post.headline}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No posts</p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {/* Daily Themes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Daily Themes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(calendar.dailyThemes).map(([day, theme]) => (
                        <div key={day} className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{day}</span>
                          <span className="text-muted-foreground">{theme}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <IconCalendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No calendar yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your campaign to see the posting schedule
              </p>
              <Button onClick={() => setActiveTab("magic")}>
                <IconArrowRight className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 