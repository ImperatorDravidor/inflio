-- Add KLAP integration columns to projects table
-- These columns store the KLAP task ID and folder ID for clip generation tracking

-- Add klap_project_id column (stores the task ID initially, then folder ID)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS klap_project_id TEXT;

-- Add klap_folder_id column (stores the output folder ID after processing)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS klap_folder_id TEXT;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_klap_project_id ON public.projects(klap_project_id);
CREATE INDEX IF NOT EXISTS idx_projects_klap_folder_id ON public.projects(klap_folder_id);

-- Add comment for documentation
COMMENT ON COLUMN public.projects.klap_project_id IS 'KLAP task ID or folder ID for clip generation';
COMMENT ON COLUMN public.projects.klap_folder_id IS 'KLAP output folder ID containing generated clips'; 