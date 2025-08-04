import { getOpenAI } from './openai'

export interface PremiumInsight {
  id: string
  content: string
  type: 'hook' | 'story' | 'statistic' | 'transformation' | 'controversy' | 'lesson' | 'trend'
  viralScore: number  // 0-100 based on multiple factors
  emotionalImpact: {
    primary: string
    secondary: string[]
    intensity: number  // 0-10
  }
  audience: {
    demographics: string[]
    psychographics: string[]
    painPoints: string[]
    desires: string[]
  }
  competitors: {
    similar: string[]  // Similar content from competitors
    performance: number  // How well similar content performed
    gap: string  // What we can do better
  }
  platforms: {
    platform: string
    score: number  // Platform-specific viral potential
    bestFormat: string
    bestTime: string[]
  }[]
  visualStyle: string
  trendAlignment: string[]  // Current trends this aligns with
  timestamp?: number
}

export interface PremiumPost {
  id: string
  platform: string
  type: 'single' | 'carousel' | 'story' | 'reel' | 'thread' | 'live' | 'poll'
  
  // Content
  headline: string
  hook: string  // First line that stops scrolling
  caption: string
  hashtags: {
    trending: string[]  // Currently trending
    evergreen: string[]  // Always relevant
    niche: string[]  // Specific to audience
    branded: string[]  // Your brand hashtags
  }
  
  // Visuals
  visualConcept: {
    primary: string
    alternatives: string[]
    textOverlay: string
    designSystem: {
      colors: string[]
      fonts: string[]
      layout: string
      effects: string[]
    }
    abTestVariants: {
      variant: string
      hypothesis: string
      changes: string[]
    }[]
  }
  
  // Strategy
  psychologyTriggers: string[]  // Loss aversion, social proof, etc.
  cta: {
    primary: string
    secondary: string
    urgency: string
  }
  
  // Performance Prediction
  predictions: {
    reach: { min: number; max: number; confidence: number }
    engagement: { rate: number; likes: number; comments: number; shares: number }
    conversions: { clicks: number; signups: number; sales: number }
    viralProbability: number  // 0-100%
  }
  
  // Optimization
  bestTimes: string[]  // Multiple optimal posting times
  audienceSegments: string[]
  contentPillars: string[]
  brandVoiceScore: number  // How well it matches brand voice
}

export interface PremiumCampaign {
  id: string
  title: string
  objective: string
  kpis: {
    primary: { metric: string; target: number }
    secondary: { metric: string; target: number }[]
  }
  
  // Advanced Strategy
  strategy: {
    positioning: string
    differentiation: string
    competitiveAdvantage: string
    narrativeArc: string  // Story progression across campaign
  }
  
  // Content
  platforms: {
    platform: string
    posts: PremiumPost[]
    strategy: string
    contentMix: { type: string; percentage: number }[]
    postingSchedule: {
      time: string
      reason: string
      expectedPerformance: number
    }[]
  }[]
  
  // Advanced Features
  abTests: {
    id: string
    hypothesis: string
    variants: { id: string; description: string }[]
    successMetric: string
  }[]
  
  automations: {
    trigger: string
    action: string
    conditions: string[]
  }[]
  
  // Analytics
  projectedMetrics: {
    totalReach: number
    totalEngagement: number
    estimatedROI: number
    brandLift: number
  }
  
  competitorAnalysis: {
    competitor: string
    theirStrategy: string
    ourAdvantage: string
    counterStrategy: string
  }[]
}

export class PremiumContentEngine {
  // Removed Supabase client - not used and was causing client-side error

