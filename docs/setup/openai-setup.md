# OpenAI API Setup for Blog Generation

This guide explains how to set up the OpenAI API key required for the blog generation feature.

## Prerequisites

- An OpenAI account with API access
- API credits or an active subscription

## Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in to your account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the generated key (you won't be able to see it again)

## Setting Up the Environment Variable

Add the following to your `.env.local` file in the project root:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Important Notes

- **Never commit your API key** to version control
- The `.env.local` file should be in your `.gitignore`
- Keep your API key secure and rotate it regularly
- Monitor your API usage to avoid unexpected charges

## Usage

Once configured, the blog generation feature will:
1. Use GPT-4 Turbo for high-quality content generation
2. Create SEO-optimized blog posts from video transcripts
3. Include proper formatting, tags, and metadata
4. Calculate reading time automatically

## Troubleshooting

If blog generation fails:
1. Check that your API key is correctly set
2. Verify you have sufficient API credits
3. Check the console for specific error messages
4. Ensure your transcript is not empty

## Cost Considerations

- GPT-4 Turbo pricing applies per token
- Average blog post generation: ~2,000-4,000 tokens
- Monitor usage at: https://platform.openai.com/usage 