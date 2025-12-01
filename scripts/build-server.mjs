// scripts/build-server.mjs
import { build } from 'esbuild';

const entry = 'server/index.ts';

// keep these out of the bundle so they use native require at runtime
const external = [
  'node:*',
  'lightningcss',
  'lightningcss/*',
  'jsdom',
  'esbuild',
];

await build({
  entryPoints: [entry],
  outfile: 'dist-server/index.cjs',
  platform: 'node',
  target: 'node20',
  bundle: true,
  external,
  format: 'cjs',
  sourcemap: false,
  logLevel: 'info',
});

console.log('✅ Built dist-server/index.cjs');
