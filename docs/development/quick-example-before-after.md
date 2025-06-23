# Quick Example: Upload Flow Before & After

## 🔴 Before: "Vibe Coded" Upload

The current upload flow is scattered across multiple files with unclear data flow:

```typescript
// In upload component - mixing UI and business logic
const handleUpload = async (file: File) => {
  // Direct localStorage manipulation in component! 
  const projectId = `project_${Date.now()}_${Math.random()}`
  localStorage.setItem(`temp_upload_${projectId}`, file.name)
  
  // Multiple API calls with no clear pattern
  const formData = new FormData()
  formData.append('file', file)
  
  // Which endpoint to use? 🤷‍♂️
  const uploadRes = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
  
  // Sometimes we save to localStorage
  const project = {
    id: projectId,
    title: file.name,
    status: 'processing'
  }
  localStorage.setItem(`project_${projectId}`, JSON.stringify(project))
  
  // Sometimes we save to Supabase?
  await supabase.from('projects').insert({ ...project })
  
  // Start processing with... which endpoint?
  if (userHasProfile) {
    await fetch('/api/process-with-profile', { 
      method: 'POST',
      body: JSON.stringify({ projectId })
    })
  } else {
    await fetch('/api/process-klap', {
      method: 'POST', 
      body: JSON.stringify({ projectId })
    })
  }
  
  // Update UI by dispatching custom event 😵
  window.dispatchEvent(new CustomEvent('projectUpdate'))
}
```

## ✅ After: Clean Architecture

```typescript
// In upload component - only UI concerns
import { useUploadVideo } from '@/features/upload/hooks/useUploadVideo'

export function UploadComponent() {
  const { uploadVideo, isUploading, progress } = useUploadVideo()
  
  const handleUpload = async (file: File) => {
    await uploadVideo(file)
  }
  
  return (
    <div>
      {/* Pure UI component */}
      <UploadButton onUpload={handleUpload} disabled={isUploading} />
      {isUploading && <ProgressBar value={progress} />}
    </div>
  )
}

// In hooks/useUploadVideo.ts - business logic separated
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useUploadVideo() {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: async (file: File) => {
      // Step 1: Upload file
      const { videoUrl } = await apiClient.uploadFile(file)
      
      // Step 2: Create project
      const project = await apiClient.createProject({
        title: file.name,
        videoUrl,
        workflows: {
          transcription: true,
          clips: true,
          blog: true,
          social: false
        }
      })
      
      // Step 3: Start processing
      await apiClient.processVideo(project.id)
      
      return project
    },
    onSuccess: (project) => {
      // Properly invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.setQueryData(['project', project.id], project)
    }
  })
  
  return {
    uploadVideo: mutation.mutate,
    isUploading: mutation.isPending,
    progress: mutation.progress
  }
}

// In lib/api-client.ts - centralized API logic
export class APIClient {
  async uploadFile(file: File): Promise<{ videoUrl: string }> {
    const { data } = await this.upload('/api/v2/upload', file)
    return data
  }
  
  async createProject(data: CreateProjectDTO): Promise<Project> {
    const { data: project } = await this.post('/api/v2/projects', data)
    return project
  }
  
  async processVideo(projectId: string): Promise<void> {
    await this.post('/api/v2/process', { projectId })
  }
}

// In repositories/project.repository.ts - data access layer
export class ProjectRepository {
  async create(data: CreateProjectData): Promise<Project> {
    const { data: project, error } = await supabase
      .from('projects')
      .insert(data)
      .select()
      .single()
      
    if (error) throw new DatabaseError('Failed to create project', error)
    return project
  }
  
  async findById(id: string): Promise<Project | null> {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
      
    return data
  }
}
```

## Key Differences

### 🔴 Vibe Coded Problems:
- Business logic mixed with UI
- Data stored in multiple places (localStorage + Supabase)
- Multiple API endpoints doing similar things
- Custom events for state management
- No error handling
- No loading states
- Unclear data flow

### ✅ Clean Architecture Benefits:
- Clear separation of concerns
- Single source of truth (Supabase only)
- Unified API client
- Proper state management with React Query
- Built-in error handling
- Loading and progress states
- Predictable data flow
- Testable code
- Type safety throughout

The clean version is:
- **Easier to understand**: Each part has one job
- **Easier to test**: Logic is separated from UI
- **Easier to maintain**: Changes are localized
- **Easier to debug**: Clear data flow
- **More reliable**: Proper error handling 