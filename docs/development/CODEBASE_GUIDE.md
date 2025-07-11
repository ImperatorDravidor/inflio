# Codebase Guide

## 🏗️ Architecture Overview

Inflio follows a modern Next.js 15 architecture with clear separation of concerns:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Routes    │────▶│   Services      │
│  (React/Next)   │     │  (Next.js API)  │     │  (Business)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   External APIs  │     │   Database      │
                        │ (Klap, OpenAI)  │     │   (Supabase)    │
                        └─────────────────┘     └─────────────────┘
```

## 📁 Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Protected routes group
│   │   ├── dashboard/     # Main dashboard
│   │   ├── projects/      # Project management
│   │   ├── studio/        # Video upload/processing
│   │   ├── social/        # Social media hub
│   │   └── analytics/     # Analytics dashboard
│   ├── api/              # API endpoints
│   └── page.tsx          # Landing page
│
├── components/           # React components
│   ├── ui/              # Base UI (shadcn/ui)
│   ├── social/          # Social media components
│   ├── staging/         # Content staging
│   └── *.tsx            # Feature components
│
├── lib/                 # Core business logic
│   ├── services/        # Service exports
│   ├── social/          # Social media logic
│   ├── staging/         # Staging services
│   ├── supabase/        # Database clients
│   └── *.ts             # Utilities
│
├── hooks/               # Custom React hooks
└── types/               # TypeScript definitions
```

## 🔑 Key Concepts

### 1. Service Layer Pattern
All business logic is abstracted into services:

```typescript
// ❌ Don't: Direct API calls in components
const response = await fetch('/api/process-klap')

// ✅ Do: Use service layer
import { ProjectService } from '@/lib/services'
const project = await ProjectService.startProcessing(projectId)
```

### 2. Supabase Integration
We use multiple Supabase clients for different contexts:

```typescript
// Browser client (for frontend)
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// Server client (for API routes)
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Admin client (for privileged operations)
import { supabaseAdmin } from '@/lib/supabase/admin'
```

### 3. Authentication Flow
Clerk handles auth, synced with Supabase:

```typescript
// Get current user
import { useAuth } from '@clerk/nextjs'
const { userId } = useAuth()

// Server-side auth check
import { auth } from '@clerk/nextjs/server'
const { userId } = await auth()
```

### 4. Error Handling
Consistent error handling across the app:

```typescript
import { handleError, AppError } from '@/lib/error-handler'

try {
  // Your code
} catch (error) {
  const message = handleError(error)
  toast.error(message)
}
```

## 🔄 Data Flow

### Video Upload → Processing → Content

1. **Upload**: Video → Supabase Storage
2. **Process**: URL → Klap API → Clips & Transcript
3. **Generate**: Transcript → OpenAI → Blog/Captions
4. **Publish**: Content → Social APIs → Platforms

### Project State Management

```typescript
interface Project {
  id: string
  status: 'uploading' | 'processing' | 'ready' | 'published'
  tasks: Task[]
  folders: {
    clips: Clip[]
    blog: BlogPost[]
    social: SocialPost[]
  }
}
```

## 🧩 Component Patterns

### 1. Loading States
```tsx
// Use built-in loading components
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { UploadProgress } from '@/components/loading-states'
```

### 2. Error Boundaries
```tsx
// Wrap critical sections
<ErrorBoundary fallback={<ErrorFallback />}>
  <VideoProcessor />
</ErrorBoundary>
```

### 3. Optimistic Updates
```tsx
// Update UI before API response
setProjects(prev => [...prev, optimisticProject])
const actualProject = await ProjectService.create(data)
setProjects(prev => prev.map(p => 
  p.id === optimisticProject.id ? actualProject : p
))
```

## 🎨 UI Components

We use shadcn/ui as our component library:

```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
```

Custom components follow this pattern:
```tsx
interface ComponentProps {
  // Props definition
}

export function Component({ 
  prop1,
  prop2,
  ...props 
}: ComponentProps) {
  // Implementation
}
```

## 🔌 External Services

### Klap API (Video Processing)
```typescript
import { KlapAPIService } from '@/lib/klap-api'

// Create project
const { projectId } = await KlapAPIService.createProject({
  video_url: url,
  settings: { ... }
})

// Poll for status
const status = await KlapAPIService.getProjectStatus(projectId)
```

### OpenAI (Content Generation)
```typescript
import { getOpenAI } from '@/lib/openai'
const openai = getOpenAI()

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [...]
})
```

## 🗄️ Database Schema

### Core Tables
- `projects` - Video projects
- `user_profiles` - User settings
- `social_integrations` - OAuth tokens
- `social_posts` - Scheduled/published posts
- `staging_sessions` - Content staging

### Storage Buckets
- `videos` - Original video files
- `project-media` - Clips and thumbnails
- `ai-images` - Generated images
- `subtitles` - VTT files

## 🚀 Common Tasks

### Add a New API Endpoint
```typescript
// 1. Create route: app/api/your-endpoint/route.ts
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Your logic here
}
```

### Add a New Service
```typescript
// 1. Create service: lib/your-service.ts
export class YourService {
  static async doSomething(params: Params) {
    // Implementation
  }
}

// 2. Export from lib/services/index.ts
export { YourService } from '../your-service'
```

### Add a New Component
```tsx
// 1. Create component: components/your-component.tsx
interface YourComponentProps {
  // Props
}

export function YourComponent(props: YourComponentProps) {
  // Implementation
}

// 2. Use in pages
import { YourComponent } from '@/components/your-component'
```

## 🐛 Debugging Tips

### Check Processing Status
```typescript
// In browser console
const projects = await ProjectService.getAllProjects(userId)
console.log(projects.filter(p => p.status === 'processing'))
```

### View Klap Configuration
```
GET /api/test-klap-simple
```

### Check Social OAuth
```
GET /api/diagnose-social-oauth
```

### Database Queries
Use Supabase dashboard SQL editor for direct queries.

## 🔒 Security Considerations

1. **Always check auth** in API routes
2. **Validate user ownership** before operations
3. **Use RLS policies** in Supabase
4. **Sanitize file names** before storage
5. **Never expose API keys** to frontend

## 📝 Code Style

- Use TypeScript strict mode
- Prefer const over let
- Use optional chaining (?.)
- Handle errors gracefully
- Add JSDoc comments for complex functions
- Keep components under 300 lines
- Extract repeated logic to hooks/utils 