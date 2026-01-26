const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to remove enableBundleCompression from Android build.gradle
 *
 * The enableBundleCompression property was removed from React Native's Gradle plugin
 * in RN 0.74+. When using Expo SDK 54 (which has this in its template) with older
 * RN versions like 0.77, the build fails because the property doesn't exist.
 *
 * This plugin removes the problematic line after prebuild generates the android files.
 */
const withRemoveBundleCompression = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      console.info('[withRemoveBundleCompression] Project root:', projectRoot);
      console.info('[withRemoveBundleCompression] Platform root:', platformRoot);

      // Try multiple possible paths
      const possiblePaths = [
        path.join(platformRoot, 'app', 'build.gradle'),
        path.join(projectRoot, 'android', 'app', 'build.gradle'),
      ];

      for (const buildGradlePath of possiblePaths) {
        console.info('[withRemoveBundleCompression] Checking:', buildGradlePath);

        if (fs.existsSync(buildGradlePath)) {
          console.info('[withRemoveBundleCompression] Found build.gradle at:', buildGradlePath);

          let contents = fs.readFileSync(buildGradlePath, 'utf-8');
          const originalContents = contents;

          // Pattern to match the enableBundleCompression line with various formats
          // Line looks like: enableBundleCompression = (findProperty('android.enableBundleCompression') ?: false).toBoolean()
          const patterns = [
            /^\s*enableBundleCompression\s*=.*$/gm,
          ];

          for (const pattern of patterns) {
            contents = contents.replace(pattern, '    // enableBundleCompression removed - not supported in RN 0.77');
          }

          if (contents !== originalContents) {
            fs.writeFileSync(buildGradlePath, contents, 'utf-8');
            console.info('[withRemoveBundleCompression] Successfully patched build.gradle');

            // Verify the patch
            const verifyContents = fs.readFileSync(buildGradlePath, 'utf-8');
            if (verifyContents.includes('enableBundleCompression removed')) {
              console.info('[withRemoveBundleCompression] Patch verified successfully');
            } else {
              console.warn('[withRemoveBundleCompression] Warning: Patch may not have been applied correctly');
            }
          } else {
            console.info('[withRemoveBundleCompression] No enableBundleCompression found to remove');
          }

          break;
        }
      }

      return config;
    },
  ]);
};

module.exports = withRemoveBundleCompression;
