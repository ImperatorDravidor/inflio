# Project Page - Tasks & Issues

## Current State Assessment

### 🚨 Critical Issues
1. **Page Size**: The project page is **3,927 lines** long - completely unmaintainable
2. **UnifiedProjectView Not Used**: We created a clean, unified component but it's not integrated
3. **Code Duplication**: Massive amounts of repeated code and inline components
4. **Performance**: Loading 4000 lines of code for every project view

### 📊 What Exists in Current Page
- Video player and transcript editing
- Clip generation and management
- Blog post generation
- Social post creation
- Thumbnail generation (multiple versions)
- Publishing workflow (multiple versions)
- Content staging
- Analytics display
- Lots of duplicate dialogs and modals

## 📋 Tasks to Complete

### Priority 1: Refactor to UnifiedProjectView ⭐
**Goal**: Replace the 4000-line monolith with our clean component

**Steps**:
1. **Integrate UnifiedProjectView**
   - Replace current ProjectDetailPageContent with UnifiedProjectView
   - Pass proper project and user data
   - Ensure all portals work

2. **Data Fetching**
   - Fix project loading with proper hooks
   - Add real-time updates for processing status
   - Handle errors gracefully

3. **Remove Duplicate Code**
   - Delete old thumbnail generators (v1, v2, etc.)
   - Remove duplicate publishing workflows
   - Clean up unused imports

### Priority 2: Complete Feature Integration 🔧

1. **Thumbnail Generation**
   - ✅ Already in UnifiedProjectView
   - Needs: Persona integration
   - Needs: Save to project

2. **Posts Generation**
   - ✅ Already in UnifiedProjectView
   - Needs: Platform validation
   - Needs: Batch operations

3. **Long-form Editor**
   - ✅ Already in UnifiedProjectView
   - Needs: Auto-save
   - Needs: Export functionality

4. **Stage → Schedule → Publish**
   - ✅ Already in UnifiedProjectView
   - Needs: OAuth connections
   - Needs: Queue management

### Priority 3: Processing & Status 📊

1. **Processing Status**
   ```tsx
   // Show real-time status
   - Transcription progress
   - Clip generation status
   - Thumbnail generation queue
   - Publishing status
   ```

2. **Progress Indicators**
   - Overall project completion
   - Individual task progress
   - Time estimates

### Priority 4: Project Actions 🎯

1. **Core Actions**
   - Delete project
   - Duplicate project
   - Export project data
   - Archive project

2. **Bulk Operations**
   - Select multiple clips
   - Batch publish
   - Bulk delete
   - Mass export

### Priority 5: Navigation & UX 🧭

1. **Navigation Flow**
   - Breadcrumbs
   - Back to projects list
   - Quick jump between features
   - Keyboard shortcuts

2. **Error States**
   - Failed video load
   - Processing errors
   - Network issues
   - Permission denied

### Priority 6: Performance ⚡

1. **Code Splitting**
   - Lazy load heavy components
   - Dynamic imports for features
   - Optimize bundle size

2. **Caching**
   - Cache project data
   - Store generated content
   - Persist user preferences

## Implementation Plan

### Step 1: Backup Current Page
```bash
cp src/app/(dashboard)/projects/[id]/page.tsx \
   src/app/(dashboard)/projects/[id]/page.backup.tsx
```

### Step 2: Create New Clean Page
```tsx
// src/app/(dashboard)/projects/[id]/page.tsx
import { UnifiedProjectView } from '@/components/project/unified-project-view'
import { useProject } from '@/hooks/use-project'
import { useUser } from '@/hooks/use-user'

export default function ProjectPage({ params }) {
  const { project, loading, error } = useProject(params.id)
  const { user } = useUser()
  
  if (loading) return <ProjectSkeleton />
  if (error) return <ProjectError error={error} />
  
  return (
    <UnifiedProjectView 
      project={project}
      user={user}
      onUpdate={handleProjectUpdate}
    />
  )
}
```

### Step 3: Migrate Features
1. Move essential logic to services
2. Extract reusable components
3. Delete duplicate code
4. Test each feature

### Step 4: Testing Checklist
- [ ] Project loads correctly
- [ ] Thumbnail generation works
- [ ] Posts can be created
- [ ] Transcript editing saves
- [ ] Publishing flow completes
- [ ] All modals/portals open
- [ ] Navigation works
- [ ] Errors handled gracefully

## Expected Outcomes

### Before
- 4000 lines of unmaintainable code
- Duplicate components everywhere
- Slow page loads
- Confusing user experience

### After
- Clean ~100 line page component
- UnifiedProjectView handles complexity
- Fast, optimized loading
- Consistent, polished UX
- All features integrated properly

## Risks & Mitigation

1. **Risk**: Breaking existing functionality
   **Mitigation**: Keep backup, test thoroughly

2. **Risk**: Missing features in UnifiedProjectView
   **Mitigation**: Port missing features carefully

3. **Risk**: Data flow issues
   **Mitigation**: Use proper hooks and services

## Success Metrics

- Page size: < 200 lines
- Load time: < 1 second
- Features working: 100%
- Code quality: A+
- User satisfaction: High

## Next Actions

1. **Immediate**: Integrate UnifiedProjectView
2. **Today**: Fix data fetching
3. **Tomorrow**: Test all features
4. **This Week**: Polish and optimize

## Notes

The current project page is the biggest technical debt in the codebase. Refactoring it to use UnifiedProjectView will:
- Improve maintainability
- Enhance performance
- Provide better UX
- Enable faster feature development
- Reduce bugs

This is a critical task that will unlock the full potential of the platform.