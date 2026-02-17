/**
 * YouTube OAuth Setup Script
 * Generates refresh token for YouTube Data API v3
 * Run: node scripts/setup-youtube-oauth.js
 */

const http = require('http');
const { URL } = require('url');

// Configuration
const PORT = 3001;
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl'
];

console.log('\n🎥 YouTube OAuth Setup for Inflio Clips Service\n');
console.log('📋 Step 1: Get YouTube API Credentials');
console.log('   1. Go to: https://console.cloud.google.com/');
console.log('   2. Create/select project');
console.log('   3. Enable "YouTube Data API v3"');
console.log('   4. Go to Credentials → Create OAuth 2.0 Client ID');
console.log('   5. Application type: Web application');
console.log(`   6. Add redirect URI: http://localhost:${PORT}/callback`);
console.log('   7. Copy Client ID and Client Secret\n');

// Get credentials from user
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => readline.question(question, resolve));
}

async function main() {
  const clientId = await ask('Enter YouTube CLIENT_ID: ');
  const clientSecret = await ask('Enter YouTube CLIENT_SECRET: ');

  if (!clientId || !clientSecret) {
    console.error('❌ Client ID and Secret are required');
    process.exit(1);
  }

  const redirectUri = `http://localhost:${PORT}/callback`;
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent'
  });

  console.log('\n📋 Step 2: Authorize the application');
  console.log(`   Open this URL in your browser:\n`);
  console.log(`   ${authUrl}\n`);
  console.log(`   Waiting for callback on http://localhost:${PORT}/callback ...\n`);

  // Create temporary server to receive OAuth callback
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>❌ Error: No authorization code received</h1>');
        server.close();
        process.exit(1);
      }

      try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
          })
        });

        const tokens = await tokenResponse.json();

        if (!tokens.refresh_token) {
          throw new Error('No refresh token received. Make sure you set prompt=consent.');
        }

        // Success page
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>YouTube OAuth Success</title></head>
            <body style="font-family: system-ui; max-width: 800px; margin: 50px auto; padding: 20px;">
              <h1 style="color: green;">✅ YouTube OAuth Setup Complete!</h1>
              <p>You can close this window and return to the terminal.</p>
            </body>
          </html>
        `);

        console.log('\n✅ Success! Add these to your .env.local file:\n');
        console.log(`YOUTUBE_CLIENT_ID=${clientId}`);
        console.log(`YOUTUBE_CLIENT_SECRET=${clientSecret}`);
        console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log(`YOUTUBE_OAUTH_CALLBACK_URL=http://localhost:${PORT}/callback`);
        console.log('\n🎉 Setup complete! The clips service is ready to use.\n');

        server.close();
        readline.close();
        process.exit(0);

      } catch (error) {
        console.error('\n❌ Token exchange failed:', error.message);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>❌ Token exchange failed</h1><p>Check console for details</p>');
        server.close();
        process.exit(1);
      }
    }
  });

  server.listen(PORT, () => {
    console.log(`   Local server listening on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
