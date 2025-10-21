# Twitch Moderator Tools - Stream Deck Plugin

A comprehensive Stream Deck plugin for Twitch moderators to manage chat, AutoMod, stream settings, announcements, and more directly from their Stream Deck device.

## Features

### Chat Management (4 actions)
- **Clear Chat** - Delete all messages from chat
- **Slow Mode Toggle** - Toggle slow mode on/off with configurable duration
- **Emote-Only Mode** - Toggle emote-only mode
- **Shield Mode** - Toggle Shield Mode for extra protection

### AutoMod (3 actions)
- **Approve AutoMod** - Approve the next held message
- **Deny AutoMod** - Deny the next held message
- **Clear AutoMod Queue** - Approve all held messages at once

### Stream Management (8 actions)
- **Create Stream Marker** - Add a marker to your VOD
- **Create Clip** - Instantly create a clip
- **Game Category Presets (x5)** - Quick category changes with 5 preset slots

### Announcements (4 actions)
- **Blue Announcement** - Stream event notifications
- **Purple Announcement** - Rules reminders
- **Orange Announcement** - Break notifications
- **Green Announcement** - Stream ending announcements

### Shoutouts (5 actions)
- **Shoutout Presets (x5)** - Quick shoutouts with 5 preset streamers

### Polls & Predictions (2 actions)
- **End Active Poll** - End the currently running poll
- **Cancel Prediction** - Cancel and refund active prediction

### Channel Points Redemptions (3 actions)
- **Fulfill Next Redemption** - Mark next redemption as fulfilled
- **Refund Next Redemption** - Cancel and refund next redemption
- **Complete All Redemptions** - Fulfill all pending redemptions

### Status Indicators (8 actions)
- **Stream Status** - Live/offline with viewer count
- **Follower Count** - Current follower count
- **Subscriber Count** - Current subscriber count
- **Chat Mode Indicator** - Active chat modes (S/E/F/R)
- **Shield Mode Status** - Shield mode active/inactive
- **AutoMod Level** - Current AutoMod level (0-4)
- **Active Poll/Prediction** - Shows active engagement
- **Next Ad Timer** - Countdown to next scheduled ad

**Total: 36 actions** across all categories

## Requirements

- **Stream Deck Software** 6.4 or later
- **Node.js** 20.x or later
- **macOS** 10.15+ or **Windows** 10+
- **Twitch Account** with moderator permissions

## Installation

### For Users

1. Download the latest `.streamDeckPlugin` file from the [Releases](../../releases) page
2. Double-click the file to install it in Stream Deck
3. The plugin will appear in the Stream Deck actions list

### For Developers

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/TwitchMod4Streamdeck.git
   cd TwitchMod4Streamdeck
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. Link the plugin to Stream Deck (macOS):
   ```bash
   ln -s $(pwd)/twitch-moderator-tools.sdPlugin ~/Library/Application\ Support/com.elgato.StreamDeck/Plugins/
   ```

   Or (Windows):
   ```powershell
   mklink /D "%appdata%\Elgato\StreamDeck\Plugins\twitch-moderator-tools.sdPlugin" "$(pwd)\twitch-moderator-tools.sdPlugin"
   ```

5. Restart Stream Deck

## Setup & Configuration

### 1. Create a Twitch Application

