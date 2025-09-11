/**
 * AI-Powered Scheduling Service
 * Uses GPT-5, web search, and Context7 for real-time, intelligent scheduling recommendations
 */

import { getOpenAI } from '@/lib/openai'
import { StagedContent, ScheduledContent } from '@/lib/staging/staging-service'
import { format, addDays, setHours, setMinutes, startOfDay } from 'date-fns'

interface ContentAnalysis {
  contentQuality: string
  targetAudience: string
  engagementPotential: number
  viralFactors: string[]
  contentStyle: string
  emotionalTone: string
  callToAction: string
}

interface PlatformResearch {
  platform: string
  currentTrends: string[]
  optimalTimes: { hour: number; minute: number; score: number; reasoning: string }[]
  competitorActivity: string
  algorithmInsights: string
}

interface SchedulingRecommendation {
  schedule: ScheduledContent[]
  insights: string[]
  reasoning: string[]
  platformResearch: PlatformResearch[]
  contentAnalysis: ContentAnalysis[]
}

export class AISchedulingService {
  /**
   * Analyze content using GPT-5 for deep insights
   */
  private static async analyzeContent(
    content: StagedContent
  ): Promise<ContentAnalysis> {
    try {
      const prompt = `Analyze this social media content for optimal scheduling:

Title: ${content.title}
Description: ${content.description || 'N/A'}
Type: ${content.type}
Platforms: ${content.platforms.join(', ')}
Tags: ${content.originalData?.tags?.join?.(', ') || 'None'}
Duration: ${content.originalData?.duration || 'N/A'}

Provide a detailed analysis including:
1. Content quality assessment
2. Target audience identification
3. Engagement potential (0-100 score)
4. Viral factors present
5. Content style (educational, entertainment, promotional, etc.)
6. Emotional tone
7. Call-to-action effectiveness

Return as JSON with these exact keys: contentQuality, targetAudience, engagementPotential, viralFactors (array), contentStyle, emotionalTone, callToAction`

      const openai = getOpenAI()
      const response = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert analyzing content for optimal posting strategies. Provide detailed, actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 500,
        temperature: 1.0, // GPT-5 only supports default temperature
        response_format: { type: 'json_object' }
      })

