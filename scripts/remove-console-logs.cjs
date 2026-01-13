#!/usr/bin/env node

/**
 * Smart Console.log Remover for The Connection
 *
 * This script intelligently removes console.log statements while:
 * - Preserving console.error, console.warn, console.info
 * - Not removing console.log in comments or strings
 * - Providing detailed reporting
 * - Creating backups (optional)
 *
 * Usage:
 *   node scripts/remove-console-logs.js
 *   node scripts/remove-console-logs.js --dry-run  (preview only)
 *   node scripts/remove-console-logs.js --backup   (create .bak files)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  roots: [
    '/Users/rawaselou/Desktop/The-Connection-main/client',
    '/Users/rawaselou/Desktop/The-Connection-main/server',
    '/Users/rawaselou/Desktop/The-Connection-main/shared',
    '/Users/rawaselou/Desktop/TheConnectionMobile-standalone/app',
    '/Users/rawaselou/Desktop/TheConnectionMobile-standalone/src',
  ],
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  dryRun: process.argv.includes('--dry-run'),
  createBackup: process.argv.includes('--backup'),
};

// Statistics
const stats = {
  filesScanned: 0,
  filesModified: 0,
  logsRemoved: 0,
  errors: [],
};

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Remove console.log statements from code
 * This uses a regex that matches console.log(...) calls
 */
function removeConsoleLogs(code) {
  const lines = code.split('\n');
  const newLines = [];
  let removed = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip if line is a comment
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      newLines.push(line);
      continue;
    }

    // Check if line contains console.log (but not console.error, console.warn, etc.)
    if (line.includes('console.log')) {
      // More sophisticated check: only match actual console.log calls
      // Pattern: console.log(...) including multiline
      const hasConsoleLog = /console\.log\s*\(/g.test(line);

      if (hasConsoleLog) {
        // Check if it's not in a string literal
        const inString = /'[^']*console\.log[^']*'|"[^"]*console\.log[^"]*"|`[^`]*console\.log[^`]*`/g.test(line);

        if (!inString) {
          // This line has a console.log to remove
          removed++;

          // If the entire line is just console.log, remove the whole line
          if (trimmed.match(/^console\.log\([^)]*\);?\s*$/)) {
            // Skip this line entirely
            continue;
          } else {
            // Line has other content, just remove the console.log part
            const cleaned = line.replace(/console\.log\([^)]*\);?/g, '');
            if (cleaned.trim().length > 0) {
              newLines.push(cleaned);
            }
            continue;
          }
        }
      }
    }

    // Keep the line
    newLines.push(line);
  }

  return { code: newLines.join('\n'), removed };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    stats.filesScanned++;

    const originalCode = fs.readFileSync(filePath, 'utf8');
    const { code: newCode, removed } = removeConsoleLogs(originalCode);

    if (removed > 0) {
      stats.logsRemoved += removed;
      stats.filesModified++;

      const relativePath = filePath.replace(/.*\/(client|server|shared|app|src)\//, '$1/');
      log(`  ✓ ${relativePath} (${removed} removed)`, 'green');

      if (!config.dryRun) {
        // Create backup if requested
        if (config.createBackup) {
          fs.writeFileSync(`${filePath}.bak`, originalCode);
        }

        // Write the cleaned code
        fs.writeFileSync(filePath, newCode);
      }
    }
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    log(`  ✗ Error processing ${filePath}: ${error.message}`, 'red');
  }
}

/**
 * Recursively find all files with specified extensions
 */
function findFiles(dir, extensions) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);

    // Skip problematic directories
    if (item.includes('node_modules') || ['.git', 'dist', 'dist-server', 'build', '.next'].includes(item)) {
      continue;
    }

    try {
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findFiles(fullPath, extensions));
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip files that can't be accessed
      continue;
    }
  }

  return files;
}

/**
 * Main execution
 */
function main() {
  log('========================================', 'blue');
  log('Smart Console.log Remover', 'blue');
  log('========================================', 'blue');
  console.log('');

  if (config.dryRun) {
    log('🔍 DRY RUN MODE - No files will be modified', 'yellow');
    console.log('');
  }

  if (config.createBackup && !config.dryRun) {
    log('💾 Backup mode enabled - .bak files will be created', 'cyan');
    console.log('');
  }

  // Check git status
  try {
    const gitStatus = execSync('git status --porcelain', {
      cwd: '/Users/rawaselou/Desktop/The-Connection-main',
      encoding: 'utf8'
    });

    if (gitStatus.trim().length > 0 && !config.dryRun) {
      log('⚠️  Warning: You have uncommitted changes!', 'yellow');
      log('   Consider committing or stashing before running this script.', 'yellow');
      console.log('');
    }
  } catch (error) {
    // Git not available or not a git repo
  }

  // Process each root directory
  for (const root of config.roots) {
    const dirName = path.basename(root);
    log(`Processing: ${dirName}`, 'cyan');

    const files = findFiles(root, config.extensions);

    if (files.length === 0) {
      log(`  No files found in ${root}`, 'yellow');
      continue;
    }

    files.forEach(processFile);
    console.log('');
  }

  // Summary
  log('========================================', 'blue');
  log('Summary', 'blue');
  log('========================================', 'blue');
  console.log('');
  log(`Files scanned:   ${stats.filesScanned}`, 'cyan');
  log(`Files modified:  ${stats.filesModified}`, stats.filesModified > 0 ? 'green' : 'cyan');
  log(`Logs removed:    ${stats.logsRemoved}`, stats.logsRemoved > 0 ? 'green' : 'cyan');

  if (stats.errors.length > 0) {
    log(`Errors:          ${stats.errors.length}`, 'red');
  }

  console.log('');

  if (config.dryRun) {
    log('This was a dry run. Run without --dry-run to make changes.', 'yellow');
  } else if (stats.filesModified > 0) {
    log('✓ Console.log removal complete!', 'green');
    console.log('');
    log('Next steps:', 'yellow');
    console.log('  1. Review changes: git diff');
    console.log('  2. Test your app');
    console.log('  3. Commit: git add . && git commit -m "Remove console.logs"');
  } else {
    log('✓ No console.logs found to remove!', 'green');
  }

  console.log('');
  log('Note: Preserved console.error, console.warn, console.info, etc.', 'cyan');
  console.log('');
}

// Run the script
main();
