#!/usr/bin/env node

/**
 * Update all UUIDs in manifest.json to match folder name
 * Changes from: com.twitch.moderator.tools
 * To: com.twitch.moderator-tools
 */

const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../com.twitch.moderator-tools.sdPlugin/manifest.json');

console.log('Updating UUIDs to match folder name...');

// Read manifest
let content = fs.readFileSync(manifestPath, 'utf8');

// Replace all occurrences of the old UUID pattern
const oldPattern = 'com.twitch.moderator.tools';
const newPattern = 'com.twitch.moderator-tools';

const occurrences = (content.match(new RegExp(oldPattern, 'g')) || []).length;

content = content.replace(new RegExp(oldPattern, 'g'), newPattern);

// Write back
fs.writeFileSync(manifestPath, content);

console.log(`  ✓ Updated ${occurrences} UUID references`);
console.log(`  ✓ Changed: ${oldPattern} → ${newPattern}`);
console.log('\n✅ All UUIDs now match folder name!');
