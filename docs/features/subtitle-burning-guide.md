# Subtitle Burning Guide

## Overview

Inflio now supports two methods for adding subtitles to your videos:

1. **VTT Overlay Subtitles** (Instant) - Subtitles that viewers can toggle on/off
2. **Burned-in Subtitles** (Processed) - Permanent subtitles embedded in the video file

## Subtitle Display Improvements

### Modern YouTube-Style Appearance
- **Font**: Uses YouTube Sans or Roboto for consistency
- **Background**: Semi-transparent with blur effect for better readability
- **Border**: Subtle border with rounded corners
- **Shadow**: Multiple text shadows for enhanced visibility
- **Animation**: Smooth fade-in or slide-up effects

### Enhanced Readability Features
- Automatic contrast adjustment
- Mobile-responsive sizing
- High contrast mode support
- Fullscreen optimization

## Subtitle Burning (FFmpeg)

### What is Subtitle Burning?
Subtitle burning permanently embeds subtitles into the video file. This is ideal for:
- YouTube uploads (ensures all viewers see subtitles)
- Social media platforms without subtitle support
- Professional presentations
- Archival purposes

### Requirements
- FFmpeg installed on the server
- Sufficient server resources for video processing
- Additional processing time (varies by video length)

### How to Use

1. **Navigate to Subtitles Tab**
   - Edit your transcript as needed
   - Adjust subtitle timing if necessary

2. **Configure Subtitle Appearance**
   - Choose font family, size, and color
   - Set background opacity
   - Select position (top/center/bottom)
   - Add effects (shadow, stroke)

3. **Enable Subtitle Burning**
   - Toggle "Burn subtitles into video" option
   - This option only appears if FFmpeg is available

4. **Apply Subtitles**
   - Click "Burn Subtitles into Video"
   - Monitor progress in real-time
   - Wait for processing to complete

### Processing Time Estimates
- 5-minute video: ~1 minute
- 30-minute video: ~6 minutes
- 60-minute video: ~12 minutes

## VTT Overlay Subtitles

### Benefits
- Instant application (no processing required)
- Viewers can toggle on/off
- Multiple language support possible
- Smaller file size

### Best For
- Quick previews
- Accessibility compliance
- Multi-language content
- Platforms with native subtitle support

## Subtitle Customization Options

### Typography
- **Font Family**: Arial, Helvetica, Roboto, Open Sans, Montserrat, Inter, Poppins
- **Font Size**: 12-48px
- **Font Weight**: 600 (semi-bold) for better visibility
- **Line Height**: 1.0-3.0

### Positioning
- **Vertical**: Top (10%), Center (50%), Bottom (90%)
- **Horizontal**: Left, Center, Right alignment
- **Max Width**: 50-100% of video width

### Colors & Effects
- **Text Color**: Any color with color picker
- **Background**: Color + opacity (0-100%)
- **Text Stroke**: 0-5px width with custom color
- **Drop Shadow**: Toggle with blur control

### Animation
- **None**: Instant appearance
- **Fade**: Smooth opacity transition
- **Slide Up**: Slides from below with fade

## Platform-Specific Recommendations

### YouTube
- **Burn subtitles** for guaranteed visibility
- Use **bottom position** with 90% max width
- **White text** on semi-transparent black background
- **24-28px font size** for desktop viewing

### Instagram/TikTok
- **Burn subtitles** (required)
- Use **center position** for Reels/Stories
- **Larger font** (32-36px) for mobile
- **High contrast** colors

### LinkedIn/Twitter
- **VTT overlay** for native players
- **Bottom position** standard
- **Conservative styling** for professional look

## Troubleshooting

### FFmpeg Not Available
- Contact your administrator to install FFmpeg
- Use VTT overlay subtitles as alternative
- Consider cloud subtitle services

### Processing Failed
- Check video format compatibility
- Ensure sufficient server resources
- Try reducing video resolution
- Use shorter segments for testing

### Subtitles Not Visible
- Verify subtitle track is enabled in player
- Check browser compatibility
- Clear browser cache
- Try different subtitle settings

## Best Practices

1. **Always Preview** before burning
2. **Test on Target Platform** before publishing
3. **Keep Text Concise** for readability
4. **Use High Contrast** colors
5. **Leave Margins** for player controls
6. **Consider Mobile Viewers** with larger fonts

## Technical Details

### Supported Video Formats
- MP4 (recommended)
- MOV
- AVI
- WebM

### Output Specifications
- Codec: H.264/H.265
- Container: MP4
- Quality: Maintains source quality
- Audio: Preserved from original

### File Size Considerations
- Burned subtitles add minimal size (~1-2%)
- Processing creates temporary files
- Original video is preserved
- New file replaces original URL 