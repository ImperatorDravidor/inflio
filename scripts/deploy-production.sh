#!/bin/bash

# Inflio Production Deployment Script
# This script helps ensure all requirements are met before deploying to Vercel

echo "🚀 Inflio Production Deployment Checker"
echo "========================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"

# Check if logged into Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged into Vercel. Run: vercel login"
    exit 1
fi

echo "✅ Logged into Vercel"

# Check for required environment variables
echo ""
echo "🔧 Checking environment variables..."

required_vars=(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "OPENAI_API_KEY"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if vercel env ls | grep -q "^$var"; then
        echo "✅ $var is set"
    else
        echo "❌ $var is missing"
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo ""
    echo "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Add them with: vercel env add $var"
    exit 1
fi

# Check for production keys (not development)
echo ""
echo "🔍 Checking for production keys..."

clerk_key=$(vercel env ls | grep "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | head -1)
if [[ $clerk_key == *"pk_test_"* ]]; then
    echo "⚠️  Warning: Using Clerk development keys in production"
    echo "   Update to production keys from Clerk Dashboard"
fi

# Check Vercel plan limitations
echo ""
echo "📊 Checking Vercel plan..."
echo "ℹ️  For files > 100MB, ensure you have Vercel Pro or higher"
echo "ℹ️  Function timeout is set to 5 minutes in vercel.json"

# Build check
echo ""
echo "🔨 Running build check..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Fix errors before deploying."
    exit 1
fi

# Final deployment
echo ""
echo "🚀 Ready to deploy!"
echo ""
read -p "Deploy to production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploying to production..."
    vercel --prod
    echo ""
    echo "✅ Deployment complete!"
    echo "🔗 Check your deployment at: https://vercel.com/dashboard"
else
    echo "Deployment cancelled."
fi 