import OpenAI from 'openai'

// Only throw error when actually trying to use the API
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('Please set your OPENAI_API_KEY in .env.local file')
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null as OpenAI | null

// Export a function that throws error only when used
export const getOpenAI = () => {
  if (!openai) {
    return getOpenAIClient()
  }
  return openai
} 
