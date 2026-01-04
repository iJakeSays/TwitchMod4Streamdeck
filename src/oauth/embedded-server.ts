/**
 * Embedded OAuth Server
 * Runs within the plugin to handle OAuth callbacks without requiring
 * a separate terminal command.
 */

import * as http from 'http';
import * as crypto from 'crypto';
import * as url from 'url';
import { logger } from '../utils/logger';

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

export interface OAuthResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string[];
  obtained_at: number;
}

interface OAuthState {
  codeVerifier: string;
  clientId: string;
  port: number;
}

let server: http.Server | null = null;
let currentState: OAuthState | null = null;
let resolveCallback: ((result: OAuthResult) => void) | null = null;
let rejectCallback: ((error: Error) => void) | null = null;

/**
 * Generate PKCE code verifier
 */
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate PKCE code challenge
 */
function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Find an available port
 */
async function findAvailablePort(startPort: number = 3000): Promise<number> {
  return new Promise((resolve, reject) => {
    const testServer = http.createServer();
    testServer.listen(startPort, () => {
      testServer.close(() => resolve(startPort));
    });
    testServer.on('error', () => {
      if (startPort < 3100) {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(new Error('No available ports found'));
      }
    });
  });
}

/**
 * Success page HTML
 */
function getSuccessPage(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Authorization Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #9146FF 0%, #6441a5 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(0,0,0,0.3);
      border-radius: 16px;
      max-width: 400px;
    }
    h1 { margin-bottom: 16px; }
    p { opacity: 0.9; margin-bottom: 24px; }
    .checkmark {
      font-size: 64px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="checkmark">✓</div>
    <h1>Authorization Successful!</h1>
    <p>You can close this window and return to Stream Deck.</p>
    <p style="font-size: 12px; opacity: 0.7;">Your Twitch account is now connected.</p>
  </div>
  <script>
    // Auto-close after 3 seconds
    setTimeout(() => window.close(), 3000);
  </script>
</body>
</html>`;
}

/**
 * Error page HTML
 */
function getErrorPage(error: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Authorization Failed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(0,0,0,0.3);
      border-radius: 16px;
      max-width: 400px;
    }
    h1 { margin-bottom: 16px; }
    p { opacity: 0.9; }
    .error-icon { font-size: 64px; margin-bottom: 16px; }
    .error-msg {
      background: rgba(0,0,0,0.2);
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
      font-family: monospace;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">✗</div>
    <h1>Authorization Failed</h1>
    <p>Something went wrong during authentication.</p>
    <div class="error-msg">${error}</div>
    <p style="margin-top: 24px; font-size: 12px;">Please try again from Stream Deck.</p>
  </div>
</body>
</html>`;
}

/**
 * Handle the OAuth callback
 */
async function handleCallback(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const parsedUrl = url.parse(req.url || '', true);
  const { code, error, error_description } = parsedUrl.query;

  if (error) {
    const errorMsg = (error_description || error) as string;
    logger.error('OAuth error:', errorMsg);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getErrorPage(errorMsg));

    if (rejectCallback) {
      rejectCallback(new Error(errorMsg));
    }
    stopServer();
    return;
  }

  if (!code || !currentState) {
    const errorMsg = 'Invalid OAuth callback';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getErrorPage(errorMsg));

    if (rejectCallback) {
      rejectCallback(new Error(errorMsg));
    }
    stopServer();
    return;
  }

  try {
    // Exchange code for tokens
    const tokenParams = new URLSearchParams({
      client_id: currentState.clientId,
      code: code as string,
      code_verifier: currentState.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: `http://localhost:${currentState.port}/callback`
    });

    logger.info('Exchanging authorization code for tokens...');

    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokens = await tokenResponse.json() as any;

    const result: OAuthResult = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      scope: tokens.scope || SCOPES,
      obtained_at: Date.now()
    };

    logger.info('OAuth tokens obtained successfully');

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getSuccessPage());

    if (resolveCallback) {
      resolveCallback(result);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Token exchange failed:', errorMsg);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getErrorPage(errorMsg));

    if (rejectCallback) {
      rejectCallback(new Error(errorMsg));
    }
  }

  stopServer();
}

/**
 * Handle HTTP requests
 */
function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  const parsedUrl = url.parse(req.url || '', true);

  if (parsedUrl.pathname === '/callback') {
    handleCallback(req, res).catch((err) => {
      logger.error('Callback handler error:', err);
    });
  } else if (parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', port: currentState?.port }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
}

/**
 * Stop the OAuth server
 */
export function stopServer(): void {
  if (server) {
    server.close();
    server = null;
    currentState = null;
    resolveCallback = null;
    rejectCallback = null;
    logger.info('OAuth server stopped');
  }
}

/**
 * Start OAuth flow
 * Returns the authorization URL to open in browser and a promise that
 * resolves with tokens when the flow completes.
 */
export async function startOAuthFlow(
  clientId: string
): Promise<{ authUrl: string; tokenPromise: Promise<OAuthResult> }> {
  // Stop any existing server
  stopServer();

  // Find available port
  const port = await findAvailablePort();
  const redirectUri = `http://localhost:${port}/callback`;

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store state
  currentState = { codeVerifier, clientId, port };

  // Build authorization URL
  const authParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    force_verify: 'true'
  });

  const authUrl = `https://id.twitch.tv/oauth2/authorize?${authParams.toString()}`;

  // Create promise for token result
  const tokenPromise = new Promise<OAuthResult>((resolve, reject) => {
    resolveCallback = resolve;
    rejectCallback = reject;

    // Timeout after 5 minutes
    setTimeout(() => {
      if (server) {
        reject(new Error('OAuth flow timed out'));
        stopServer();
      }
    }, 5 * 60 * 1000);
  });

  // Start server
  server = http.createServer(handleRequest);

  await new Promise<void>((resolve, reject) => {
    server!.listen(port, () => {
      logger.info(`OAuth server started on port ${port}`);
      resolve();
    });
    server!.on('error', reject);
  });

  return { authUrl, tokenPromise };
}

/**
 * Check if OAuth server is running
 */
export function isServerRunning(): boolean {
  return server !== null;
}
