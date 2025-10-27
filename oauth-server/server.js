/**
 * Local OAuth Callback Server for Twitch Stream Deck Plugin
 *
 * This server handles the OAuth 2.0 flow with PKCE:
 * 1. Opens browser to Twitch authorization page
 * 2. Receives callback with authorization code
 * 3. Exchanges code for access/refresh tokens
 * 4. Saves tokens to plugin settings
 * 5. Shows success page
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const open = require('open');

const app = express();
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

// Required Twitch scopes
const SCOPES = [
  'moderator:manage:chat_messages',
  'moderator:manage:chat_settings',
  'moderator:manage:automod',
  'moderator:manage:shield_mode',
  'channel:manage:broadcast',
  'clips:edit',
  'moderator:read:followers',
  'channel:read:subscriptions',
  'channel:read:redemptions',
  'channel:manage:redemptions',
  'moderator:manage:announcements',
  'moderator:manage:shoutouts',
  'channel:manage:polls',
  'channel:manage:predictions',
  'channel:read:ads'
];

// Store PKCE verifier in memory (cleared after use)
let codeVerifier = null;
let clientId = null;

/**
 * Generate PKCE code verifier
 */
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate PKCE code challenge
 */
function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Load configuration from file or environment
 */
function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    clientId = config.clientId;
    console.log('✓ Loaded config from config.json');
    return config;
  }

  // Try environment variables
  clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    console.error('\n❌ ERROR: No Twitch Client ID found!');
    console.error('\nPlease either:');
    console.error('1. Create oauth-server/config.json with your clientId');
    console.error('2. Set TWITCH_CLIENT_ID environment variable');
    console.error('\nSee oauth-server/config.example.json for format.\n');
    process.exit(1);
  }

  return { clientId };
}

/**
 * Save tokens to a file that the plugin can read
 */
function saveTokens(tokens) {
  const tokensPath = path.join(__dirname, '..', '.oauth-tokens.json');
  const data = {
    ...tokens,
    obtained_at: Date.now()
  };

  fs.writeFileSync(tokensPath, JSON.stringify(data, null, 2));
  console.log('✓ Tokens saved to .oauth-tokens.json');
  console.log('  You can now copy these into your Stream Deck plugin settings');
}

// Serve static files (success/error pages)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Start OAuth flow
 * Visit http://localhost:3000/auth to begin
 */
app.get('/auth', (req, res) => {
  const config = loadConfig();

  // Generate PKCE parameters
  codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Build authorization URL
  const authUrl = new URL('https://id.twitch.tv/oauth2/authorize');
  authUrl.searchParams.append('client_id', config.clientId);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', SCOPES.join(' '));
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('force_verify', 'true');

  console.log('\n→ Redirecting to Twitch authorization...');
  res.redirect(authUrl.toString());
});

/**
 * OAuth callback endpoint
 * Twitch redirects here after user authorizes
 */
app.get('/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  // Handle authorization errors
  if (error) {
    console.error(`❌ Authorization error: ${error} - ${error_description}`);
    return res.redirect(`/error.html?error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code) {
    console.error('❌ No authorization code received');
    return res.redirect('/error.html?error=No authorization code received');
  }

  if (!codeVerifier) {
    console.error('❌ No code verifier found - did you start from /auth?');
    return res.redirect('/error.html?error=Invalid OAuth flow');
  }

  console.log('✓ Authorization code received');

  try {
    // Exchange code for tokens
    const tokenUrl = 'https://id.twitch.tv/oauth2/token';
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    });

    console.log('→ Exchanging code for tokens...');

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Save tokens
    saveTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      scope: tokens.scope || SCOPES
    });

    // Clear code verifier
    codeVerifier = null;

    console.log('✅ OAuth flow completed successfully!\n');

    // Redirect to success page
    res.redirect('/success.html');

  } catch (error) {
    console.error('❌ Token exchange failed:', error.message);
    res.redirect(`/error.html?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

/**
 * Start the server
 */
function startServer() {
  const config = loadConfig();

  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Twitch OAuth Server Started');
    console.log('='.repeat(60));
    console.log(`\nServer running at: http://localhost:${PORT}`);
    console.log(`Redirect URI: ${REDIRECT_URI}`);
    console.log(`Client ID: ${config.clientId.substring(0, 8)}...`);
    console.log('\n' + '='.repeat(60));
    console.log('NEXT STEPS:');
    console.log('='.repeat(60));
    console.log('\n1. Make sure your Twitch app has this redirect URI:');
    console.log(`   ${REDIRECT_URI}`);
    console.log('\n2. Open your browser to start OAuth flow:');
    console.log(`   http://localhost:${PORT}/auth`);
    console.log('\n3. After authorization, tokens will be saved to:');
    console.log('   .oauth-tokens.json');
    console.log('\n4. Copy tokens into Stream Deck plugin settings');
    console.log('\n' + '='.repeat(60) + '\n');

    // Auto-open browser in dev mode
    if (process.argv.includes('--dev')) {
      console.log('→ Opening browser...\n');
      setTimeout(() => {
        open(`http://localhost:${PORT}/auth`);
      }, 1000);
    }
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down OAuth server...');
  process.exit(0);
});

// Start server
startServer();
