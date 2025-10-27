#!/usr/bin/env node

/**
 * Validate and help fix config.json
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../oauth-server/config.json');

console.log('Checking oauth-server/config.json...\n');

// Check if file exists
if (!fs.existsSync(configPath)) {
  console.error('❌ config.json not found!');
  console.error('\nTo fix:');
  console.error('  cd oauth-server');
  console.error('  cp config.example.json config.json');
  console.error('  # Then edit config.json with your Client ID\n');
  process.exit(1);
}

// Read file
const content = fs.readFileSync(configPath, 'utf8');

console.log('File contents:');
console.log('─'.repeat(60));
console.log(content);
console.log('─'.repeat(60));
console.log();

// Try to parse
try {
  const config = JSON.parse(content);
  console.log('✅ Valid JSON!');
  console.log('\nParsed configuration:');
  console.log(JSON.stringify(config, null, 2));

  // Check for required fields
  if (!config.clientId) {
    console.log('\n⚠️  Warning: No clientId found');
    console.log('   Make sure to add your Twitch Client ID');
  } else if (config.clientId === 'your_twitch_client_id_here') {
    console.log('\n⚠️  Warning: Still using example Client ID');
    console.log('   Replace with your actual Twitch Client ID');
  } else {
    console.log('\n✅ Client ID is set!');
  }

} catch (error) {
  console.error('❌ Invalid JSON!');
  console.error('\nError:', error.message);
  console.error('\nCommon fixes:');
  console.error('  1. Remove trailing commas');
  console.error('  2. Remove comments (// or /* */)');
  console.error('  3. Use double quotes (") not single quotes (\')');
  console.error('  4. Make sure all braces are matched { }');
  console.error('\nCorrect format:');
  console.error('{');
  console.error('  "clientId": "your_actual_client_id_here"');
  console.error('}');
  console.error('\nNo trailing commas, no comments allowed!\n');
  process.exit(1);
}
