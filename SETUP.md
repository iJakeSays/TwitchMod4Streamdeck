# Setup Guide - Twitch Moderator Tools

This guide will help you set up and test the Twitch Moderator Tools Stream Deck plugin.

## Development Setup

### 1. Prerequisites

- Node.js 20.x or later
- Stream Deck software 6.4+
- A Twitch account with moderator permissions
- macOS Sequoia or Windows 10+

### 2. Installation

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# For development (auto-rebuild on changes)
npm run watch
```

### 3. Install Plugin in Stream Deck

**macOS:**
```bash
ln -s "$(pwd)/twitch-moderator-tools.sdPlugin" "$HOME/Library/Application Support/com.elgato.StreamDeck/Plugins/"
```

**Windows (PowerShell as Administrator):**
```powershell
$source = "$(Get-Location)\twitch-moderator-tools.sdPlugin"
$target = "$env:APPDATA\Elgato\StreamDeck\Plugins\twitch-moderator-tools.sdPlugin"
New-Item -ItemType SymbolicLink -Path $target -Target $source
```

After creating the symlink, restart the Stream Deck software.

## Twitch Application Setup

### 1. Register Your Application

1. Go to https://dev.twitch.tv/console/apps
2. Click "Register Your Application"
3. Fill in:
   - **Name:** "Stream Deck Mod Tools" (or your preferred name)
   - **OAuth Redirect URLs:** `http://localhost:3000/callback`
   - **Category:** Application Integration
4. Click "Create"
5. Copy your **Client ID** - you'll need this

### 2. Configure OAuth Callback Server (Optional for Testing)

For production use, you'll need to implement an OAuth callback server. Here's a simple example using Node.js:

```javascript
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const queryObject = url.parse(req.url, true).query;

  if (queryObject.code) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Authentication Successful!</h1><p>You can close this window.</p>');

    console.log('Authorization Code:', queryObject.code);
    // Send this code back to the plugin
  }
});

server.listen(3000);
console.log('OAuth callback server running on http://localhost:3000');
```

## Plugin Configuration

### 1. Open Stream Deck

1. Launch Stream Deck software
2. Look for "Twitch Moderator Tools" in the actions list
3. Drag any action onto your Stream Deck

### 2. Configure Global Settings

1. Click on any Twitch Moderator Tools action
2. In the property inspector, enter:
   - **Client ID:** Your Twitch application client ID
   - **Broadcaster Channel:** The Twitch username you're moderating
3. Click "Save Settings"

### 3. Authenticate

Currently, the authentication flow needs to be completed manually:

1. Generate an authorization URL:
   ```
   https://id.twitch.tv/oauth2/authorize?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=http://localhost:3000/callback&
     response_type=code&
     scope=moderator:manage:chat_messages+moderator:manage:chat_settings+...&
     code_challenge=YOUR_CODE_CHALLENGE&
     code_challenge_method=S256
   ```

2. Visit the URL and authorize
3. Exchange the code for tokens
4. Save tokens in the plugin's global settings

## Testing the Plugin

### Test Actions

1. **Clear Chat:**
   - Add the "Clear Chat" action to your Stream Deck
   - Press it to clear all chat messages
   - Should show green checkmark on success

2. **Slow Mode:**
   - Configure duration in settings (default: 30s)
   - Press to toggle slow mode
   - Button should show ON/OFF state

3. **Create Clip:**
   - Press while stream is live
   - Should create a clip and show success

### Debugging

Enable debug logging:

1. Check Stream Deck logs:
   - **macOS:** `~/Library/Logs/StreamDeck/`
   - **Windows:** `%APPDATA%\Elgato\StreamDeck\Logs\`

2. Look for plugin output:
   ```
   [INFO] Twitch Moderator Tools plugin starting...
   [INFO] Loaded global settings
   [INFO] Twitch client initialized successfully
   ```

## Known Limitations & TODO

### Authentication
- [ ] OAuth flow needs to be implemented in the property inspector
- [ ] Callback server needs to be integrated or use a hosted service
- [ ] Token refresh needs testing

### Missing Status Indicators
The following status indicator actions are defined but need full implementation:
- [ ] Follower Count
- [ ] Subscriber Count
- [ ] Chat Mode Indicator
- [ ] Shield Mode Status
- [ ] AutoMod Level
- [ ] Active Poll/Prediction
- [ ] Next Ad Timer

To implement these, create files in `src/actions/indicators/` following the pattern in `stream-status.ts`.

### Testing Needed
- [ ] Test all actions with real Twitch account
- [ ] Verify rate limiting works correctly
- [ ] Test error handling for various API failures
- [ ] Test token refresh flow
- [ ] Verify all icons display correctly

### Enhancements
- [ ] Add configuration for AutoMod queue action (approve vs deny all)
- [ ] Add notification sounds for certain actions
- [ ] Add confirmation dialogs for destructive actions
- [ ] Add multi-language support
- [ ] Add analytics/usage tracking (optional)

## Production Deployment

### Before Release

1. **Complete OAuth Implementation:**
   - Implement full OAuth flow in property inspector
   - Add secure token storage
   - Test token refresh

2. **Create Distribution Package:**
   ```bash
   npm run build
   # Create .streamDeckPlugin bundle
   cd ..
   ./DistributionTool -b -i twitch-moderator-tools.sdPlugin -o .
   ```

3. **Test on Physical Device:**
   - Install on actual Stream Deck
   - Test all 36 actions
   - Verify icons and feedback
   - Test error conditions

4. **Documentation:**
   - Update README with any changes
   - Create video tutorial
   - Add screenshots
   - Document all settings

5. **Submit to Stream Deck Marketplace:**
   - Follow Elgato's submission guidelines
   - Include all required assets
   - Provide support contact

## Support

If you encounter issues:

1. Check the logs (see Debugging section)
2. Verify Twitch API credentials
3. Check Twitch API status: https://devstatus.twitch.tv
4. Open an issue on GitHub with logs and error messages

## Resources

- [Stream Deck SDK Documentation](https://docs.elgato.com/sdk/)
- [Twitch API Documentation](https://dev.twitch.tv/docs/api/)
- [Twitch Authentication Guide](https://dev.twitch.tv/docs/authentication/)
- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)

## License

MIT License - see LICENSE file for details
