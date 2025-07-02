#!/usr/bin/env node

/**
 * Test OAuth Configuration
 * Run with: node scripts/test-oauth-config.js or npm run test:oauth
 */

require('dotenv').config({ path: '.env.local' });

const platforms = {
  google: {
    envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    name: 'Google (YouTube)',
    setupUrl: 'https://console.cloud.google.com/',
    callbackUrl: '/api/social/callback/youtube'
  },
  facebook: {
    envVars: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
    name: 'Facebook & Instagram',
    setupUrl: 'https://developers.facebook.com/',
    callbackUrl: '/api/social/callback/facebook'
  },
  twitter: {
    envVars: ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET'],
    name: 'X (Twitter)',
    setupUrl: 'https://developer.twitter.com/',
    callbackUrl: '/api/social/callback/x'
  },
  linkedin: {
    envVars: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
    name: 'LinkedIn',
    setupUrl: 'https://www.linkedin.com/developers/',
    callbackUrl: '/api/social/callback/linkedin'
  }
};

console.log('🔍 Inflio Social OAuth Configuration Check\n');
console.log('============================================\n');

let allConfigured = true;
let configuredCount = 0;

// Check App URL
console.log('📌 Core Configuration:');
console.log('---------------------');
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!appUrl) {
  console.log('❌ NEXT_PUBLIC_APP_URL is not set');
  console.log('   Add to .env.local: NEXT_PUBLIC_APP_URL=http://localhost:3000');
  allConfigured = false;
} else {
  console.log('✅ NEXT_PUBLIC_APP_URL:', appUrl);
}
console.log('\n');


console.log('📱 Platform OAuth Credentials:');
console.log('==============================\n');

for (const [key, config] of Object.entries(platforms)) {
    console.log(`${config.name}:`);
    console.log(`Developer Console: ${config.setupUrl}`);
    
    let platformConfigured = true;
    for (const envVar of config.envVars) {
        const value = process.env[envVar];
        if (!value || value === 'undefined' || value === '') {
            console.log(`  ❌ ${envVar} is not set`);
            platformConfigured = false;
            allConfigured = false;
        } else {
            console.log(`  ✅ ${envVar} is configured`);
        }
    }
    
    if (platformConfigured) {
        configuredCount++;
        console.log(`  ✅ ${config.name} is ready to connect!`);
        console.log(`  📍 Callback URL: ${appUrl || 'http://localhost:3000'}${config.callbackUrl}`);
    } else {
        console.log(`  ⚠️  ${config.name} needs configuration.`);
        console.log(`  📝 Add the missing credentials to your .env.local file.`);
    }
    console.log('');
}

console.log('================================');
console.log(`\n📊 Summary: ${configuredCount}/${Object.keys(platforms).length} platforms configured.`);

if (allConfigured && configuredCount > 0) {
    console.log('\n✅ Core OAuth setup complete!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Start your dev server: npm run dev');
    console.log('2. Go to http://localhost:3000/social and connect your accounts.');
} else if (configuredCount > 0) {
    console.log('\n⚠️  Some configuration is missing, but you can connect to the configured platforms.');
    console.log('\n🎯 Next Steps:');
    console.log('1. Fix the missing configuration items above.');
    console.log('2. For platforms that are configured, you can start connecting!');
} else {
    console.log('\n❌ No platforms are configured yet.');
    console.log('   Please add credentials to your .env.local file.');
}

console.log('\n📖 See `docs/setup/social-oauth-complete-guide.md` for detailed setup instructions.');
console.log('💬 Need help? Check the setup guide or ask for support.\n');

process.exit(allConfigured ? 0 : 1); 