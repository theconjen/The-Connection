import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const assetsDir = path.join(repoRoot, 'assets');
const readmePath = path.join(assetsDir, 'README.md');
const message = '# Assets directory\n\nThis folder is required for Metro bundler asset resolution.\n';

if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir, { recursive: true });
  writeFileSync(readmePath, message, { encoding: 'utf8' });
  console.log(`Created missing assets directory at ${assetsDir}`);
} else if (!existsSync(readmePath)) {
  writeFileSync(readmePath, message, { encoding: 'utf8' });
  console.log(`Added README to assets directory at ${readmePath}`);
}
