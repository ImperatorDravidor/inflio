Write-Host "Testing Klap API..." -ForegroundColor Cyan

# Replace with your actual project ID
$projectId = Read-Host "Enter your project ID"

# Test 1: Check project status
Write-Host "`nTest 1: Checking project status..." -ForegroundColor Yellow
$statusUrl = "https://www.inflio.ai/api/test-klap-status?projectId=$projectId&debug=true"
Write-Host "URL: $statusUrl" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $statusUrl -Method Get
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n-------------------`n" -ForegroundColor DarkGray

# Test 2: Direct Klap API test
Write-Host "Test 2: Testing Klap API directly..." -ForegroundColor Yellow
Write-Host "Do you want to test with a video URL? (y/n)" -ForegroundColor Cyan
$testDirect = Read-Host

if ($testDirect -eq 'y') {
    $videoUrl = Read-Host "Enter a public video URL (MP4)"
    
    $body = @{
        videoUrl = $videoUrl
    } | ConvertTo-Json
    
    try {
        Write-Host "Creating Klap task..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "https://www.inflio.ai/api/test-klap-direct" -Method Post -Body $body -ContentType "application/json"
        Write-Host "Response:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 10 | Write-Host
        
        if ($response.task.id) {
            Write-Host "`nTask created! Task ID: $($response.task.id)" -ForegroundColor Green
            Write-Host "You can check task status at:" -ForegroundColor Cyan
            Write-Host "https://www.inflio.ai/api/test-klap-direct?taskId=$($response.task.id)" -ForegroundColor White
        }
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response body: $responseBody" -ForegroundColor Red
        }
    }
}

Write-Host "`nDone!" -ForegroundColor Green 