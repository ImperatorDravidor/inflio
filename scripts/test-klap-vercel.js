#!/usr/bin/env node

/**
 * Test script for Klap configuration on Vercel
 * Run this to verify all environment variables are set correctly
 */

const VERCEL_URL = process.argv[2];

if (!VERCEL_URL) {
  console.log('Usage: node scripts/test-klap-vercel.js <your-vercel-url>');
  console.log('Example: node scripts/test-klap-vercel.js https://inflio.vercel.app');
  process.exit(1);
}

async function testKlapSetup() {
  console.log('🔍 Testing Klap Setup on Vercel...\n');
  
  try {
    // Test debug endpoint
    console.log('1️⃣ Checking environment configuration...');
    const debugUrl = `${VERCEL_URL}/api/debug-production`;
    const debugResponse = await fetch(debugUrl);
    
    if (!debugResponse.ok) {
      console.error('❌ Debug endpoint failed:', debugResponse.status);
      return;
    }
    
    const debugData = await debugResponse.json();
    console.log('\n📊 Environment Status:');
    console.log('- KLAP_API_KEY:', debugData.environment.KLAP_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('- UPSTASH_REDIS_REST_URL:', debugData.environment.UPSTASH_REDIS_REST_URL ? '✅ Set' : '❌ Missing');
    console.log('- UPSTASH_REDIS_REST_TOKEN:', debugData.environment.UPSTASH_REDIS_REST_TOKEN ? '✅ Set' : '❌ Missing');
    console.log('- WORKER_SECRET:', debugData.environment.WORKER_SECRET ? '✅ Set' : '❌ Missing');
    console.log('- Redis Status:', debugData.redisStatus);
    
    if (debugData.missingCritical !== 'None') {
      console.log('\n⚠️  Missing Critical Variables:', debugData.missingCritical);
      console.log('\n📝 Recommendations:');
      debugData.recommendations.forEach(r => console.log(r));
      return;
    }
    
    console.log('\n✅ All critical environment variables are configured!');
    
    // Test Klap API endpoint
    console.log('\n2️⃣ Testing Klap API connectivity...');
    const klapTestUrl = `${VERCEL_URL}/api/test-klap-simple`;
    const klapResponse = await fetch(klapTestUrl);
    
    if (klapResponse.ok) {
      const klapData = await klapResponse.json();
      console.log('✅ Klap API Status:', klapData.status);
    } else {
      console.log('⚠️  Klap API test endpoint not available');
    }
    
    console.log('\n🎉 Setup Complete!');
    console.log('\nNext Steps:');
    console.log('1. Upload a short video (< 2 minutes) with "Generate Clips" enabled');
    console.log('2. Monitor the project page for processing status');
    console.log('3. Check Vercel function logs if issues occur');
    console.log('\nUseful URLs:');
    console.log(`- Debug Info: ${VERCEL_URL}/api/debug-production`);
    console.log(`- Vercel Logs: https://vercel.com/[your-team]/[your-project]/functions`);
    console.log('- Upstash Console: https://console.upstash.com');
    
  } catch (error) {
    console.error('❌ Error testing setup:', error.message);
    console.log('\nMake sure:');
    console.log('1. The URL is correct (include https://)');
    console.log('2. The deployment is complete');
    console.log('3. You have internet connection');
  }
}

testKlapSetup(); 