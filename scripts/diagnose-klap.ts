/**
 * Diagnostic script for Klap processing issues
 * Usage: npx tsx scripts/diagnose-klap.ts <projectId>
 */

import { KlapJobQueue } from '../src/lib/redis'
import { ProjectService } from '../src/lib/services/index'
import * as dotenv from 'dotenv'
import { supabaseAdmin } from '../src/lib/supabase/admin'

dotenv.config({ path: '.env.local' })

const projectId = process.argv[2]

if (!projectId) {
  console.error('Usage: npx tsx scripts/diagnose-klap.ts <projectId>')
  process.exit(1)
}

async function diagnose() {
  console.log('🔍 Diagnosing Klap processing for project:', projectId)
  console.log('=====================================\n')

  // Check environment variables
  console.log('1. Environment Variables:')
  console.log('   UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL ? '✅ Set' : '❌ Missing')
  console.log('   UPSTASH_REDIS_REST_TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN ? '✅ Set' : '❌ Missing')
  console.log('   WORKER_SECRET:', process.env.WORKER_SECRET ? '✅ Set' : '❌ Missing')
  console.log('   KLAP_API_KEY:', process.env.KLAP_API_KEY ? '✅ Set' : '❌ Missing')
  console.log()

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('❌ Redis credentials are missing! Jobs cannot be processed.')
    console.error('   Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')
    return
  }

  if (!process.env.WORKER_SECRET) {
    console.error('❌ WORKER_SECRET is missing! The cron job cannot authenticate with the worker.')
    console.error('   Please set WORKER_SECRET to any secure random string')
    return
  }

  // Check project
  console.log('2. Project Status:')
  try {
    const project = await ProjectService.getProject(projectId)
    if (!project) {
      console.error('   ❌ Project not found')
      return
    }
    console.log('   ✅ Project found')
    console.log('   Video URL:', project.video_url ? '✅ Present' : '❌ Missing')
    console.log('   Status:', project.status)
    console.log('   Klap Project ID:', project.klap_project_id || 'Not set')
    
    const clipsTask = project.tasks.find(t => t.type === 'clips')
    if (clipsTask) {
      console.log('   Clips Task Status:', clipsTask.status)
      console.log('   Clips Task Progress:', clipsTask.progress)
    } else {
      console.log('   ❌ No clips task found')
    }
  } catch (error: any) {
    console.error('   ❌ Error loading project:', error.message)
  }
  console.log()

  // Check Redis job
  console.log('3. Redis Job Status:')
  try {
    const job = await KlapJobQueue.getJobByProjectId(projectId)
    if (!job) {
      console.log('   ❌ No job found in Redis')
      console.log('   This means the job was never queued or has expired')
    } else {
      console.log('   ✅ Job found in Redis')
      console.log('   Job ID:', job.id)
      console.log('   Status:', job.status)
      console.log('   Progress:', job.progress)
      console.log('   Created:', new Date(job.createdAt).toLocaleString())
      console.log('   Updated:', new Date(job.updatedAt).toLocaleString())
      console.log('   Attempts:', job.attempts)
      if (job.error) {
        console.log('   Error:', job.error)
      }
      if (job.taskId) {
        console.log('   Klap Task ID:', job.taskId)
      }
    }
  } catch (error: any) {
    console.error('   ❌ Error checking Redis:', error.message)
  }
  console.log()

  // Test worker endpoint
  console.log('4. Testing Worker Endpoint:')
  try {
    const response = await fetch('http://localhost:3000/api/worker/klap', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WORKER_SECRET}`
      }
    })
    const result = await response.json()
    console.log('   Response Status:', response.status)
    console.log('   Response:', result)
  } catch (error: any) {
    console.error('   ❌ Worker endpoint error:', error.message)
  }
  console.log()

  // Test cron endpoint (in dev mode)
  console.log('5. Testing Cron Endpoint (GET):')
  try {
    const response = await fetch('http://localhost:3000/api/cron/klap', {
      method: 'GET'
    })
    const result = await response.json()
    console.log('   Response Status:', response.status)
    console.log('   Response:', result)
  } catch (error: any) {
    console.error('   ❌ Cron endpoint error:', error.message)
  }
}

diagnose().then(() => {
  console.log('\n✅ Diagnosis complete')
  process.exit(0)
}).catch(error => {
  console.error('\n❌ Diagnosis failed:', error)
  process.exit(1)
}) 