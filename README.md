# 🎬 Inflio - AI-Powered Video Content Platform

Transform your videos into amazing content with AI - transcriptions, clips, blog posts, social media content, and more.

## 🎯 Product Overview

Inflio is a comprehensive video content transformation platform that leverages cutting-edge AI to help creators and businesses maximize the value of their video content. Upload once, generate multiple content formats automatically.

### 🌟 Key Features

- **🎙️ AI Transcription** - Convert videos to text using OpenAI Whisper with 95%+ accuracy
- **✂️ Smart Clip Generation** - AI identifies viral moments and creates short-form content via Klap API
- **📝 Blog Post Creation** - Transform video transcripts into SEO-optimized articles
- **📱 Social Media Content** - Generate platform-specific posts for Twitter, LinkedIn, Instagram, TikTok
- **🎯 Personalized AI** - System learns your brand voice and style over time
- **📊 Analytics Dashboard** - Track performance and content metrics
- **🔄 Batch Processing** - Process multiple videos with workflow automation
- **💾 Cloud Storage** - Secure video storage with Supabase

### 🎬 How It Works

1. **Upload** - Drag and drop your video (MP4, MOV, AVI, WebM up to 2GB)
2. **Select Workflows** - Choose AI processing options (transcription, clips, blog, social)
3. **AI Processing** - Watch real-time progress as AI transforms your content
4. **Export & Share** - Download in multiple formats or share directly

### 🤖 AI Personalization

Inflio builds a personalized profile for each user:
- **Brand Voice** - Professional, casual, friendly, playful, or inspirational
- **Visual Style** - Colors, fonts, and design preferences
- **Content Goals** - Engagement, sales, education, or brand awareness
- **Learning System** - AI improves based on your feedback and edits

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Clerk account
- OpenAI API key
- Klap API key (optional)

### Installation

1. **Clone and install:**
```bash
git clone https://github.com/yourusername/inflio.git
cd inflio
npm install
```

2. **Set up environment variables:**
Copy `.env.example` to `.env.local` and fill in your keys.

3. **Set up database:**
- Create a Supabase project
- Run migrations in `migrations/` folder in order
- Create "videos" storage bucket (make it public)

4. **Configure Clerk webhook:**
- In Clerk Dashboard → Webhooks → Add Endpoint
- URL: `https://your-domain/api/webhooks/clerk`
- Events: user.created, user.updated, user.deleted

5. **Run development server:**
```bash
npm run dev
```

## 📁 Project Structure

```
inflio/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/             # Utilities and services
│   └── hooks/           # Custom React hooks
├── migrations/          # Database migrations
├── docs/               # Documentation
└── public/             # Static assets
```

## 🎯 Features

- **AI Video Transcription** - OpenAI Whisper integration
- **Smart Clip Generation** - Klap AI for viral moments
- **Blog Post Creation** - Convert videos to articles
- **User Personalization** - AI learns your style
- **Real-time Processing** - Live progress tracking
- **Multi-format Export** - Download in various formats

## 🚀 Deployment

See [docs/README_DEPLOYMENT.md](docs/README_DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Finflio)

## 🛠️ Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database & storage
- **Clerk** - Authentication
- **OpenAI** - AI transcription
- **Klap** - Video clips

## 📄 License

MIT License - see LICENSE file for details.
