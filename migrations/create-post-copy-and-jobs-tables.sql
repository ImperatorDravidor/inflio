-- Create missing tables for post generation system
-- post_copy: stores platform-specific copy variants for each post suggestion
-- post_generation_jobs: tracks batch generation job progress

-- ─── post_copy ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS post_copy (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id uuid NOT NULL REFERENCES post_suggestions(id) ON DELETE CASCADE,
  platform text NOT NULL,
  caption text NOT NULL DEFAULT '',
  hashtags jsonb DEFAULT '[]'::jsonb,
  cta text DEFAULT '',
  title text,
  description text,
  total_length integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_copy_suggestion_id ON post_copy(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_post_copy_platform ON post_copy(platform);

ALTER TABLE post_copy ENABLE ROW LEVEL SECURITY;

-- ─── post_generation_jobs ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS post_generation_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  user_id text NOT NULL,
  job_type text NOT NULL DEFAULT 'batch_suggestions',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input_params jsonb,
  output_data jsonb,
  total_items integer DEFAULT 0,
  completed_items integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_post_generation_jobs_project ON post_generation_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_post_generation_jobs_user ON post_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_post_generation_jobs_status ON post_generation_jobs(status);

ALTER TABLE post_generation_jobs ENABLE ROW LEVEL SECURITY;
