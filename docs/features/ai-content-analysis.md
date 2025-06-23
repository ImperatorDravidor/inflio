# AI Content Analysis Feature

## Overview

The AI Content Analysis feature uses OpenAI GPT-4.1 to automatically extract keywords, topics, and valuable insights from video transcripts. This analysis powers intelligent content generation across blog posts, social media, and more.

## Features

### 1. Automatic Keyword & Topic Extraction
- **Keywords**: 10-15 relevant keywords extracted from transcript
- **Topics**: 5-8 main topics discussed in the video
- **Smart Filtering**: Removes common stop words and focuses on meaningful terms

### 2. Content Analysis
- **Summary**: AI-generated 2-3 sentence summary
- **Sentiment Analysis**: Detects positive, neutral, or negative tone
- **Key Moments**: Identifies 3-5 important timestamps with descriptions

### 3. Content Suggestions
- **Blog Post Ideas**: 3 AI-generated blog post suggestions
- **Social Media Hooks**: 3 engaging social media post ideas
- **Short Form Content**: 3 ideas for clips or shorts

## Implementation

### Database Schema

The content analysis is stored in the `content_analysis` JSONB column:

```sql
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS content_analysis JSONB;
```

### Data Structure

```typescript
interface ContentAnalysis {
  keywords: string[]
  topics: string[]
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  keyMoments: Array<{
    timestamp: number
    description: string
  }>
  contentSuggestions: {
    blogPostIdeas: string[]
    socialMediaHooks: string[]
    shortFormContent: string[]
  }
  analyzedAt: string
}
```

## API Integration

### 1. Automatic Analysis During Transcription

When a video is transcribed, the AI automatically analyzes the content:

```typescript
// POST /api/process-transcription
{
  projectId: string,
  videoUrl: string,
  language?: string
}

// Response includes:
{
  transcription: {...},
  contentAnalysis: {
    keywords: ["keyword1", "keyword2", ...],
    topics: ["topic1", "topic2", ...],
    summary: "Brief summary...",
    sentiment: "positive",
    keyMoments: [...],
    contentSuggestions: {...}
  },
  analysisError: null // or error message if analysis failed
}
```

### 2. Blog Generation with Analysis

Blog posts now use the content analysis for better quality:

```typescript
// POST /api/generate-blog
{
  projectId: string,
  transcriptText: string,
  blogStyle: 'professional' | 'casual' | 'technical'
}
```

### 3. Social Media Generation

Generate platform-specific social posts:

```typescript
// POST /api/generate-social
{
  projectId: string,
  platforms: ['twitter', 'linkedin', 'instagram', 'tiktok']
}
```

## Quality Assurance

### Analysis Flow

1. **Transcript Validation**
   - Minimum 100 characters required for analysis
   - Checks transcript quality before processing
   - Logs character count and segment information

2. **API Key Verification**
   - Validates OpenAI API key is configured
   - Provides clear error messages if missing
   - Falls back gracefully without breaking transcription

3. **Error Handling**
   - Comprehensive error logging with context
   - Non-blocking: transcription completes even if analysis fails
   - Returns `analysisError` field in response for debugging

4. **Performance Monitoring**
   - Tracks processing time in milliseconds
   - Logs analysis results (keywords count, topics, etc.)
   - Provides detailed debug information

### Testing the Service

#### 1. API Test Endpoint

Test the AI analysis independently:

```bash
POST /api/test-ai-analysis
{
  "transcriptText": "Your test transcript text here..."
}
```

Response includes:
- Analysis results
- Processing time
- Debug information
- Error details (if any)

#### 2. Test Script

Run the included test script:

```bash
node scripts/test-ai-analysis.js
```

This will:
- Test with a sample transcript
- Display analysis results
- Show processing time
- Verify API key configuration

#### 3. Manual Testing Steps

1. **Check API Key**:
   ```bash
   # Ensure this is set in .env.local
   OPENAI_API_KEY=sk-...
   ```

2. **Test Transcription + Analysis**:
   - Upload a video
   - Monitor console logs for analysis progress
   - Check response for `contentAnalysis` field

3. **Verify UI Display**:
   - Keywords show as badges
   - Topics are displayed
   - Key moments are clickable
   - Content suggestions appear

## UI Features

### Project Overview Page

The content analysis is displayed in the project overview with:

1. **Keywords Section**: Visual badges for each keyword
2. **Topics Section**: Highlighted main topics
3. **Summary Card**: Brief content overview with sentiment indicator
4. **Key Moments**: Clickable timestamps that jump to video position
5. **Content Ideas**: Suggestions for repurposing content

### Interactive Elements

- Click on key moments to jump to that timestamp in the video
- Hover effects on keywords and topics
- Color-coded sentiment indicators
- Expandable content suggestion cards

## OpenAI Configuration

### Model Selection

The system uses GPT-4.1 for optimal performance:

```typescript
model: 'gpt-4.1'
temperature: 0.3  // Lower for more consistent analysis
max_tokens: 1500  // Sufficient for comprehensive analysis
response_format: { type: 'json_object' }  // Structured output
```

### Fallback Mechanism

If OpenAI is unavailable, a basic frequency analysis provides:
- Top 10 most frequent meaningful words as keywords
- Basic topic extraction from keywords
- Simple summary from first 200 characters
- Even distribution of key moments across video duration

## Best Practices

### 1. API Key Management
```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Error Handling
- Graceful fallback to basic analysis
- Continues processing even if analysis fails
- User-friendly error messages

### 3. Performance Optimization
- Analysis runs asynchronously during transcription
- Results are cached in the database
- No repeated analysis for same content

## Future Enhancements

1. **Custom Prompts**: Allow users to customize analysis focus
2. **Language Support**: Multi-language content analysis
3. **Trend Detection**: Identify trending topics and keywords
4. **Competitive Analysis**: Compare content with industry benchmarks
5. **Export Options**: Download analysis as PDF/CSV reports

## Troubleshooting

### Common Issues

1. **No Analysis Generated**
   - Check OpenAI API key is valid
   - Ensure transcription completed successfully
   - Verify project has transcript data
   - Check console logs for specific errors

2. **Poor Quality Keywords**
   - Transcript may be too short (min 100 chars)
   - Video content may lack clear topics
   - Try regenerating with manual review

3. **API Rate Limits**
   - Implement request queuing
   - Add retry logic with exponential backoff
   - Monitor usage in OpenAI dashboard

4. **Analysis Takes Too Long**
   - Normal processing: 2-5 seconds
   - Check OpenAI API status
   - Consider implementing timeout (30s recommended)

## Cost Considerations

- Each analysis uses approximately 2000-3000 tokens
- Blog generation uses 3000-4000 tokens
- Social posts use 500-1000 tokens per platform
- Monitor usage to control costs

## Security

- API keys stored securely in environment variables
- No sensitive data sent to OpenAI
- User content remains private and encrypted 