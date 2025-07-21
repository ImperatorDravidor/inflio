-- Add Klap status tracking columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS klap_status TEXT DEFAULT 'idle' CHECK (klap_status IN ('idle', 'queued', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS klap_task_id TEXT,
ADD COLUMN IF NOT EXISTS klap_queued_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS klap_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS klap_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS klap_error TEXT;

-- Add index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_projects_klap_status ON projects(klap_status);
CREATE INDEX IF NOT EXISTS idx_projects_klap_task_id ON projects(klap_task_id);

-- Add comment for documentation
COMMENT ON COLUMN projects.klap_status IS 'Current status of Klap clip generation';
COMMENT ON COLUMN projects.klap_task_id IS 'Klap API task ID for tracking';
COMMENT ON COLUMN projects.klap_queued_at IS 'When the Klap job was queued';
COMMENT ON COLUMN projects.klap_started_at IS 'When Klap processing actually started';
COMMENT ON COLUMN projects.klap_completed_at IS 'When Klap processing completed';
COMMENT ON COLUMN projects.klap_error IS 'Error message if Klap processing failed'; 