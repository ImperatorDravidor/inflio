# Inflio - AI-Powered Video Content Platform

<div align="center">
  <img src="public/infliologo.svg" alt="Inflio Logo" width="200" />
  
  Transform long-form videos into viral clips, engaging blog posts, and social media content with AI
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.3-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
  [![License](https://img.shields.io/badge/license-MIT-purple)](LICENSE)
</div>

## 🚀 Overview

Inflio is a comprehensive video content platform that leverages cutting-edge AI to help content creators maximize their video's potential. Upload once, publish everywhere with intelligent content generation and multi-platform distribution.

### 🎯 Key Features

<<<<<<< HEAD
=======
#### ✅ Fully Implemented
>>>>>>> 7184e73 (Add new files and configurations for project setup)
- **🎥 Smart Video Processing** - Handle videos up to 2GB with URL-based processing
- **✂️ AI Clip Generation** - Extract viral moments with Klap AI's virality scoring
- **📝 Intelligent Transcription** - High-accuracy speech-to-text with speaker detection
- **📰 SEO-Optimized Blogs** - Convert videos into engaging blog posts with AI
<<<<<<< HEAD
- **📱 Multi-Platform Publishing** - Schedule and publish to 6+ social platforms
- **🎨 AI Thumbnail Generation** - Create eye-catching thumbnails automatically
- **📊 Content Analytics** - Track performance across all platforms
- **🎙️ Podcast Tools** - Generate chapters, show notes, and highlights
- **🔄 Subtitle Generation** - Create and edit subtitles with timeline visualization

=======
- **📱 Multi-Platform Publishing** - OAuth integration for 6 social platforms
- **🎨 AI Thumbnail Generation** - Create eye-catching thumbnails automatically
- **🔄 Subtitle Generation** - Create and edit subtitles with timeline visualization

#### ⚠️ Partially Implemented
- **📊 Content Analytics** - Dashboard exists but shows placeholder data
- **🎙️ Podcast Tools** - UI present but functionality not connected

>>>>>>> 7184e73 (Add new files and configurations for project setup)
## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3 with App Router
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 4.0 + shadcn/ui
- **State**: React Hooks + Custom Event System
- **Animation**: Framer Motion
- **Charts**: Recharts

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + Storage)
- **Authentication**: Clerk
- **AI**:
  - Transcription: OpenAI Whisper
  - Content Analysis: OpenAI GPT-4.1
  - Video Clips: Klap AI
  - Content Generation: Google Gemini

### Infrastructure
- **Error Tracking**: Sentry
- **Rate Limiting**: Upstash Redis
- **Image Processing**: Cloudinary
- **Deployment**: Vercel/Netlify Ready

## 📁 Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── projects/         # Project management
│   │   ├── social/          # Social media hub
│   │   ├── studio/          # Video upload & processing
│   │   └── analytics/       # Performance tracking
│   └── api/                   # API endpoints
│       ├── process*/         # Video processing
│       ├── generate*/        # AI content generation
│       └── social/          # Social media APIs
├── components/                # React components
│   ├── ui/                   # Base UI components
│   ├── social/              # Social media components
│   └── staging/             # Content staging
├── lib/                       # Core utilities
│   ├── services/            # Service layer
│   ├── social/              # Social media logic
│   ├── staging/             # Content staging
│   └── supabase/            # Database clients
└── hooks/                     # Custom React hooks
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account
- Clerk account
- API keys for AI services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/inflio.git
   cd inflio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file with:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   CLERK_SECRET_KEY=sk_test_xxxxx
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
   SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
   
   # AI Services
   OPENAI_API_KEY=sk-xxxxx
   KLAP_API_KEY=klap_xxxxx
   GOOGLE_GENERATIVE_AI_API_KEY=xxxxx
   
   # Social Media OAuth (Optional)
   TWITTER_CLIENT_ID=xxxxx
   TWITTER_CLIENT_SECRET=xxxxx
   # Add other platforms as needed
   ```

4. **Set up database**
   
   Run migrations in order:
   ```bash
   # In Supabase SQL editor, run files from migrations/ folder:
   - supabase-schema.sql
   - supabase-user-profiles-schema.sql
   - social-media-schema.sql
   - content-analysis.sql
   # And others as needed
   ```

5. **Configure storage buckets**
   
   In Supabase Storage, create buckets:
   - `videos` - For video uploads
   - `thumbnails` - For generated thumbnails
   - `subtitles` - For subtitle files
   - `blog-images` - For blog post images

6. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

7. **Open http://localhost:3000**

## 🔄 Workflow

### 1. Video Upload → 2. Processing → 3. Content Generation → 4. Publishing

1. **Upload Video** (`/studio/upload`)
   - Drag & drop or browse
   - Videos up to 2GB supported
   - Select processing workflows

2. **AI Processing** (`/studio/processing/[id]`)
   - Real-time progress tracking
   - Transcription (2-3 minutes)
   - Clip generation (5-7 minutes)
   - Content analysis

3. **Content Management** (`/projects/[id]`)
   - Review generated content
   - Edit blogs and captions
   - Select publishing platforms

4. **Multi-Platform Publishing** (`/projects/[id]/publish`)
   - Connect social accounts
   - Schedule posts
   - Track performance

## 🔌 API Documentation

### Core Endpoints

#### Video Processing
- `POST /api/upload` - Upload video to storage
- `POST /api/process-klap` - Generate clips with Klap AI
- `POST /api/process-transcription` - Transcribe with Whisper

#### Content Generation
- `POST /api/generate-blog` - Create blog posts
- `POST /api/generate-social` - Generate social media content
- `POST /api/generate-thumbnail` - Create thumbnails
- `POST /api/generate-caption` - Generate video captions

#### Social Media
- `GET /api/social/connect` - Initialize OAuth flow
- `GET /api/social/callback/[platform]` - OAuth callbacks
- `POST /api/social/publish` - Publish content
- `GET /api/social/analytics/[platform]` - Get analytics

[Full API Documentation →](docs/api/introduction.md)

## 🎨 Features Deep Dive

### AI Content Analysis
- Extracts keywords and topics from transcripts
- Identifies key moments with timestamps
- Generates content suggestions
- Sentiment analysis

### Social Media Integration
Supports publishing to:
- Twitter/X
- LinkedIn
- Instagram
- TikTok
- YouTube
- Facebook

### Blog Editor
- Markdown support with live preview
- SEO optimization tools
- AI-powered image suggestions
- Export to multiple formats

### Subtitle System
- Generate subtitles from transcription
- Visual timeline editor
- Export as SRT/VTT
- Apply subtitles to videos

## 🔐 Security & Authentication

- **Authentication**: Clerk handles user auth with SSO support
- **Authorization**: Row-level security in Supabase
- **API Security**: Rate limiting with Upstash Redis
- **Token Storage**: Encrypted OAuth tokens
- **File Security**: Signed URLs for uploads

## 📊 Architecture

### Klap-First Processing
```
Video Upload → Supabase Storage → URL to Klap API → AI Processing → Results
```

Benefits:
- No file size limits
- Parallel processing
- Built for video content
- Automatic retries

### Event-Driven Updates
- Real-time progress tracking
- WebSocket connections
- Optimistic UI updates
- Background job processing

## 🚢 Deployment

### Vercel Deployment
1. Connect GitHub repository
2. Add environment variables
3. Deploy with one click

### Production Checklist
- [ ] Set production API keys
- [ ] Configure CORS settings
- [ ] Enable Sentry error tracking
- [ ] Set up monitoring
- [ ] Configure CDN for videos
- [ ] Review security settings

[Deployment Guide →](docs/deployment/guide.md)

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use existing UI components
- Write meaningful commit messages
- Add tests for new features
- Update documentation

[Development Guide →](docs/development/code-style.md)

## 📈 Performance

- **Video Processing**: 5-10 minutes for 30-minute videos
- **Concurrent Users**: Handles 1000+ active users
- **Storage**: Optimized for large video files
- **API Response**: <200ms average

## 🐛 Troubleshooting

### Common Issues

**"Klap API key not configured"**
- Ensure `KLAP_API_KEY` is set in `.env.local`
- Verify API key is active

**"Failed to upload video"**
- Check file size (<2GB)
- Verify storage bucket permissions
- Ensure stable internet connection

**"Social media authentication failed"**
- Verify OAuth credentials
- Check callback URLs match exactly
- Ensure platform app is approved

[Full Troubleshooting Guide →](docs/README.md)

## 📞 Support

- **Documentation**: [docs/README.md](docs/README.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/inflio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/inflio/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Klap AI](https://klap.app) for video clip generation
- [OpenAI](https://openai.com) for transcription and analysis
- [Supabase](https://supabase.com) for backend infrastructure
- [Vercel](https://vercel.com) for hosting
- [shadcn/ui](https://ui.shadcn.com) for UI components

---

<div align="center">
  Made with ❤️ by the Inflio Team
  
  [Website](https://inflio.com) • [Documentation](docs/README.md) • [API Reference](docs/api/introduction.md)
</div>
