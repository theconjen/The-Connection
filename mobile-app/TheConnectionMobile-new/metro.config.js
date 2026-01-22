const { getDefaultConfig } = require('expo/metro-config');

// Use ONLY this directory - no parent paths
const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Set project root to ONLY this directory
config.projectRoot = projectRoot;
config.watchFolders = [projectRoot];

module.exports = config;
