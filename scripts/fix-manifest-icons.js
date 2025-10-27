#!/usr/bin/env node

/**
 * Fix manifest.json to use PNG extensions for all icons
 */

const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../twitch-moderator-tools.sdPlugin/manifest.json');

console.log('Fixing manifest.json to use PNG extensions...');

// Read manifest
let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Fix all action icons
if (manifest.Actions) {
  manifest.Actions.forEach((action, index) => {
    // Fix Icon field
    if (action.Icon && !action.Icon.endsWith('.png')) {
      action.Icon = action.Icon + '.png';
      console.log(`  ✓ Fixed Actions[${index}].Icon`);
    }

    // Fix States images
    if (action.States) {
      action.States.forEach((state, stateIndex) => {
        if (state.Image && !state.Image.endsWith('.png')) {
          state.Image = state.Image + '.png';
          console.log(`  ✓ Fixed Actions[${index}].States[${stateIndex}].Image`);
        }
      });
    }
  });
}

// Write back to file
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log('\n✅ Manifest fixed! All icons now reference PNG files.');
console.log('   CategoryIcon: ' + manifest.CategoryIcon);
console.log('   Icon: ' + manifest.Icon);
console.log('   Total actions fixed: ' + manifest.Actions.length);
