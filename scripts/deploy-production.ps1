# Inflio Production Deployment Script (PowerShell)
# This script helps ensure all requirements are met before deploying to Vercel

Write-Host "🚀 Inflio Production Deployment Checker" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Red
    exit 1
}

# Check if logged into Vercel
try {
    vercel whoami | Out-Null
    Write-Host "✅ Logged into Vercel" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged into Vercel. Run: vercel login" -ForegroundColor Red
    exit 1
}

# Check for required environment variables
Write-Host ""
Write-Host "🔧 Checking environment variables..." -ForegroundColor Yellow

$requiredVars = @(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY", 
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY"
)

$missingVars = @()
$envList = vercel env ls

foreach ($var in $requiredVars) {
    if ($envList -match "^$var") {
        Write-Host "✅ $var is set" -ForegroundColor Green
    } else {
        Write-Host "❌ $var is missing" -ForegroundColor Red
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Add them with: vercel env add <VAR_NAME>" -ForegroundColor Yellow
    exit 1
}

# Check for production keys (not development)
Write-Host ""
Write-Host "🔍 Checking for production keys..." -ForegroundColor Yellow

$clerkKey = $envList | Select-String "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | Select-Object -First 1
if ($clerkKey -match "pk_test_") {
    Write-Host "⚠️  Warning: Using Clerk development keys in production" -ForegroundColor Yellow
    Write-Host "   Update to production keys from Clerk Dashboard" -ForegroundColor Yellow
}

# Check Vercel plan limitations
Write-Host ""
Write-Host "📊 Checking Vercel plan..." -ForegroundColor Yellow
Write-Host "ℹ️  For files > 100MB, ensure you have Vercel Pro or higher" -ForegroundColor Cyan
Write-Host "ℹ️  Function timeout is set to 5 minutes in vercel.json" -ForegroundColor Cyan

# Build check
Write-Host ""
Write-Host "🔨 Running build check..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed. Fix errors before deploying." -ForegroundColor Red
    exit 1
}

# Final deployment
Write-Host ""
Write-Host "🚀 Ready to deploy!" -ForegroundColor Green
Write-Host ""
$deploy = Read-Host "Deploy to production? (y/N)"

if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host "Deploying to production..." -ForegroundColor Green
    vercel --prod
    Write-Host ""
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host "🔗 Check your deployment at: https://vercel.com/dashboard" -ForegroundColor Cyan
} else {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
} 