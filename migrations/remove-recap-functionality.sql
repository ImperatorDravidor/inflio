-- Remove recap functionality from database

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can view own recap views" ON recap_views;
DROP POLICY IF EXISTS "Users can insert own recap views" ON recap_views;

-- Drop indexes
DROP INDEX IF EXISTS idx_recap_views_user;

-- Drop table
DROP TABLE IF EXISTS recap_views;

-- Clean up any references in other tables or functions
-- Note: If there are any foreign key references or functions that depend on recap_views,
-- they would need to be handled here as well 