-- Migration: Simplify Personas for Nano Banana Pro
-- Purpose: Remove LoRA training complexity, support instant persona creation
-- Date: 2025-12-18

-- Remove LoRA training fields that are no longer needed
ALTER TABLE personas
  DROP COLUMN IF EXISTS model_ref,
  DROP COLUMN IF EXISTS lora_model_url,
  DROP COLUMN IF EXISTS lora_config_url,
  DROP COLUMN IF EXISTS lora_trigger_phrase,
  DROP COLUMN IF EXISTS lora_training_status,
  DROP COLUMN IF EXISTS lora_trained_at,
  DROP COLUMN IF EXISTS training_job_id;

-- Update status constraint to new simplified workflow
ALTER TABLE personas
  DROP CONSTRAINT IF EXISTS personas_status_check;

ALTER TABLE personas
  ADD CONSTRAINT personas_status_check
  CHECK (status IN ('pending_upload', 'analyzing', 'ready', 'failed'));

-- Add index for faster persona queries by user and status
CREATE INDEX IF NOT EXISTS idx_personas_status_user
  ON personas(user_id, status);

-- Add comment explaining new workflow
COMMENT ON TABLE personas IS
'Persona table using Nano Banana Pro for instant character consistency.
Workflow: pending_upload → analyzing (photo analysis) → ready (portraits generated).
No training required - uses reference images directly.';
