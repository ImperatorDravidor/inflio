-- Add quote_cards column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS quote_cards JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN projects.quote_cards IS 'Generated quote cards with extracted quotes, designs, and image URLs';

-- Create an index for better performance when querying projects with quote cards
CREATE INDEX IF NOT EXISTS idx_projects_quote_cards ON projects USING GIN (quote_cards);

-- Example quote card structure:
-- {
--   "id": "card_123",
--   "quote": {
--     "id": "quote_1",
--     "text": "The quote text",
--     "context": "Context about the quote",
--     "speaker": "Speaker Name",
--     "timestamp": 120,
--     "sentiment": "inspiring",
--     "keywords": ["keyword1", "keyword2"],
--     "impactScore": 0.85
--   },
--   "design": {
--     "id": "modern-gradient",
--     "name": "Modern Gradient",
--     "backgroundColor": "#667EEA",
--     ...design properties
--   },
--   "imageUrl": "https://storage.url/quote.svg",
--   "hashtags": ["#inspiration", "#quotes"],
--   "createdAt": "2024-01-01T00:00:00Z"
-- } 