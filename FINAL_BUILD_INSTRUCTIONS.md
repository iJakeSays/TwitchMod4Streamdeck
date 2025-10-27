# FINAL BUILD INSTRUCTIONS

All issues fixed! Follow these exact steps:

## Prerequisites

```bash
brew install imagemagick
```

## Step 1: Pull Latest Changes

```bash
cd /path/to/TwitchMod4Streamdeck
git pull origin claude/twitch-moderator-stream-deck-011CUKZzmo7zbu1vWT3G29Mk
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Build Plugin

```bash
npm run build
```

Expected output: `created twitch-moderator-tools.sdPlugin/bin/plugin.js in 2.2s`

## Step 4: Convert Icons (This deletes SVG files!)

```bash
node scripts/convert-icons.js
```

This will:
- ✅ Create 42 PNG files (21 icons × 2 sizes)
- ✅ Delete all 21 SVG files to prevent conflicts
- ✅ Leave only PNG files for packaging

Expected output:
```
Converting 19 action icons...
  ✓ Created clear-chat.png
  ✓ Created clear-chat@2x.png
  ...
Removing SVG files to avoid conflicts...
  ✓ Deleted plugin.svg
  ✓ Deleted category.svg
  ...
✅ All SVG files removed! Only PNG files remain.
```

## Step 5: Package Plugin

```bash
streamdeck pack twitch-moderator-tools.sdPlugin
```

Expected output: `✅ Created: com.twitch.moderator.tools.streamDeckPlugin`

## Step 6: Install Plugin

```bash
streamdeck install com.twitch.moderator.tools.streamDeckPlugin
```

Or double-click the `.streamDeckPlugin` file.

## Verification

After installation:
1. Open Stream Deck software
2. Look for "twitch-moderator-tools" in actions
3. You should see 36 actions available
4. Drag any action to your Stream Deck
5. Configure Twitch Client ID in settings

## What Was Fixed

✅ **manifest.json:**
- `SDKVersion: 2` added
- `Category` matches `Name`
- All icon paths omit file extensions (Stream Deck format)

✅ **Icon conversion:**
- Converts SVG → PNG (both 72x72 and 144x144)
- Deletes SVG files after conversion
- Prevents "multiple files found" conflicts

✅ **Build system:**
- Creates `bin/plugin.js` (compiled TypeScript)
- All dependencies installed
- Ready for packaging

## Troubleshooting

### Error: "CodePath file not found"
**Solution:** Run `npm run build`

### Error: "Icon file not found"
**Solution:** Run `node scripts/convert-icons.js`

### Error: "multiple files named 'imgs/...' found"
**Solution:** The conversion script now deletes SVGs automatically. If you still see this, manually delete the SVG files:
```bash
rm twitch-moderator-tools.sdPlugin/imgs/*.svg
rm twitch-moderator-tools.sdPlugin/imgs/actions/*.svg
```

### ImageMagick not found
**Solution:**
```bash
brew install imagemagick
which convert  # Verify installation
```

## Quick Copy-Paste

```bash
# Complete build process
cd /path/to/TwitchMod4Streamdeck
git pull origin claude/twitch-moderator-stream-deck-011CUKZzmo7zbu1vWT3G29Mk
npm install
npm run build
node scripts/convert-icons.js
streamdeck pack twitch-moderator-tools.sdPlugin
streamdeck install com.twitch.moderator.tools.streamDeckPlugin
```

## Success! 🎉

After these steps, you'll have:
- ✅ Working `.streamDeckPlugin` file
- ✅ 36 actions available in Stream Deck
- ✅ No validation errors
- ✅ Ready to configure and use

Next steps:
1. Configure Twitch Client ID
2. Set broadcaster channel username
3. Implement OAuth authentication (see SETUP.md)
4. Test actions with your Twitch account

See `README.md` for full documentation.
