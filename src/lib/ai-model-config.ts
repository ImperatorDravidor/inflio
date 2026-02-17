/**
 * AI Model Configuration
 * Manages model selection with GPT-5 as primary and fallback options
 */

export const AI_MODELS = {
  // Primary model - GPT-4o (latest and best available model as of Oct 2024)
  // Note: gpt-5 uses different API endpoint (/v1/responses) - see gpt5-service.ts
  PRIMARY: 'gpt-4o',
  
  // Fallback models in order of preference
  FALLBACKS: [
    'gpt-4-turbo',
    'gpt-4-turbo-preview',
    'gpt-4',
    'gpt-3.5-turbo'
  ]
}

/**
 * Get the configured AI model with fallback support
 * Uses GPT-4o as primary (latest Chat Completions model)
 * For gpt-5 Responses API, use GPT5Service class instead
 */
export function getAIModel(): string {
  // Check if there's an override in environment
  if (process.env.OPENAI_MODEL_OVERRIDE) {
    console.log(`[AI Model] Using override model: ${process.env.OPENAI_MODEL_OVERRIDE}`)
    return process.env.OPENAI_MODEL_OVERRIDE
  }
  
  // Default to GPT-4o (latest, fastest, best Chat Completions model)
  return AI_MODELS.PRIMARY
}

/**
 * Try to execute OpenAI completion with automatic fallback
 */
export async function executeWithModelFallback(
  openai: any,
  config: {
    messages: any[],
    temperature?: number,
    max_tokens?: number,
    response_format?: any,
    [key: string]: any
  },
  context: string = 'AI Operation'
): Promise<any> {
  // Start with primary model (gpt-4o)
  const modelsToTry = [AI_MODELS.PRIMARY, ...AI_MODELS.FALLBACKS]
  let lastError: any = null
  
  for (const model of modelsToTry) {
    try {
      console.log(`[${context}] Attempting with model: ${model}`)
      
      const completion = await openai.chat.completions.create({
        ...config,
        model
      })
      
      console.log(`[${context}] Successfully used model: ${model}`)
      return completion
      
    } catch (error: any) {
      lastError = error
      
      // Check if it's a model availability error
      const isModelError = 
        error?.message?.toLowerCase().includes('model') ||
        error?.code === 'model_not_found' ||
        error?.status === 404 ||
        error?.message?.includes('does not exist')
      
      if (isModelError && model !== modelsToTry[modelsToTry.length - 1]) {
        console.log(`[${context}] Model ${model} not available, trying next fallback...`)
        continue
      } else {
        // Not a model error or we're out of fallbacks
        throw error
      }
    }
  }
  
  // If we get here, all models failed
  console.error(`[${context}] All models failed, throwing last error`)
  throw lastError
}
