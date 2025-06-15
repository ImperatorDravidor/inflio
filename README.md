# Inflio - AI-Powered Video Content Platform

Transform your videos into engaging content with AI. Generate clips, transcriptions, blog posts, and social media content automatically.

## Features

- 🎥 **Video Processing** - Upload and process videos up to 2GB
- ✂️ **Smart Clips** - AI-powered clip generation with virality scores
- 📝 **AI Transcription** - Automatic speech-to-text conversion with high accuracy
- 📰 **Blog Generation** - Convert videos into SEO-optimized blog posts
- 📱 **Social Media** - Create platform-specific social content
- 🎙️ **Podcast Tools** - Generate chapters and show notes
- 📊 **Analytics** - Track content performance across platforms

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase
- **Authentication**: Clerk
- **AI Services**: Advanced AI APIs for content processing
- **Storage**: Supabase Storage

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API endpoints
│   └── ...                # Public routes
├── components/            # Reusable React components
├── hooks/                 # Custom React hooks
└── lib/                   # Utilities and services
    ├── services/          # Service layer
    ├── constants.ts       # App-wide constants
    └── ...                # Other utilities
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/inflio.git
   cd inflio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Required environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - API keys for AI services (see `.env.example`)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Key Features Implementation

### Video Upload Flow
1. User uploads video through `/studio/upload`
2. Video is stored in Supabase Storage
3. Project is created with selected workflows
4. User is redirected to processing page

### Processing Pipeline
1. Video is processed using AI for transcription
2. Smart algorithms generate clips from the video
3. Results are stored in the database
4. User can view and export content

### Smart Navigation
- Processing projects automatically redirect to processing page
- Loading overlay prevents interaction with incomplete projects
- Consistent navigation patterns throughout the app

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
