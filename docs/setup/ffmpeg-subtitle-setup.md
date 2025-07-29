# FFmpeg Setup for Subtitle Burning

## Overview

FFmpeg is required for burning subtitles directly into video files. This guide covers installation and configuration for various deployment environments.

## Installation

### Local Development (macOS)

```bash
# Using Homebrew
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### Local Development (Windows)

1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to PATH environment variable
4. Restart terminal and verify:
```bash
ffmpeg -version
```

### Production (Vercel)

**Note**: Vercel does not support FFmpeg in serverless functions due to size limitations. Consider these alternatives:

1. **Use Cloud Services** (Recommended)
   - Cloudinary
   - Mux
   - AWS MediaConvert

2. **External Processing Server**
   - Set up a dedicated server with FFmpeg
   - Use as an API endpoint for video processing

3. **Edge Runtime with WebAssembly**
   - Limited functionality
   - Smaller file size support

### Production (VPS/Dedicated Server)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install epel-release
sudo yum install ffmpeg

# Verify installation
ffmpeg -version
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Your app setup
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]
```

## Configuration

### Environment Variable

Set the FFmpeg path if not in system PATH:

```env
FFMPEG_PATH=/usr/local/bin/ffmpeg
```

### Vercel Configuration

Since Vercel doesn't support FFmpeg, configure fallback options:

```env
# Enable cloud provider for subtitle burning
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Or use Mux
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
```

## Testing FFmpeg Availability

### API Endpoint Test

```bash
curl https://your-domain.com/api/check-ffmpeg
```

Expected response:
```json
{
  "available": true,
  "provider": "ffmpeg",
  "message": "FFmpeg is available for subtitle burning"
}
```

### Manual Test

```bash
# Test subtitle burning command
ffmpeg -i input.mp4 -vf "subtitles=subtitles.srt" -c:a copy output.mp4
```

## Performance Optimization

### 1. Hardware Acceleration

Enable GPU acceleration if available:

```bash
# NVIDIA GPU
ffmpeg -hwaccel cuda -i input.mp4 ...

# Intel Quick Sync
ffmpeg -hwaccel qsv -i input.mp4 ...
```

### 2. Preset Configuration

Balance quality vs speed:

```bash
# Faster processing (lower quality)
ffmpeg -preset ultrafast ...

# Better quality (slower)
ffmpeg -preset slow ...
```

### 3. Thread Configuration

```env
# Set FFmpeg thread count
FFMPEG_THREADS=4
```

## Troubleshooting

### Common Issues

1. **"FFmpeg not found"**
   - Verify installation: `which ffmpeg`
   - Check PATH environment variable
   - Set FFMPEG_PATH explicitly

2. **"Permission denied"**
   - Ensure FFmpeg is executable: `chmod +x /path/to/ffmpeg`
   - Check file permissions for temp directory

3. **"Out of memory"**
   - Increase server memory
   - Process smaller segments
   - Use streaming mode

### Debugging

Enable FFmpeg logging:

```javascript
// In your video processing service
const ffmpegCmd = `${FFMPEG_PATH} -loglevel debug -i input.mp4 ...`
```

## Alternative Solutions

### 1. Cloudinary (Recommended for Vercel)

```javascript
// Already integrated in CloudVideoService
const provider = process.env.CLOUDINARY_URL ? 'cloudinary' : 'fallback'
```

### 2. Browser-Based (FFmpeg.wasm)

```javascript
// For client-side processing (limited functionality)
import { FFmpeg } from '@ffmpeg/ffmpeg'
```

### 3. API Service

Create a dedicated microservice:

```javascript
// subtitle-service/index.js
const express = require('express')
const { exec } = require('child_process')

app.post('/burn-subtitles', async (req, res) => {
  // Process video with FFmpeg
})
```

## Resource Requirements

### Minimum Requirements
- CPU: 2 cores
- RAM: 2GB
- Storage: 10GB (for temp files)

### Recommended for Production
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+
- GPU: Optional (for acceleration)

## Security Considerations

1. **Input Validation**
   - Validate video formats
   - Limit file sizes
   - Sanitize subtitle content

2. **Resource Limits**
   - Set processing timeouts
   - Limit concurrent jobs
   - Monitor disk usage

3. **Access Control**
   - Authenticate API requests
   - Rate limiting
   - User quotas 