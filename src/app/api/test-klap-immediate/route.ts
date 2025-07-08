import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') || '3aVyqGCVFXevEslQ'  // Your ID as default
  
  const apiKey = process.env.KLAP_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'KLAP_API_KEY not configured' }, { status: 500 })
  }

  const results = {
    id,
    length: id.length,
    attempts: [] as any[]
  }

  // Try 1: As a task
  try {
    const taskResponse = await fetch(`https://api.klap.app/v2/tasks/${id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    const taskData = taskResponse.ok ? await taskResponse.json() : await taskResponse.text()
    results.attempts.push({
      endpoint: `/tasks/${id}`,
      status: taskResponse.status,
      success: taskResponse.ok,
      data: taskData
    })
  } catch (error) {
    results.attempts.push({
      endpoint: `/tasks/${id}`,
      error: error instanceof Error ? error.message : 'Failed'
    })
  }

  // Try 2: As a project/folder  
  try {
    const projectResponse = await fetch(`https://api.klap.app/v2/projects/${id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    const projectData = projectResponse.ok ? await projectResponse.json() : await projectResponse.text()
    results.attempts.push({
      endpoint: `/projects/${id}`,
      status: projectResponse.status,
      success: projectResponse.ok,
      data: projectData
    })
  } catch (error) {
    results.attempts.push({
      endpoint: `/projects/${id}`,
      error: error instanceof Error ? error.message : 'Failed'
    })
  }

  // Try 3: If it's 16 chars, try trimming to 12 or 8
  if (id.length === 16) {
    const id12 = id.substring(0, 12)
    const id8 = id.substring(0, 8)
    
    try {
      const response12 = await fetch(`https://api.klap.app/v2/projects/${id12}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      results.attempts.push({
        endpoint: `/projects/${id12} (trimmed to 12)`,
        status: response12.status,
        success: response12.ok,
        data: response12.ok ? await response12.json() : await response12.text()
      })
    } catch (error) {}
    
    try {
      const response8 = await fetch(`https://api.klap.app/v2/projects/${id8}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      results.attempts.push({
        endpoint: `/projects/${id8} (trimmed to 8)`,
        status: response8.status,
        success: response8.ok,
        data: response8.ok ? await response8.json() : await response8.text()
      })
    } catch (error) {}
  }

  return NextResponse.json(results)
} 