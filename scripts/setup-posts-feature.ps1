# PowerShell script to set up the posts feature
# This script will check and apply the necessary database migrations

Write-Host "🚀 Setting up Posts Feature..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm packages are installed
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing npm packages..." -ForegroundColor Yellow
    npm install
}

# Run the check script
Write-Host "🔍 Checking current setup..." -ForegroundColor Yellow
Write-Host ""
node scripts/check-posts-setup.js

Write-Host ""
Write-Host "📝 Would you like to apply the posts feature migration? (y/n)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "🔧 Applying database migration..." -ForegroundColor Cyan
    
    # Check if Supabase CLI is installed
    if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Supabase CLI is not installed." -ForegroundColor Red
        Write-Host "Please install it from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
        exit 1
    }
    
    # Apply the migration using Supabase CLI
    Write-Host "Running: supabase db push --file migrations/posts-feature-mvp.sql" -ForegroundColor Gray
    supabase db push --file migrations/posts-feature-mvp.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed. Please check the error messages above." -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "🔍 Verifying setup..." -ForegroundColor Yellow
    node scripts/check-posts-setup.js
    
    Write-Host ""
    Write-Host "✨ Posts feature setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure your OpenAI API key is configured in .env.local" -ForegroundColor White
    Write-Host "2. Restart your development server: npm run dev" -ForegroundColor White
    Write-Host "3. Try generating posts for a project!" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Setup cancelled. You can run this script again when ready." -ForegroundColor Yellow
}
