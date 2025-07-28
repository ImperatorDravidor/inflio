# New Features Deployment Guide

## Features to Deploy
1. **Thread Generator** - Convert content to Twitter/LinkedIn threads
2. **Video Chapter Generation** - Create YouTube chapters from transcripts
3. **Quote Cards** - Extract quotes and generate visual cards

## Pre-Deployment Checklist

### 1. Database Migrations
Run the following migrations in order:
```sql
-- 1. Add chapters column
migrations/add-chapters-column.sql

-- 2. Add quote_cards column
migrations/add-quote-cards-column.sql
```

### 2. Environment Variables
Ensure these are set in production:
- `OPENAI_API_KEY` - Required for all AI features
- `NEXT_PUBLIC_SUPABASE_URL` - For storage
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - For storage
- `SUPABASE_SERVICE_ROLE_KEY` - For server operations

### 3. API Endpoints Added
New endpoints that will be available:
- `POST /api/generate-thread` - Generate social media threads
- `POST/GET /api/generate-chapters` - Generate/retrieve video chapters
- `POST/GET /api/generate-quote-cards` - Generate quote cards

### 4. UI Changes
- Project page now has 7 tabs (added "Quotes" tab)
- Blog posts have "Generate Thread" option in dropdown
- Video chapters appear in project overview section

## Deployment Steps

### Step 1: Database Setup
```bash
# Connect to production database
# Run migrations
psql $DATABASE_URL < migrations/add-chapters-column.sql
psql $DATABASE_URL < migrations/add-quote-cards-column.sql
```

### Step 2: Deploy Code
```bash
# Deploy to Vercel (automatic via git push)
git push origin master

# Or manual deployment
vercel --prod
```

### Step 3: Verify Deployment
1. Check build logs for any errors
2. Test each new feature:
   - Create a test project
   - Generate transcript
   - Test thread generation from a blog post
   - Test chapter generation
   - Test quote card generation

### Step 4: Monitor
- Watch error logs for first 24 hours
- Monitor OpenAI API usage
- Check database performance

## Rollback Plan

If issues arise:
1. Revert to previous deployment in Vercel
2. Database columns are safe to keep (won't affect existing functionality)

## Testing Checklist

### Thread Generator
- [ ] Generate thread from existing blog post
- [ ] Test Twitter format (280 char limit)
- [ ] Test LinkedIn format (3000 char limit)
- [ ] Test copy functionality
- [ ] Test download functionality

### Video Chapters
- [ ] Generate chapters from transcript
- [ ] Edit chapter titles
- [ ] Delete/add chapters
- [ ] Copy YouTube description
- [ ] Validate for YouTube requirements

### Quote Cards
- [ ] Extract quotes from transcript
- [ ] Preview all 5 design templates
- [ ] Download individual cards
- [ ] Bulk download
- [ ] Social sharing buttons

## Performance Notes

- All features use OpenAI GPT-4 (monitor costs)
- SVG generation is lightweight
- Database indexes added for JSONB columns
- No impact on existing features

## User Communication

Announce new features:
1. **Thread Generator**: "Turn your blog posts into engaging Twitter threads"
2. **Video Chapters**: "Add YouTube chapters automatically"
3. **Quote Cards**: "Create shareable quote graphics from your videos"

## Support Documentation

Update help docs with:
- How to use thread generator
- YouTube chapter best practices
- Quote card design options

## Success Metrics

Track after launch:
- Feature adoption rate
- API success/error rates
- User feedback
- Performance impact 