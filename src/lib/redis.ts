import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Job status types
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface KlapJob {
  id: string
  projectId: string
  videoUrl: string
  status: JobStatus
  progress: number
  taskId?: string
  folderId?: string
  clips?: any[]
  error?: string
  createdAt: number
  updatedAt: number
  attempts: number
  startedAt?: number
}

// Job queue keys
const REDIS_PREFIX = 'klap'
export const REDIS_KEYS = {
  jobQueue: 'klap:jobs:queue',
  jobData: (jobId: string) => `klap:job:${jobId}`,
  projectJob: (projectId: string) => `klap:project:${projectId}:job`,
  processingJobs: 'klap:jobs:processing',
} as const

// Job queue operations
export class KlapJobQueue {
  /**
   * Create a new job
   */
  static async createJob(projectId: string, videoUrl: string): Promise<KlapJob> {
    const jobId = `job_${projectId}_${Date.now()}`
    
    const job: KlapJob = {
      id: jobId,
      projectId,
      videoUrl,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attempts: 0,
    }

    // Store job data
    await redis.setex(
      REDIS_KEYS.jobData(jobId),
      86400, // 24 hours TTL
      JSON.stringify(job)
    )

    // Map project to job
    await redis.setex(
      REDIS_KEYS.projectJob(projectId),
      86400,
      jobId
    )

    // Add to queue
    await redis.lpush(REDIS_KEYS.jobQueue, jobId)
    
    console.log(`[Redis] Job ${jobId} queued for project ${projectId}`)

    return job
  }

  /**
   * Get next job from queue
   */
  static async getNextJob(): Promise<KlapJob | null> {
    // Move job from queue to processing (atomically)
    const jobId = await redis.lmove(
      REDIS_KEYS.jobQueue,
      REDIS_KEYS.processingJobs,
      'right',
      'left'
    ) as string | null
    
    if (!jobId) return null
    
    console.log(`[Redis] Moving job ${jobId} from queue to processing`)

    // Get job data
    const jobData = await redis.get<KlapJob>(REDIS_KEYS.jobData(jobId))
    if (!jobData) {
      // Remove from processing if data not found
      await redis.lrem(REDIS_KEYS.processingJobs, 0, jobId)
      return null
    }

    // Update status
    const updatedJob: KlapJob = {
      ...jobData,
      status: 'processing',
      startedAt: Date.now(),
      updatedAt: Date.now(),
      attempts: jobData.attempts + 1
    }

    await redis.setex(
      REDIS_KEYS.jobData(jobId),
      86400,
      JSON.stringify(updatedJob)
    )

    return updatedJob
  }

  /**
   * Get job by project ID
   */
  static async getJobByProjectId(projectId: string): Promise<KlapJob | null> {
    const jobId = await redis.get<string>(REDIS_KEYS.projectJob(projectId))
    if (!jobId) return null

    const jobData = await redis.get<KlapJob>(REDIS_KEYS.jobData(jobId))
    if (!jobData) return null

    return jobData
  }

  /**
   * Update job progress
   */
  static async updateJob(jobId: string, updates: Partial<KlapJob>): Promise<void> {
    const jobData = await redis.get<KlapJob>(REDIS_KEYS.jobData(jobId))
    if (!jobData) throw new Error('Job not found')

    const updatedJob = {
      ...jobData,
      ...updates,
      updatedAt: Date.now()
    }

    await redis.setex(
      REDIS_KEYS.jobData(jobId),
      86400,
      JSON.stringify(updatedJob)
    )
  }

  /**
   * Complete job with clips
   */
  static async completeJob(jobId: string, clips: any[]): Promise<void> {
    await this.updateJob(jobId, {
      status: 'completed',
      clips,
      progress: 100,
    })

    // Remove from processing
    await redis.lrem(REDIS_KEYS.processingJobs, 0, jobId)
  }

  /**
   * Mark job as failed
   */
  static async failJob(jobId: string, error: string): Promise<void> {
    const jobData = await redis.get<KlapJob>(REDIS_KEYS.jobData(jobId))
    if (!jobData) return

    // Check retry limit
    if (jobData.attempts < 3) {
      // Requeue for retry
      await this.updateJob(jobId, {
        status: 'queued',
        error,
      })
      await redis.lpush(REDIS_KEYS.jobQueue, jobId)
    } else {
      // Mark as failed
      await this.updateJob(jobId, {
        status: 'failed',
        error,
      })
    }

    // Remove from processing
    await redis.lrem(REDIS_KEYS.processingJobs, 0, jobId)
  }

  /**
   * Clean up stale jobs
   */
  static async cleanupStaleJobs(): Promise<void> {
    const processingJobs = await redis.lrange<string>(REDIS_KEYS.processingJobs, 0, -1)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000

    for (const jobId of processingJobs) {
      const jobData = await redis.get<KlapJob>(REDIS_KEYS.jobData(jobId))
      if (!jobData) {
        await redis.lrem(REDIS_KEYS.processingJobs, 0, jobId)
        continue
      }

      if (jobData.updatedAt < tenMinutesAgo) {
        // Job is stale, requeue or fail
        await this.failJob(jobId, 'Job timed out')
      }
    }
  }
} 