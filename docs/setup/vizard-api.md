# Vizard API Documentation

## Introduction

The Vizard API enables developers to effortlessly integrate AI-powered video clipping into their products and workflows. Transform lengthy videos into engaging, share-ready short clips optimized for platforms like TikTok, YouTube Shorts, and Instagram Reels.

### Key Features

- 🎬 **Automated Video Clipping**: Automatically detect and extract engaging moments
- 📝 **Subtitle Generation**: Accurate transcripts and customizable subtitles
- ⚙️ **Flexible Customization**: Set clip durations, aspect ratios, and branding templates
- 📲 **Multi-platform Optimization**: Clips tailored specifically for social media channels

The API is RESTful, easy to integrate, and supports JSON-formatted requests.

---

## Quickstart

### 1. Obtain Your API Key

**Requirements:**
- Must be on a paid plan (API access only available to paid users)

**Steps:**
1. Log in to your Vizard account
2. Ensure you're on a paid plan
3. Go to Workspace Settings
4. Click on the API tab
5. Click "Generate API Key"
6. Copy and securely store your API key

### 2. Submit a Video for Clipping

**Base URL:** `https://elb-api.vizard.ai/hvizard-server-front/open-api/v1`

**Endpoint:** `POST /project/create`

**Headers:**
```
Content-Type: application/json
VIZARDAI_API_KEY: YOUR_API_KEY
```

**Example Request:**
```bash
curl -X POST https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/create \
  -H "Content-Type: application/json" \
  -H "VIZARDAI_API_KEY: YOUR_API_KEY" \
  -d '{
    "lang": "en",
    "preferLength": [0],
    "videoUrl": "https://www.youtube.com/watch?v=OqLfw-TzzfI",
    "videoType": 2
  }'
```

**Response:** Returns a `projectId` for retrieving clips

### 3. Retrieve Your Clips

**Processing Time:** Few minutes to tens of minutes (depends on video length and resolution)
- 4K videos take significantly longer
- Example: 30-minute talking-head video generates 20+ clips in ~10 minutes

**Polling Interval:** 30 seconds recommended

#### Method A: Polling

**Endpoint:** `GET /project/query/{projectId}`

```bash
curl -X GET https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/query/{projectId} \
  -H "VIZARDAI_API_KEY: YOUR_API_KEY"
```

#### Method B: Webhook

Configure a webhook URL in workspace settings before submitting video. API will POST clips metadata to your endpoint when ready.

---

## Minimum Setup Parameters

### Video Source

**Supported Sources:**
- Remote video files (direct download URL: .mp4, .mov, .avi, .3gp)
- YouTube videos (standard URL, no live videos)
- Google Drive videos (publicly shared link)
- Vimeo videos (direct link)
- StreamYard videos (shared recording link)
- TikTok, Twitter, Rumble, Twitch, Loom, Facebook, LinkedIn

**Parameters:**

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `videoType` | ✅ | int | Video source type (see table below) |
| `videoUrl` | ✅ | string | URL of video source |
| `ext` | ✅ (only for videoType 1) | string | File extension (mp4, 3gp, avi, mov) |

**Video Type Values:**

| Value | Source |
|-------|--------|
| 1 | Remote video file |
| 2 | YouTube |
| 3 | Google Drive |
| 4 | Vimeo |
| 5 | StreamYard |
| 6 | TikTok |
| 7 | Twitter |
| 8 | Rumble |
| 9 | Twitch |
| 10 | Loom |
| 11 | Facebook |
| 12 | LinkedIn |

**Limits:**
- ⚠️ Maximum video length: 600 minutes
- ⚠️ Maximum file size: 10GB
- ⚠️ Maximum resolution: 4K (exported clips maintain original resolution)
- ⚠️ Minimum video length: 3 minutes OR 300+ words transcription

### Clip Length

Controls target duration of each generated clip.

| Parameter | Required | Value | Clip Duration |
|-----------|----------|-------|---------------|
| `preferLength` | ✅ | [0] | Auto-chosen by AI |
| | | [1] | < 30 seconds |
| | | [2] | 30-60 seconds |
| | | [3] | 60-90 seconds |
| | | [4] | 90 seconds - 3 minutes |

**Examples:**
- `[1]` → Only ultra-short clips (<30s)
- `[2,3]` → Medium clips (30s-90s)
- `[1,2,3]` → Variety under 90s
- `[0]` → AI decides (cannot combine with other values)

### Spoken Language

| Parameter | Required | Value | Language |
|-----------|----------|-------|----------|
| `lang` | ✅ | `auto` | Auto-detect |
| | | `en` | English |
| | | `es` | Spanish |
| | | `pt` | Portuguese |
| | | `fr` | French |
| | | `de` | German |
| | | `ru` | Russian |

Uses ISO 639-1 language codes. `auto` recommended for most use cases.

---

## Advanced Options (Optional)

### Aspect Ratio

**Parameter:** `ratioOfClip`

