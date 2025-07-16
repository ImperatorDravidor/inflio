/**
 * Manually trigger the Klap cron job
 * Usage: node scripts/trigger-klap-cron.js
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

async function triggerCron() {
  console.log('🚀 Triggering Klap cron job...')
  
  try {
    const response = await fetch('http://localhost:3000/api/cron/klap', {
      method: 'GET' // Using GET for dev mode
    })
    
    const result = await response.json()
    
    console.log('Response Status:', response.status)
    console.log('Result:', JSON.stringify(result, null, 2))
    
    if (response.ok) {
      console.log('✅ Cron job triggered successfully')
    } else {
      console.error('❌ Cron job failed')
    }
  } catch (error) {
    console.error('❌ Error triggering cron:', error.message)
  }
}

triggerCron() 