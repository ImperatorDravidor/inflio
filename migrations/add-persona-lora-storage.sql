-- Add LoRA model storage to personas table
ALTER TABLE personas ADD COLUMN IF NOT EXISTS lora_model_url TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS lora_config_url TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS lora_trigger_phrase TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS lora_training_status TEXT DEFAULT 'not_trained' CHECK (lora_training_status IN ('not_trained', 'training', 'trained', 'failed'));
ALTER TABLE personas ADD COLUMN IF NOT EXISTS lora_training_job_id TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS lora_trained_at TIMESTAMPTZ;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS lora_training_params JSONB DEFAULT '{}';

-- Create index for training status
CREATE INDEX IF NOT EXISTS idx_personas_lora_training_status ON personas(lora_training_status);

-- Create LoRA training jobs table
CREATE TABLE IF NOT EXISTS lora_training_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Training configuration
  images_data_url TEXT NOT NULL,
  trigger_phrase TEXT,
  learning_rate DECIMAL,
  steps INTEGER,
  multiresolution_training BOOLEAN DEFAULT true,
  subject_crop BOOLEAN DEFAULT true,
  create_masks BOOLEAN DEFAULT false,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  
  -- Results
  lora_model_url TEXT,
  lora_config_url TEXT,
  
  -- Metadata
  fal_request_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_lora_training_jobs_user_id ON lora_training_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_lora_training_jobs_persona_id ON lora_training_jobs(persona_id);
CREATE INDEX IF NOT EXISTS idx_lora_training_jobs_status ON lora_training_jobs(status);

-- Enable RLS
ALTER TABLE lora_training_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for LoRA training jobs
CREATE POLICY "Users can view own training jobs" ON lora_training_jobs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own training jobs" ON lora_training_jobs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own training jobs" ON lora_training_jobs
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Function to update persona after successful training
CREATE OR REPLACE FUNCTION update_persona_after_training()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.lora_model_url IS NOT NULL THEN
    UPDATE personas
    SET 
      lora_model_url = NEW.lora_model_url,
      lora_config_url = NEW.lora_config_url,
      lora_trigger_phrase = NEW.trigger_phrase,
      lora_training_status = 'trained',
      lora_trained_at = NEW.completed_at,
      lora_training_params = jsonb_build_object(
        'learning_rate', NEW.learning_rate,
        'steps', NEW.steps,
        'multiresolution_training', NEW.multiresolution_training,
        'subject_crop', NEW.subject_crop,
        'create_masks', NEW.create_masks
      )
    WHERE id = NEW.persona_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE personas
    SET lora_training_status = 'failed'
    WHERE id = NEW.persona_id;
  ELSIF NEW.status = 'processing' THEN
    UPDATE personas
    SET 
      lora_training_status = 'training',
      lora_training_job_id = NEW.id::text
    WHERE id = NEW.persona_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating persona
CREATE TRIGGER update_persona_lora_status
  AFTER UPDATE OF status ON lora_training_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_persona_after_training();
