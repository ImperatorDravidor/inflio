# Inflio Cleanup Action Plan

## Phase 1: Immediate Fixes (1-2 days)

### 1. Documentation Consolidation
- [ ] Delete the `/docs` folder completely
- [ ] Keep only `/documentation` folder
- [ ] Create a proper README.md in `/documentation` that indexes all docs

### 2. Remove localStorage Usage
- [ ] Replace all localStorage calls in `project-service.ts` with Supabase
- [ ] Test that projects still save/load correctly
- [ ] Remove localStorage-related constants

### 3. Fix Git Status
```bash
# Stage the documentation moves
git add documentation/
git rm -r docs/

# Commit the cleanup
git commit -m "refactor: consolidate documentation into single folder"
```

## Phase 2: API Consolidation (3-4 days)

### 1. Create New API Structure
```
src/app/api/v2/
├── process/
│   └── route.ts         # Single processing endpoint
├── projects/
│   ├── route.ts         # List/create projects
│   └── [id]/
│       ├── route.ts     # Get/update/delete project
│       └── status/
│           └── route.ts # Get processing status
└── auth/
    └── webhook/
        └── route.ts     # Clerk webhook
```

### 2. Implement Video Processor Service
- [ ] Create `src/lib/services/video-processor.ts`
- [ ] Create individual service files for each workflow
- [ ] Add proper error handling and logging

### 3. Migrate Frontend Calls
- [ ] Create `src/lib/api-client.ts`
- [ ] Update all components to use the new API client
- [ ] Remove direct fetch calls from components

## Phase 3: Database Cleanup (2-3 days)

### 1. Consolidate Migrations
- [ ] Create a single master migration file
- [ ] Document the final schema clearly
- [ ] Remove redundant migration files

### 2. Update Supabase Types
- [ ] Generate TypeScript types from Supabase
- [ ] Replace all `any` types with proper interfaces
- [ ] Add JSDoc comments to all types

### 3. Implement Proper Data Access Layer
```typescript
// src/lib/data/repositories/
├── project.repository.ts
├── user.repository.ts
├── clip.repository.ts
└── content.repository.ts
```

## Phase 4: Component Organization (2-3 days)

### 1. Create Feature-Based Structure
```
src/
├── features/
│   ├── upload/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── editor/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   └── analytics/
│       ├── components/
│       ├── hooks/
│       └── utils/
└── shared/
    ├── components/
    ├── hooks/
    └── utils/
```

### 2. Extract Business Logic
- [ ] Move all business logic out of components
- [ ] Create custom hooks for complex operations
- [ ] Implement proper separation of concerns

## Phase 5: State Management (1-2 days)

### 1. Remove Event-Based Updates
- [ ] Remove `window.dispatchEvent` calls
- [ ] Implement proper state management (React Query or SWR)
- [ ] Add optimistic updates where appropriate

### 2. Add Caching Layer
```typescript
// Example with React Query
const { data: project, isLoading } = useQuery({
  queryKey: ['project', projectId],
  queryFn: () => apiClient.getProject(projectId),
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

## Phase 6: Testing & Quality (2-3 days)

### 1. Add Basic Tests
- [ ] Unit tests for services
- [ ] Integration tests for API routes
- [ ] Component tests for critical flows

### 2. Add Type Safety
- [ ] Enable strict TypeScript mode
- [ ] Fix all type errors
- [ ] Add runtime validation with Zod

### 3. Add Error Boundaries
- [ ] Create global error boundary
- [ ] Add error boundaries to major sections
- [ ] Implement proper error logging

## Phase 7: Performance Optimization (1-2 days)

### 1. Optimize Bundle Size
- [ ] Analyze bundle with `next-bundle-analyzer`
- [ ] Lazy load heavy components
- [ ] Optimize images and assets

### 2. Add Loading States
- [ ] Implement skeleton screens
- [ ] Add progress indicators for long operations
- [ ] Optimize perceived performance

## Quick Wins Checklist

These can be done immediately:

- [ ] Add `.env.example` file with all required variables
- [ ] Update `README.md` with proper setup instructions
- [ ] Fix ESLint configuration and run linter
- [ ] Add `prettier` for consistent formatting
- [ ] Remove unused dependencies from `package.json`
- [ ] Add error tracking (Sentry or similar)
- [ ] Set up proper logging

## Monitoring Progress

Track cleanup progress with this metric:

```typescript
// Add to a monitoring dashboard
const codeHealthMetrics = {
  duplicateCode: 0,     // Target: 0
  anyTypes: 0,          // Target: 0
  todoComments: 0,      // Target: 0
  eslintErrors: 0,      // Target: 0
  testCoverage: 0,      // Target: >80%
}
```

## Success Criteria

The cleanup is complete when:

1. ✅ Single source of truth for all data (Supabase only)
2. ✅ One API endpoint per resource action
3. ✅ Clear separation of concerns
4. ✅ No `any` types in the codebase
5. ✅ All components have loading and error states
6. ✅ Documentation is up-to-date and helpful
7. ✅ New developers can onboard in < 1 hour

## Maintenance Going Forward

1. **Code Reviews**: Require reviews for all PRs
2. **Documentation**: Update docs with every feature
3. **Testing**: Don't merge without tests
4. **Refactoring**: Regular cleanup sprints
5. **Monitoring**: Track code quality metrics

Remember: Clean code is not just about making it work, it's about making it obvious how it works! 