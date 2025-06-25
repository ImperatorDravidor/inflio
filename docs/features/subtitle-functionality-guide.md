# Subtitle Functionality Guide

## Overview

The subtitle functionality in Inflio allows users to add professional, customizable subtitles to their videos for long-form content publishing. The system supports both VTT overlay subtitles (instant) and cloud-based burned-in subtitles (processed).

## Features

### 1. **Instant VTT Subtitles**
- Subtitles are generated immediately as WebVTT format
- Applied to the video player without processing delay
- Users can toggle subtitles on/off using video controls
- Works offline and doesn't require cloud services

### 2. **Advanced Customization Options**

#### Basic Settings
- **Font Family**: Arial, Helvetica, Roboto, Open Sans, Montserrat, Inter, Poppins
- **Position**: Top, Center, or Bottom of video
- **Text Alignment**: Left, Center, or Right
- **Animation**: None, Fade In/Out, or Slide Up
- **Font Size**: 12px to 48px (adjustable)
- **Line Height**: 1.0 to 3.0 (adjustable)
- **Max Width**: 50% to 100% of video width

#### Colors & Background
- **Text Color**: Fully customizable with color picker
- **Background Color**: Customizable with opacity control
- **Background Opacity**: 0% to 100%
- **Padding**: 0px to 20px around text

#### Text Effects
- **Drop Shadow**: Toggle on/off with customizable color and blur
- **Text Stroke**: 0px to 5px width with custom color
- **Animation Duration**: 100ms to 1000ms for fade/slide effects

### 3. **Live Preview**
- Real-time preview of subtitle appearance
- Shows exactly how subtitles will look on the video
- Toggle preview on/off to save screen space

### 4. **Video Player Integration**
- Subtitles are properly styled using CSS
- Support for fullscreen mode with larger subtitle size
- Video controls don't overlap with subtitles
- Proper metadata loading prevents duration display issues

### 5. **Export Options**
- Download transcript as TXT file
- Export as SRT subtitle file
- Export as styled WebVTT file (includes all customization)
- Copy full transcript to clipboard

## Technical Implementation

### Frontend Components

1. **EnhancedTranscriptEditor** (`src/components/enhanced-transcript-editor.tsx`)
   - Main component for transcript editing and subtitle customization
   - Handles VTT generation with custom styling
   - Manages subtitle application process
   - Provides UI for all customization options

2. **Video Player Updates** (`src/app/(dashboard)/projects/[id]/page.tsx`)
   - Added `onLoadedMetadata` handler to prevent duration issues
   - Implemented subtitle track management
   - Added crossOrigin attribute for subtitle support

3. **CSS Styling** (`src/app/globals.css`)
   - Custom ::cue styles for subtitle appearance
   - Webkit and Firefox specific adjustments
   - Animation keyframes for fade and slide effects
   - Custom scrollbar for subtitle settings panel

### Subtitle Processing Flow

1. **Immediate Application**:
   ```
   User clicks "Apply Subtitles" → Generate VTT → Create Blob URL → Apply to Video Player
   ```

2. **Background Processing** (if cloud service available):
   ```
   Send to Cloud API → Poll for Status → Update with Burned-in Video URL
   ```

### Key Features of VTT Generation

```typescript
// VTT with custom styling
WEBVTT

STYLE
::cue {
  font-family: Arial, sans-serif;
  font-size: 24px;
  color: #FFFFFF;
  background-color: #000000CC;
  text-align: center;
  line-height: 1.5;
  padding: 8px;
  text-shadow: #000000 0px 0px 0px;
  box-shadow: #000000 0px 2px 4px;
}

1
00:00:00.000 --> 00:00:05.000 position:90% line:90% align:center size:90%
This is the first subtitle
```

## User Experience

### Applying Subtitles

1. Navigate to the **Subtitles** tab in the transcript editor
2. Customize subtitle appearance using the various settings
3. Preview changes in real-time
4. Click **Apply Subtitles** button
5. See immediate results with progress indicators
6. "Long-form Ready" badge appears when complete

### Status Messages

- **Processing**: Shows progress percentage and current stage
- **Success**: "✅ Subtitles applied! Your content is ready for publishing."
- **With Cloud**: "🎬 Enhanced video with burned-in subtitles is ready!"
- **Error Handling**: Clear error messages if something goes wrong

## Benefits

