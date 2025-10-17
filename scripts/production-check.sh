#!/bin/bash

# Production Build Check Script
# This script ensures the application is ready for production deployment

echo "🚀 Starting Production Readiness Check..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo -e "\n📦 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "Node version: $NODE_VERSION"
if [[ "$NODE_VERSION" < "v18" ]]; then
    echo -e "${RED}❌ Node.js 18+ is required${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js version is compatible${NC}"
fi

# Check if .env.local exists
echo -e "\n🔐 Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local file found${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local file not found - ensure environment variables are configured for deployment${NC}"
fi

# Install dependencies
echo -e "\n📚 Installing dependencies..."
npm ci --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Run type checking
echo -e "\n🔍 Running TypeScript type checking..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ No TypeScript errors found${NC}"
else
    echo -e "${RED}❌ TypeScript errors detected${NC}"
    exit 1
fi

# Run linting (optional, can be uncommented if needed)
# echo -e "\n🧹 Running ESLint..."
# npm run lint
# if [ $? -eq 0 ]; then
#     echo -e "${GREEN}✅ No linting errors found${NC}"
# else
#     echo -e "${YELLOW}⚠️  Linting warnings detected${NC}"
# fi

# Build the application
echo -e "\n🏗️  Building application for production..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Check build output
echo -e "\n📊 Build Statistics:"
if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo "Build size: $BUILD_SIZE"
    
    # Count static and dynamic pages
    STATIC_PAGES=$(find .next/server/pages -name "*.html" 2>/dev/null | wc -l)
    echo "Static pages: $STATIC_PAGES"
    
    echo -e "${GREEN}✅ Build output verified${NC}"
else
    echo -e "${RED}❌ Build output directory not found${NC}"
    exit 1
fi

# Summary
echo -e "\n=========================================="
echo -e "${GREEN}🎉 Production build check completed successfully!${NC}"
echo -e "\nNext steps:"
echo "1. Configure environment variables for your deployment platform"
echo "2. Apply database migrations"
echo "3. Deploy using your preferred platform (Vercel, Netlify, etc.)"
echo "4. Run post-deployment tests"
echo -e "\nRefer to DEPLOYMENT_READY.md for detailed deployment instructions."
