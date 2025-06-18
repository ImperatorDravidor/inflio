# Inflio Codebase Clarity Guide

## What This App Actually Does

Inflio is a video content creation platform that helps creators transform long-form videos into various content formats:

1. **Video Processing**: Upload videos and get AI-generated clips
2. **Transcription**: Generate accurate transcriptions using OpenAI Whisper
3. **Content Generation**: Create blog posts and social media content from videos
4. **Social Media Management**: Schedule and publish content to various platforms
5. **Analytics**: Track performance of generated content

## Current Architecture Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  API Routes  │────▶│ External APIs   │
│   (Frontend)    │     │  (Backend)   │     │ (Klap, OpenAI)  │
└─────────────────┘     └──────────────┘     └─────────────────┘
         │                      │                      │
         ▼                      ▼                      │
┌─────────────────┐     ┌──────────────┐             │
│     Clerk       │     │   Supabase   │◀────────────┘
│    (Auth)       │     │  (Database)  │
└─────────────────┘     └──────────────┘
```

## Main Issues ("Vibe Coding" Problems)

### 1. **Duplicate API Routes**
Currently, there are multiple routes doing similar things:
- `/api/process` - Generic processing
- `/api/process-klap` - Klap-specific processing
- `/api/process-transcription` - Transcription processing
- `/api/process-with-profile` - Processing with user profile

**Solution**: Consolidate into a single `/api/process` route with options:
```typescript
// Instead of multiple routes, use one with options
POST /api/process
{
  "projectId": "...",
  "workflows": {
    "clips": true,
    "transcription": true,
    "blog": false,
    "social": false
  },
  "useProfile": true
}
```

### 2. **Mixed State Management**
The app uses both:
- **localStorage** (in `project-service.ts`)
- **Supabase** (for actual storage)

This creates confusion about where data actually lives.

**Solution**: Remove localStorage usage and use Supabase exclusively:
```typescript
// Replace localStorage with Supabase calls
static async getProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  
  return data
}
```

### 3. **Unclear Project Flow**
The project creation and processing flow is scattered across multiple files.

**Current Flow**:
1. User uploads video → `/studio/upload/page.tsx`
2. Creates project → `project-service.ts` (localStorage)
3. Starts processing → Multiple API routes
4. Updates progress → Mixed between localStorage and Supabase

**Suggested Clean Flow**:
```
Upload → Create Project (Supabase) → Queue Processing → Update Status → Display Results
```

### 4. **Documentation Chaos**
Two documentation folders:
- `/docs` (old)
- `/documentation` (new)

**Solution**: Keep only `/documentation` and organize it properly:
```
documentation/
├── README.md           # Main documentation index
├── architecture/       # System design docs
├── api/               # API documentation
├── setup/             # Setup guides
└── guides/            # User guides
```

## Recommended Refactoring Steps

### Step 1: Consolidate API Routes
```typescript
// src/app/api/v2/process/route.ts
export async function POST(request: Request) {
  const { projectId, workflows, options } = await request.json()
  
  // Single entry point for all processing
  const processor = new VideoProcessor(projectId, workflows, options)
  return processor.execute()
}
```

### Step 2: Create Clear Service Layer
```typescript
// src/lib/services/
├── video-processor.ts    # Main processing orchestrator
├── transcription.ts      # Transcription service
├── clip-generator.ts     # Clip generation
├── content-creator.ts    # Blog/social content
└── storage.ts           # Unified storage (Supabase only)
```

### Step 3: Simplify Project Types
```typescript
// src/lib/types/project.ts
export interface Project {
  id: string
  userId: string
  title: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  videoUrl: string
  results: {
    transcription?: Transcription
    clips?: Clip[]
    blog?: BlogPost
    social?: SocialPost[]
  }
  createdAt: Date
  updatedAt: Date
}
```

### Step 4: Clear Component Structure
```
src/app/(dashboard)/
├── layout.tsx           # Dashboard layout
├── projects/           # Project management
│   ├── page.tsx       # Projects list
│   └── [id]/          # Project details
├── studio/            # Creation studio
│   ├── upload/        # Upload interface
│   └── editor/        # Edit generated content
└── analytics/         # Performance tracking
```

## Database Schema Cleanup

### Current Issues:
- Multiple migration files with overlapping schemas
- Unclear relationships between tables

### Suggested Clean Schema:
```sql
-- Core tables
users (id, email, name, created_at)
projects (id, user_id, title, status, video_url, created_at)
transcriptions (id, project_id, text, timestamps, created_at)
clips (id, project_id, title, start_time, end_time, url)
content (id, project_id, type, platform, content, scheduled_at)

-- Relationships
users 1:N projects
projects 1:1 transcriptions
projects 1:N clips
projects 1:N content
```

## Environment Variables Cleanup

Consolidate all environment variables:
```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# External APIs
KLAP_API_KEY=
OPENAI_API_KEY=
ASSEMBLYAI_API_KEY=

# App Config
NEXT_PUBLIC_APP_URL=
```

## Quick Wins for Immediate Clarity

1. **Delete unused files**: Remove all localStorage-based code
2. **Consolidate docs**: Move everything to `/documentation`
3. **Add JSDoc comments**: Document all main functions
4. **Create API client**: Single point for all API calls
5. **Add error boundaries**: Proper error handling throughout

## Next Steps

1. Create a proper API client:
```typescript
// src/lib/api-client.ts
class APIClient {
  async processVideo(projectId: string, options: ProcessOptions) {
    return this.post('/api/v2/process', { projectId, options })
  }
  
  async getProject(projectId: string) {
    return this.get(`/api/v2/projects/${projectId}`)
  }
}
```

2. Implement proper error handling:
```typescript
// src/lib/error-handler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
  }
}
```

3. Add proper loading states and progress tracking
4. Implement proper caching with React Query or SWR
5. Add comprehensive tests

This guide should help transform the "vibe coded" app into a well-structured, maintainable codebase! 