Write-Host "`n🔍 Diagnosing Klap Clips Generation Issue..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor DarkGray

# Check if .env.local exists and contains KLAP_API_KEY
Write-Host "`n1️⃣ Checking environment configuration..." -ForegroundColor Yellow

$envFile = ".env.local"
$hasKlapKey = $false

if (Test-Path $envFile) {
    $content = Get-Content $envFile | Where-Object { $_ -match "^KLAP_API_KEY=" }
    if ($content) {
        Write-Host "✅ KLAP_API_KEY found in .env.local" -ForegroundColor Green
        $hasKlapKey = $true
    } else {
        Write-Host "❌ KLAP_API_KEY NOT found in .env.local" -ForegroundColor Red
    }
    
    $skipReupload = Get-Content $envFile | Where-Object { $_ -match "^SKIP_KLAP_VIDEO_REUPLOAD=" }
    if ($skipReupload) {
        Write-Host "✅ SKIP_KLAP_VIDEO_REUPLOAD is configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  SKIP_KLAP_VIDEO_REUPLOAD not set (clips will be slower)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
}

# Quick fix instructions
if (-not $hasKlapKey) {
    Write-Host "`n🚨 QUICK FIX NEEDED!" -ForegroundColor Red
    Write-Host "===================" -ForegroundColor Red
    Write-Host "`n1. Get your Klap API key:" -ForegroundColor White
    Write-Host "   - Go to https://klap.app" -ForegroundColor Gray
    Write-Host "   - Sign in → Developer Settings → API Keys" -ForegroundColor Gray
    Write-Host "   - Copy your key (starts with 'klap_')" -ForegroundColor Gray
    
    Write-Host "`n2. Add to your .env.local file:" -ForegroundColor White
    Write-Host "   KLAP_API_KEY=klap_xxxxxxxxxxxxx" -ForegroundColor Cyan
    Write-Host "   SKIP_KLAP_VIDEO_REUPLOAD=true" -ForegroundColor Cyan
    
    Write-Host "`n3. Restart your dev server:" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Cyan
}

# Check if server is running
Write-Host "`n2️⃣ Checking if development server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Development server is running" -ForegroundColor Green
        
        # Run full diagnostics if server is up
        Write-Host "`n3️⃣ Running full diagnostics..." -ForegroundColor Yellow
        Write-Host "Please sign in to the app first, then press Enter to continue..." -ForegroundColor Cyan
        Read-Host
        
        try {
            $diagUrl = "http://localhost:3000/api/diagnose-klap"
            Write-Host "Fetching diagnostics from: $diagUrl" -ForegroundColor Gray
            $diag = Invoke-RestMethod -Uri $diagUrl -Method Get
            
            Write-Host "`n📊 DIAGNOSTIC RESULTS:" -ForegroundColor Cyan
            Write-Host "=====================" -ForegroundColor DarkGray
            Write-Host "Status: $($diag.status)" -ForegroundColor $(if ($diag.status -eq "READY") { "Green" } else { "Red" })
            
            Write-Host "`nChecks:" -ForegroundColor Yellow
            foreach ($check in $diag.diagnostics.checks) {
                Write-Host "  $($check.status) $($check.name): $($check.value)" -ForegroundColor White
            }
            
            if ($diag.diagnostics.recommendations.Count -gt 0) {
                Write-Host "`nRecommendations:" -ForegroundColor Yellow
                foreach ($rec in $diag.diagnostics.recommendations) {
                    Write-Host "  $rec" -ForegroundColor White
                }
            }
        } catch {
            Write-Host "❌ Could not run diagnostics. Make sure you're signed in!" -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Server returned unexpected status" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Development server is NOT running" -ForegroundColor Red
    Write-Host "   Start it with: npm run dev" -ForegroundColor Yellow
}

# Test options
Write-Host "`n4️⃣ Additional Testing Options:" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor DarkGray
Write-Host "A. Test Klap API directly with a sample video" -ForegroundColor White
Write-Host "B. Check status of a specific project" -ForegroundColor White
Write-Host "C. View detailed troubleshooting guide" -ForegroundColor White
Write-Host "D. Exit" -ForegroundColor White

$choice = Read-Host "`nEnter your choice (A/B/C/D)"

switch ($choice.ToUpper()) {
    "A" {
        Write-Host "`nTesting Klap API with sample video..." -ForegroundColor Cyan
        $testUrl = "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
        $body = @{ videoUrl = $testUrl } | ConvertTo-Json
        
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-klap-direct" -Method Post -Body $body -ContentType "application/json"
            Write-Host "✅ Klap API test successful!" -ForegroundColor Green
            $response | ConvertTo-Json -Depth 10 | Write-Host
        } catch {
            Write-Host "❌ Klap API test failed!" -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
        }
    }
    "B" {
        $projectId = Read-Host "Enter your project ID"
        $statusUrl = "http://localhost:3000/api/test-klap-status?projectId=$projectId"
        try {
            $response = Invoke-RestMethod -Uri $statusUrl -Method Get
            Write-Host "`nProject Status:" -ForegroundColor Cyan
            $response | ConvertTo-Json -Depth 10 | Write-Host
        } catch {
            Write-Host "❌ Could not get project status" -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
        }
    }
    "C" {
        Write-Host "`nOpening troubleshooting guide..." -ForegroundColor Cyan
        Start-Process "notepad.exe" "docs\QUICK_FIX_CLIPS_TIMEOUT.md"
    }
}

Write-Host "`n✨ Diagnosis complete!" -ForegroundColor Green
Write-Host "Need more help? Check docs\KLAP_PRODUCTION_TROUBLESHOOTING.md" -ForegroundColor Gray 