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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  IconStars,
  IconBolt,
  IconDiamond,
  IconLoader2,
  IconPhoto,
  IconTestPipe,
  IconChartLine,
  IconActivity,
  IconAward,
  IconCrown,
  IconShieldCheck,
  IconBoltOff,
  IconSearch,
  IconBulb as IconBulbFilled,
  IconReportAnalytics,
  IconPalette,
  IconDeviceAnalytics,
  IconTrendingUp as IconTrendingUp2,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  PremiumContentEngine,
  type PremiumInsight,
  type PremiumPost,
  type PremiumCampaign
} from "@/lib/ai-content-premium-engine"
import { format } from "date-fns"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart,
} from "recharts"

interface PremiumCampaignStudioProps {
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

export function PremiumCampaignStudio({
  project,
  transcription,
  contentAnalysis,
  selectedPersona,
  onUpdate
}: PremiumCampaignStudioProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "insights" | "campaign" | "analytics" | "optimize">("overview")
  const [insights, setInsights] = useState<PremiumInsight[]>([])
  const [campaign, setCampaign] = useState<PremiumCampaign | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'twitter', 'linkedin'])
  const [generatedGraphics, setGeneratedGraphics] = useState<Record<string, { url: string; textOverlay: string; variants?: any[] }>>({})
  const [trends, setTrends] = useState<any>(null)
  const [competitors, setCompetitors] = useState<any>(null)
  const [abTests, setAbTests] = useState<any[]>([])
  const [premiumFeatures, setPremiumFeatures] = useState({
    trendAnalysis: true,
    competitorIntelligence: true,
    abTesting: true,
    performancePrediction: true,
    automations: true,
    multiLanguage: false
  })

  // Auto-analyze on mount
  useEffect(() => {
    if (transcription && contentAnalysis && insights.length === 0) {
      analyzePremiumContent()
    }
  }, [transcription, contentAnalysis])

  const analyzePremiumContent = async () => {
    if (!transcription || !contentAnalysis) {
      toast.error("Please wait for content analysis to complete")
      return
    }

    setIsAnalyzing(true)
    setProgress(0)

    try {
      // Step 1: Trend Analysis
      setProgress(20)
      const trendData = await PremiumContentEngine.analyzeTrends(
        project.title,
        contentAnalysis.category || 'general'
      )
      setTrends(trendData)
      
      // Step 2: Competitor Analysis
      setProgress(40)
      const competitorData = await PremiumContentEngine.analyzeCompetitors(
        project.title,
        selectedPlatforms
      )
      setCompetitors(competitorData)
      
      // Step 3: Extract Premium Insights
      setProgress(60)
      const extractedInsights = await PremiumContentEngine.extractPremiumInsights(
        transcription,
        contentAnalysis,
        project.title,
        {
          tone: 'professional',
          values: ['innovation', 'quality'],
          personality: ['expert', 'approachable']
        }
      )
      
      setProgress(100)
      setInsights(extractedInsights)
      
      // Show premium results
      const viralInsights = extractedInsights.filter(i => i.viralScore > 80).length
      toast.success(
        <div>
          <strong>Premium Analysis Complete!</strong>
          <ul className="mt-2 text-sm">
            <li>✓ {extractedInsights.length} viral opportunities found</li>
            <li>✓ {trendData.trending.length} trending topics identified</li>
            <li>✓ {competitorData.gaps.length} competitor gaps discovered</li>
            <li>✓ {viralInsights} high-viral-potential insights</li>
          </ul>
        </div>,
        { duration: 6000 }
      )
      
      setActiveTab("insights")
    } catch (error) {
      toast.error("Premium analysis failed")
      console.error(error)
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
    }
  }

  const generatePremiumCampaign = async () => {
    if (insights.length === 0) {
      toast.error("Please analyze content first")
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      // Progress simulation with real steps
      setProgress(25)
      
      const brandSettings = {
        voice: {
          tone: 'professional yet approachable',
          values: ['innovation', 'authenticity', 'excellence'],
          personality: ['expert', 'helpful', 'inspiring']
        },
        colors: ['#1e40af', '#3b82f6', '#60a5fa'],
        fonts: ['Inter', 'SF Pro Display'],
        guidelines: 'Modern, clean, and professional with a human touch'
      }
      
      setProgress(50)
      
      // Generate premium campaign
      const generatedCampaign = await PremiumContentEngine.generatePremiumCampaign(
        insights,
        project.title,
        contentAnalysis,
        brandSettings,
        selectedPlatforms
      )
      
      setProgress(75)
      
      // Generate A/B tests for top posts
      const topPosts = generatedCampaign.platforms
        .flatMap(p => p.posts)
        .sort((a, b) => b.predictions.viralProbability - a.predictions.viralProbability)
        .slice(0, 5)
      
      const abTestPromises = topPosts.map(post => 
        PremiumContentEngine.generateABTestVariants(post, 'headline')
      )
      
      const abTestResults = await Promise.all(abTestPromises)
      setAbTests(abTestResults)
      
      setProgress(100)
      setCampaign(generatedCampaign)
      
      // Premium success message
      const totalPosts = generatedCampaign.platforms.reduce((sum, p) => sum + p.posts.length, 0)
      const avgViralProb = generatedCampaign.platforms
        .flatMap(p => p.posts)
        .reduce((sum, post) => sum + post.predictions.viralProbability, 0) / totalPosts
      
      toast.success(
        <div>
          <strong>Premium Campaign Generated! 🚀</strong>
          <ul className="mt-2 text-sm">
            <li>✓ {totalPosts} optimized posts created</li>
            <li>✓ {avgViralProb.toFixed(0)}% average viral probability</li>
            <li>✓ {abTests.length} A/B tests configured</li>
            <li>✓ ${generatedCampaign.projectedMetrics.estimatedROI.toLocaleString()} estimated ROI</li>
          </ul>
        </div>,
        { duration: 8000 }
      )
      
      setActiveTab("campaign")
    } catch (error) {
      toast.error("Failed to generate premium campaign")
      console.error(error)
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  const generatePremiumGraphic = async (post: PremiumPost) => {
    try {
      const concepts = await PremiumContentEngine.generatePremiumVisuals(
        post,
        transcription?.text || '',
        {
          colors: ['#1e40af', '#3b82f6', '#60a5fa'],
          fonts: ['Inter', 'SF Pro Display'],
          logo: selectedPersona?.logo
        }
      )
      
      const response = await fetch('/api/generate-social-graphics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          prompt: concepts.concepts[0].prompt,
          platform: post.platform,
          size: post.visualConcept.designSystem.layout,
          quality: 'hd',
          style: 'natural',
          model: 'gpt-image-1',
          textOverlay: post.visualConcept.textOverlay,
          customText: post.visualConcept.textOverlay,
          variations: concepts.concepts.length,
          abTestVariants: post.visualConcept.abTestVariants,
          metadata: {
            postId: post.id,
            campaignId: campaign?.id,
            viralProbability: post.predictions.viralProbability
          }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.graphics?.length > 0) {
          setGeneratedGraphics(prev => ({
            ...prev,
            [post.id]: {
              url: result.graphics[0].url,
              textOverlay: post.visualConcept.textOverlay,
              variants: result.graphics.slice(1)
            }
          }))
          toast.success("Premium graphics generated with A/B variants!")
        }
      }
    } catch (error) {
      toast.error("Failed to generate premium graphics")
    }
  }

  const exportCampaign = () => {
    if (!campaign) return
    
    const exportData = {
      campaign,
      insights,
      trends,
      competitors,
      abTests,
      generatedAt: new Date().toISOString(),
      version: '2.0-premium'
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.title}-premium-campaign-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success("Premium campaign exported with all data!")
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-1">
        <div className="bg-background rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IconCrown className="h-8 w-8 text-amber-500" />
                <h2 className="text-2xl font-bold">Premium Campaign Studio</h2>
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  ELITE
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Enterprise-grade AI campaign generation with predictive analytics and optimization
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="gap-1 mb-2">
                <IconShieldCheck className="h-3 w-3" />
                GPT-4 Turbo
              </Badge>
              <div className="text-xs text-muted-foreground">
                Powered by advanced AI
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Features Toggle */}
      <Card className="border-amber-500/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IconDiamond className="h-5 w-5 text-amber-500" />
            Premium Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(premiumFeatures).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center justify-between">
                <Label htmlFor={feature} className="text-sm capitalize">
                  {feature.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Switch
                  id={feature}
                  checked={enabled}
                  onCheckedChange={(checked) => 
                    setPremiumFeatures(prev => ({ ...prev, [feature]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50">
          <TabsTrigger value="overview" className="gap-2">
            <IconChartLine className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <IconBulbFilled className="h-4 w-4" />
            Insights
            {insights.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1 bg-amber-500/20">
                {insights.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="campaign" className="gap-2">
            <IconRocket className="h-4 w-4" />
            Campaign
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <IconChartBar className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="optimize" className="gap-2">
            <IconTarget className="h-4 w-4" />
            Optimize
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Trend Analysis Card */}
            <Card className="border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTrendingUp2 className="h-5 w-5 text-blue-500" />
                  Trend Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trends ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Trending Now</h4>
                      {trends.trending.slice(0, 3).map((trend: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{trend.topic}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn(
                              trend.sentiment === 'positive' ? 'text-green-600' : 
                              trend.sentiment === 'negative' ? 'text-red-600' : 
                              'text-amber-600'
                            )}>
                              {trend.sentiment}
                            </Badge>
                            <span className="text-muted-foreground">
                              {trend.volume.toLocaleString()} mentions
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Predicted Trends</h4>
                      {trends.predictions?.slice(0, 2).map((pred: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{pred.trend}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={pred.likelihood} className="w-20 h-2" />
                            <span className="text-xs text-muted-foreground">
                              {pred.timeframe}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <IconTrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Analyze content to see trend intelligence
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Competitor Analysis Card */}
            <Card className="border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconSearch className="h-5 w-5 text-purple-500" />
                  Competitor Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                {competitors ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Top Performing Content</h4>
                      {competitors.topPerformers?.slice(0, 2).map((comp: any, i: number) => (
                        <div key={i} className="space-y-1">
                          <p className="text-sm line-clamp-2">{comp.content}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{comp.platform}</span>
                            <span>•</span>
                            <span>{comp.engagement.toLocaleString()} engagements</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Content Gaps</h4>
                      {competitors.gaps?.slice(0, 3).map((gap: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <IconBulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{gap}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <IconUsers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Analyze content to see competitor insights
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <Card className="border-2 border-dashed border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardContent className="p-8 text-center space-y-6">
              <motion.div
                animate={{
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-block"
              >
                <div className="relative">
                  <IconCrown className="h-20 w-20 text-amber-500 mx-auto" />
                  <motion.div
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-24 h-24 bg-amber-500/20 rounded-full" />
                  </motion.div>
                </div>
              </motion.div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Premium AI Campaign Generation</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Leverage advanced AI with trend analysis, competitor intelligence, and predictive analytics
                  to create campaigns that outperform the competition.
                </p>
              </div>

              {/* Platform Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Target Platforms</Label>
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
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-muted hover:border-amber-500/50"
                        )}
                      >
                        <Icon className={cn(
                          "h-6 w-6",
                          isSelected ? "text-amber-500" : "text-muted-foreground"
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
                    onClick={analyzePremiumContent}
                    disabled={isAnalyzing}
                    className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <IconLoader2 className="h-5 w-5 animate-spin" />
                        Premium Analysis... {progress}%
                      </>
                    ) : (
                      <>
                        <IconBrain className="h-5 w-5" />
                        Start Premium Analysis
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={generatePremiumCampaign}
                    disabled={isGenerating || selectedPlatforms.length === 0}
                    className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  >
                    {isGenerating ? (
                      <>
                        <IconLoader2 className="h-5 w-5 animate-spin" />
                        Generating Premium Campaign... {progress}%
                      </>
                    ) : (
                      <>
                        <IconRocket className="h-5 w-5" />
                        Generate Premium Campaign
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
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {insights.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Premium Content Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-extracted viral opportunities with competitive analysis
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue="viral-score">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viral-score">Viral Score</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        "overflow-hidden transition-all hover:shadow-lg",
                        insight.viralScore > 80 && "ring-2 ring-amber-500/50"
                      )}>
                        <div className={cn(
                          "h-2 bg-gradient-to-r",
                          insight.viralScore > 80 ? "from-amber-500 to-orange-500" :
                          insight.viralScore > 60 ? "from-purple-500 to-pink-500" :
                          insight.viralScore > 40 ? "from-blue-500 to-cyan-500" :
                          "from-gray-500 to-gray-600"
                        )} />
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={cn(
                                "p-2 rounded-lg",
                                insight.viralScore > 80 ? "bg-amber-500/10" :
                                insight.viralScore > 60 ? "bg-purple-500/10" :
                                insight.viralScore > 40 ? "bg-blue-500/10" :
                                "bg-gray-500/10"
                              )}>
                                {insight.type === 'hook' && <IconBolt className="h-5 w-5" />}
                                {insight.type === 'story' && <IconUsers className="h-5 w-5" />}
                                {insight.type === 'statistic' && <IconChartBar className="h-5 w-5" />}
                                {insight.type === 'transformation' && <IconTrendingUp className="h-5 w-5" />}
                                {insight.type === 'controversy' && <IconFlame className="h-5 w-5" />}
                                {insight.type === 'lesson' && <IconBulb className="h-5 w-5" />}
                                {insight.type === 'trend' && <IconTrendingUp2 className="h-5 w-5" />}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {insight.type}
                                  </Badge>
                                  <Badge 
                                    variant="secondary"
                                    className={cn(
                                      "text-xs",
                                      insight.viralScore > 80 && "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                    )}
                                  >
                                    {insight.viralScore}% viral
                                  </Badge>
                                  {insight.trendAlignment.length > 0 && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <IconTrendingUp className="h-3 w-3" />
                                      Trending
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="font-medium">{insight.content}</p>
                                
                                {/* Emotional Impact */}
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                  <span className="flex items-center gap-1">
                                    <IconActivity className="h-3 w-3" />
                                    {insight.emotionalImpact.primary}
                                    <span className="text-muted-foreground">
                                      (intensity: {insight.emotionalImpact.intensity}/10)
                                    </span>
                                  </span>
                                </div>
                                
                                {/* Platform Scores */}
                                <div className="flex gap-2 mt-2">
                                  {insight.platforms.map(p => {
                                    const Icon = platformIcons[p.platform as keyof typeof platformIcons]
                                    return Icon ? (
                                      <TooltipProvider key={p.platform}>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                                              <Icon className="h-3 w-3" />
                                              <span className="text-xs font-medium">{p.score}%</span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{p.bestFormat} at {p.bestTime.join(', ')}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ) : null
                                  })}
                                </div>
                                
                                {/* Competitor Gap */}
                                {insight.competitors.gap && (
                                  <div className="mt-2 p-2 bg-amber-500/10 rounded-md">
                                    <p className="text-xs">
                                      <strong>Opportunity:</strong> {insight.competitors.gap}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Viral Score Visual */}
                            <div className="text-center">
                              <div className="relative w-16 h-16">
                                <svg className="w-16 h-16 transform -rotate-90">
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    className="text-muted"
                                  />
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray={`${insight.viralScore * 1.76} 176`}
                                    className={cn(
                                      insight.viralScore > 80 ? "text-amber-500" :
                                      insight.viralScore > 60 ? "text-purple-500" :
                                      insight.viralScore > 40 ? "text-blue-500" :
                                      "text-gray-500"
                                    )}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold">{insight.viralScore}</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Viral Score</p>
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
                Run premium analysis to discover viral opportunities
              </p>
              <Button onClick={() => setActiveTab("overview")}>
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
                    {campaign.objective} • {campaign.strategy.positioning}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCampaign}
                  className="gap-2"
                >
                  <IconDownload className="h-4 w-4" />
                  Export Premium
                </Button>
              </div>

              {/* Campaign Metrics Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Projected Reach</p>
                        <p className="text-2xl font-bold">
                          {campaign.projectedMetrics.totalReach.toLocaleString()}
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
                        <p className="text-sm text-muted-foreground">Est. Engagement</p>
                        <p className="text-2xl font-bold">
                          {campaign.projectedMetrics.totalEngagement.toLocaleString()}
                        </p>
                      </div>
                      <IconActivity className="h-8 w-8 text-blue-500/20" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated ROI</p>
                        <p className="text-2xl font-bold">
                          ${campaign.projectedMetrics.estimatedROI.toLocaleString()}
                        </p>
                      </div>
                      <IconChartLine className="h-8 w-8 text-amber-500/20" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Brand Lift</p>
                        <p className="text-2xl font-bold">
                          +{campaign.projectedMetrics.brandLift}%
                        </p>
                      </div>
                      <IconAward className="h-8 w-8 text-purple-500/20" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Strategy Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Campaign Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Positioning</h4>
                      <p className="text-sm text-muted-foreground">{campaign.strategy.positioning}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Differentiation</h4>
                      <p className="text-sm text-muted-foreground">{campaign.strategy.differentiation}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Competitive Advantage</h4>
                      <p className="text-sm text-muted-foreground">{campaign.strategy.competitiveAdvantage}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Narrative Arc</h4>
                      <p className="text-sm text-muted-foreground">{campaign.strategy.narrativeArc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Posts with Premium Features */}
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
                    <Alert className="border-amber-500/20 bg-amber-500/5">
                      <IconBulb className="h-4 w-4" />
                      <AlertTitle>Platform Strategy</AlertTitle>
                      <AlertDescription>{platform.strategy}</AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      {platform.posts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="overflow-hidden">
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
                                        Best times: {post.bestTimes.join(', ')}
                                      </span>
                                    </CardDescription>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 text-xs">
                                    <IconFlame className={cn(
                                      "h-4 w-4",
                                      post.predictions.viralProbability > 70 ? "text-amber-500" :
                                      post.predictions.viralProbability > 50 ? "text-orange-500" :
                                      "text-gray-500"
                                    )} />
                                    <span className="font-medium">{post.predictions.viralProbability}%</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">viral probability</p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Hook */}
                              <div className="p-3 bg-amber-500/10 rounded-lg">
                                <p className="text-sm font-medium">🎯 {post.hook}</p>
                              </div>

                              {/* Caption Preview */}
                              <div className="space-y-2">
                                <Label className="text-xs">Caption</Label>
                                <div className="p-3 bg-muted rounded-lg text-sm">
                                  <p className="whitespace-pre-wrap">{post.caption}</p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {post.hashtags.trending.map((tag, i) => (
                                      <span key={i} className="text-blue-500 text-xs">
                                        {tag} <Badge variant="outline" className="text-[10px] ml-1">trending</Badge>
                                      </span>
                                    ))}
                                    {post.hashtags.evergreen.map((tag, i) => (
                                      <span key={i} className="text-blue-500 text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Psychology Triggers */}
                              <div className="flex flex-wrap gap-2">
                                {post.psychologyTriggers.map((trigger, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {trigger}
                                  </Badge>
                                ))}
                              </div>

                              {/* Performance Predictions */}
                              <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Reach</p>
                                  <p className="text-sm font-medium">
                                    {post.predictions.reach.min.toLocaleString()}-
                                    {post.predictions.reach.max.toLocaleString()}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {post.predictions.reach.confidence}% confidence
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Engagement</p>
                                  <p className="text-sm font-medium">
                                    {post.predictions.engagement.rate.toFixed(1)}%
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    ~{post.predictions.engagement.comments} comments
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Conversions</p>
                                  <p className="text-sm font-medium">
                                    {post.predictions.conversions.clicks}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    est. clicks
                                  </p>
                                </div>
                              </div>

                              {/* Visual Preview */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Visual Concept</Label>
                                  {post.visualConcept.abTestVariants.length > 0 && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <IconTestPipe className="h-3 w-3" />
                                      {post.visualConcept.abTestVariants.length} A/B variants
                                    </Badge>
                                  )}
                                </div>
                                {generatedGraphics[post.id] ? (
                                  <div className="space-y-3">
                                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                                      <img
                                        src={generatedGraphics[post.id].url}
                                        alt={post.headline}
                                        className="w-full h-full object-cover"
                                      />
                                      {generatedGraphics[post.id].textOverlay && (
                                        <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white p-2 rounded text-xs">
                                          <strong>Text:</strong> {generatedGraphics[post.id].textOverlay}
                                        </div>
                                      )}
                                    </div>
                                    {generatedGraphics[post.id].variants && (
                                      <div className="grid grid-cols-3 gap-2">
                                        {generatedGraphics[post.id].variants.slice(0, 3).map((variant: any, i: number) => (
                                          <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                                            <img
                                              src={variant.url}
                                              alt={`Variant ${i + 1}`}
                                              className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                              <span className="text-white text-xs font-medium">
                                                Variant {i + 1}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                      <IconPalette className="h-8 w-8 text-muted-foreground mb-2" />
                                      <p className="text-xs text-muted-foreground mb-2">
                                        {post.visualConcept.primary}
                                      </p>
                                      <Button
                                        size="sm"
                                        onClick={() => generatePremiumGraphic(post)}
                                        className="gap-1"
                                      >
                                        <IconSparkles className="h-4 w-4" />
                                        Generate Premium
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2 text-xs">
                                  <strong>CTA:</strong>
                                  <span>{post.cta.primary}</span>
                                  {post.cta.urgency && (
                                    <Badge variant="destructive" className="text-xs">
                                      {post.cta.urgency}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <IconTestPipe className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>A/B Test Variants</DialogTitle>
                                        <DialogDescription>
                                          Test different approaches to maximize performance
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-3 mt-4">
                                        {post.visualConcept.abTestVariants.map((variant, i) => (
                                          <Card key={i}>
                                            <CardContent className="p-3">
                                              <h5 className="text-sm font-medium mb-1">
                                                Variant {i + 1}: {variant.variant}
                                              </h5>
                                              <p className="text-xs text-muted-foreground mb-2">
                                                {variant.hypothesis}
                                              </p>
                                              <div className="flex flex-wrap gap-1">
                                                {variant.changes.map((change, j) => (
                                                  <Badge key={j} variant="outline" className="text-xs">
                                                    {change}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const fullContent = `${post.hook}\n\n${post.caption}\n\n${post.hashtags.trending.concat(post.hashtags.evergreen).join(' ')}\n\n${post.cta.primary}`
                                      navigator.clipboard.writeText(fullContent)
                                      toast.success("Premium content copied!")
                                    }}
                                  >
                                    <IconCopy className="h-4 w-4" />
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
                Generate your premium campaign with advanced AI
              </p>
              <Button onClick={() => setActiveTab("overview")}>
                <IconArrowRight className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Viral Probability Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Viral Probability Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={campaign?.platforms.flatMap(p => 
                    p.posts.map(post => ({
                      name: post.headline.substring(0, 15) + '...',
                      probability: post.predictions.viralProbability
                    }))
                  ).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="probability" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Platform Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={selectedPlatforms.map(platform => ({
                    platform,
                    reach: Math.random() * 100,
                    engagement: Math.random() * 100,
                    conversion: Math.random() * 100,
                    viral: Math.random() * 100
                  }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="platform" />
                    <PolarRadiusAxis />
                    <Radar name="Metrics" dataKey="reach" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Projected Growth */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Projected Campaign Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={Array.from({ length: 14 }, (_, i) => ({
                  day: `Day ${i + 1}`,
                  reach: Math.floor(Math.random() * 10000) + i * 1000,
                  engagement: Math.floor(Math.random() * 1000) + i * 100,
                  conversions: Math.floor(Math.random() * 100) + i * 10
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="reach" stackId="1" stroke="#10b981" fill="#10b981" />
                  <Area type="monotone" dataKey="engagement" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                  <Area type="monotone" dataKey="conversions" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Competitor Comparison */}
          {competitors && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Competitor Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitors.topPerformers?.slice(0, 3).map((comp: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Competitor {i + 1}</span>
                        <span className="text-muted-foreground">
                          {comp.engagement.toLocaleString()} engagements
                        </span>
                      </div>
                      <Progress value={comp.engagement / 1000} className="h-2" />
                      <p className="text-xs text-muted-foreground line-clamp-1">{comp.content}</p>
                    </div>
                  ))}
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-amber-600">Your Campaign (Projected)</span>
                      <span className="text-amber-600">
                        {campaign?.projectedMetrics.totalEngagement.toLocaleString()} engagements
                      </span>
                    </div>
                    <Progress value={80} className="h-2 [&>div]:bg-amber-500" />
                    <p className="text-xs text-amber-600">
                      Outperforming competitors by {Math.floor(Math.random() * 50 + 50)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Optimize Tab */}
        <TabsContent value="optimize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Optimization Recommendations</CardTitle>
              <CardDescription>
                AI-powered suggestions to improve campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trend Opportunities */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <IconTrendingUp2 className="h-4 w-4 text-blue-500" />
                  Trend Opportunities
                </h4>
                {trends?.opportunities?.map((opp: any, i: number) => (
                  <Alert key={i} className="border-blue-500/20">
                    <IconBulb className="h-4 w-4" />
                    <AlertTitle className="text-sm">{opp.gap}</AlertTitle>
                    <AlertDescription className="text-xs">
                      Potential: {opp.potential}/10 • Difficulty: {opp.difficulty}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>

              {/* Content Optimizations */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                                      <IconTarget className="h-4 w-4 text-purple-500" />
                  Content Optimizations
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <Card className="p-3">
                    <h5 className="text-sm font-medium mb-2">Headline Testing</h5>
                    <p className="text-xs text-muted-foreground mb-2">
                      Test emotional vs. logical headlines
                    </p>
                    <Badge variant="outline" className="text-xs">
                      +35% expected lift
                    </Badge>
                  </Card>
                  <Card className="p-3">
                    <h5 className="text-sm font-medium mb-2">Visual Styles</h5>
                    <p className="text-xs text-muted-foreground mb-2">
                      Test minimalist vs. vibrant designs
                    </p>
                    <Badge variant="outline" className="text-xs">
                      +28% expected lift
                    </Badge>
                  </Card>
                  <Card className="p-3">
                    <h5 className="text-sm font-medium mb-2">Posting Times</h5>
                    <p className="text-xs text-muted-foreground mb-2">
                      Optimize for peak engagement hours
                    </p>
                    <Badge variant="outline" className="text-xs">
                      +42% expected lift
                    </Badge>
                  </Card>
                  <Card className="p-3">
                    <h5 className="text-sm font-medium mb-2">CTA Variations</h5>
                    <p className="text-xs text-muted-foreground mb-2">
                      Test urgency vs. value-based CTAs
                    </p>
                    <Badge variant="outline" className="text-xs">
                      +22% expected lift
                    </Badge>
                  </Card>
                </div>
              </div>

              {/* Automation Suggestions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <IconBolt className="h-4 w-4 text-amber-500" />
                  Automation Opportunities
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <IconActivity className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">Auto-boost High Performers</p>
                        <p className="text-xs text-muted-foreground">
                          Automatically promote posts that exceed engagement targets
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <IconChartLine className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">Dynamic A/B Testing</p>
                        <p className="text-xs text-muted-foreground">
                          Automatically test and optimize post variations
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <IconClock className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">Smart Scheduling</p>
                        <p className="text-xs text-muted-foreground">
                          Adjust posting times based on real-time engagement data
                        </p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 