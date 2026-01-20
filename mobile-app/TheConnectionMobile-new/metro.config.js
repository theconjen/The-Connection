const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// CRITICAL: Force Metro to use this directory as the absolute project root
const projectRoot = __dirname;
const parentRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Override all path resolution to use this directory as primary
config.projectRoot = projectRoot;

// Extend Expo's default watchFolders with monorepo paths
// This preserves Expo's defaults while adding parent node_modules access
const defaultWatchFolders = config.watchFolders || [];
config.watchFolders = [
  ...defaultWatchFolders,
  projectRoot,
  path.resolve(parentRoot, 'node_modules'),
];

// Fix resolver to check local node_modules first, then parent
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(parentRoot, 'node_modules'),
  ],
};

// CRITICAL FIX: Rewrite bundle requests to remove workspace path prefix
config.server = {
  ...config.server,
  rewriteRequestUrl: (url) => {
    // Remove /mobile-app/TheConnectionMobile-new/ prefix from all requests
    const badPrefix = '/mobile-app/TheConnectionMobile-new/';
    if (url.includes(badPrefix)) {
      const fixed = url.replace(badPrefix, '/');
      console.log(`[Metro] Rewriting URL: ${url} -> ${fixed}`);
      return fixed;
    }
    return url;
  },
};

module.exports = config;
