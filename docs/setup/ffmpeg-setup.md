# FFmpeg Setup for Subtitle Processing

## Overview

The Enhanced Transcript Editor requires FFmpeg to burn subtitles directly into videos. This guide explains how to set up FFmpeg on different platforms.

## Installation Methods

### Option 1: Docker (Recommended)

If you're using Docker, FFmpeg can be included in your container:

```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Rest of your Dockerfile...
```

### Option 2: Local Installation

#### macOS
```bash
# Using Homebrew
brew install ffmpeg
```

#### Windows
1. Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your PATH environment variable

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Linux (CentOS/RHEL)
```bash
sudo yum install epel-release
sudo yum install ffmpeg
```

### Option 3: Cloud Deployment

For production deployments, consider:

1. **Vercel**: Use a custom runtime with FFmpeg
2. **AWS Lambda**: Use Lambda Layers with FFmpeg
3. **Google Cloud Run**: Include FFmpeg in your container
4. **Dedicated Media Server**: Process videos on a separate server

## Configuration

Set environment variables in your `.env.local`:

```env
# FFmpeg Configuration
FFMPEG_PATH=/usr/bin/ffmpeg          # Path to FFmpeg binary
FFPROBE_PATH=/usr/bin/ffprobe        # Path to FFprobe binary
VIDEO_TEMP_DIR=/tmp/video-processing  # Temporary directory for processing
```

## Verifying Installation

Check if FFmpeg is properly installed:

```bash
ffmpeg -version
```

You should see output like:
```
ffmpeg version 4.4.0 Copyright (c) 2000-2021 the FFmpeg developers
```

## Fallback Mode

If FFmpeg is not available, the application automatically falls back to demo mode:
- Simulated progress tracking
- Demo video URL returned
- No actual video processing

## Performance Considerations

### Processing Time
- **1-minute video**: ~30-60 seconds
- **5-minute video**: ~2-5 minutes
- **10-minute video**: ~5-10 minutes

### Resource Requirements
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum
- **Storage**: 3x video size for temporary files

### Optimization Tips

1. **Use Hardware Acceleration** (if available):
   ```bash
   # NVIDIA GPU
   FFMPEG_HARDWARE_ACCEL=cuda
   
   # Intel Quick Sync
   FFMPEG_HARDWARE_ACCEL=qsv
   ```

2. **Adjust Quality Settings**:
   ```bash
   # Lower quality for faster processing
   FFMPEG_PRESET=ultrafast
   
   # Higher quality (slower)
   FFMPEG_PRESET=slow
   ```

3. **Concurrent Processing**:
   Limit concurrent video processing to prevent resource exhaustion:
   ```env
   MAX_CONCURRENT_VIDEOS=2
   ```

## Troubleshooting

### Common Issues

1. **"FFmpeg not found"**
   - Verify FFmpeg is in PATH
   - Check FFMPEG_PATH environment variable
   - Restart application after installation

2. **"Permission denied"**
   - Ensure write permissions for VIDEO_TEMP_DIR
   - Check file permissions on video files

3. **"Out of memory"**
   - Increase available RAM
   - Process smaller videos
   - Use lower quality settings

4. **Slow Processing**
   - Enable hardware acceleration
   - Use faster preset
   - Process on dedicated server

### Debug Mode

Enable debug logging:
```env
FFMPEG_DEBUG=true
```

This will output:
- FFmpeg commands being executed
- Processing progress details
- Error messages

## Production Setup

### Recommended Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js   │────▶│ Job Queue    │────▶│ Worker Node │
│     App     │     │ (Redis/SQS)  │     │  (FFmpeg)   │
└─────────────┘     └──────────────┘     └─────────────┘
                            │                     │
                            ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │   Database   │     │   Storage   │
                    │ (Task Status)│     │ (Supabase)  │
                    └──────────────┘     └─────────────┘
```

### Scaling Considerations

1. **Horizontal Scaling**: Add more worker nodes
2. **Queue Management**: Use Redis or AWS SQS
3. **Storage**: Use CDN for processed videos
4. **Monitoring**: Track processing times and failures

## Alternative Solutions

If FFmpeg setup is not feasible:

1. **Cloud APIs**:
   - AWS MediaConvert
   - Google Cloud Video Intelligence
   - Azure Media Services

2. **Third-party Services**:
   - Mux
   - Cloudinary
   - Transloadit

3. **Browser-based Processing**:
   - WebAssembly FFmpeg (limited features)
   - Canvas-based rendering (lower quality)

## Conclusion

With FFmpeg properly configured, users can:
- Burn professional subtitles into videos
- Customize subtitle appearance
- Process videos for long-form content
- Maintain high video quality

The real-time processing provides a seamless experience for content creators preparing videos for publication. 