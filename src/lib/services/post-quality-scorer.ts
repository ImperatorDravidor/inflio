/**
 * Post Quality Scoring Service
 * Uses gpt-5 to evaluate and filter post quality
 */

import { getOpenAI } from '@/lib/openai'

export interface QualityScore {
  overall: number // 0-10
  hookStrength: number // 0-10
  valueDensity: number // 0-10
  platformFit: number // 0-10
  uniqueness: number // 0-10
  actionability: number // 0-10
  reasoning: string
  improvements: string[]
}

export interface ScoredPost<T> {
  post: T
  score: QualityScore
  rank: number
}

export class PostQualityScorer {
  /**
   * Score a single post using gpt-5
   */
  static async scorePost(post: {
    contentType: { format: string; label: string }
    content: { hook: string; body: string; cta: string }
    platforms: { primary: string[] }
    insights: { targetAudience: string; whyItWorks: string }
  }): Promise<QualityScore> {
    const openai = getOpenAI()
    
    const systemPrompt = `You are an expert social media analyst evaluating post quality.
    
Score posts on these criteria (0-10 each):
1. Hook Strength: Does it immediately grab attention? Is it scroll-stopping?
2. Value Density: How much value per word? Is it packed with insights or fluff?
3. Platform Fit: Is it optimized for the target platforms? Right length, tone, format?
4. Uniqueness: Is it generic or does it stand out? Fresh perspective?
5. Actionability: Can the audience immediately apply this? Clear next steps?

Be harsh but fair. Most posts should score 5-7. Only exceptional posts get 8-10.`

    const userPrompt = `Evaluate this social media post:

CONTENT TYPE: ${post.contentType.label} (${post.contentType.format})
TARGET PLATFORMS: ${post.platforms.primary.join(', ')}

HOOK: "${post.content.hook}"

FULL CONTENT:
"${post.content.body}"

CALL TO ACTION: "${post.content.cta}"

TARGET AUDIENCE: ${post.insights.targetAudience}
STRATEGY: ${post.insights.whyItWorks}

Return JSON:
{
  "hookStrength": 0-10,
  "valueDensity": 0-10,
  "platformFit": 0-10,
  "uniqueness": 0-10,
  "actionability": 0-10,
  "reasoning": "Brief explanation of scores",
  "improvements": ["Specific suggestion 1", "Specific suggestion 2"]
}`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // Latest model for quality scoring
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Low temperature for consistent scoring
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })
      
      const response = completion.choices[0].message.content
      if (!response) {
        throw new Error('No response from gpt-5')
      }
      
      const scores = JSON.parse(response)
      
      // Calculate overall score (weighted average)
      const overall = (
        scores.hookStrength * 0.25 +      // Hook is most important
        scores.valueDensity * 0.25 +      // Value is critical
        scores.platformFit * 0.20 +       // Platform optimization matters
        scores.uniqueness * 0.15 +        // Standing out helps
        scores.actionability * 0.15       // Being useful is key
      )
      
      return {
        overall: Math.round(overall * 10) / 10,
        hookStrength: scores.hookStrength || 0,
        valueDensity: scores.valueDensity || 0,
        platformFit: scores.platformFit || 0,
        uniqueness: scores.uniqueness || 0,
        actionability: scores.actionability || 0,
        reasoning: scores.reasoning || 'No reasoning provided',
        improvements: scores.improvements || []
      }
    } catch (error: any) {
      console.error('[PostQualityScorer] Scoring failed:', error)
      
      // Fallback scoring based on basic heuristics
      return this.fallbackScore(post)
    }
  }
  
  /**
   * Score multiple posts and rank them
   */
  static async scoreAndRankPosts<T extends {
    contentType: any
    content: any
    platforms: any
    insights: any
  }>(posts: T[]): Promise<ScoredPost<T>[]> {
    console.log(`[PostQualityScorer] Scoring ${posts.length} posts...`)
    
    // Score all posts in parallel
    const scoredPosts = await Promise.all(
      posts.map(async (post) => {
        const score = await this.scorePost(post)
        return { post, score, rank: 0 }
      })
    )
    
    // Sort by overall score and assign ranks
    const ranked = scoredPosts
      .sort((a, b) => b.score.overall - a.score.overall)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }))
    
    console.log('[PostQualityScorer] Scoring complete:', {
      total: posts.length,
      avgScore: (ranked.reduce((sum, p) => sum + p.score.overall, 0) / ranked.length).toFixed(1),
      topScore: ranked[0]?.score.overall,
      lowScore: ranked[ranked.length - 1]?.score.overall
    })
    
    return ranked
  }
  
  /**
   * Filter posts by minimum quality threshold
   */
  static async filterByQuality<T extends {
    contentType: any
    content: any
    platforms: any
    insights: any
  }>(
    posts: T[],
    minScore: number = 7.0,
    maxPosts?: number
  ): Promise<ScoredPost<T>[]> {
    const scored = await this.scoreAndRankPosts(posts)
    
    let filtered = scored.filter(s => s.score.overall >= minScore)
    
    // If we don't have enough high-quality posts, lower the bar
    if (filtered.length < 3 && scored.length >= 3) {
      console.log('[PostQualityScorer] Not enough posts above threshold, relaxing criteria')
      filtered = scored.slice(0, Math.max(3, maxPosts || 5))
    }
    
    // Limit to maxPosts if specified
    if (maxPosts && filtered.length > maxPosts) {
      filtered = filtered.slice(0, maxPosts)
    }
    
    console.log('[PostQualityScorer] Filtered to', filtered.length, 'high-quality posts')
    
    return filtered
  }
  
  /**
   * Fallback scoring when gpt-5 is unavailable
   */
  private static fallbackScore(post: {
    content: { hook: string; body: string; cta: string }
  }): QualityScore {
    const hook = post.content.hook
    const body = post.content.body
    const cta = post.content.cta
    
    // Basic heuristics
    const hasQuestion = /\?/.test(hook)
    const hasNumbers = /\d+/.test(hook + body)
    const hasEmojis = /[\p{Emoji}]/u.test(body)
    const wordCount = body.split(/\s+/).length
    const hasCallout = /you|your/i.test(hook)
    
    const hookStrength = (
      (hasQuestion ? 2 : 0) +
      (hasNumbers ? 2 : 0) +
      (hasCallout ? 2 : 0) +
      (hook.length > 20 && hook.length < 100 ? 2 : 0)
    )
    
    const valueDensity = wordCount > 100 && wordCount < 300 ? 7 : 5
    const platformFit = hasEmojis ? 7 : 6
    const uniqueness = 5 // Can't really determine without AI
    const actionability = cta.length > 10 ? 7 : 5
    
    const overall = (hookStrength + valueDensity + platformFit + uniqueness + actionability) / 5
    
    return {
      overall,
      hookStrength,
      valueDensity,
      platformFit,
      uniqueness,
      actionability,
      reasoning: 'Scored using fallback heuristics (gpt-5 unavailable)',
      improvements: ['AI scoring unavailable - manual review recommended']
    }
  }
  
  /**
   * Test if model is available and working
   */
  static async testConnection(): Promise<boolean> {
    try {
      const openai = getOpenAI()
      await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10
      })
      return true
    } catch (error) {
      console.error('[PostQualityScorer] Model connection test failed:', error)
      return false
    }
  }
}


