/**
 * Simple YouTube OAuth - Copy from URL Bar
 * Run: node scripts/get-youtube-token-simple.js
 */

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => readline.question(question, resolve));
}

async function main() {
  const clientId = '22661032341-1hi7dt8dl5bmq7avh5i3tal9hk5qgokt.apps.googleusercontent.com';
  const clientSecret = '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';
  const redirectUri = 'http://localhost:9000'; // Simple localhost

  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
    access_type: 'offline',
    prompt: 'consent'
  });

  console.log('\n🎥 YouTube OAuth Setup\n');
  console.log('STEP 1: Add redirect URI to Google Console');
  console.log('   Go to: https://console.cloud.google.com/apis/credentials');
  console.log('   Click your OAuth 2.0 Client ID');
  console.log('   Under "Authorized redirect URIs", click "+ ADD URI"');
  console.log('   Add: http://localhost:9000');
  console.log('   Click SAVE\n');

  await ask('Press ENTER after you added the redirect URI...');

  console.log('\nSTEP 2: Authorize the app');
  console.log('   1. Open this URL:\n');
  console.log(`   ${authUrl}\n`);
  console.log('   2. Authorize the app');
  console.log('   3. You\'ll see an error page - that\'s OK!');
  console.log('   4. Look at the URL bar - it will have: http://localhost:9000/?code=XXXXX');
  console.log('   5. Copy everything after "code=" until the "&" (or end of URL)\n');

  const code = await ask('Paste the code here: ');

  if (!code) {
    console.error('❌ No code provided');
    process.exit(1);
  }

  try {
    console.log('\n⏳ Getting refresh token...\n');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code.trim(),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await response.json();

    if (tokens.error) {
      console.error('❌ Error:', tokens.error_description || tokens.error);
      process.exit(1);
    }

    if (!tokens.refresh_token) {
      console.error('❌ No refresh token received');
      process.exit(1);
    }

    console.log('✅ SUCCESS! Add this line to your .env.local:\n');
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    console.log('🎉 Clips service is now ready!\n');

    readline.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
