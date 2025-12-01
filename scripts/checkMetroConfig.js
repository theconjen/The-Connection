import { getDefaultConfig } from 'expo/metro-config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const projectRoot = path.resolve(__dirname, '../mobile-app/TheConnectionMobile');
  const c = await getDefaultConfig(projectRoot);
  console.log('projectRoot=', projectRoot);
  console.log('hasEnhance=', !!(c.server && c.server.enhanceMiddleware));
  console.log('server keys=', Object.keys(c.server || {}));
})();
