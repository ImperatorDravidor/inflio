# ESLint Error Fixes Guide

This guide helps fix the common ESLint errors found in the Inflio codebase.

## Summary of Issues

After running `npm run lint`, we found several categories of errors:

### 1. **Unused Imports and Variables** (Most Common)
- **Rule**: `@typescript-eslint/no-unused-vars`
- **Fix**: Remove the unused import or variable
- **Example files**: Most component and page files

### 2. **Unescaped Entities in JSX**
- **Rule**: `react/no-unescaped-entities`
- **Fix**: Replace apostrophes and quotes with HTML entities
  - `'` → `&apos;`
  - `"` → `&quot;`
- **Example**: `Let's` → `Let&apos;s`

### 3. **TypeScript `any` Types**
- **Rule**: `@typescript-eslint/no-explicit-any`
- **Fix**: Replace with more specific types:
  - `any` → `unknown` (for truly unknown types)
  - `any[]` → `unknown[]` or specific type arrays
  - For event handlers: Remove the type annotation and let TypeScript infer

### 4. **React Hook Dependencies**
- **Rule**: `react-hooks/exhaustive-deps`
- **Fix**: Add missing dependencies or use `useCallback` for functions
- **Common in**: `useEffect` hooks

### 5. **Unused Error Variables in Catch Blocks**
- **Fix**: Change `catch (error)` to `catch` when error is not used

### 6. **Next.js Image Optimization**
- **Rule**: `@next/next/no-img-element`
- **Fix**: Use Next.js `Image` component instead of `<img>`

## Quick Fixes Applied

### Files Fixed:
1. ✅ `src/app/(dashboard)/dashboard/page.tsx` - Removed unused imports
2. ✅ `src/app/(dashboard)/projects/[id]/page.tsx` - Removed unused imports and variables
3. ✅ `src/app/onboarding/page.tsx` - Fixed unescaped entities and unused imports
4. ✅ `src/components/clips-view.tsx` - Removed many unused imports, fixed type annotations

## Recommended Approach for Remaining Files

### Phase 1: Auto-fixable Issues
Run ESLint with the `--fix` flag:
```bash
npx eslint . --fix
```

### Phase 2: Manual Fixes by Priority

1. **High Priority** (Errors in main pages and components):
   - `/app/(dashboard)/social/*` pages
   - `/app/(dashboard)/studio/*` pages
   - `/components/dashboard-*.tsx` files
   - API routes in `/app/api/*`

2. **Medium Priority** (Supporting components):
   - `/components/social/*`
   - `/components/ui/*` (except generated files)
   - `/lib/*` service files

3. **Low Priority** (Type definitions and utilities):
   - Type annotation improvements
   - Hook dependency warnings

### Phase 3: Common Patterns to Fix

#### Pattern 1: Unused Icon Imports
Many files import icons that aren't used. Search for:
```typescript
import { Icon... } from "@tabler/icons-react"
```
And remove unused ones.

#### Pattern 2: Unused UI Component Imports
```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
```
Often only `Card` and `CardContent` are used.

#### Pattern 3: Catch Block Errors
Replace:
```typescript
} catch (error) {
  console.error('Error message')
}
```
With:
```typescript
} catch {
  console.error('Error message')
}
```

#### Pattern 4: Event Handler Types
Replace:
```typescript
onChange={(value: any) => setValue(value)}
```
With:
```typescript
onChange={(value) => setValue(value)}
```

## Next Steps

1. Run `npm run lint` to see current error count
2. Focus on fixing errors (not warnings) first
3. Fix files that are frequently used/imported
4. Consider adding ESLint disable comments for intentional patterns
5. Update ESLint config if certain rules are too strict

## Tools to Help

- VS Code ESLint extension for real-time feedback
- `eslint --fix` for auto-fixable issues
- Search and replace for common patterns
- Git diff to review changes before committing 