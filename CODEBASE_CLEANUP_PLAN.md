# Inflio Codebase Cleanup & Organization Plan

**Date**: December 2, 2024
**Backup Branch**: `backup-before-cleanup-20251202-220606`
**Status**: In Progress

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Root Directory Analysis](#root-directory-analysis)
3. [Source Code Structure](#source-code-structure)
4. [Cleanup Strategy](#cleanup-strategy)
5. [Execution Plan](#execution-plan)
6. [Safety Checklist](#safety-checklist)

---

## Overview

### Current State
- **42 config/doc files** in root directory
- **29 markdown documentation files** (many are implementation notes)
- **648KB** of onboarding code (75% unused)
- Multiple duplicate/alternative implementations
- Unclear file organization

### Goals
1. Remove all unused/dead code
2. Organize documentation into proper structure
3. Clean up root directory
4. Document what remains and why
5. Make codebase maintainable and understandable

---

## Root Directory Analysis

### Configuration Files (Keep - Active)
```
✅ package.json                  - Dependencies
✅ package-lock.json             - Lock file
✅ next.config.ts                - Next.js config
✅ tsconfig.json                 - TypeScript config
✅ tailwind.config.ts            - Tailwind config
✅ postcss.config.mjs            - PostCSS config
✅ eslint.config.mjs             - ESLint config
✅ .eslintignore                 - ESLint ignore
✅ components.json               - shadcn/ui config
✅ next-env.d.ts                 - Next.js types
✅ .gitignore                    - Git ignore
✅ .env.example                  - Env template
✅ .env.local                    - Local env (gitignored)
```

### Monitoring/Error Tracking (Keep - Active)
```
✅ sentry.edge.config.ts         - Sentry edge config
✅ sentry.server.config.ts       - Sentry server config
```

### Documentation Files (Needs Organization)

#### Essential Docs (Keep in Root)
```
✅ README.md                     - Main project docs
✅ CLAUDE.md                     - AI assistant instructions
✅ START_HERE.md                 - Quick start guide
```

#### Implementation/Spec Docs (Move to /docs/specs/)
```
📁 PRODUCT_REQUIREMENTS_DOCUMENT.md    → docs/specs/PRD.md
📁 ONBOARDING_SPEC.md                  → docs/specs/onboarding-spec.md
📁 PERSONA_IMPLEMENTATION_SPEC.md      → docs/specs/persona-implementation.md
📁 PRODUCT_EXPERIENCE_DEMO.md          → docs/specs/product-experience.md
```

#### Setup/Integration Guides (Move to /docs/setup/)
```
📁 FINAL_SETUP_GUIDE.md                → docs/setup/final-setup-guide.md
📁 SETUP_SUBMAGIC.md                   → docs/setup/submagic-setup.md
📁 GOOGLE_DRIVE_SETUP.md               → docs/setup/google-drive-setup.md
📁 YOUTUBE_MAGIC_CLIPS_SETUP.md        → docs/setup/youtube-clips-setup.md
📁 VIZARD_API_DOCS.md                  → docs/setup/vizard-api.md
📁 QUICKSTART.md                       → docs/setup/quickstart.md
```

#### Feature Documentation (Move to /docs/features/)
```
📁 HOW_CLIPS_WORK_NOW.md               → docs/features/clips-workflow.md
📁 README_CLIPS.md                     → docs/features/clips-readme.md
```

#### Historical/Fix Docs (Move to /docs/history/)
```
📁 CHANGES_SUMMARY.md                  → docs/history/changes-summary.md
📁 IMPLEMENTATION_COMPLETE.md          → docs/history/implementation-complete.md
📁 DEPLOYMENT_READY.md                 → docs/history/deployment-ready.md
📁 PRODUCTION_READY_SUMMARY.md         → docs/history/production-ready.md
📁 SUBMAGIC_MIGRATION.md               → docs/history/submagic-migration.md
📁 SIMPLIFICATION_SUMMARY.md           → docs/history/simplification.md
📁 ONBOARDING_PERSISTENCE_FIX.md       → docs/history/onboarding-persistence-fix.md
📁 DASHBOARD_FLOW_FIXES.md             → docs/history/dashboard-flow-fixes.md
📁 HERO_ANIMATION_FIX.md               → docs/history/hero-animation-fix.md
📁 THUMBNAIL_FIX_SUMMARY.md            → docs/history/thumbnail-fix.md
📁 VIDEO_UPLOAD_FIX.md                 → docs/history/video-upload-fix.md
📁 AI_ONBOARDING_IMPLEMENTATION.md     → docs/history/ai-onboarding-impl.md
📁 INFLIOAI_REFINED_IMPLEMENTATION.md  → docs/history/inflioai-refined.md
📁 REFINED_ONBOARDING_SYNC.md          → docs/history/refined-onboarding-sync.md
```

### Root Directories

```
✅ src/                          - Source code (keep)
✅ public/                       - Static assets (keep)
✅ migrations/                   - DB migrations (keep)
✅ scripts/                      - Utility scripts (keep - analyze)
✅ docs/                         - Documentation (keep - reorganize)
✅ .claude/                      - Claude instructions (keep)
✅ .git/                         - Git repo (keep)
✅ .next/                        - Build output (gitignored)
✅ node_modules/                 - Dependencies (gitignored)
❓ supabase/                     - Supabase config (check if used)
❓ triage/                       - Temp directory? (check contents)
```

---

## Source Code Structure

### App Directory (`src/app/`)
```
✅ (dashboard)/                  - Protected routes
✅ api/                          - API endpoints
✅ onboarding/                   - Onboarding flow
✅ sign-in/                      - Auth pages
✅ sign-up/                      - Auth pages
✅ privacy/                      - Privacy policy
✅ terms/                        - Terms of service
❓ dashboard/                    - Duplicate of (dashboard)? Check
❓ docs/                         - What's this for?
❓ editor/                       - Used?
❓ test-video/                   - Dev only? Remove for production
```

### Components (`src/components/`)
```
✅ ui/                           - shadcn/ui components
✅ navigation/                   - Nav components
✅ profile/                      - Profile components
✅ project/                      - Project components
✅ social/                       - Social media components
✅ staging/                      - Content staging components
✅ thumbnail/                    - Thumbnail components
✅ providers/                    - React context providers
✅ posts/                        - Post components
⚠️ onboarding/                   - 75% dead code (cleanup needed)
⚠️ archived/                     - Already archived (review & delete)
```

### Services (`src/lib/services/`)
```
TO BE ANALYZED
```

### API Routes (`src/app/api/`)
```
TO BE ANALYZED
```

---

## Cleanup Strategy

### Phase 1: Documentation Reorganization (Safe)
1. Create proper docs structure
2. Move files to appropriate locations
3. Update any references
4. Remove from root

### Phase 2: Dead Code Removal (Careful)
1. Analyze import graph
2. Identify unused files
3. Remove onboarding dead code
4. Remove archived components
5. Clean up test/dev routes

### Phase 3: Code Organization (Moderate)
1. Consolidate duplicate functionality
2. Remove unused API routes
3. Clean up services
4. Update imports

### Phase 4: Final Cleanup (Safe)
1. Remove temporary directories
2. Update documentation
3. Create maintenance guide

---

## Execution Plan

### Session 1: Documentation & Root Cleanup ⏳
- [ ] Create new docs structure
- [ ] Move markdown files
- [ ] Clean up root directory
- [ ] Update README

### Session 2: Onboarding Cleanup
- [ ] Remove 18+ unused onboarding files
- [ ] Clean up API routes
- [ ] Update imports
- [ ] Test onboarding flow

### Session 3: Component Analysis
- [ ] Map all component imports
- [ ] Identify unused components
- [ ] Remove archived components
- [ ] Update component index

### Session 4: API & Services Cleanup
- [ ] Analyze API route usage
- [ ] Remove unused endpoints
- [ ] Consolidate services
- [ ] Update service exports

### Session 5: Testing & Documentation
- [ ] Test critical paths
- [ ] Update documentation
- [ ] Create maintenance guide
- [ ] Final commit

---

## Safety Checklist

### Before Each Deletion
- [ ] Grep for imports: `grep -r "filename" src/`
- [ ] Check direct usage: `grep -r "ComponentName" src/`
- [ ] Verify no dynamic imports
- [ ] Check API route calls: `grep -r "/api/route-name" src/`

### After Each Phase
- [ ] Run `npm run build`
- [ ] Test in browser
- [ ] Check for console errors
- [ ] Commit changes

### Rollback Plan
- Backup branch: `backup-before-cleanup-20251202-220606`
- Restore: `git checkout backup-before-cleanup-20251202-220606`

---

## Progress Tracking

**Status**: 🟡 In Progress

- [x] Git backup created
- [x] Initial analysis complete
- [ ] Documentation reorganized
- [ ] Dead code removed
- [ ] Code organized
- [ ] Final cleanup
- [ ] Documentation updated

---

## Notes

- This is a multi-day project - take it slow
- Test after each major change
- Document decisions
- Keep commits atomic
- Don't rush - safety first

