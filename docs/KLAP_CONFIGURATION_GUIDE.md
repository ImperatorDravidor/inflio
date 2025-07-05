# Klap Integration Configuration Guide

## Overview

The Klap integration in Inflio is designed to give you **full control over your video content** by default. This guide explains how clip processing works and when you might want to modify the default behavior.

## Default Behavior: Full Clip Storage

By default, Inflio will:

1. **Generate clips** using Klap's AI technology
2. **Export clips** from Klap to get download URLs  
3. **Download each clip** to your server
4. **Upload clips to YOUR Supabase storage**
5. **Store clips** in organized folders: `{projectId}/clips/`

This ensures you have complete ownership and control over your video clips.

## The Processing Flow

```
1. Original Video → Uploaded to YOUR Supabase
2. Video URL → Sent to Klap API
3. Klap → Generates clips (10-15 min)
4. Inflio → Downloads each clip
5. Inflio → Uploads to YOUR storage
6. Result → Full control over all content
```

## Environment Variables

### Required Variables

```bash
# Your Klap API key (required)
KLAP_API_KEY=klap_xxxxx

# Supabase configuration (required)
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Optional Performance Variable

```bash
# ONLY set this if you want to skip downloading clips
# Default: false (clips ARE downloaded and stored)
SKIP_KLAP_VIDEO_REUPLOAD=true
```

## When to Use Skip Mode

Set `SKIP_KLAP_VIDEO_REUPLOAD=true` ONLY if:

1. **Experiencing persistent timeout issues** on Vercel Hobby plan
2. **Need faster processing** and don't mind external hosting
3. **Testing/development** where you don't need local copies
4. **Temporary workaround** while upgrading infrastructure

## Comparison: Default vs Skip Mode

| Feature | Default (Recommended) | Skip Mode |
|---------|----------------------|-----------|
| Clip Storage | YOUR Supabase | Klap's servers |
| Control | Full ownership | Limited |
| Processing Time | 15-30 min | 10-20 min |
| Bandwidth Usage | Higher | Lower |
| Independence | Yes | No |
| Editing Capability | Yes | Limited |
| Long-term Access | Guaranteed | Depends on Klap |

## Best Practices

### For Production Use

1. **Use default behavior** - Don't set `SKIP_KLAP_VIDEO_REUPLOAD`
2. **Monitor storage usage** - Ensure adequate Supabase storage
3. **Use background processing** - Already implemented
4. **Check logs** for download/upload progress

### For Development

1. **Can use skip mode** for faster iteration
2. **Test both modes** to ensure compatibility
3. **Monitor API usage** to avoid rate limits

## Storage Structure

When clips are properly downloaded and stored:

```
videos/
├── {projectId}/
│   ├── video.mp4 (original)
│   ├── clips/
│   │   ├── clip_1_{klapId}.mp4
│   │   ├── clip_2_{klapId}.mp4
│   │   └── clip_3_{klapId}.mp4
│   └── thumbnails/
│       └── ...
```

## Troubleshooting

### Clips Not Downloading?

1. Check server logs for:
   ```
   [Klap Background] Downloading clip from: ...
   [Klap Background] Uploading clip to Supabase: ...
   ```

2. Verify `SKIP_KLAP_VIDEO_REUPLOAD` is not set to `true`

3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is configured

4. Check Supabase storage limits

### Timeout Issues?

1. **Vercel Hobby**: Consider upgrading to Pro (60s timeout)
2. **Temporary**: Set `SKIP_KLAP_VIDEO_REUPLOAD=true`
3. **Long-term**: Implement queue-based processing

## Security Considerations

- **Service Role Key**: Only use on server-side
- **API Keys**: Never expose in client code
- **Storage**: Consider bucket policies for access control
- **URLs**: Use signed URLs for sensitive content

## Future Enhancements

- Queue-based processing for better reliability
- Webhook notifications when clips are ready
- Automatic retry for failed downloads
- CDN integration for faster delivery

## Summary

The default configuration gives you **full control** over your video content by downloading and storing all clips in your own infrastructure. Only use skip mode as a temporary workaround for specific issues. Your content, your control! 