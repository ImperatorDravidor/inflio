# Inflio Documentation

Welcome to the Inflio documentation. This guide will help you set up, understand, and work with the Inflio video content creation platform.

## 🎬 Important: Klap Clip Storage

By default, Inflio downloads and stores all generated clips in YOUR Supabase storage, giving you full control over your content. The system:

- ✅ Downloads clips from Klap after generation
- ✅ Stores them in your Supabase storage
- ✅ Gives you complete ownership and control
- ✅ Processes in background to avoid timeouts

If you're experiencing timeout issues, see the [Klap Configuration Guide](KLAP_CONFIGURATION_GUIDE.md) for options.

## 📚 Documentation Structure

### 🚀 [Setup & Configuration](./setup/)
- [Quick Setup Checklist](./setup/quick-setup-checklist.md) - Get started quickly
- [Environment Variables](./setup/environment-variables.md) - Configure your environment
- [Supabase Setup](./setup/supabase-setup.md) - Database and storage configuration
- [Clerk Authentication](./setup/clerk-setup.md) - User authentication setup
- [Social Media Integration](./setup/social-media-setup.md) - Connect social platforms
- [AI Image Storage](./setup/ai-image-storage-setup.md) - Configure AI image storage

### 🎯 [Features](./features/)
- [Video Processing](./features/video-processing.md) - Upload and process videos
- [AI Content Analysis](./features/ai-content-analysis.md) - Extract keywords, topics & insights with AI
- [AI Carousel Generation](./features/ai-carousel-generation.md) - Create multi-slide social carousels
- [Blog Editor](./features/blog-editor.md) - Content creation tools
- [Blog Management](./features/blog-management.md) - Manage, duplicate & delete blog posts
- [Publishing Workflow](./features/publishing-workflow.md) - Multi-platform publishing
- [Dashboard](./features/dashboard.md) - Main interface overview

### 🔧 [API Documentation](./api/)
- [Klap API Integration](./api/klap-api.md) - Video processing API
- [API Endpoints](./api/endpoints.md) - Available API routes
- [API Comparison](./api/comparison.md) - Service comparisons

### 💻 [Development](./development/)
- [Architecture Overview](./development/architecture.md) - System design
- [Code Style Guide](./development/code-style.md) - Coding standards
- [Testing Guide](./development/testing.md) - Testing approach

### 🚀 [Deployment](./deployment/)
- [Deployment Guide](./deployment/guide.md) - Production deployment
- [Production Configuration](./deployment/production.md) - Production settings

## 🎯 Quick Links

- **First Time?** Start with the [Quick Setup Checklist](./setup/quick-setup-checklist.md)
- **Need API Keys?** Check [Environment Variables](./setup/environment-variables.md)
- **Understanding the App?** Read [Architecture Overview](./development/architecture.md)
- **New AI Features?** Explore [AI Content Analysis](./features/ai-content-analysis.md)
- **Blog Management?** See [Blog Management Features](./features/blog-management.md)
- **Create Carousels?** Check [AI Carousel Generation](./features/ai-carousel-generation.md)

## 📋 Project Overview

Inflio is a comprehensive video content creation platform that:
- Processes videos to generate clips, transcriptions, and social media content
- **Uses AI to extract keywords, topics, and content insights**
- **Generates AI images and carousels for social media using GPT Image 1**
- **Offers advanced blog management with duplicate, delete, and export features**
- **Provides customizable blog generation with multiple writing styles**
- Integrates with multiple social media platforms for publishing
- Provides analytics and insights on content performance
- Offers AI-powered content generation and editing tools

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Authentication**: Clerk
- **Video Processing**: Klap API
- **AI**: OpenAI GPT-4.1 (text) & GPT Image 1 (images)
- **Storage**: Supabase Storage

## 📞 Support

For questions or issues:
1. Check the relevant documentation section
2. Review the [FAQ](./faq.md) (if available)
3. Submit an issue on GitHub

---

Last updated: December 2024 

For comprehensive setup instructions, see the [Environment Setup Guide](setup/environment-setup.md). 