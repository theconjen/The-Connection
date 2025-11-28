#!/usr/bin/env node

/**
 * Fix Expo SDK Objective-C Protocol Import Order
 *
 * This script fixes a warning in Expo SDK 54 where EXAppDelegatesLoader.m
 * uses the protocol EXAppDelegateSubscriberProtocol before importing the
 * generated Swift header that declares it.
 *
 * The fix reorders imports so the Swift header is imported before the
 * category that adopts the protocol.
 */

const fs = require('fs');
const path = require('path');

const TARGET_FILE = path.join(
  __dirname,
  '../ios/Pods/EXAppDelegates/ios/EXAppDelegates/EXAppDelegatesLoader.m'
);

function fixImportOrder() {
  // Check if file exists (only after expo prebuild has run)
  if (!fs.existsSync(TARGET_FILE)) {
    console.log('ℹ️  EXAppDelegatesLoader.m not found - run expo prebuild first');
    console.log('   This script will automatically fix the import order after prebuild');
    return;
  }

  console.log('🔧 Fixing Expo SDK Objective-C import order...');

  const content = fs.readFileSync(TARGET_FILE, 'utf8');

  // Check if already fixed
  if (content.includes('// Fixed by fix-expo-objc-imports.js')) {
    console.log('✅ Import order already fixed');
    return;
  }

  // Pattern to match the imports and category sections
  const importRegex = /#import\s+<EXAppDelegates\/EXLegacyAppDelegateWrapper\.h>/;
  const swiftHeaderRegex = /#if\s+__has_include[\s\S]*?#endif/m;
  const categoryRegex = /@interface\s+EXLegacyAppDelegateWrapper\s*\(\s*\)\s*<EXAppDelegateSubscriberProtocol>/;

  // Find positions
  const importMatch = content.match(importRegex);
  const swiftHeaderMatch = content.match(swiftHeaderRegex);
  const categoryMatch = content.match(categoryRegex);

  if (!importMatch || !swiftHeaderMatch || !categoryMatch) {
    console.log('⚠️  Could not find expected patterns in file - Expo SDK may have changed');
    console.log('   Please check the file manually or report this issue');
    return;
  }

  // Reorder: Swift header should come BEFORE the category declaration
  // Current order is likely:
  //   1. #import <EXAppDelegates/EXLegacyAppDelegateWrapper.h>
  //   2. #if __has_include ... Swift header
  //   3. @interface EXLegacyAppDelegateWrapper () <Protocol>

  // We want:
  //   1. #if __has_include ... Swift header (FIRST)
  //   2. #import <EXAppDelegates/EXLegacyAppDelegateWrapper.h>
  //   3. @interface EXLegacyAppDelegateWrapper () <Protocol>

  const fixedContent = content.replace(
    /(#import\s+<EXAppDelegates\/EXLegacyAppDelegateWrapper\.h>)\s*(#if\s+__has_include[\s\S]*?#endif)/m,
    `// Fixed by fix-expo-objc-imports.js - Swift header must be imported before protocol usage\n$2\n\n$1`
  );

  if (fixedContent === content) {
    console.log('⚠️  No changes made - pattern may have already been reordered differently');
    return;
  }

  // Write the fixed content back
  fs.writeFileSync(TARGET_FILE, fixedContent, 'utf8');

  console.log('✅ Successfully fixed import order in EXAppDelegatesLoader.m');
  console.log('   Swift header is now imported before protocol usage');
}

try {
  fixImportOrder();
} catch (error) {
  console.error('❌ Error fixing import order:', error.message);
  process.exit(1);
}
