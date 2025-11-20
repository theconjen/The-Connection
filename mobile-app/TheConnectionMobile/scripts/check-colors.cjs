#!/usr/bin/env node

/**
 * Check for hardcoded color values in the mobile app
 * This helps maintain brand consistency
 */

const { execSync } = require('child_process');
const path = require('path');

// Common hardcoded color patterns to check for
const colorPatterns = [
  '#[0-9a-fA-F]{6}', // 6-digit hex colors
  '#[0-9a-fA-F]{3}',  // 3-digit hex colors
  '#[0-9a-fA-F]{8}',  // 8-digit hex colors with alpha
];

// Files and patterns to exclude from checking
const excludePatterns = [
  'node_modules',
  '.git',
  'scripts/check-colors.cjs', // Exclude this file
  'DESIGN_SYSTEM.md', // Documentation can have color examples
];

console.log('🎨 Checking for hardcoded colors...\n');

const appDir = path.join(__dirname, '../app');

try {
  // Build grep command with all patterns
  const grepPattern = colorPatterns.join('\\|');
  const excludeArgs = excludePatterns.map(p => `--exclude-dir="${p}"`).join(' ');

  const command = `cd ${appDir} && grep -r -n "${grepPattern}" . ${excludeArgs} || true`;
  const result = execSync(command, { encoding: 'utf8' });

  if (result.trim()) {
    // Filter out acceptable hardcoded colors (white, black, transparent)
    const lines = result.split('\n').filter(line => {
      if (!line.trim()) return false;
      // Allow white, black, and transparent
      if (line.includes('#ffffff') || line.includes('#FFFFFF')) return false;
      if (line.includes('#fff') && !line.includes('#fffa')) return false; // Allow #fff but not other 4-char
      if (line.includes('#000000') || line.includes('#000')) return false;
      if (line.includes('transparent')) return false;
      // Allow comments
      if (line.includes('//') && line.indexOf('//') < line.indexOf('#')) return false;
      return true;
    });

    if (lines.length > 0) {
      console.error('❌ Found hardcoded color values:\n');
      lines.forEach(line => console.error(`   ${line}`));
      console.error('\n⚠️  Please use Colors from ../../src/shared/colors.ts instead of hardcoded values.');
      console.error('   See DESIGN_SYSTEM.md for usage examples.\n');
      process.exit(1);
    }
  }

  console.log('✅ No hardcoded colors found! Brand consistency maintained.\n');
  process.exit(0);
} catch (error) {
  console.error('Error running color check:', error.message);
  process.exit(1);
}
