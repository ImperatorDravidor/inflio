# Vercel AI & Transcription Troubleshooting Guide

## Issue: AI Analysis/Transcription Works Locally but Not on Vercel

### Common Causes

1. **Missing Environment Variables**
   - `OPENAI_API_KEY` not set on Vercel
   - `ASSEMBLYAI_API_KEY` not set (for transcription)

2. **Model Access Issues**
   - Custom models (`gpt-4.1`, `gpt-4.1-mini`) may require special access
   - API key might not have access to specific models

3. **Timeout Issues**
   - AI analysis can take longer on Vercel due to cold starts
   - Default function timeout might be too short

## Diagnostic Steps

### 1. Test Your Configuration

Visit this endpoint on your deployed app:
```
https://your-app.vercel.app/api/test-vercel-ai
```

This will show:
- Whether API keys are configured
- If OpenAI connection works
- Which model is accessible

### 2. Check Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```bash
# Required for AI analysis
OPENAI_API_KEY=sk-...

# Optional for transcription (falls back to mock if not set)
ASSEMBLYAI_API_KEY=...
```

### 3. Check Vercel Function Logs

1. Go to Vercel Dashboard → Functions tab
2. Look for `/api/projects/[id]/process`
3. Check for error messages like:
   - `[AIContentService] Error analyzing transcript`
   - `[TranscriptionProcessor] Environment`

## Solutions

### Solution 1: Ensure API Keys are Set

```bash
# Add to Vercel Environment Variables
OPENAI_API_KEY=sk-your-actual-key-here
```

### Solution 2: Verify Model Access

If using custom models (`gpt-4.1`, `gpt-4.1-mini`):
1. Verify these models exist in your OpenAI account
2. Check if your API key has access to them
3. Consider using standard models as fallback

### Solution 3: Increase Function Timeout

The routes already have extended timeouts:
```typescript
export const maxDuration = 300; // 5 minutes
```

But ensure your Vercel plan supports it:
- Hobby: 10 seconds max
- Pro: 5 minutes max
- Enterprise: 15 minutes max

### Solution 4: Use Fallback Data

The app is designed to fall back to mock data if AI fails:
- Transcription → Mock transcript
- AI Analysis → Mock content analysis

If fallbacks aren't working, check:
1. Error handling in catch blocks
2. Console logs in Vercel Functions

## How It Should Work

1. **Transcription Flow**:
   ```
   Video Upload → AssemblyAI (if key exists) → Fallback to Mock
   ```

2. **AI Analysis Flow**:
   ```
   Transcript → OpenAI Analysis → Fallback to Mock Analysis
   ```

Both should always return data, even if APIs fail.

## Testing Locally vs Production

### Local Development
- Uses development models
- No cold start delays
- Direct API access

### Vercel Production
- Uses production models (`gpt-4.1-mini`)
- Cold start can add 1-3 seconds
- Goes through Vercel's network

## Quick Fixes

### 1. Force Mock Data (Temporary)
If you need it working immediately, you can force mock data by not setting API keys.

### 2. Use Standard OpenAI Models
If custom models aren't working, update `ai-content-service.ts`:
```typescript
// Change from:
const model = process.env.NODE_ENV === 'production' ? 'gpt-4.1-mini' : 'gpt-4.1'

// To:
const model = process.env.NODE_ENV === 'production' ? 'gpt-3.5-turbo' : 'gpt-4-turbo-preview'
```

### 3. Add Detailed Logging
The code now includes detailed logging. Check Vercel Functions logs for:
- `[TranscriptionProcessor] Environment`
- `[AIContentService] Error analyzing transcript`

## Support

If issues persist:
1. Run the test endpoint: `/api/test-vercel-ai`
2. Check Vercel function logs
3. Verify API keys are correctly set
4. Ensure your OpenAI account has access to the models you're using 