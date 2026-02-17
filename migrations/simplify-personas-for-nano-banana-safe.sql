-- Migration: Simplify Personas for Nano Banana Pro (SAFE VERSION)
-- Purpose: Remove LoRA training complexity, support instant persona creation
-- Date: 2025-12-18

-- Step 1: Update existing personas to new status values
-- Map old statuses to new ones:
-- 'trained' -> 'ready' (already usable)
-- 'training' -> 'analyzing' (in progress)
-- 'pending' -> 'pending_upload' (waiting)
-- 'ready_to_train' -> 'ready' (we're skipping training now)
-- 'failed' -> 'failed' (keep as is)

UPDATE personas
SET status = CASE
  WHEN status = 'trained' THEN 'ready'
  WHEN status = 'training' THEN 'analyzing'
  WHEN status = 'pending' THEN 'pending_upload'
  WHEN status = 'ready_to_train' THEN 'ready'
  WHEN status = 'failed' THEN 'failed'
  ELSE 'ready' -- fallback for any other statuses
END
WHERE status NOT IN ('pending_upload', 'analyzing', 'ready', 'failed');

-- Step 2: Drop old status constraint
ALTER TABLE personas
  DROP CONSTRAINT IF EXISTS personas_status_check;

-- Step 3: Add new status constraint with simplified values
ALTER TABLE personas
  ADD CONSTRAINT personas_status_check
  CHECK (status IN ('pending_upload', 'analyzing', 'ready', 'failed'));

-- Step 4: Remove LoRA training fields that are no longer needed
ALTER TABLE personas
  DROP COLUMN IF EXISTS model_ref,
  DROP COLUMN IF EXISTS lora_model_url,
  DROP COLUMN IF EXISTS lora_config_url,
  DROP COLUMN IF EXISTS lora_trigger_phrase,
  DROP COLUMN IF EXISTS lora_training_status,
  DROP COLUMN IF EXISTS lora_trained_at,
  DROP COLUMN IF EXISTS training_job_id;

-- Step 5: Add index for faster persona queries by user and status
CREATE INDEX IF NOT EXISTS idx_personas_status_user
  ON personas(user_id, status);

-- Step 6: Add comment explaining new workflow
COMMENT ON TABLE personas IS
'Persona table using Nano Banana Pro for instant character consistency.
Workflow: pending_upload → analyzing (photo analysis) → ready (portraits generated).
No training required - uses reference images directly.';
