import { Redis } from '@upstash/redis'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function testRedis() {
  console.log('Testing Redis connection...')
  
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    
    // Test basic operations
    await redis.set('test-key', 'test-value')
    const value = await redis.get('test-key')
    
    console.log('✅ Redis connected successfully!')
    console.log('   Test value:', value)
    
    // Test job queue
    await redis.lpush('test-queue', 'job1')
    const job = await redis.rpop('test-queue')
    console.log('   Queue test:', job)
    
    // Clean up
    await redis.del('test-key')
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
  }
}

testRedis() 