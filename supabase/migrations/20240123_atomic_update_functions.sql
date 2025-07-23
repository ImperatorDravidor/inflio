-- Function to atomically append content to a project folder
CREATE OR REPLACE FUNCTION append_to_folder(
  project_id UUID,
  folder_type TEXT,
  new_content JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET 
    folders = jsonb_set(
      folders,
      ARRAY[folder_type],
      COALESCE(folders->folder_type, '[]'::jsonb) || new_content,
      true
    ),
    updated_at = NOW()
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to atomically increment a numeric field in project
CREATE OR REPLACE FUNCTION increment_project_field(
  project_id UUID,
  field_path TEXT[],
  increment_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET 
    -- Use jsonb_set with the current value + increment
    data = jsonb_set(
      data,
      field_path,
      to_jsonb(COALESCE((data #>> field_path)::integer, 0) + increment_by),
      true
    ),
    updated_at = NOW()
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update task progress atomically
CREATE OR REPLACE FUNCTION update_task_progress(
  project_id UUID,
  task_type TEXT,
  new_progress INTEGER,
  new_status TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  task_index INTEGER;
  current_task JSONB;
  updated_task JSONB;
  all_tasks JSONB;
BEGIN
  -- Get current tasks array
  SELECT tasks INTO all_tasks
  FROM projects
  WHERE id = project_id;
  
  -- Find the task index
  SELECT position - 1 INTO task_index
  FROM (
    SELECT value, position
    FROM jsonb_array_elements(all_tasks) WITH ORDINALITY AS t(value, position)
    WHERE value->>'type' = task_type
  ) AS task_search;
  
  IF task_index IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get current task
  current_task := all_tasks->task_index;
  
  -- Build updated task
  updated_task := current_task || jsonb_build_object('progress', new_progress);
  
  -- Add status if provided
  IF new_status IS NOT NULL THEN
    updated_task := updated_task || jsonb_build_object('status', new_status);
    
    -- Add timestamps based on status
    IF new_status = 'processing' AND current_task->>'startedAt' IS NULL THEN
      updated_task := updated_task || jsonb_build_object('startedAt', NOW());
    ELSIF new_status = 'completed' THEN
      updated_task := updated_task || jsonb_build_object('completedAt', NOW());
    END IF;
  END IF;
  
  -- Update the tasks array
  UPDATE projects
  SET 
    tasks = jsonb_set(all_tasks, ARRAY[task_index::text], updated_task, false),
    updated_at = NOW()
  WHERE id = project_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_tasks ON projects USING gin(tasks);
CREATE INDEX IF NOT EXISTS idx_projects_folders ON projects USING gin(folders);