1. Visit [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Click "Register Your Application"
3. Fill in the details:
   - **Name**: Your plugin name (e.g., "My Stream Deck Mod Tools")
   - **OAuth Redirect URLs**: `http://localhost:3000/callback`
   - **Category**: Application Integration
4. Copy the **Client ID** - you'll need this for the plugin

### 2. Configure the Plugin

1. Drag any action from the Twitch Moderator Tools category onto your Stream Deck
2. Click the action to open the property inspector
3. Enter your **Twitch Client ID**
4. Enter the **Broadcaster Channel Username** (the channel you're moderating)
5. Click **Save Settings**

### 3. Authenticate with Twitch

1. Click the **Authenticate with Twitch** button in the global settings
2. Your browser will open to the Twitch authorization page
3. Click **Authorize** to grant permissions
4. The plugin will save your authentication tokens securely

### Required Twitch Scopes

The plugin requests the following permissions:
- `moderator:manage:chat_messages` - Clear chat, delete messages
- `moderator:manage:chat_settings` - Slow mode, emote-only, follower mode
- `moderator:manage:automod` - AutoMod approvals/denials
- `moderator:manage:shield_mode` - Shield Mode control
- `channel:manage:broadcast` - Stream markers, category changes
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

## Action Configuration

### Chat Management Actions

**Slow Mode Toggle:**
- Configure duration (3-120 seconds) in the property inspector
- Button shows ON/OFF state
- Default: 30 seconds

### Stream Management Actions

**Game Category Presets:**
- Configure each preset with a game name
- Enter the exact game name as it appears on Twitch
- Example: "Just Chatting", "League of Legends", etc.

### Announcement Actions

- Customize the message text for each announcement
- Colors are pre-configured (Blue, Purple, Orange, Green)
- Messages can be changed in the property inspector

### Shoutout Actions

- Configure each preset with a streamer's username
- Enter the exact Twitch username
- Example: "shroud", "pokimane", etc.

## Development

### Project Structure

```
TwitchMod4Streamdeck/
├── src/                      # TypeScript source files
│   ├── actions/              # All action implementations
│   │   ├── chat/            # Chat management actions
│   │   ├── automod/         # AutoMod actions
│   │   ├── stream/          # Stream management actions
│   │   ├── announcements/   # Announcement & shoutout actions
│   │   ├── polls-predictions/ # Poll & prediction actions
│   │   ├── redemptions/     # Redemption actions
│   │   └── indicators/      # Status indicator actions
│   ├── api/                 # Twitch API client & auth
│   └── utils/               # Utilities & helpers
├── twitch-moderator-tools.sdPlugin/  # Plugin bundle
│   ├── bin/                 # Compiled JavaScript
│   ├── imgs/                # Icons and images
│   └── ui/                  # Property inspector HTML
└── package.json
```

### Build Commands

```bash
# Install dependencies
npm install

# Build once
npm run build

# Build and watch for changes
npm run watch

# Clean build artifacts
npm run clean
```

### Adding New Actions

1. Create a new action file in `src/actions/[category]/`
2. Extend `SingletonAction` from `@elgato/streamdeck`
3. Implement `onKeyDown` and other lifecycle methods
4. Add the action to `manifest.json`
5. Register the action in `src/plugin.ts`
6. Create an SVG icon in `imgs/actions/`
7. Create property inspector UI if needed in `ui/`

## Troubleshooting

### Authentication Issues

**Problem:** "Not authenticated" error when using actions
- **Solution:** Click the "Authenticate with Twitch" button in global settings
- Make sure you've authorized all requested scopes

**Problem:** Actions stop working after some time
- **Solution:** Tokens may have expired. Re-authenticate with Twitch

### API Issues

**Problem:** "API Error" showing on button
- **Solution:** Check your internet connection
- Verify the broadcaster username is correct
- Check Twitch API status at https://devstatus.twitch.tv

**Problem:** "Rate Limited" message
- **Solution:** Wait a few seconds. The plugin has built-in rate limiting
- Avoid spamming actions too quickly

### Action-Specific Issues

**Problem:** Game category preset not working
- **Solution:** Ensure the game name is spelled exactly as it appears on Twitch
- Try searching on Twitch first to verify the exact name

**Problem:** Shoutout not working
- **Solution:** Verify the username is correct (without @)
- Ensure the target user exists on Twitch

**Problem:** Status indicators not updating
- **Solution:** Indicators update every 30-60 seconds
- Try removing and re-adding the action

## API Rate Limiting

The plugin respects Twitch's API rate limits:
- **Limit:** 800 points per minute
- **Built-in:** Automatic request queuing
- **Feedback:** "Rate Limited" message if limits are hit

## Security

- OAuth tokens are stored securely using Stream Deck's settings API
- Tokens are never logged or exposed
- All API calls use HTTPS
- PKCE flow for enhanced security

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Issues:** [GitHub Issues](../../issues)
- **Discussions:** [GitHub Discussions](../../discussions)
- **Twitch API:** [Twitch Developer Documentation](https://dev.twitch.tv/docs/api/)

## Changelog

### Version 1.0.0 (2024)
- Initial release
- 36 moderation actions
- OAuth 2.0 with PKCE authentication
- Rate limiting and error handling
- Status indicators with auto-refresh

## Acknowledgments

- Built with the [Elgato Stream Deck SDK](https://docs.elgato.com/sdk/)
- Powered by the [Twitch API](https://dev.twitch.tv/docs/api/)
- Icons designed for clarity and quick recognition

---

Made with ❤️ for Twitch moderators everywhere
