/**
 * Convert SVG icons to PNG format for Stream Deck
 * Stream Deck requires PNG files, not SVG
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const svgDir = path.join(__dirname, '../twitch-moderator-tools.sdPlugin/imgs');
const sizes = {
  actions: [144, 72], // Stream Deck action icons need 144x144 and 72x72 (@2x)
  plugin: [144, 72],
  category: [144, 72]
};

console.log('Converting SVG icons to PNG...');

// Check if we have ImageMagick or rsvg-convert
let converter = null;
try {
  execSync('which convert', { stdio: 'ignore' });
  converter = 'imagemagick';
  console.log('Using ImageMagick for conversion');
} catch (e) {
  try {
    execSync('which rsvg-convert', { stdio: 'ignore' });
    converter = 'rsvg';
    console.log('Using rsvg-convert for conversion');
  } catch (e2) {
    console.error('ERROR: No SVG converter found!');
    console.error('Please install one of the following:');
    console.error('  - ImageMagick: brew install imagemagick');
    console.error('  - librsvg: brew install librsvg');
    process.exit(1);
  }
}

function convertSVG(svgPath, pngPath, size) {
  try {
    if (converter === 'imagemagick') {
      execSync(`convert -background none -resize ${size}x${size} "${svgPath}" "${pngPath}"`);
    } else if (converter === 'rsvg') {
      execSync(`rsvg-convert -w ${size} -h ${size} "${svgPath}" -o "${pngPath}"`);
    }
    console.log(`  ✓ Created ${path.basename(pngPath)}`);
  } catch (error) {
    console.error(`  ✗ Failed to convert ${path.basename(svgPath)}: ${error.message}`);
  }
}

// Convert plugin and category icons
['plugin', 'category'].forEach(name => {
  const svgFile = path.join(svgDir, `${name}.svg`);
  if (fs.existsSync(svgFile)) {
    // Create @1x version (72x72)
    convertSVG(svgFile, path.join(svgDir, `${name}.png`), 72);
    // Create @2x version (144x144)
    convertSVG(svgFile, path.join(svgDir, `${name}@2x.png`), 144);
  }
});

// Convert action icons
const actionsDir = path.join(svgDir, 'actions');
if (fs.existsSync(actionsDir)) {
  const svgFiles = fs.readdirSync(actionsDir).filter(f => f.endsWith('.svg'));

  console.log(`\nConverting ${svgFiles.length} action icons...`);

  svgFiles.forEach(svgFile => {
    const baseName = path.basename(svgFile, '.svg');
    const svgPath = path.join(actionsDir, svgFile);

    // Create @1x version (72x72)
    convertSVG(svgPath, path.join(actionsDir, `${baseName}.png`), 72);
    // Create @2x version (144x144)
    convertSVG(svgPath, path.join(actionsDir, `${baseName}@2x.png`), 144);
  });
}

console.log('\n✅ Icon conversion complete!');
console.log('All PNG files have been created in twitch-moderator-tools.sdPlugin/imgs/');