| Value | Aspect Ratio | Best For |
|-------|--------------|----------|
| 1 (default) | 9:16 (Vertical) | TikTok, Instagram Reels, Shorts |
| 2 | 1:1 (Square) | Instagram Feed, Facebook Feed |
| 3 | 4:5 (Portrait) | Instagram Feed (optimized height) |
| 4 | 16:9 (Horizontal) | YouTube, LinkedIn, Twitter |

### Apply Template

**Parameter:** `templateId` (int)

Apply custom branding/styling templates created in Vizard web interface.

**Template controls:**
- Subtitle font, size, color
- Headline style/positioning
- Logo placement
- Branding elements
- Background layers, motion, transitions

**Finding templateId:**
1. Log in to Vizard
2. Open video editor (click 'Edit' on any clip)
3. Switch to 'Template' tab
4. Hover over template and copy ID

⚠️ Template ratio must match `ratioOfClip` parameter

### Remove Silence and Filler Words

**Parameter:** `removeSilenceSwitch`

| Value | Effect |
|-------|--------|
| 0 (default) | Keep silence |
| 1 | Remove silent gaps and filler words (um, uh) |

**Use cases:**
- Interview/podcast videos
- Long monologues
- Fast-paced social content

⚠️ Off by default to avoid choppy output

### Max Number of Clips

**Parameter:** `maxClipNumber` (int, range: 1-100)

Sets upper limit of clips returned. If not set, all clips returned.
Clips ranked by viral score.

**Example:** 1-hour video generates 40 clips, `maxClipNumber: 10` returns top 10

### Include Relevant Topics

**Parameter:** `keywords` (string)

AI-guided clip selection based on topics/moments.

**Examples:**
- "Find where Sam talks about GPT-5"
- "Get moment of Ronaldo's shot"
- "Give me a scene where a sea otter sees a hamburger"

⚠️ Optional. When set, returns fewer, more focused clips. If no aligned clips found, returns nothing.

### Show Subtitles

**Parameter:** `subtitleSwitch`

| Value | Effect |
|-------|--------|
| 1 (default) | Show subtitles |
| 0 | Hide subtitles |

### Auto Emoji

**Parameter:** `emojiSwitch`

| Value | Effect |
|-------|--------|
| 0 (default) | Disable emoji |
| 1 | Enable auto emoji in subtitles |

### Highlight Keywords

**Parameter:** `highlightSwitch`

| Value | Effect |
|-------|--------|
| 0 (default) | No keyword highlighting |
| 1 | Auto highlight keywords in subtitles |

### Auto B-rolls

**Parameter:** `autoBrollSwitch`

| Value | Effect |
|-------|--------|
| 0 (default) | No B-rolls |
| 1 | Enable auto B-roll |

### AI-Generated Headline

**Parameter:** `headlineSwitch`

| Value | Effect |
|-------|--------|
| 1 (default) | Show AI headline/hook (first 3 seconds) |
| 0 | No headline |

### Project Name

**Parameter:** `projectName` (string)

Custom name for project. If not provided, defaults to filename or YouTube title.

---

## Example Request with Advanced Options

```bash
curl -X POST https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/create \
  -H "Content-Type: application/json" \
  -H "VIZARDAI_API_KEY: YOUR_API_KEY" \
  -d '{
    "lang": "en",
    "preferLength": [0],
    "videoUrl": "https://www.youtube.com/watch?v=OqLfw-TzzfI",
    "videoType": 2,
    "ratioOfClip": 1,
    "templateId": 52987165,
    "removeSilenceSwitch": 0,
    "maxClipNumber": 10,
    "keywords": "AI, spark, vizard",
    "subtitleSwitch": 1,
    "emojiSwitch": 0,
    "highlightSwitch": 0,
    "autoBrollSwitch": 0,
    "headlineSwitch": 1,
    "projectName": "Introducing Spark 1.0"
  }'
```

---

## Response Format

```json
{
  "code": 2000,
  "projectId": 17861706,
  "shareLink": "https://vizard.ai/project?invite=...",
  "errMsg": ""
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `code` | int | Status code (see table below) |
| `projectId` | string | Unique project ID for retrieving clips |
| `shareLink` | string | Shareable project link (Business/Team plans only) |
| `errMsg` | string | Error message (only when code ≠ 2000) |

### Status Codes

| Code | Meaning |
|------|---------|
| 2000 | Request valid, project being created |
| 4001 | Invalid API key |
| 4002 | Project creation failed |
| 4003 | Rate limit exceeded |
| 4004 | Unsupported video format |
| 4005 | Video file is broken |
| 4006 | Illegal parameter |
| 4007 | Insufficient remaining minutes |
| 4008 | Cannot download video from URL |
| 4009 | Invalid video URL |
| 4010 | Cannot detect spoken language (try specific language code) |

⚠️ **Important:** Code 2000 doesn't guarantee project creation. Use query endpoint to verify.

---

## Rate Limits

| Limit Type | Value |
|------------|-------|
| Requests per minute | 3 |
| Requests per hour | 20 |

**Need higher limits?** Contact support@vizard.ai for custom limits.

---

## Integration Notes

- API is RESTful
- All requests use JSON format
- Use `projectId` from creation response to poll for clips
- Recommended polling interval: 30 seconds
- Processing time varies by video length/resolution
- 4K videos require significantly more processing time
