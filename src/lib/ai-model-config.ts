/**
 * AI Model Configuration
 * Manages model selection with GPT-5 as primary and fallback options
 */

export const AI_MODELS = {
  // Primary model - GPT-5
  PRIMARY: 'gpt-5',
  
  // Fallback models in order of preference
  FALLBACKS: [
    'gpt-4-turbo-preview',
    'gpt-4-1106-preview',
    'gpt-4',
    'gpt-3.5-turbo-1106'
  ]
}

/**
 * Get the configured AI model with fallback support
 * Always tries GPT-5 first as per requirements
 */
export function getAIModel(): string {
  // Check if there's an override in environment
  if (process.env.OPENAI_MODEL_OVERRIDE) {
    console.log(`[AI Model] Using override model: ${process.env.OPENAI_MODEL_OVERRIDE}`)
    return process.env.OPENAI_MODEL_OVERRIDE
  }
  
  // Default to GPT-5 as required
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
  // Start with GPT-5
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
