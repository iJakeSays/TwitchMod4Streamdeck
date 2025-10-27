# OAuth Authentication Setup

Complete guide to set up Twitch OAuth authentication for the Stream Deck plugin.

## Overview

The plugin includes a **local OAuth server** that handles Twitch authentication automatically. No need for external services - everything runs on your computer!

## Quick Start (5 Minutes)

### Step 1: Create Twitch Application

1. Visit https://dev.twitch.tv/console/apps
2. Click **"Register Your Application"**
3. Fill in:
   - **Name**: Stream Deck Mod Tools (or your choice)
   - **OAuth Redirect URLs**: `http://localhost:3000/callback`
   - **Category**: Application Integration
4. Click **"Create"**
5. Click **"Manage"** on your new app
6. Copy the **Client ID**

### Step 2: Configure OAuth Server

```bash
cd oauth-server
cp config.example.json config.json
```

Edit `config.json` and paste your Client ID:

```json
{
  "clientId": "paste_your_client_id_here"
}
```

### Step 3: Install Dependencies

```bash
cd ..
npm install
```

This installs Express and other OAuth server dependencies.

### Step 4: Start OAuth Server

```bash
npm run oauth-server:dev
```

This will:
- ✅ Start the server on http://localhost:3000
- ✅ Auto-open your browser to the auth page
- ✅ Show detailed instructions in terminal

### Step 5: Authorize with Twitch

1. Browser opens automatically to Twitch
2. Review the permissions requested
3. Click **"Authorize"**
4. You'll be redirected to a success page
5. Tokens are saved to `.oauth-tokens.json`

### Step 6: Use Tokens in Stream Deck

The tokens are saved in the project root as `.oauth-tokens.json`:

```json
{
  "access_token": "abcdef123456...",
  "refresh_token": "xyz789...",
  "expires_in": 14159,
  "token_type": "bearer",
  "scope": [...],
  "obtained_at": 1698765432000
}
```

**Option A: Manual Copy (Current)**
1. Open `.oauth-tokens.json`
2. Copy `access_token` and `refresh_token`
3. Open Stream Deck software
4. Configure plugin settings with tokens

**Option B: Automatic (Future Enhancement)**
- Plugin will read `.oauth-tokens.json` automatically
- No manual copying needed

## Detailed Setup

### Creating Twitch Application

#### Why You Need This

Twitch requires all applications to register before using the API. This gives you a Client ID that identifies your application.

#### Step-by-Step

1. **Go to Twitch Developer Console**
   - https://dev.twitch.tv/console/apps
   - Log in with your Twitch account

2. **Register Application**
   - Click "Register Your Application"
   - Name: Anything you want (e.g., "My Stream Deck Tools")
   - OAuth Redirect URLs: **MUST BE** `http://localhost:3000/callback`
   - Category: Application Integration

3. **Get Client ID**
   - After creation, click "Manage"
   - Copy the Client ID (looks like: `abc123def456...`)

4. **Important Notes**
   - Redirect URI must match EXACTLY: `http://localhost:3000/callback`
   - Don't use `https://` - use `http://` for local development
   - Port must be `3000` (or change in `oauth-server/server.js`)

### OAuth Server Commands

```bash
# Start server (manual browser open)
npm run oauth-server

# Start server + auto-open browser
npm run oauth-server:dev

# Check if server is running
curl http://localhost:3000/health
```

### Server Endpoints

**Start OAuth Flow:**
http://localhost:3000/auth

**Callback (Twitch redirects here):**
http://localhost:3000/callback

**Health Check:**
http://localhost:3000/health

## OAuth Flow Diagram

```
1. User clicks "Authenticate"
   ↓
2. Browser opens: http://localhost:3000/auth
   ↓
3. Server redirects to: https://id.twitch.tv/oauth2/authorize
   ↓
4. User authorizes on Twitch
   ↓
5. Twitch redirects to: http://localhost:3000/callback?code=...
   ↓
6. Server exchanges code for tokens
   ↓
7. Tokens saved to: .oauth-tokens.json
   ↓
8. Success page shown to user
```

## Requested Permissions

The OAuth server requests these scopes:

### Chat Management
- `moderator:manage:chat_messages` - Clear chat, delete messages
- `moderator:manage:chat_settings` - Slow mode, emote-only, etc.
- `moderator:manage:shield_mode` - Shield Mode

### AutoMod
- `moderator:manage:automod` - Approve/deny AutoMod messages