1. **Instant Gratification**: No waiting for server processing
2. **Highly Customizable**: Match brand guidelines or personal preferences
3. **Accessibility**: Makes content accessible to deaf/hard-of-hearing viewers
4. **Engagement**: Subtitles increase viewer retention and engagement
5. **Platform Ready**: Optimized for social media and long-form platforms

## Future Enhancements

- Multi-language subtitle support
- Auto-translation capabilities
- Animated subtitle styles
- Subtitle templates/presets
- Batch subtitle application for multiple videos
- Advanced timing adjustments per segment

## Troubleshooting

### Common Issues

1. **Subtitles not showing**: 
   - Ensure video has `crossOrigin="anonymous"` attribute
   - Check if subtitle track is set to "showing" mode
   - Verify VTT file format is correct

2. **Video duration showing incorrectly**:
   - Fixed by waiting for metadata to load before displaying
   - Uses `onLoadedMetadata` event handler

3. **Styling not applied**:
   - Some browsers have limited VTT styling support
   - Fallback to basic subtitle display

### Browser Compatibility

- **Chrome/Edge**: Full support for all features
- **Firefox**: Full support with minor styling differences
- **Safari**: Basic support, some advanced styles may not work
- **Mobile**: Touch-friendly interface, subtitles scale appropriately

## How Subtitles Work

### 1. **Subtitle Generation Flow**
```
Transcript Segments → VTT File Generation → Storage Upload → Video Player Integration
```

### 2. **Storage Architecture**
- **Storage Bucket**: `videos` (Supabase Storage)
- **File Path**: `subtitles/{taskId}.vtt`
- **File Format**: WebVTT (.vtt) for web video players
- **Accessibility**: Public read access for video players

### 3. **Video Providers**
The system supports multiple video processing providers:
- **Cloudinary**: Advanced video processing (in development)
- **Mux**: Professional video infrastructure (planned)
- **Shotstack**: Video generation API (planned)  
- **Fallback**: VTT file generation and storage (current default)

## Testing the Subtitle Feature

### Step 1: Prerequisites
Ensure you have:
- ✅ A project with completed transcription
- ✅ Proper Supabase storage setup
- ✅ `videos` bucket with subtitle policies

### Step 2: Apply Subtitles
1. Go to your project page
2. Open the transcript editor (right panel)
3. Click the **"Subtitles"** tab
4. Configure subtitle settings (font, color, position)
5. Click **"Apply Subtitles"**

### Step 3: Monitor the Process
Watch the browser console for logs:
```javascript
// Expected console output:
"Applying subtitles: { projectId, videoUrl, segmentCount, settings }"
"Subtitle API response status: 200"
"Subtitle API result: { taskId, status, vttUrl }"
"VTT file uploaded successfully: https://..."
```

### Step 4: Verify Results
- ✅ Success toast: "🎉 Subtitles applied! Your long-form content is ready."
- ✅ Green badge: "Long-form Ready" 
- ✅ Video player shows subtitle track
- ✅ VTT file accessible at public URL

## Testing API Endpoint

You can test subtitle generation directly:

```bash
# Test subtitle generation
curl -X POST http://localhost:3000/api/test-subtitles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "Subtitle test completed",
  "result": {
    "taskId": "uuid-here",
    "status": "completed", 
    "vttUrl": "https://your-project.supabase.co/storage/v1/object/public/videos/subtitles/uuid.vtt",
    "provider": "fallback"
  }
}
```

## Troubleshooting Common Issues

### 1. **"Storage bucket not found" Error**

**Symptoms:**
- Error: `Error: Failed to apply subtitles`
- Console: `Supabase upload error: Bucket not found`

**Solution:**
```sql
-- Check if videos bucket exists
SELECT * FROM storage.buckets WHERE id = 'videos';

-- If missing, create it
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true);
```

### 2. **"Permission denied" on Upload**

**Symptoms:**
- Error: `Failed to apply subtitles`
- Console: `Supabase upload error: new row violates row-level security policy`

**Solution:**
Run the subtitle storage migration:
```sql
-- migrations/supabase-subtitle-storage.sql
-- This adds policies for subtitle files
```

### 3. **Subtitles Don't Show in Video Player**

**Symptoms:**
- Success message appears
- VTT file exists and is accessible
- But subtitles don't appear in video

**Debug Steps:**
1. Check browser console for video track errors
2. Verify VTT file format:
```
WEBVTT

00:00:00.000 --> 00:00:03.500
Welcome to this amazing video tutorial.

00:00:03.500 --> 00:00:07.200
Today we'll learn about subtitle generation.
```

3. Check video element HTML:
```