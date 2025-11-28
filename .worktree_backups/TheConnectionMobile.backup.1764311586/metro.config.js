const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const workspaceRoot = path.resolve(monorepoRoot, '..');

// Start from Expo's default config for this project
const config = getDefaultConfig(projectRoot);

// Ensure Metro uses the mobile app folder as the project root
config.projectRoot = projectRoot;

// Include relevant workspace packages so Metro can resolve shared code
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/shared'),
  path.resolve(monorepoRoot, 'packages/ui'),
  // Also watch the repository root so Metro can find workspace node_modules
  path.resolve(workspaceRoot),
];

// Resolve modules from both the mobile app and monorepo node_modules
config.resolver = config.resolver || {};
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Map specific packages to the workspace node_modules to avoid resolution
// issues in monorepo setups (expo-router is installed at the repo root).
config.resolver.extraNodeModules = Object.assign({}, config.resolver.extraNodeModules || {}, {
  'expo-router': path.resolve(workspaceRoot, 'node_modules', 'expo-router'),
});

module.exports = config;
