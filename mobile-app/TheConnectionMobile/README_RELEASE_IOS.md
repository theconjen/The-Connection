# iOS App Store Release Checklist

1) Accounts & Access
- Apple Developer account with App Store Connect access
- App Bundle ID: `app.theconnection.mobile`
- EAS Project: link this app to EAS and set `extra.eas.projectId`

2) Project Config
- app.json:
  - `expo.ios.bundleIdentifier` matches App Store ID
  - `expo.ios.buildNumber` increment per release (start at "1")
  - `expo.name`, `expo.slug`, `expo.scheme`
  - `expo.icon`, `expo.splash.image` present at `./assets`
  - `expo.extra.eas.projectId` set
  - `expo.plugins` contains `expo-router`
- Assets:
  - App icon at `assets/icon.png`
  - Splash at `assets/splash-icon.png`
  - Adaptive icon for Android present (ok to keep)

3) EAS Setup
- Install CLI: `npm i -g eas-cli` (or use `npx eas-cli`)
- Log in: `npx eas-cli login`
- Initialize: `npx eas-cli init` (choose existing project or create)
- Set project ID into `app.json > extra.eas.projectId`

4) Build
- Ensure API base is set for production:
  - `eas.json` has `build.production.env.EXPO_PUBLIC_API_BASE` set to your prod API
- Run build:
  - `npx eas-cli build --platform ios --profile production`
- First run will prompt to create an App Store Connect app and/or Provisioning Profiles; follow prompts

5) Submit
- After build completes:
  - `npx eas-cli submit --platform ios --profile production`
- You may be prompted to log in to App Store Connect

6) App Store Metadata
- In App Store Connect:
  - Add screenshots (6.7", 5.5"), app description, keywords, support URL, marketing URL
  - Set age rating, category, pricing
  - Export compliance: `ITSAppUsesNonExemptEncryption: false` is set in `infoPlist` (no custom encryption)

7) Review and Release
- Wait for App Review
- Once approved, release to App Store or phased release

8) Increment for next version
- Update `expo.version` (e.g., 1.0.1) and `expo.ios.buildNumber` (e.g., "2") for next build

Notes
- Dev builds use Expo Go; Store builds require EAS build artifacts
- For push notifications, configure Apple Push keys/certificates later
