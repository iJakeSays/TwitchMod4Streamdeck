#!/usr/bin/env node

/**
 * Fix manifest.json to REMOVE PNG extensions from all icons
 * Stream Deck requires paths WITHOUT extensions
 */

const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../com.twitch.moderator-tools.sdPlugin/manifest.json');

console.log('Fixing manifest.json to remove PNG extensions...');

// Read manifest
let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Fix CategoryIcon and Icon
if (manifest.CategoryIcon && manifest.CategoryIcon.endsWith('.png')) {
  manifest.CategoryIcon = manifest.CategoryIcon.replace('.png', '');
  console.log('  ✓ Fixed CategoryIcon');
}

if (manifest.Icon && manifest.Icon.endsWith('.png')) {
  manifest.Icon = manifest.Icon.replace('.png', '');
  console.log('  ✓ Fixed Icon');
}

// Fix all action icons
if (manifest.Actions) {
  manifest.Actions.forEach((action, index) => {
    // Fix Icon field
    if (action.Icon && action.Icon.endsWith('.png')) {
      action.Icon = action.Icon.replace('.png', '');
      console.log(`  ✓ Fixed Actions[${index}].Icon`);
    }

    // Fix States images
    if (action.States) {
      action.States.forEach((state, stateIndex) => {
        if (state.Image && state.Image.endsWith('.png')) {
          state.Image = state.Image.replace('.png', '');
          console.log(`  ✓ Fixed Actions[${index}].States[${stateIndex}].Image`);
        }
      });
    }
  });
}

// Write back to file
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log('\n✅ Manifest fixed! All icon paths now omit file extensions.');
console.log('   CategoryIcon: ' + manifest.CategoryIcon);
console.log('   Icon: ' + manifest.Icon);
console.log('   Total actions fixed: ' + manifest.Actions.length);
console.log('\nStream Deck will automatically choose PNG over SVG when both exist.');
