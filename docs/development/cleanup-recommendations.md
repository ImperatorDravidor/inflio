# Codebase Cleanup Recommendations

## 🗑️ Unused Dependencies to Remove

### 1. **Definitely Unused**
```json
"@auth/prisma-adapter": "^2.10.0",        // Not using Prisma auth
"@google/generative-ai": "^0.24.1",        // Using OpenAI instead
"motion": "^12.18.1",                      // Duplicate of framer-motion
"dotted-map": "^2.2.3",                    // Only type declaration, no usage
"react-countup": "^6.5.3",                 // Not used anywhere
"@types/canvas-confetti": "^1.9.0",        // Dev dependency not used
```

### 2. **Backup/Alternative Services (Keep for now)**
```json
"assemblyai": "^4.13.2",                   // Backup transcription service
"cloudinary": "^2.7.0",                    // Backup for subtitle burning
"next-cloudinary": "^6.16.0",              // Related to cloudinary
```

### 3. **Required Dependencies**
```json
"svix": "^1.67.0",                         // Used by Clerk webhooks
"@ffmpeg/ffmpeg": "^0.11.6",               // Mentioned but not implemented
```

## 🔧 Code to Remove/Refactor

### 1. **Podcast Feature (Not Implemented)**
- Remove `podcast` from `WorkflowOptions` interface
- Remove `PodcastData` interface
- Remove podcast references from:
  - `src/lib/project-types.ts`
  - `src/lib/project-service.ts`
  - `src/lib/supabase-db.ts`
  - `src/components/workflow-selection.tsx`
  - Database schema

### 2. **Unused Cloud Services**
- Clean up `cloud-video-service.ts` to remove Cloudinary code if not using subtitle burning
- Remove AssemblyAI code from `process-transcription/route.ts` if only using OpenAI

### 3. **FFmpeg References**
- Remove FFmpeg comments and placeholder code from `audio-extraction.ts`

### 4. **Type Declarations**
- Remove `src/types/dotted-map.d.ts`

## 📦 Package.json Cleanup Script

```bash
# Remove unused packages
npm uninstall @auth/prisma-adapter @google/generative-ai motion dotted-map react-countup @types/canvas-confetti

# Optional: Remove backup services if confirmed not needed
# npm uninstall assemblyai cloudinary next-cloudinary
```

## 🧹 CSS Cleanup

### 1. **Check tw-animate-css usage**
If not using any of its animation classes, remove:
- Import from `globals.css`
- Package from dependencies

## 🗂️ Database Schema Cleanup

Update the default folders JSON to remove podcast:
```sql
ALTER TABLE projects 
ALTER COLUMN folders 
SET DEFAULT '{"clips": [], "blog": [], "social": []}'::jsonb;
```

## ✅ Benefits of Cleanup

1. **Reduced Bundle Size**: ~500KB+ reduction
2. **Cleaner Codebase**: No confusing unused features
3. **Faster Builds**: Fewer dependencies to process
4. **Easier Maintenance**: Less code to maintain

## ⚠️ Before Cleanup

1. **Backup First**: Create a git branch for cleanup
2. **Test Thoroughly**: Ensure nothing breaks after removal
3. **Check Environment**: Some features might be environment-specific

## 🔍 Verification Steps

After cleanup:
1. Run `npm run build` - should succeed
2. Run `npm run dev` - test all features
3. Check bundle size reduction
4. Verify all workflows still function

## 💡 Future Considerations

1. **Podcast Feature**: If planning to implement, keep the structure
2. **Video Processing**: If subtitle burning is important, keep Cloudinary
3. **Transcription Backup**: Keep AssemblyAI if OpenAI reliability is a concern 