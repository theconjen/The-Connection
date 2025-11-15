const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo packages
config.watchFolders = [
  projectRoot,
  path.resolve(monorepoRoot, 'packages/shared'),
  path.resolve(monorepoRoot, 'packages/ui'),
];

// Ensure proper resolution for node_modules and workspace packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Add extra node modules for workspace packages
config.resolver.extraNodeModules = {
  '@connection/shared': path.resolve(monorepoRoot, 'packages/shared/src'),
  '@connection/ui': path.resolve(monorepoRoot, 'packages/ui/src'),
};

// Ensure proper platform support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
