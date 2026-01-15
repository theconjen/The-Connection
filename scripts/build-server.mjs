// scripts/build-server.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve all paths from the project root so the bundle lands at /dist-server
const projectRoot = path.resolve(__dirname, '..');
const entry = path.join(projectRoot, 'server', 'index.ts');

// keep these out of the bundle so they use native require at runtime
const external = [
  'node:*',
  'lightningcss',
  'lightningcss/*',
  'jsdom',
  'esbuild',
  // Keep argon2 external so native bindings are required at runtime
  'argon2',
  // fsevents contains a native .node binary; avoid bundling it
  'fsevents',
  // Keep franc-min external (language detection)
  'franc-min',
];

await build({
  entryPoints: [entry],
  outfile: path.join(projectRoot, 'dist-server', 'index.cjs'),
  platform: 'node',
  target: 'node20',
  bundle: true,
  external,
  format: 'cjs',
  sourcemap: true, // Enable source maps for error tracking
  logLevel: 'info',
});

console.log('✅ Built dist-server/index.cjs');
