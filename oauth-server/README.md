# OAuth Callback Server

Local OAuth 2.0 server for authenticating with Twitch. This handles the complete OAuth flow with PKCE for the Stream Deck plugin.

## Quick Start

### 1. Create Configuration File

```bash
cd oauth-server
cp config.example.json config.json
```

Edit `config.json` with your Twitch application credentials:

```json
{
  "clientId": "your_actual_client_id_here"
}
```

### 2. Get Your Twitch Client ID

1. Visit https://dev.twitch.tv/console/apps
2. Click "Register Your Application" (or select existing app)
3. Fill in:
   - **Name**: Stream Deck Mod Tools (or your choice)
   - **OAuth Redirect URLs**: `http://localhost:3000/callback`
   - **Category**: Application Integration
4. Click "Manage" and copy your **Client ID**
5. Paste it into `oauth-server/config.json`

### 3. Start the OAuth Server

```bash
npm run oauth-server
```

Or with auto-open browser:

```bash
npm run oauth-server:dev
```

### 4. Authorize with Twitch

1. Open your browser to: http://localhost:3000/auth
2. Click "Authorize" on the Twitch page
3. You'll be redirected to a success page
4. Tokens are saved to `.oauth-tokens.json`

### 5. Copy Tokens to Plugin

The tokens are saved in `.oauth-tokens.json` in the project root. You can:

**Option A: Manual Copy**
1. Open `.oauth-tokens.json`
2. Copy the `access_token` and `refresh_token`
3. Paste into Stream Deck plugin settings

**Option B: Automatic (Future)**
The plugin will eventually read this file automatically.

## How It Works

### OAuth Flow with PKCE

1. **User clicks "Authenticate"** in plugin settings
2. **Server generates** PKCE code verifier and challenge
3. **Browser opens** to Twitch authorization page
4. **User authorizes** the application
5. **Twitch redirects** back to `http://localhost:3000/callback` with code
6. **Server exchanges** authorization code for tokens
7. **Tokens saved** to `.oauth-tokens.json`
8. **Success page** displayed to user

### Required Scopes

The server requests these scopes from Twitch:

- `moderator:manage:chat_messages` - Clear chat, delete messages
- `moderator:manage:chat_settings` - Slow mode, emote-only, etc.
- `moderator:manage:automod` - AutoMod approvals/denials
- `moderator:manage:shield_mode` - Shield Mode control
- `channel:manage:broadcast` - Stream markers, categories
- `clips:edit` - Create clips
- `moderator:read:followers` - Follower count
- `channel:read:subscriptions` - Subscriber count
- `channel:read:redemptions` - View redemptions
- `channel:manage:redemptions` - Fulfill/refund redemptions
- `moderator:manage:announcements` - Send announcements
- `moderator:manage:shoutouts` - Send shoutouts
- `channel:manage:polls` - Manage polls
- `channel:manage:predictions` - Manage predictions
- `channel:read:ads` - Ad schedule info

## Configuration

### config.json

```json
{
  "clientId": "your_twitch_client_id",
  "clientSecret": "optional_for_pkce"
}
```

**Note:** `clientSecret` is optional when using PKCE flow (which we do).

### Environment Variables (Alternative)

Instead of `config.json`, you can use environment variables:

```bash
export TWITCH_CLIENT_ID="your_client_id"
npm run oauth-server
```

## Endpoints

### GET /auth
Start OAuth flow. Redirects to Twitch authorization page.

**Example:** http://localhost:3000/auth

### GET /callback
OAuth callback endpoint. Twitch redirects here after authorization.

**Parameters:**
- `code` - Authorization code from Twitch
- `error` - Error code (if authorization failed)
- `error_description` - Error description

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "port": 3000
}
```

## Token File Format

`.oauth-tokens.json`:

```json
{
  "access_token": "abcdef123456...",
  "refresh_token": "xyz789...",
  "expires_in": 14159,
  "token_type": "bearer",
  "scope": ["moderator:manage:chat_messages", ...],
  "obtained_at": 1698765432000
}
```

## Security Notes

### Important! 🔒

1. **Never commit tokens** - `.oauth-tokens.json` is in `.gitignore`
2. **Never commit config** - `config.json` is in `.gitignore`
3. **Keep Client ID private** - Don't share in public repos
4. **Use HTTPS in production** - This server is for local development only

### Token Expiration

- Access tokens expire (usually ~4 hours)
- Refresh tokens can be used to get new access tokens
- The plugin should handle token refresh automatically

## Troubleshooting

### "No Twitch Client ID found"

Create `oauth-server/config.json` with your Client ID:

```json
{
  "clientId": "your_actual_client_id"
}
```

### "redirect_uri_mismatch" Error

1. Check your Twitch app settings at https://dev.twitch.tv/console/apps
2. Make sure OAuth Redirect URLs includes: `http://localhost:3000/callback`
3. It must match exactly (including http://, port, and path)

### "Invalid code verifier"

Make sure you:
1. Started the flow from `/auth` endpoint
2. Didn't refresh the callback page
3. The server is still running

### Port 3000 Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)

# Or use a different port (edit server.js)
```

### Browser Doesn't Open

If using `npm run oauth-server:dev` and browser doesn't open:
- Manually visit http://localhost:3000/auth
- Check if port 3000 is available

## Development

### Start in Dev Mode

```bash
npm run oauth-server:dev
```

This will:
- Start the server
- Auto-open browser to `/auth`
- Enable verbose logging

### Manual Testing

```bash
# Start server
npm run oauth-server

# In another terminal, test health endpoint
curl http://localhost:3000/health

# Open browser manually
open http://localhost:3000/auth
```

## Integration with Stream Deck Plugin

The plugin can read tokens from `.oauth-tokens.json`:

```javascript
const fs = require('fs');
const path = require('path');

const tokensPath = path.join(__dirname, '..', '.oauth-tokens.json');
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

// Use tokens for Twitch API calls
const accessToken = tokens.access_token;
```

## Future Enhancements

- [ ] Auto-inject tokens into Stream Deck plugin
- [ ] Token refresh on expiration
- [ ] Multi-user support
- [ ] Encrypted token storage
- [ ] Revoke token endpoint

## Support

If you encounter issues:
1. Check the terminal for error messages
2. Verify your Twitch app settings
3. Make sure redirect URI matches exactly
4. See main README.md for more help

---

Built for Twitch Moderator Tools Stream Deck Plugin
https://github.com/yourusername/TwitchMod4Streamdeck
