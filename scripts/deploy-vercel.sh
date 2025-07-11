#!/bin/bash

# Inflio Vercel Deployment Script
# Run this to deploy to production

echo "🚀 Starting Inflio deployment to Vercel..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "Please run this script from the inflio directory"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "It's recommended to commit all changes before deploying"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Run build to check for errors
echo "📦 Running production build check..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed! Please fix errors before deploying"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "🔐 Deploying to Vercel..."
echo ""

# Deploy to production
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Post-deployment checklist:"
echo "   1. ✓ Check the deployed URL"
echo "   2. ✓ Test authentication flow"
echo "   3. ✓ Try uploading a test video"
echo "   4. ✓ Verify environment variables"
echo "   5. ✓ Check error logs in Vercel dashboard"
echo ""
echo "💡 Tip: Monitor your app at https://vercel.com/dashboard" 