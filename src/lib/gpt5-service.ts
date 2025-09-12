import OpenAI from 'openai'

// Initialize OpenAI client with GPT-5 support
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false // Server-side only
})

export interface GPT5Response {
  output_text: string
  reasoning_tokens?: number
  output_tokens?: number
  input_tokens?: number
}

export interface GPT5Options {
  reasoning?: {
    effort: 'minimal' | 'low' | 'medium' | 'high'
  }
  text?: {
    verbosity: 'low' | 'medium' | 'high'
  }
  tools?: any[]
  previous_response_id?: string
}

export class GPT5Service {
  /**
   * Send a message to GPT-5 using the Responses API
   */
  static async chat(
    input: string,
    options: GPT5Options = {}
  ): Promise<GPT5Response> {
    try {
      // Default to low reasoning for conversational UI
      const defaultOptions: GPT5Options = {
        reasoning: { effort: 'low' },
        text: { verbosity: 'medium' },
        ...options
      }

      // Use the Responses API for GPT-5
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-5',
          input,
          ...defaultOptions
        })
      })

      if (!response.ok) {
        throw new Error(`GPT-5 API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('GPT-5 Service Error:', error)
      throw error
    }
  }

  /**
   * InflioAI speaks to the user about their progress
   */
  static async getInflioAIGuidance(
    context: {
      userName?: string
      currentStep: string
      completedSteps: string[]
      totalSteps: number
    }
  ): Promise<string> {
    const stepDescriptions: Record<string, string> = {
      profile: 'setting up your creator profile',
      brand: 'uploading your brand guide',
      avatar: 'training your AI avatar',
      connect: 'connecting your social platforms',
      upload: 'uploading your first video'
    }

    const input = `You are InflioAI, a friendly and professional content creation assistant.
    
Context:
- User: ${context.userName || 'Creator'}
- Progress: ${context.completedSteps.length}/${context.totalSteps} steps complete
- Current task: ${stepDescriptions[context.currentStep] || 'getting started'}
- Completed: ${context.completedSteps.map(s => stepDescriptions[s]).join(', ') || 'Just starting'}

Provide ONE concise, encouraging sentence about their current step and why it matters.
Focus on the benefit they'll get. Be warm but professional. No greetings needed.
Example: "Setting up your profile helps me write in your unique voice - every piece of content will sound exactly like you."

Current step to explain: ${context.currentStep}`

    const response = await this.chat(input, {
      reasoning: { effort: 'minimal' },
      text: { verbosity: 'low' }
    })

    return response.output_text
  }

  /**
   * Generate content ideas based on user's brand
   */
  static async generateContentIdeas(
    brandData: any,
    count: number = 5
  ): Promise<string[]> {
    const input = `Based on this brand data: ${JSON.stringify(brandData)}, 
    generate ${count} specific, actionable content ideas. 
    Return as a JSON array of strings.`

    const response = await this.chat(input, {
      reasoning: { effort: 'medium' },
      text: { verbosity: 'low' }
    })

    try {
      return JSON.parse(response.output_text)
    } catch {
      return [response.output_text]
    }
  }

  /**
   * Answer user questions with context awareness
   */
  static async answerQuestion(
    question: string,
    context: {
      page?: string
      userData?: any
      previousMessages?: string[]
    }
  ): Promise<string> {
    const input = `Context: User is on ${context.page || 'dashboard'} page of Inflio.
Previous conversation: ${context.previousMessages?.join('\n') || 'none'}

User question: ${question}

Provide a helpful, accurate answer. If the question is about Inflio features, explain them clearly. 
If it's about content creation, provide actionable advice.`

    const response = await this.chat(input, {
      reasoning: { effort: 'medium' },
      text: { verbosity: 'medium' }
    })

    return response.output_text
  }

  /**
   * Analyze uploaded content and provide insights
   */
  static async analyzeContent(
    contentType: 'video' | 'text' | 'image',
    contentData: any
  ): Promise<{
    insights: string[]
    recommendations: string[]
    score: number
  }> {
    const input = `Analyze this ${contentType} content and provide:
1. Key insights
2. Recommendations for improvement
3. Overall quality score (0-100)

Content data: ${JSON.stringify(contentData)}

Return as JSON with keys: insights (array), recommendations (array), score (number)`

    const response = await this.chat(input, {
      reasoning: { effort: 'high' },
      text: { verbosity: 'medium' }
    })

    try {
      return JSON.parse(response.output_text)
    } catch {
      return {
        insights: ['Unable to parse analysis'],
        recommendations: ['Please try again'],
        score: 0
      }
    }
  }
}
