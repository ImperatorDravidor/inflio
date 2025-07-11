# Technical Debt Tracker

## 🚨 Critical Issues (Fix Immediately)

### 1. Test Endpoints in Production
**Issue**: 20+ test/debug API endpoints exposed in production
**Files**:
- `/api/test-klap-*` (11 endpoints)
- `/api/diagnose-*` (2 endpoints)
- `/api/test-*` (7 endpoints)

**Action**: 
```bash
# Move to separate test folder or add auth check
if (process.env.NODE_ENV === 'production' && !isAdmin) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
```

### 2. Hardcoded Demo Data
**Issue**: Analytics and metrics show fake data
**Files**:
- `src/app/(dashboard)/dashboard/page.tsx` - Static achievement data
- `src/components/social/social-analytics-chart.tsx` - Hardcoded progression
- Landing page stats - "10M+ Videos Processed"

**Action**: Connect to real data or clearly mark as demo

### 3. Database Migrations Chaos
**Issue**: 17 migration files with no clear order
**Location**: `/migrations/`

**Action**: 
1. Consolidate into single `schema.sql`
2. Create `migrations-archive/` for old files
3. Add migration runner script

## ⚠️ High Priority Issues

### 1. Large Component Files
**Issue**: Components over 500 lines
- `dashboard/page.tsx` - 973 lines
- `publishing-workflow.tsx` - 700+ lines
- `studio/upload/page.tsx` - 568 lines

**Action**: Extract into smaller components

### 2. Missing Error Boundaries
**Issue**: No error boundaries in critical paths
**Action**: Add error boundaries to:
- Video upload flow
- Processing page
- Publishing workflow

### 3. TypeScript `any` Usage
**Count**: 47 instances of `any`
**Action**: Replace with proper types

## 📊 Code Quality Metrics

### Current State
- **Test Coverage**: 0%
- **TypeScript Coverage**: ~85%
- **Bundle Size**: Not optimized
- **Lighthouse Score**: Not measured

### Target State
- **Test Coverage**: 70%+
- **TypeScript Coverage**: 100%
- **Bundle Size**: < 200KB initial
- **Lighthouse Score**: 90+

## 🔧 Refactoring Opportunities

### 1. Extract Services
```typescript
// Current: Inline API calls
const response = await fetch('/api/...')

// Better: Service layer
const clips = await ClipService.generate(projectId)
```

### 2. Create Custom Hooks
```typescript
// Extract repeated logic
useProjectData(projectId)
useProcessingStatus(taskId)
useAnalytics(platform)
```

### 3. Implement State Management
```typescript
// Add Zustand for:
- User profile
- Projects list
- Social accounts
- Usage data
```

## 📝 Documentation Debt

### Outdated Docs
1. API endpoints documentation missing
2. Social media setup incomplete
3. Deployment guide needs update
4. No contributing guidelines

### Missing Docs
1. Architecture decisions
2. State management patterns
3. Testing approach
4. Performance guidelines

## 🚀 Performance Issues

### 1. Unoptimized Images
- No lazy loading
- No responsive images
- No WebP format

### 2. Bundle Size
- Importing entire icon libraries
- No code splitting
- Heavy dependencies

### 3. API Calls
- No request deduplication
- Missing cache headers
- No optimistic updates

## 📅 Cleanup Roadmap

### Week 1
- [ ] Remove test endpoints
- [ ] Add auth checks to debug routes
- [ ] Fix landing page stats
- [ ] Consolidate migrations

### Week 2
- [ ] Break down large components
- [ ] Add error boundaries
- [ ] Create service layer
- [ ] Add basic tests

### Week 3
- [ ] Implement state management
- [ ] Fix TypeScript issues
- [ ] Add performance monitoring
- [ ] Update documentation

### Week 4
- [ ] Optimize bundle size
- [ ] Add e2e tests
- [ ] Performance audit
- [ ] Deploy improvements

## 📈 Tracking Progress

### Metrics to Track
1. Bundle size reduction
2. Test coverage increase
3. TypeScript errors fixed
4. Component size average
5. API response times

### Success Criteria
- No test endpoints in prod
- 70% test coverage
- All components < 300 lines
- Zero TypeScript errors
- Real analytics data 