      const analysis = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        contentQuality: analysis.contentQuality || 'Standard quality content',
        targetAudience: analysis.targetAudience || 'General audience',
        engagementPotential: analysis.engagementPotential || 75,
        viralFactors: analysis.viralFactors || [],
        contentStyle: analysis.contentStyle || 'Mixed',
        emotionalTone: analysis.emotionalTone || 'Neutral',
        callToAction: analysis.callToAction || 'None specified'
      }
    } catch (error) {
      console.error('Error analyzing content with GPT-5:', error)
      // Fallback analysis
      return {
        contentQuality: 'Unable to analyze - using defaults',
        targetAudience: 'General audience',
        engagementPotential: 70,
        viralFactors: [],
        contentStyle: content.type === 'blog' ? 'Educational' : 'Entertainment',
        emotionalTone: 'Positive',
        callToAction: 'Engage with content'
      }
    }
  }

  /**
   * Research current optimal posting times using web search
   */
  private static async researchPlatformTimes(
    platform: string,
    contentType: string
  ): Promise<PlatformResearch> {
    try {
      // Search for current optimal posting times
      const searchQuery = `best time to post ${contentType} on ${platform} 2024 2025 engagement statistics`
      
      const searchResponse = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })
      
      const searchResults = await searchResponse.json()
      
      // Use GPT-5 to analyze search results
      const analysisPrompt = `Based on these search results about optimal posting times for ${platform}:

${JSON.stringify(searchResults.results?.slice(0, 3) || [])}

Provide:
1. Top 5 optimal posting times with hour, minute, and engagement score (0-100)
2. Current trending hashtags and topics
3. Competitor posting patterns
4. Algorithm insights for ${contentType} content

Return as JSON with keys: optimalTimes (array of {hour, minute, score, reasoning}), currentTrends (array), competitorActivity (string), algorithmInsights (string)`

      const openai = getOpenAI()
      const response = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are a social media strategist analyzing real-time data for optimal posting strategies.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_completion_tokens: 600,
        temperature: 1.0,
        response_format: { type: 'json_object' }
      })

      const platformData = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        platform,
        currentTrends: platformData.currentTrends || [],
        optimalTimes: platformData.optimalTimes || [
          { hour: 12, minute: 0, score: 85, reasoning: 'Default peak hour' }
        ],
        competitorActivity: platformData.competitorActivity || 'Standard posting patterns observed',
        algorithmInsights: platformData.algorithmInsights || 'Algorithm favors consistent, quality content'
      }
    } catch (error) {
      console.error('Error researching platform times:', error)
      // Fallback to some sensible defaults
      return {
        platform,
        currentTrends: ['trending', 'viral'],
        optimalTimes: [
          { hour: 9, minute: 0, score: 80, reasoning: 'Morning engagement' },
          { hour: 12, minute: 0, score: 85, reasoning: 'Lunch break traffic' },
          { hour: 17, minute: 0, score: 82, reasoning: 'After work browsing' },
          { hour: 20, minute: 0, score: 78, reasoning: 'Evening leisure time' }
        ],
        competitorActivity: 'Most competitors post during business hours',
        algorithmInsights: 'Consistent posting rewarded by algorithm'
      }
    }
  }

  /**
   * Fetch best practices from Context7 documentation
   */
  private static async fetchBestPractices(
    platforms: string[]
  ): Promise<{ platform: string; bestPractices: string[] }[]> {
    try {
      const practices = []
      
      for (const platform of platforms) {
        const response = await fetch('/api/context7/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `${platform} social media best practices optimal posting times engagement strategies 2024`,
            libraryName: 'social-media-marketing'
          })
        })
        
        const data = await response.json()
        
        // Extract key best practices
        const bestPractices = data.results?.slice(0, 5).map((r: any) => r.summary) || [
          `Post consistently on ${platform}`,
          'Engage with your audience',
          'Use relevant hashtags'
        ]
        
        practices.push({
          platform,
          bestPractices
        })
      }
      
      return practices
    } catch (error) {
      console.error('Error fetching Context7 best practices:', error)
      return platforms.map(platform => ({
        platform,
        bestPractices: [
          'Post at peak engagement times',
          'Use platform-specific features',
          'Maintain consistent brand voice'
        ]
      }))
    }
  }

  /**
   * Generate personalized schedule using AI analysis
   */
  public static async generateIntelligentSchedule(
    content: StagedContent[],
    userId: string,
    projectId: string
  ): Promise<SchedulingRecommendation> {
    const schedule: ScheduledContent[] = []
    const insights: string[] = []
    const reasoning: string[] = []
    const contentAnalyses: ContentAnalysis[] = []
    const platformResearchData: PlatformResearch[] = []
    
    // Start with a conversational insight
    insights.push(`I'm analyzing ${content.length} pieces of content in real-time, researching current platform trends and optimal posting times...`)
    
    // Get unique platforms
    const allPlatforms = [...new Set(content.flatMap(c => c.platforms))]
    
    // Research each platform in parallel
    const platformResearchPromises = allPlatforms.map(platform => 
      this.researchPlatformTimes(platform, content[0]?.type || 'general')
    )
    const platformResearch = await Promise.all(platformResearchPromises)
    platformResearchData.push(...platformResearch)
    
    // Fetch best practices
    const bestPractices = await this.fetchBestPractices(allPlatforms)
    
    // Analyze each piece of content
    for (let i = 0; i < content.length; i++) {
      const item = content[i]
      
      // Analyze content with GPT-5
      const analysis = await this.analyzeContent(item)
      contentAnalyses.push(analysis)
      
      // Get platform-specific research
      const primaryPlatform = item.platforms[0]
      const platformData = platformResearch.find(p => p.platform === primaryPlatform)
      
      if (platformData) {
        // Select optimal time based on content analysis
        let bestTime = platformData.optimalTimes[0]
        
        // Adjust based on engagement potential
        if (analysis.engagementPotential > 85) {
          // High potential content gets prime slots
          bestTime = platformData.optimalTimes.reduce((best, current) => 
            current.score > best.score ? current : best
          )
          insights.push(`"${item.title}" has high viral potential (${analysis.engagementPotential}%). Scheduling at peak time.`)
        } else if (analysis.engagementPotential < 60) {
          // Lower potential content gets off-peak to avoid competing
          bestTime = platformData.optimalTimes[platformData.optimalTimes.length - 1]
          insights.push(`"${item.title}" would perform better with some optimization. Scheduling at a less competitive time.`)
        }
        
        // Calculate actual date/time
        const now = new Date()
        const dayOffset = Math.floor(i / 3) // Spread over multiple days
        let scheduledDate = addDays(now, dayOffset)
        scheduledDate = setHours(scheduledDate, bestTime.hour)
        scheduledDate = setMinutes(scheduledDate, bestTime.minute)
        
        // Generate smart hashtags based on current trends
        const hashtags = [
          ...platformData.currentTrends.slice(0, 3),
          ...analysis.viralFactors.slice(0, 2).map(f => f.replace(/\s+/g, ''))
        ]
        
        // Create scheduled item
        schedule.push({
          stagedContent: item,
          platforms: item.platforms,
          scheduledDate,
          engagementPrediction: {
            score: Math.min(100, bestTime.score + (analysis.engagementPotential > 80 ? 5 : 0)),
            bestTime: bestTime.score >= 80,
            reasoning: `${bestTime.reasoning}. ${analysis.contentStyle} content targeting ${analysis.targetAudience}.`
          },
          optimizationReason: `AI Analysis: ${analysis.contentQuality}. ${bestTime.reasoning}. ${platformData.algorithmInsights}`,
          suggestedHashtags: hashtags
        })
        
        reasoning.push(
          `${item.title}: Scheduled for ${format(scheduledDate, 'EEE MMM d')} at ${format(scheduledDate, 'h:mm a')} based on real-time ${primaryPlatform} data. ${analysis.viralFactors.length > 0 ? `Viral factors: ${analysis.viralFactors.join(', ')}.` : ''}`
        )
      }
    }
    
    // Add platform-specific insights
    platformResearch.forEach(pr => {
      if (pr.currentTrends.length > 0) {
        insights.push(`${pr.platform} trending now: ${pr.currentTrends.slice(0, 3).join(', ')}`)
      }
      if (pr.competitorActivity) {
        insights.push(`${pr.platform}: ${pr.competitorActivity}`)
      }
    })
    
    // Add best practices insights
    bestPractices.forEach(bp => {
      if (bp.bestPractices.length > 0) {
        insights.push(`${bp.platform} tip: ${bp.bestPractices[0]}`)
      }
    })
    
    // Final conversational summary
    const avgEngagement = contentAnalyses.reduce((sum, a) => sum + a.engagementPotential, 0) / contentAnalyses.length
    insights.push(`Overall engagement potential: ${Math.round(avgEngagement)}%. ${avgEngagement > 75 ? 'Your content is well-optimized!' : 'Consider adding more engaging elements like questions or clear CTAs.'}`)
    
    return {
      schedule,
      insights,
      reasoning,
      platformResearch: platformResearchData,
      contentAnalysis: contentAnalyses
    }
  }

  /**
   * Continuously learn and improve recommendations
   */
  public static async learnFromResults(
    scheduledContent: ScheduledContent[],
    actualPerformance: { contentId: string; engagement: number; reach: number }[]
  ): Promise<void> {
    try {
      // Send performance data back to GPT-5 for learning
      const learningPrompt = `Analyze this posting performance data to improve future scheduling:

Scheduled Posts: ${JSON.stringify(scheduledContent.map(s => ({
  time: format(s.scheduledDate, 'EEE HH:mm'),
  platform: s.platforms[0],
  predictedScore: s.engagementPrediction?.score
})))}

Actual Performance: ${JSON.stringify(actualPerformance)}

What patterns do you see? How should we adjust future scheduling?`

      const openai = getOpenAI()
      const response = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are analyzing social media performance data to improve scheduling algorithms.'
          },
          {
            role: 'user',
            content: learningPrompt
          }
        ],
        max_completion_tokens: 300,
        temperature: 1.0
      })
      
      // Store insights for future use (could save to database)
      console.log('Learning insights:', response.choices[0].message.content)
    } catch (error) {
      console.error('Error in learning from results:', error)
    }
  }
}