### Stream Management
- `channel:manage:broadcast` - Markers, categories
- `clips:edit` - Create clips

### Engagement
- `moderator:manage:announcements` - Send announcements
- `moderator:manage:shoutouts` - Send shoutouts
- `channel:manage:polls` - Manage polls
- `channel:manage:predictions` - Manage predictions

### Channel Points
- `channel:read:redemptions` - View redemptions
- `channel:manage:redemptions` - Fulfill/refund

### Statistics
- `moderator:read:followers` - Follower count
- `channel:read:subscriptions` - Sub count
- `channel:read:ads` - Ad schedule

## Security & Privacy

### What's Safe ✅

- **Client ID** - Safe to commit to private repos (but not public)
- **OAuth Server Code** - Runs locally, never sends data elsewhere
- **Tokens stored locally** - Only on your computer

### What to Protect 🔒

- **Access Token** - Never share or commit (in `.oauth-tokens.json`)
- **Refresh Token** - Never share or commit (in `.oauth-tokens.json`)
- **Client Secret** - Don't need this for PKCE flow

### Gitignore Protection

The following are automatically excluded from git:

```
oauth-server/config.json      # Your Client ID
.oauth-tokens.json             # Your tokens
*.streamDeckPlugin             # Built packages
```

### PKCE Security

This server uses **PKCE** (Proof Key for Code Exchange):
- More secure than standard OAuth
- No client secret needed
- Protects against authorization code interception
- Recommended by OAuth 2.1 spec

## Troubleshooting

### "No Twitch Client ID found"

**Problem:** Server can't find your Client ID

**Solution:**
```bash
cd oauth-server
cp config.example.json config.json
# Edit config.json with your Client ID
```

### "redirect_uri_mismatch"

**Problem:** Twitch redirect URI doesn't match

**Solution:**
1. Check Twitch app settings
2. Redirect URI must be EXACTLY: `http://localhost:3000/callback`
3. No trailing slash
4. Must use `http://` not `https://`
5. Port must be `3000`

### "Port 3000 already in use"

**Problem:** Another app is using port 3000

**Solution:**
```bash
# Find what's using port 3000
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)

# Or change port in oauth-server/server.js
```

### "Invalid code verifier"

**Problem:** OAuth flow interrupted

**Solution:**
1. Don't refresh the callback page
2. Make sure server is still running
3. Start fresh from http://localhost:3000/auth

### Browser Doesn't Auto-Open

**Problem:** Using `:dev` but browser doesn't open

**Solution:**
- Manually visit http://localhost:3000/auth
- Check terminal for errors
- Make sure `open` package installed: `npm install`

### Tokens Expired

**Problem:** Access token expired (happens after ~4 hours)

**Solution:**
- Re-run OAuth flow to get new tokens
- Future: Plugin will auto-refresh using refresh token

## Advanced Configuration

### Using Environment Variables

Instead of `config.json`:

```bash
export TWITCH_CLIENT_ID="your_client_id"
npm run oauth-server
```

### Changing Port

Edit `oauth-server/server.js`:

```javascript
const PORT = 3000; // Change to your preferred port
```

**Remember to update:**
- Twitch app redirect URI
- All documentation references

### Adding Client Secret (Optional)

If you want to use client secret (not needed for PKCE):

```json
{
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret"
}
```

## Testing OAuth Flow

### Manual Test

```bash
# Terminal 1: Start server
npm run oauth-server

# Terminal 2: Test health
curl http://localhost:3000/health

# Browser: Start auth
open http://localhost:3000/auth
```

### Verify Tokens

After successful auth:

```bash
# Check tokens file exists
cat .oauth-tokens.json

# Verify token format
node -e "console.log(JSON.parse(require('fs').readFileSync('.oauth-tokens.json')))"
```

## Integration with Plugin

### Current (Manual)

1. Run OAuth server
2. Get tokens from `.oauth-tokens.json`
3. Copy to Stream Deck plugin settings

### Future (Automatic)

Plugin will:
1. Detect `.oauth-tokens.json`
2. Load tokens automatically
3. Refresh expired tokens
4. Re-auth if needed

## Next Steps

After OAuth setup:

1. ✅ Tokens saved to `.oauth-tokens.json`
2. ✅ Copy tokens to Stream Deck plugin
3. ✅ Configure broadcaster username
4. ✅ Test actions with your Twitch channel

See `README.md` for plugin configuration and usage.

---

**Questions?** See `oauth-server/README.md` for more details.
