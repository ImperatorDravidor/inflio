import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  // Check authentication
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to run diagnostics' }, { status: 401 })
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: [] as any[],
    recommendations: [] as string[],
    testCommands: [] as string[]
  }

  // Check 1: KLAP_API_KEY
  const hasKlapKey = !!process.env.KLAP_API_KEY
  const klapKeyPreview = hasKlapKey 
    ? `${process.env.KLAP_API_KEY!.substring(0, 10)}...` 
    : 'NOT SET'
  
  diagnostics.checks.push({
    name: 'KLAP_API_KEY Environment Variable',
    status: hasKlapKey ? '✅ PASS' : '❌ FAIL',
    value: klapKeyPreview,
    critical: true
  })

  if (!hasKlapKey) {
    diagnostics.recommendations.push(
      '🚨 CRITICAL: KLAP_API_KEY is not set!',
      '1. Go to https://klap.app and sign in',
      '2. Navigate to Developer Settings or API Keys',
      '3. Generate or copy your API key',
      '4. Add to your .env.local file: KLAP_API_KEY=klap_xxxxx',
      '5. Restart your development server'
    )
  }

  // Check 2: SKIP_KLAP_VIDEO_REUPLOAD
  const skipReupload = process.env.SKIP_KLAP_VIDEO_REUPLOAD !== 'false'
  diagnostics.checks.push({
    name: 'SKIP_KLAP_VIDEO_REUPLOAD Setting',
    status: skipReupload ? '✅ ENABLED' : '⚠️ DISABLED',
    value: skipReupload ? 'true (recommended)' : 'false',
    critical: false
  })

  if (!skipReupload) {
    diagnostics.recommendations.push(
      '⚠️ Performance: Enable SKIP_KLAP_VIDEO_REUPLOAD=true for 3-5x faster processing'
    )
  }

  // Check 3: Test Klap API connectivity (only if key exists)
  if (hasKlapKey) {
    try {
      const testResponse = await fetch('https://api.klap.app/v2/tasks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      diagnostics.checks.push({
        name: 'Klap API Connectivity',
        status: testResponse.ok ? '✅ PASS' : '❌ FAIL',
        value: `Status: ${testResponse.status} ${testResponse.statusText}`,
        critical: true
      })

      if (!testResponse.ok) {
        const errorText = await testResponse.text()
        let errorInfo = errorText

        try {
          const errorJson = JSON.parse(errorText)
          errorInfo = errorJson.message || errorJson.error || errorText
        } catch {}

        if (testResponse.status === 401) {
          diagnostics.recommendations.push(
            '❌ Invalid API Key: Your KLAP_API_KEY is not valid',
            '1. Double-check the key in your .env.local file',
            '2. Make sure there are no extra spaces or quotes',
            '3. Generate a new key from https://klap.app if needed'
          )
        } else if (testResponse.status === 429) {
          diagnostics.recommendations.push(
            '⚠️ Rate Limited: You\'ve exceeded Klap API limits',
            '1. Wait a few minutes before trying again',
            '2. Check your Klap dashboard for usage limits',
            '3. Consider upgrading your Klap plan'
          )
        } else {
          diagnostics.recommendations.push(
            `❌ API Error ${testResponse.status}: ${errorInfo}`,
            'Contact Klap support if this persists'
          )
        }
      } else {
        // Try to get account info if possible
        const tasks = await testResponse.json()
        diagnostics.checks.push({
          name: 'Klap Account Status',
          status: '✅ ACTIVE',
          value: Array.isArray(tasks) ? `${tasks.length} recent tasks` : 'Connected',
          critical: false
        })
      }
    } catch (error) {
      diagnostics.checks.push({
        name: 'Klap API Connectivity',
        status: '❌ FAIL',
        value: error instanceof Error ? error.message : 'Network error',
        critical: true
      })
      
      diagnostics.recommendations.push(
        '❌ Network Error: Cannot reach Klap API',
        '1. Check your internet connection',
        '2. Check if https://api.klap.app is accessible',
        '3. Check for firewall or proxy issues'
      )
    }
  }

  // Check 4: Other required environment variables
  const requiredEnvVars = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', display: 'Supabase URL' },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', display: 'Supabase Anon Key' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', display: 'Supabase Service Key' },
    { name: 'OPENAI_API_KEY', display: 'OpenAI API Key' }
  ]

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name]
    diagnostics.checks.push({
      name: envVar.display,
      status: value ? '✅ SET' : '⚠️ NOT SET',
      value: value ? `${value.substring(0, 20)}...` : 'Missing',
      critical: envVar.name.includes('SUPABASE')
    })
  }

  // Test commands
  diagnostics.testCommands = [
    '# Test with a sample video (replace VIDEO_URL with actual URL):',
    'curl -X POST http://localhost:3000/api/test-klap-direct \\',
    '  -H "Content-Type: application/json" \\',
    '  -d \'{"videoUrl": "VIDEO_URL"}\''
  ]

  // Overall status
  const criticalFails = diagnostics.checks.filter(c => c.critical && c.status.includes('FAIL'))
  const overallStatus = criticalFails.length === 0 ? 'READY' : 'NOT READY'

  // Summary recommendations
  if (overallStatus === 'READY') {
    diagnostics.recommendations.unshift(
      '✅ Klap integration appears to be configured correctly!',
      'If clips are still not generating, try:',
      '1. Upload a short test video (< 5 minutes)',
      '2. Check browser console for errors',
      '3. Check server logs for [Klap] messages'
    )
  } else {
    diagnostics.recommendations.unshift(
      `❌ ${criticalFails.length} critical issue(s) found - fix these first!`
    )
  }

  return NextResponse.json({
    status: overallStatus,
    diagnostics,
    nextSteps: overallStatus === 'READY' 
      ? ['Try generating clips with a test video', 'Monitor server logs for progress']
      : ['Fix the critical issues listed above', 'Run diagnostics again after fixing']
  }, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  })
} 