  static async analyzeTrends(topic: string, industry: string): Promise<{
    trending: { topic: string; volume: number; sentiment: string }[]
    predictions: { trend: string; likelihood: number; timeframe: string }[]
    opportunities: { gap: string; potential: number; difficulty: string }[]
  }> {
    const openai = getOpenAI()
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: `You are a trend analyst and social media strategist. Analyze current trends, predict upcoming trends, and identify content opportunities.`
        },
        {
          role: 'user',
          content: `Analyze trends for topic: "${topic}" in industry: "${industry}".
          
          Provide:
          1. Current trending topics with search volume and sentiment
          2. Predicted upcoming trends with likelihood and timeframe
          3. Content gap opportunities with potential and difficulty
          
          Format as JSON.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })
    
    return JSON.parse(response.choices[0].message.content || '{}')
  }

  static async analyzeCompetitors(
    topic: string,
    platforms: string[]
  ): Promise<{
    topPerformers: {
      content: string
      platform: string
      engagement: number
      strategy: string
    }[]
    patterns: string[]
    gaps: string[]
  }> {
    const openai = getOpenAI()
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: `You are a competitive intelligence analyst specializing in social media content strategy.`
        },
        {
          role: 'user',
          content: `Analyze top-performing content about "${topic}" on ${platforms.join(', ')}.
          
          Identify:
          1. Top performing content examples with engagement metrics
          2. Common patterns in successful content
          3. Gaps and opportunities competitors are missing
          
          Format as JSON.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })
    
    return JSON.parse(response.choices[0].message.content || '{}')
  }

  static async extractPremiumInsights(
    transcription: any,
    contentAnalysis: any,
    projectTitle: string,
    brandVoice?: { tone: string; values: string[]; personality: string[] }
  ): Promise<PremiumInsight[]> {
    const insights: PremiumInsight[] = []
    
    if (!transcription?.segments) return insights
    
    const openai = getOpenAI()
    
    // Get trend analysis
    const trends = await this.analyzeTrends(projectTitle, contentAnalysis?.category || 'general')
    
    // Get competitor insights
    const competitors = await this.analyzeCompetitors(
      projectTitle, 
      ['instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']
    )
    
    // Extract insights with advanced analysis
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: `You are a world-class content strategist with expertise in viral psychology, behavioral economics, and social media algorithms. Extract insights that have maximum viral potential while maintaining authenticity.`
        },
        {
          role: 'user',
          content: `Analyze this content for viral potential:
          
          Title: ${projectTitle}
          Transcript: ${transcription.segments.map((s: any) => s.text).join(' ')}
          
          Current Trends: ${JSON.stringify(trends.trending)}
          Competitor Patterns: ${JSON.stringify(competitors.patterns)}
          
          Extract 15-20 insights that:
          1. Have genuine viral potential (shocking, emotional, transformative)
          2. Align with current trends
          3. Fill gaps competitors are missing
          4. Trigger specific psychological responses
          5. Work across multiple platforms
          
          For each insight, calculate:
          - Viral score (0-100) based on shareability, emotion, novelty
          - Emotional impact with intensity
          - Target audience psychographics
          - Platform-specific potential
          - Competitor gap analysis
          
          Format as JSON array with all fields.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8
    })
    
    const extracted = JSON.parse(response.choices[0].message.content || '{}')
    const processedInsights = extracted.insights || []
    
    // Enhance each insight with additional data
    for (const insight of processedInsights) {
      insight.id = crypto.randomUUID()
      
      // Add competitor analysis
      insight.competitors = {
        similar: competitors.topPerformers
          .filter(p => p.content.toLowerCase().includes(insight.content.substring(0, 30).toLowerCase()))
          .map(p => p.content),
        performance: insight.competitors?.performance || 0,
        gap: insight.competitors?.gap || 'Unique angle not covered by competitors'
      }
      
      // Add trend alignment
      insight.trendAlignment = trends.trending
        .filter(t => insight.content.toLowerCase().includes(t.topic.toLowerCase()))
        .map(t => t.topic)
    }
    
    // Sort by viral score
    return processedInsights.sort((a: PremiumInsight, b: PremiumInsight) => b.viralScore - a.viralScore)
  }

  static async generatePremiumCampaign(
    insights: PremiumInsight[],
    projectTitle: string,
    contentAnalysis: any,
    brandSettings: {
      voice: { tone: string; values: string[]; personality: string[] }
      colors: string[]
      fonts: string[]
      guidelines: string
    },
    targetPlatforms: string[] = ['instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']
  ): Promise<PremiumCampaign> {
    const openai = getOpenAI()
    
    // Analyze brand voice from previous content
    const brandAnalysis = await this.analyzeBrandVoice(brandSettings)
    
    // Generate strategic campaign
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a CMO-level strategist creating premium social media campaigns. Use advanced psychology, data-driven insights, and platform expertise to create campaigns that dramatically outperform standard content.`
        },
        {
          role: 'user',
          content: `Create a premium campaign for: "${projectTitle}"
          
          Top Insights: ${JSON.stringify(insights.slice(0, 10))}
          Brand Voice: ${JSON.stringify(brandAnalysis)}
          Platforms: ${targetPlatforms.join(', ')}
          
          Create a sophisticated campaign with:
          
          1. STRATEGIC FOUNDATION
          - Clear positioning and differentiation
          - Competitive advantage
          - Narrative arc across all content
          
          2. PREMIUM CONTENT (20-30 posts)
          - Psychology-based hooks (loss aversion, social proof, etc.)
          - A/B test variants for each post
          - Multi-format approach (carousels, reels, threads)
          - Platform-specific optimization
          
          3. ADVANCED FEATURES
          - Predictive analytics for each post
          - Optimal posting schedule with reasoning
          - Automation triggers
          - Competitor counter-strategies
          
          4. PERFORMANCE OPTIMIZATION
          - Viral probability scores
          - Engagement predictions
          - ROI projections
          - Brand lift estimates
          
          Make this feel like a $50k agency campaign.
          Format as complete JSON structure.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9
    })
    
    const campaign = JSON.parse(response.choices[0].message.content || '{}')
    
    // Enhance with IDs and additional processing
    campaign.id = crypto.randomUUID()
    campaign.platforms?.forEach((p: any) => {
      p.posts?.forEach((post: any) => {
        post.id = crypto.randomUUID()
        
        // Add brand voice scoring
        post.brandVoiceScore = this.calculateBrandVoiceScore(post.caption, brandAnalysis)
        
        // Enhance predictions with confidence intervals
        if (!post.predictions) {
          post.predictions = this.generatePerformancePredictions(post, insights)
        }
      })
    })
    
    return campaign as PremiumCampaign
  }

  static async generateABTestVariants(
    post: PremiumPost,
    testingStrategy: 'headline' | 'visual' | 'cta' | 'timing'
  ): Promise<{
    original: PremiumPost
    variants: {
      id: string
      changes: string[]
      hypothesis: string
      expectedLift: number
    }[]
  }> {
    const openai = getOpenAI()
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a conversion optimization expert creating A/B test variants for social media content.`
        },
        {
          role: 'user',
          content: `Create A/B test variants for this post:
          
          Platform: ${post.platform}
          Type: ${post.type}
          Current headline: ${post.headline}
          Current hook: ${post.hook}
          Testing: ${testingStrategy}
          
          Create 3 variants that test different approaches:
          1. Conservative improvement (10-20% expected lift)
          2. Moderate change (20-40% expected lift)
          3. Bold experiment (40%+ potential lift)
          
          For each variant, provide:
          - Specific changes
          - Hypothesis for why it will work
          - Expected performance lift
          
          Format as JSON.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      original: post,
      variants: result.variants?.map((v: any) => ({
        ...v,
        id: crypto.randomUUID()
      })) || []
    }
  }

  static async optimizeForPlatformAlgorithm(
    post: PremiumPost,
    platform: string,
    currentAlgorithmFactors: any
  ): Promise<{
    optimizations: string[]
    score: number
    recommendations: string[]
  }> {
    const algorithmFactors = {
      instagram: {
        engagement: { weight: 0.3, factors: ['likes', 'comments', 'shares', 'saves'] },
        relevance: { weight: 0.25, factors: ['hashtags', 'captions', 'alt text'] },
        timeliness: { weight: 0.2, factors: ['recency', 'trending topics'] },
        relationships: { weight: 0.25, factors: ['DMs', 'profile visits', 'story replies'] }
      },
      twitter: {
        engagement: { weight: 0.35, factors: ['retweets', 'quote tweets', 'replies'] },
        relevance: { weight: 0.3, factors: ['keywords', 'hashtags', 'mentions'] },
        recency: { weight: 0.2, factors: ['real-time', 'trending'] },
        quality: { weight: 0.15, factors: ['media', 'links', 'thread quality'] }
      },
      linkedin: {
        relevance: { weight: 0.35, factors: ['professional keywords', 'industry terms'] },
        engagement: { weight: 0.3, factors: ['comments', 'shares', 'reactions'] },
        quality: { weight: 0.2, factors: ['dwell time', 'click-through'] },
        creator: { weight: 0.15, factors: ['profile strength', 'connection quality'] }
      },
      youtube: {
        watchTime: { weight: 0.4, factors: ['retention', 'session duration'] },
        engagement: { weight: 0.25, factors: ['likes', 'comments', 'shares'] },
        clickThrough: { weight: 0.2, factors: ['thumbnail', 'title'] },
        relevance: { weight: 0.15, factors: ['tags', 'description', 'captions'] }
      },
      tiktok: {
        completion: { weight: 0.35, factors: ['watch percentage', 'rewatches'] },
        engagement: { weight: 0.3, factors: ['likes', 'comments', 'shares'] },
        creation: { weight: 0.2, factors: ['sounds used', 'effects used'] },
        velocity: { weight: 0.15, factors: ['early engagement', 'viral signals'] }
      }
    }
    
    const factors = algorithmFactors[platform as keyof typeof algorithmFactors]
    let totalScore = 0
    const optimizations: string[] = []
    const recommendations: string[] = []
    
    // Calculate current score and generate optimizations
    Object.entries(factors).forEach(([factor, config]) => {
      const factorScore = this.calculateFactorScore(post, factor, config)
      totalScore += factorScore * config.weight
      
      if (factorScore < 0.7) {
        optimizations.push(`Optimize for ${factor}: ${config.factors.join(', ')}`)
        recommendations.push(this.generateOptimizationRecommendation(post, factor, platform))
      }
    })
    
    return {
      optimizations,
      score: Math.round(totalScore * 100),
      recommendations
    }
  }

  private static calculateFactorScore(post: any, factor: string, config: any): number {
    // Simplified scoring logic - in production, this would use real data
    const baseScore = 0.5
    const bonus = post.psychologyTriggers?.length > 0 ? 0.1 : 0
    const hashtagBonus = post.hashtags?.trending?.length > 0 ? 0.1 : 0
    const visualBonus = post.visualConcept?.abTestVariants?.length > 0 ? 0.1 : 0
    
    return Math.min(baseScore + bonus + hashtagBonus + visualBonus, 1)
  }

  private static generateOptimizationRecommendation(post: any, factor: string, platform: string): string {
    const recommendations: Record<string, Record<string, string>> = {
      instagram: {
        engagement: "Add a question in the first line to boost comments",
        relevance: "Include 5-7 niche hashtags mixed with 3-5 trending ones",
        timeliness: "Post during peak hours: 11am-1pm or 7-9pm local time",
        relationships: "Include a CTA to DM or save the post"
      },
      twitter: {
        engagement: "Start with a controversial or surprising statement",
        relevance: "Include 1-2 trending hashtags and relevant mentions",
        recency: "Tweet during news cycles or trending moments",
        quality: "Add a thread with valuable insights"
      },
      linkedin: {
        relevance: "Use industry-specific keywords in the first 2 lines",
        engagement: "Ask for professional opinions or experiences",
        quality: "Include data or case studies",
        creator: "Mention relevant connections or companies"
      },
      youtube: {
        watchTime: "Create a compelling hook in the first 5 seconds",
        engagement: "Ask viewers to comment their thoughts",
        clickThrough: "Use contrast and faces in thumbnails",
        relevance: "Include 10-15 relevant tags"
      },
      tiktok: {
        completion: "Keep videos under 30 seconds with a payoff at the end",
        engagement: "Use trending sounds and effects",
        creation: "Encourage duets and stitches",
        velocity: "Post when your audience is most active"
      }
    }
    
    return recommendations[platform]?.[factor] || "Optimize based on platform best practices"
  }

  private static async analyzeBrandVoice(brandSettings: any): Promise<any> {
    return {
      tone: brandSettings.voice?.tone || 'professional',
      personality: brandSettings.voice?.personality || ['authoritative', 'helpful'],
      values: brandSettings.voice?.values || ['quality', 'innovation'],
      vocabulary: {
        preferred: ['transform', 'elevate', 'premium'],
        avoided: ['cheap', 'basic', 'simple']
      },
      sentenceStructure: {
        averageLength: 15,
        complexity: 'medium',
        activeVoice: true
      }
    }
  }

  private static calculateBrandVoiceScore(caption: string, brandAnalysis: any): number {
    let score = 70 // Base score
    
    // Check for preferred vocabulary
    brandAnalysis.vocabulary?.preferred?.forEach((word: string) => {
      if (caption.toLowerCase().includes(word.toLowerCase())) {
        score += 5
      }
    })
    
    // Check for avoided vocabulary
    brandAnalysis.vocabulary?.avoided?.forEach((word: string) => {
      if (caption.toLowerCase().includes(word.toLowerCase())) {
        score -= 10
      }
    })
    
    // Cap at 100
    return Math.min(Math.max(score, 0), 100)
  }

  private static generatePerformancePredictions(post: any, insights: PremiumInsight[]): any {
    // Base predictions on insight viral scores and platform factors
    const relatedInsight = insights.find(i => 
      post.caption?.includes(i.content.substring(0, 30))
    )
    
    const viralScore = relatedInsight?.viralScore || 50
    const platformMultipliers: Record<string, number> = {
      instagram: 1.2,
      twitter: 1.0,
      linkedin: 0.8,
      youtube: 1.5,
      tiktok: 2.0
    }
    const platformMultiplier = platformMultipliers[post.platform as string] || 1
    
    const baseReach = 1000
    const reach = Math.round(baseReach * (viralScore / 20) * platformMultiplier)
    
    return {
      reach: { 
        min: Math.round(reach * 0.7), 
        max: Math.round(reach * 1.5), 
        confidence: 75 
      },
      engagement: {
        rate: viralScore / 5,
        likes: Math.round(reach * 0.1),
        comments: Math.round(reach * 0.02),
        shares: Math.round(reach * 0.01)
      },
      conversions: {
        clicks: Math.round(reach * 0.05),
        signups: Math.round(reach * 0.005),
        sales: Math.round(reach * 0.001)
      },
      viralProbability: Math.min(viralScore * 1.2, 95)
    }
  }

  static async generatePremiumVisuals(
    post: PremiumPost,
    videoContent: string,
    brandAssets: {
      logo?: string
      colors: string[]
      fonts: string[]
      templates?: any[]
    }
  ): Promise<{
    concepts: {
      id: string
      prompt: string
      style: string
      variations: string[]
      mockup: string
    }[]
    recommendations: string[]
  }> {
    const openai = getOpenAI()
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an award-winning creative director specializing in viral social media visuals. Create premium, high-converting visual concepts.`
        },
        {
          role: 'user',
          content: `Design premium visuals for:
          
          Platform: ${post.platform}
          Content: "${post.headline}"
          Text overlay: "${post.visualConcept.textOverlay}"
          Brand colors: ${brandAssets.colors.join(', ')}
          Psychology triggers: ${post.psychologyTriggers.join(', ')}
          
          Create:
          1. Primary hero concept with detailed art direction
          2. 3 A/B test variations with different approaches
          3. Detailed prompts for gpt-image-1
          4. Color psychology and composition notes
          5. Platform-specific optimizations
          
          Make these scroll-stopping, premium visuals that convert.`
        }
      ],
      temperature: 0.9
    })
    
    const concepts = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      concepts: concepts.concepts?.map((c: any) => ({
        ...c,
        id: crypto.randomUUID(),
        mockup: `Premium ${post.platform} visual: ${c.prompt}`
      })) || [],
      recommendations: concepts.recommendations || []
    }
  }

  static async trackAndOptimize(
    campaignId: string,
    metrics: {
      post: string
      reach: number
      engagement: number
      clicks: number
      conversions: number
    }[]
  ): Promise<{
    insights: string[]
    optimizations: {
      post: string
      recommendation: string
      expectedLift: number
    }[]
    nextSteps: string[]
  }> {
    // Analyze performance data
    const highPerformers = metrics.filter(m => m.engagement > metrics.reduce((sum, m) => sum + m.engagement, 0) / metrics.length)
    const lowPerformers = metrics.filter(m => m.engagement < metrics.reduce((sum, m) => sum + m.engagement, 0) / metrics.length * 0.5)
    
    const insights = [
      `Top ${highPerformers.length} posts generated ${highPerformers.reduce((sum, m) => sum + m.reach, 0).toLocaleString()} reach`,
      `Average engagement rate: ${(metrics.reduce((sum, m) => sum + m.engagement, 0) / metrics.reduce((sum, m) => sum + m.reach, 0) * 100).toFixed(2)}%`,
      `${lowPerformers.length} posts underperformed - optimization opportunities identified`
    ]
    
    const optimizations = lowPerformers.map(post => ({
      post: post.post,
      recommendation: "Rewrite hook using top performer patterns",
      expectedLift: 35
    }))
    
    return {
      insights,
      optimizations,
      nextSteps: [
        "A/B test new hooks on underperforming content",
        "Double down on high-performing content themes",
        "Adjust posting schedule based on engagement patterns"
      ]
    }
  }
} 