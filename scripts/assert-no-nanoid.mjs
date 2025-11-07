// scripts/assert-no-nanoid.mjs
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.resolve(__dirname, '..', 'dist-server', 'index.cjs');

let bundleContent;
try {
  bundleContent = await readFile(bundlePath, 'utf8');
} catch (error) {
  console.error(`❌ Unable to read ${bundlePath}:`, error);
  process.exit(1);
}

const forbiddenPatterns = [
  /require\(["']nanoid["']\)/,
  /from[\s]+["']nanoid["']/,
  /import\(["']nanoid["']\)/,
];

const offendingPattern = forbiddenPatterns.find((pattern) => pattern.test(bundleContent));
if (offendingPattern) {
  console.error('❌ dist-server/index.cjs still imports "nanoid". Bundle should inline dependencies.');
  process.exit(1);
}

console.log('✅ dist-server/index.cjs contains no nanoid import statements.');
