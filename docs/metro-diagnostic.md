# Metro diagnostic notes

## What we attempted
- Tried to launch Metro with `npm start -- --clear --reset-cache` inside `mobile-app/TheConnectionMobile-new`, but the base image does not have `npm` available. This prevented a live repro of the bundler error in this environment.

## Findings from static inspection
- Two mobile projects exist: `mobile-app/TheConnectionMobile` uses a Metro config that forces Metro to watch the workspace root and resolve modules from both the app and workspace `node_modules`, meaning it can pick up the root React Native version (0.77.x) instead of the app version. This cross-resolution is a common source of Metro duplicate module errors in monorepos when React Native versions differ.
- The newer app (`mobile-app/TheConnectionMobile-new`) declares React Native 0.81.5 and React 19.2.0 while using Expo SDK 54. Expo 54 is paired with React Native ~0.76, so the higher version pin is likely incompatible with Expo’s Metro configuration and can trigger resolution errors or native module mismatches during bundling.
- The repository root `package.json` applies `pnpm` overrides that force React Native 0.81.5 globally. Because Metro in a workspace walks up the directory tree, these overrides can leak into the mobile app and further skew the expected dependency graph for Expo 54.

## Recommended next steps
- Install tooling locally (Node + npm/pnpm) and rerun `npm start -- --clear --reset-cache` inside `mobile-app/TheConnectionMobile-new` to capture the precise Metro error message.
- Align React Native and Expo versions: remove the root override for React Native or downgrade the app’s React Native dependency to the Expo 54-supported release (~0.76) before reinstalling dependencies (`rm -rf node_modules package-lock.json && npm install`). Ensure no other workspace package.json forces a conflicting React Native version.
- If shared workspace packages require the root watch, update `mobile-app/TheConnectionMobile`’s `metro.config.js` to explicitly prefer the app’s own `node_modules` (or pin matching versions in the root) so Metro does not pull in mismatched React Native builds from the workspace root.
- After version alignment, run `npx expo-doctor` and `npx expo start --clear --no-dev --tunnel` to verify the graph resolves cleanly.
