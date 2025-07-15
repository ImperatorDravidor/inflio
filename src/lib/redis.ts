import { Redis } from '@upstash/redis'

// Initialize Redis client
export const redis = new Redis({
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
}

// Job queue keys
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

    // Add to queue
    await redis.lpush(REDIS_KEYS.jobQueue, jobId)

    // Map project to job
    await redis.setex(
      REDIS_KEYS.projectJob(projectId),
      86400,
      jobId
    )

    return job
  }

  /**
   * Get next job from queue
   */
  static async getNextJob(): Promise<KlapJob | null> {
    // Pop from queue
    const jobId = await redis.rpop<string>(REDIS_KEYS.jobQueue)
    if (!jobId) return null

    // Add to processing list
    await redis.lpush(REDIS_KEYS.processingJobs, jobId)

    const jobData = await redis.get<string>(REDIS_KEYS.jobData(jobId))
    if (!jobData) {
      // Remove from processing if data not found
      await redis.lrem(REDIS_KEYS.processingJobs, 0, jobId)
      return null
    }

    const job = JSON.parse(jobData) as KlapJob
    
    // Update status
    job.status = 'processing'
    job.updatedAt = Date.now()
    job.attempts++
    
    await redis.setex(
      REDIS_KEYS.jobData(jobId),
      86400,
      JSON.stringify(job)
    )

    return job
  }

  /**
   * Get job by project ID
   */
  static async getJobByProjectId(projectId: string): Promise<KlapJob | null> {
    const jobId = await redis.get<string>(REDIS_KEYS.projectJob(projectId))
    if (!jobId) return null

    const jobData = await redis.get<string>(REDIS_KEYS.jobData(jobId))
    if (!jobData) return null

    return JSON.parse(jobData) as KlapJob
  }

  /**
   * Update job progress
   */
  static async updateJob(jobId: string, updates: Partial<KlapJob>): Promise<void> {
    const jobData = await redis.get<string>(REDIS_KEYS.jobData(jobId))
    if (!jobData) throw new Error('Job not found')

    const job = JSON.parse(jobData) as KlapJob
    const updatedJob = {
      ...job,
      ...updates,
      updatedAt: Date.now(),
    }

    await redis.setex(
      REDIS_KEYS.jobData(jobId),
      86400,
      JSON.stringify(updatedJob)
    )
  }

  /**
   * Complete job
   */
  static async completeJob(jobId: string, clips: any[]): Promise<void> {
    await this.updateJob(jobId, {
      status: 'completed',
      progress: 100,
      clips,
    })

    // Remove from processing list
    await redis.lrem(REDIS_KEYS.processingJobs, 0, jobId)
  }

  /**
   * Fail job
   */
  static async failJob(jobId: string, error: string): Promise<void> {
    const jobData = await redis.get<string>(REDIS_KEYS.jobData(jobId))
    if (!jobData) return

    const job = JSON.parse(jobData) as KlapJob
    
    await this.updateJob(jobId, {
      status: 'failed',
      error,
    })

    // Remove from processing list
    await redis.lrem(REDIS_KEYS.processingJobs, 0, jobId)

    // If attempts < 3, requeue
    if (job.attempts < 3) {
      await redis.lpush(REDIS_KEYS.jobQueue, jobId)
    }
  }

  /**
   * Clean up stale jobs
   */
  static async cleanupStaleJobs(): Promise<void> {
    const processingJobs = await redis.lrange(REDIS_KEYS.processingJobs, 0, -1)
    
    for (const jobId of processingJobs) {
      const jobData = await redis.get<string>(REDIS_KEYS.jobData(jobId))
      if (!jobData) {
        await redis.lrem(REDIS_KEYS.processingJobs, 0, jobId)
        continue
      }

      const job = JSON.parse(jobData) as KlapJob
      const staleTime = Date.now() - job.updatedAt

      // If job hasn't been updated in 10 minutes, consider it stale
      if (staleTime > 600000) {
        await this.failJob(jobId, 'Job timed out')
      }
    }
  }
} 