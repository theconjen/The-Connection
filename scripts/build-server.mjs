// scripts/build-server.mjs
import { build } from 'esbuild';

const entry = 'server/index.ts';

// keep these out of the bundle so they use native require at runtime
const external = [
  'node:*',
  'dotenv', 'dotenv/config',
  'lightningcss', 'lightningcss/*',
];

await build({
  entryPoints: [entry],
  outfile: 'dist-server/index.cjs',
  platform: 'node',
  target: 'node20',
  bundle: true,
  packages: 'external',
  external,
  format: 'cjs',        // <-- key change
  sourcemap: false,
  logLevel: 'info',
});

console.log('✅ Built dist-server/index.cjs');
