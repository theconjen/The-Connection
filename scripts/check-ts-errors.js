#!/usr/bin/env node
// Simple wrapper to run TypeScript compiler and print a friendly summary for novices.
// Usage: node scripts/check-ts-errors.js

import { spawn } from 'child_process';

function runTSC() {
  const args = ['tsc', '-p', './tsconfig.json', '--noEmit'];
  // Use `npx` to ensure local tsc is used
  const tsc = spawn('npx', args, { stdio: ['ignore', 'pipe', 'pipe'] });

  let out = '';
  let err = '';

  tsc.stdout.on('data', (c) => (out += c.toString()));
  tsc.stderr.on('data', (c) => (err += c.toString()));

  tsc.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ TypeScript found no errors.');
      process.exit(0);
    }

    const combined = out + '\n' + err;
    console.log('\n❌ TypeScript reported errors.');

    // Print first 200 non-empty lines to avoid overwhelming novices.
    const lines = combined.split('\n').filter(Boolean).slice(0, 200);

    console.log('\n--- First errors (truncated) ---\n');
    console.log(lines.join('\n'));

    console.log('\n--- Help ---\n');
    console.log('Common fixes:');
    console.log('- Run `npm install` to ensure dependencies are present.');
    console.log("- If you see \"Cannot find module '@shared/schema'\", ensure the `shared/schema.ts` file exists.");
    console.log('- If path aliases are used (e.g. `@shared/*`), make sure you run tools from the project root so `tsconfig.json` paths are picked up.');
    console.log("- For missing type errors in editors, reload VS Code window (Ctrl+Shift+P → 'Reload Window').");

    process.exit(code || 1);
  });
}

runTSC();
