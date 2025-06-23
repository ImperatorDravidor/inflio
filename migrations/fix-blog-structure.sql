-- Fix blog structure for existing blog posts
-- This migration updates any blog posts that have the old structure (metaTitle/metaDescription)
-- to the new structure (seoTitle/seoDescription) and adds missing fields

UPDATE projects
SET folders = jsonb_set(
  folders,
  '{blog}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN blog_item ? 'metaTitle' OR blog_item ? 'metaDescription' OR NOT blog_item ? 'readingTime' OR NOT blog_item ? 'sections'
        THEN 
          blog_item 
          -- Rename metaTitle to seoTitle
          || CASE 
              WHEN blog_item ? 'metaTitle' 
              THEN jsonb_build_object('seoTitle', blog_item->'metaTitle')
              ELSE jsonb_build_object('seoTitle', COALESCE(blog_item->'seoTitle', LEFT(blog_item->>'title', 60)))
          END
          -- Rename metaDescription to seoDescription  
          || CASE
              WHEN blog_item ? 'metaDescription'
              THEN jsonb_build_object('seoDescription', blog_item->'metaDescription')
              ELSE jsonb_build_object('seoDescription', COALESCE(blog_item->'seoDescription', LEFT(blog_item->>'excerpt', 160)))
          END
          -- Add readingTime if missing
          || CASE
              WHEN NOT blog_item ? 'readingTime'
              THEN jsonb_build_object('readingTime', GREATEST(1, ROUND(array_length(string_to_array(blog_item->>'content', ' '), 1)::numeric / 200)))
              ELSE '{}'::jsonb
          END
          -- Add sections if missing
          || CASE
              WHEN NOT blog_item ? 'sections'
              THEN jsonb_build_object('sections', '[]'::jsonb)
              ELSE '{}'::jsonb
          END
          -- Remove old fields
          - 'metaTitle'
          - 'metaDescription'
        ELSE blog_item
      END
    )
    FROM jsonb_array_elements(folders->'blog') AS blog_item
  )
)
WHERE folders ? 'blog' 
  AND folders->'blog' != '[]'::jsonb
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(folders->'blog') AS blog_item
    WHERE blog_item ? 'metaTitle' 
       OR blog_item ? 'metaDescription'
       OR NOT blog_item ? 'readingTime'
       OR NOT blog_item ? 'sections'
  );

-- Add comment explaining the migration
COMMENT ON TABLE projects IS 'Blog structure migrated to use seoTitle/seoDescription instead of metaTitle/metaDescription'; 