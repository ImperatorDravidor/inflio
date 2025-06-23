# AI Image Storage Setup

This guide explains how AI-generated images are stored and how to optimize storage for production.

## Current Implementation

### How It Works Now
Generated images are currently stored directly in the `projects` table within the `folders` JSONB column:

```json
{
  "folders": {
    "clips": [...],
    "blog": [...],
    "social": [...],
    "images": [
      {
        "id": "unique-id",
        "prompt": "A beautiful sunset over mountains",
        "imageData": "base64-encoded-string...",
        "style": "photorealistic",
        "quality": "high",
        "size": "1024x1024",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### No Database Changes Required
Since we're using the existing JSONB `folders` column, **no database migration is needed**. The system works out of the box.

## Production Optimization (Recommended)

For production environments, we recommend using Supabase Storage instead of storing base64 images in the database.

### Benefits of Supabase Storage:
- **Performance**: Faster queries, smaller database
- **Cost**: Storage is cheaper than database space
- **CDN**: Images served via Supabase's CDN
- **Scalability**: No row size limits

### Setting Up Supabase Storage

1. **Create Storage Bucket** (Manual Setup)
   
   Go to your Supabase dashboard → Storage → Create a new bucket:
   - Name: `ai-generated-images`
   - Public bucket: ✅ (for easy access)
   - File size limit: 10MB
   - Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`

2. **Or Use Automatic Setup**
   
   The code includes automatic bucket creation. Just uncomment this line in `/api/generate-images/route.ts`:
   
   ```typescript
   // Uncomment for production:
   // await SupabaseImageStorage.initializeBucket()
   ```

### Storage Structure

Images are organized by project:
```
ai-generated-images/
├── project-id-1/
│   ├── image-id-1.png
│   ├── image-id-2.jpg
│   └── image-id-3.webp
└── project-id-2/
    ├── image-id-4.png
    └── image-id-5.jpg
```

### Switching to Storage Mode

To use Supabase Storage instead of base64:

1. Uncomment the storage code in `/api/generate-images/route.ts`
2. The system will automatically:
   - Upload images to Supabase Storage
   - Store only the public URL in the database
   - Serve images via CDN

## Security Considerations

### RLS Policies (Optional)
If you want to restrict image access:

```sql
-- Allow users to view only their project images
CREATE POLICY "Users can view own project images" ON storage.objects
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM projects 
    WHERE id = SPLIT_PART(name, '/', 1)
  )
);

-- Allow users to upload to their projects
CREATE POLICY "Users can upload to own projects" ON storage.objects
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM projects 
    WHERE id = SPLIT_PART(name, '/', 1)
  )
);
```

## Migration Script

If you have existing base64 images and want to migrate to Storage:

```javascript
// scripts/migrate-images-to-storage.js
const { createClient } = require('@supabase/supabase-js')
const { SupabaseImageStorage } = require('../src/lib/supabase-image-storage')

async function migrateImages() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  // Get all projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .not('folders->images', 'is', null)

  for (const project of projects) {
    if (project.folders.images?.length > 0) {
      const updatedImages = []
      
      for (const image of project.folders.images) {
        if (image.imageData) {
          // Upload to storage
          const publicUrl = await SupabaseImageStorage.uploadImage(
            image.imageData,
            project.id,
            image.id,
            image.format || 'png'
          )
          
          // Update image object
          updatedImages.push({
            ...image,
            url: publicUrl,
            imageData: undefined // Remove base64 data
          })
        } else {
          updatedImages.push(image)
        }
      }
      
      // Update project
      await supabase
        .from('projects')
        .update({
          folders: {
            ...project.folders,
            images: updatedImages
          }
        })
        .eq('id', project.id)
    }
  }
}
```

## Best Practices

1. **Image Optimization**
   - Use appropriate quality settings
   - Choose the right format (WebP for web, PNG for transparency)
   - Compress images when possible

2. **Cleanup**
   - Delete unused images regularly
   - Implement image expiration for temporary content

3. **Monitoring**
   - Track storage usage in Supabase dashboard
   - Set up alerts for quota limits

## Troubleshooting

### Common Issues

1. **"Row too large" error**
   - Switch to Supabase Storage mode
   - Or reduce image quality/size

2. **Storage bucket not found**
   - Create the bucket manually in Supabase dashboard
   - Or run the initialization code

3. **CORS errors**
   - Ensure bucket is set to public
   - Or configure CORS in Supabase dashboard

## Summary

- **Current**: Images stored as base64 in JSONB (works immediately, no setup)
- **Production**: Use Supabase Storage for better performance and scalability
- **Migration**: Optional script to move existing images to Storage 