const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Ensure proper resolution for node_modules
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

// Configure watchFolders to include project root
config.watchFolders = [projectRoot];

// Ensure proper platform support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
