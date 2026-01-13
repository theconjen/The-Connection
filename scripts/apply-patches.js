#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function writeWrapper() {
  const target = path.join(__dirname, '..', 'node_modules', '@tanstack', 'query-core', 'build', 'modern');
  const file = path.join(target, 'onlineManager.js');
  try {
    if (fs.existsSync(file)) {
      console.log('apply-patches: wrapper already exists, skipping:', file);
      return;
    }
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(file, "export * from '../cjs/onlineManager.cjs';\n", 'utf8');
    console.log('apply-patches: created wrapper file:', file);
  } catch (err) {
    console.error('apply-patches: failed to create wrapper file', err);
    // don't throw to avoid breaking installs in edge cases
  }
}

writeWrapper();
