# Transcript Segmentation Fix

## Problem
The transcript was displaying "2636 segments • 2636 words", indicating that each word was being treated as a separate segment. This made the transcript unsuitable for video subtitles, as viewers would see one word at a time instead of readable phrases.

## Root Cause
In `src/lib/transcription-processor.ts`, the AssemblyAI word-level data was being directly mapped to segments:
```typescript
// OLD CODE - Each word became a segment
segments: transcript.words?.map((word, index) => ({
  id: `seg-${index}`,
  start: word.start / 1000,
  end: word.end / 1000,
  text: word.text,
  confidence: word.confidence
}))
```

## Solution
Added a `groupWordsIntoSegments` function that intelligently groups words into proper subtitle segments based on:
- **Word count**: Target around 10 words per segment
- **Duration**: Maximum 5 seconds per segment
- **Natural breaks**: Split at punctuation marks (. ! ? : ;) after at least 5 words
- **Readability**: Ensures segments are neither too short nor too long

## Implementation Details

### Segmentation Algorithm
```typescript
const maxWordsPerSegment = 10  // Target segment length
const maxDuration = 5          // Maximum 5 seconds per segment
const punctuationMarks = ['.', '!', '?', ':', ';']

// Split when:
// 1. Segment has 10+ words
// 2. Segment duration exceeds 5 seconds
// 3. Natural break point (punctuation) after 5+ words
```

### Benefits
1. **Better Readability**: Viewers see complete phrases instead of single words
2. **Natural Timing**: Segments align with speech patterns
3. **Professional Subtitles**: Similar to YouTube/Netflix subtitle standards
4. **Improved UX**: Easier to edit and review transcripts

### Example Output
**Before**: 
- Segment 1: "Welcome"
- Segment 2: "to"
- Segment 3: "this"
- Segment 4: "video"

**After**:
- Segment 1: "Welcome to this video. Today we're going to explore"
- Segment 2: "some amazing content that will help you understand"

## Impact on Features
- ✅ **Video Chapters**: Better chapter detection with proper sentence boundaries
- ✅ **Quote Cards**: More meaningful quote extraction
- ✅ **Thread Generator**: Natural content breaks for social media
- ✅ **Subtitle Export**: Professional subtitle files ready for video platforms

## Notes
- Existing transcripts will need to be re-processed to benefit from this fix
- The grouping algorithm can be adjusted if different segment lengths are preferred
- Mock transcriptions already use proper segments, so they're unaffected 