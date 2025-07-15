// Health check utilities for monitoring system status

import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'
import { validateEnv } from './env-validation'
import { openai, getOpenAI } from './openai'
import { KlapAPIService } from './klap-api'

export interface HealthCheckResult {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  error?: string
  details?: Record<string, any>
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: HealthCheckResult[]
  summary: {
    healthy: number
    degraded: number
    unhealthy: number
  }
}

/**
 * Check Supabase database connection
 */
async function checkSupabase(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    const env = validateEnv()
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Simple query to verify connection
    const { error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
      .single()
    
    const responseTime = Date.now() - start
    
    if (error) {
      return {
        service: 'supabase',
        status: 'unhealthy',
        responseTime,
        error: error.message
      }
    }
    
    return {
      service: 'supabase',
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime
    }
  } catch (error) {
    return {
      service: 'supabase',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check OpenAI API connection
 */
async function checkOpenAI(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    const env = validateEnv()
    
    if (!env.OPENAI_API_KEY || !openai) {
      return {
        service: 'openai',
        status: 'unhealthy',
        error: 'OpenAI API key not configured'
      }
    }
    
    // Use getOpenAI() which handles null case
    const openaiClient = getOpenAI()
    
    // Simple completion to verify API access
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5
    })
    
    const responseTime = Date.now() - start
    
    return {
      service: 'openai',
      status: responseTime > 2000 ? 'degraded' : 'healthy',
      responseTime,
      details: {
        model: response.model,
        usage: response.usage
      }
    }
  } catch (error) {
    return {
      service: 'openai',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check Klap API connection
 */
async function checkKlap(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    const env = validateEnv()
    
    if (!env.KLAP_API_KEY) {
      return {
        service: 'klap',
        status: 'unhealthy',
        error: 'Klap API key not configured'
      }
    }
    
    // Check if we can get task status (lightweight endpoint)
    const testTaskId = 'health-check-test'
    try {
      await KlapAPIService['request'](`/tasks/${testTaskId}`)
    } catch (error: any) {
      // 404 is expected for non-existent task, but it means API is responding
      if (error.message?.includes('404')) {
        const responseTime = Date.now() - start
        return {
          service: 'klap',
          status: responseTime > 1000 ? 'degraded' : 'healthy',
          responseTime
        }
      }
      throw error
    }
    
    const responseTime = Date.now() - start
    return {
      service: 'klap',
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime
    }
  } catch (error) {
    return {
      service: 'klap',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check Clerk authentication service
 */
async function checkClerk(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    const env = validateEnv()
    
    if (!env.CLERK_SECRET_KEY) {
      return {
        service: 'clerk',
        status: 'unhealthy',
        error: 'Clerk secret key not configured'
      }
    }
    
    // Make a simple API call to verify Clerk is accessible
    const response = await fetch('https://api.clerk.com/v1/users?limit=1', {
      headers: {
        'Authorization': `Bearer ${env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    const responseTime = Date.now() - start
    
    if (!response.ok) {
      return {
        service: 'clerk',
        status: 'unhealthy',
        responseTime,
        error: `Clerk API returned ${response.status}`
      }
    }
    
    return {
      service: 'clerk',
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime
    }
  } catch (error) {
    return {
      service: 'clerk',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check system memory usage
 */
async function checkMemory(): Promise<HealthCheckResult> {
  try {
    if (typeof process === 'undefined') {
      return {
        service: 'memory',
        status: 'healthy',
        details: { note: 'Memory check not available in browser' }
      }
    }
    
    const used = process.memoryUsage()
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024)
    const rssMB = Math.round(used.rss / 1024 / 1024)
    
    // Warning thresholds
    const heapWarning = heapUsedMB > 400 // 400MB heap usage
    const rssWarning = rssMB > 512 // 512MB total memory
    
    return {
      service: 'memory',
      status: heapWarning || rssWarning ? 'degraded' : 'healthy',
      details: {
        heapUsedMB,
        heapTotalMB,
        rssMB,
        heapUsagePercent: Math.round((heapUsedMB / heapTotalMB) * 100)
      }
    }
  } catch (error) {
    return {
      service: 'memory',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Run all health checks
 */
export async function runHealthChecks(): Promise<SystemHealth> {
  const checks = await Promise.all([
    checkSupabase(),
    checkOpenAI(),
    checkKlap(),
    checkClerk(),
    checkMemory()
  ])
  
  const summary = {
    healthy: checks.filter(c => c.status === 'healthy').length,
    degraded: checks.filter(c => c.status === 'degraded').length,
    unhealthy: checks.filter(c => c.status === 'unhealthy').length
  }
  
  const overallStatus = summary.unhealthy > 0 
    ? 'unhealthy' 
    : summary.degraded > 0 
    ? 'degraded' 
    : 'healthy'
  
  const result: SystemHealth = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    summary
  }
  
  // Log health check results
  logger.info('Health check completed', {
    action: 'health_check',
    metadata: {
      status: overallStatus,
      summary,
      services: checks.map(c => ({
        service: c.service,
        status: c.status,
        responseTime: c.responseTime
      }))
    }
  })
  
  return result
}

/**
 * Create health check endpoint handler
 */
export async function handleHealthCheck(
  request: Request
): Promise<Response> {
  try {
    const health = await runHealthChecks()
    
    return new Response(JSON.stringify(health, null, 2), {
      status: health.status === 'unhealthy' ? 503 : 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    logger.error('Health check failed', {
      action: 'health_check_error'
    }, error as Error)
    
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  }
} 