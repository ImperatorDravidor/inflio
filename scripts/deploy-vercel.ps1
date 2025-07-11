# Inflio Vercel Deployment Script (PowerShell)
# Run this to deploy to production

Write-Host "🚀 Starting Inflio deployment to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Not in project root directory" -ForegroundColor Red
    Write-Host "Please run this script from the inflio directory"
    exit 1
}

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Warning: You have uncommitted changes" -ForegroundColor Yellow
    Write-Host "It's recommended to commit all changes before deploying"
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Deployment cancelled"
        exit 1
    }
}

# Run build to check for errors
Write-Host "📦 Running production build check..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed! Please fix errors before deploying" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Check if Vercel CLI is installed
try {
    vercel --version | Out-Null
} catch {
    Write-Host "📥 Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm i -g vercel
}

Write-Host "🔐 Deploying to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Deploy to production
vercel --prod

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Post-deployment checklist:" -ForegroundColor Cyan
Write-Host "   1. ✓ Check the deployed URL"
Write-Host "   2. ✓ Test authentication flow"
Write-Host "   3. ✓ Try uploading a test video"
Write-Host "   4. ✓ Verify environment variables"
Write-Host "   5. ✓ Check error logs in Vercel dashboard"
Write-Host ""
Write-Host "💡 Tip: Monitor your app at https://vercel.com/dashboard" -ForegroundColor Yellow 