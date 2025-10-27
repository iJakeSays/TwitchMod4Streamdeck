# Icon Conversion Guide

Stream Deck requires PNG format icons, but this repository currently has SVG files. You need to convert them to PNG before packaging the plugin.

## Quick Solution (Recommended)

### On macOS:

```bash
# Install ImageMagick
brew install imagemagick

# Run the conversion script
node scripts/convert-icons.js
```

### On Windows:

1. Install ImageMagick from https://imagemagick.org/script/download.php
2. Add ImageMagick to your PATH
3. Run: `node scripts/convert-icons.js`

## Manual Conversion

If you prefer to convert manually or the script doesn't work:

### Required PNG Files

You need to create these PNG files from the corresponding SVG files:

**Main Icons (72x72 and 144x144):**
- `imgs/plugin.png` and `imgs/plugin@2x.png`
- `imgs/category.png` and `imgs/category@2x.png`

**Action Icons (72x72 and 144x144):**
All files in `imgs/actions/` need PNG versions:
- `announcement.png` and `announcement@2x.png`
- `approve-automod.png` and `approve-automod@2x.png`
- `chat-mode.png` and `chat-mode@2x.png`
- `clear-automod.png` and `clear-automod@2x.png`
- `clear-chat.png` and `clear-chat@2x.png`
- `create-clip.png` and `create-clip@2x.png`
- `deny-automod.png` and `deny-automod@2x.png`
- `emote-only.png` and `emote-only@2x.png`
- `follower-count.png` and `follower-count@2x.png`
- `game-category.png` and `game-category@2x.png`
- `poll.png` and `poll@2x.png`
- `prediction.png` and `prediction@2x.png`
- `redemption.png` and `redemption@2x.png`
- `shield-mode.png` and `shield-mode@2x.png`
- `shoutout.png` and `shoutout@2x.png`
- `slow-mode.png` and `slow-mode@2x.png`
- `stream-marker.png` and `stream-marker@2x.png`
- `stream-status.png` and `stream-status@2x.png`
- `sub-count.png` and `sub-count@2x.png`

### Sizes
- Regular (`*.png`): 72x72 pixels
- Retina (`*@2x.png`): 144x144 pixels

### Manual Conversion Options

**Option 1: Using ImageMagick (Command Line)**
```bash
# Convert a single SVG to PNG
convert -background none -resize 72x72 input.svg output.png
convert -background none -resize 144x144 input.svg output@2x.png
```

**Option 2: Using Inkscape (Command Line)**
```bash
inkscape input.svg --export-filename=output.png --export-width=72
inkscape input.svg --export-filename=output@2x.png --export-width=144
```

**Option 3: Using Online Converter**
1. Visit https://cloudconvert.com/svg-to-png
2. Upload each SVG file
3. Set dimensions to 72x72 for regular, 144x144 for @2x
4. Download and save with correct names

**Option 4: Using Sketch, Figma, or Adobe Illustrator**
1. Open the SVG file
2. Export as PNG
3. Set artboard size to 72x72 (or 144x144 for @2x)
4. Export with transparent background

## Verify Conversion

After conversion, verify you have all required PNG files:

```bash
# Check if all PNG files exist
ls -la twitch-moderator-tools.sdPlugin/imgs/*.png
ls -la twitch-moderator-tools.sdPlugin/imgs/actions/*.png
```

You should have:
- 4 PNG files in `imgs/` (plugin.png, plugin@2x.png, category.png, category@2x.png)
- 38 PNG files in `imgs/actions/` (19 icons × 2 sizes)

## After Conversion

Once you have all PNG files, you can package the plugin:

```bash
streamdeck pack twitch-moderator-tools.sdPlugin
```

This will create a `com.twitch.moderator.tools.streamDeckPlugin` file that you can install.

## Troubleshooting

**"Icon file not found" error:**
- Make sure the PNG files are in the correct location
- Verify file names match exactly (case-sensitive)
- Ensure you have both regular and @2x versions

**Icons look blurry:**
- Make sure @2x versions are 144x144 pixels
- Regular versions should be 72x72 pixels
- Export with transparent background

**Script fails:**
- Install ImageMagick or rsvg-convert
- Check PATH includes the converter
- Try manual conversion as fallback
