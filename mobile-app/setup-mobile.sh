#!/bin/bash
set -euo pipefail

# The Connection Mobile App Setup Script
# Sets up the new Expo app with dependencies required for development and builds

APP_DIR="$(dirname "$0")/TheConnectionMobile-new"

echo "🚀 Setting up The Connection Mobile App..."

# Navigate to mobile app directory
cd "$APP_DIR" || exit 1

if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm is not installed. Run 'corepack enable pnpm' first." >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies with pnpm..."
  pnpm install
fi

echo "📱 Installing core React Native dependencies via Expo..."
pnpm exec expo install \
  react-native-screens \
  react-native-safe-area-context \
  @react-navigation/native \
  @react-navigation/stack \
  @react-navigation/bottom-tabs \
  react-native-gesture-handler \
  react-native-reanimated \
  @react-native-async-storage/async-storage

# Install EAS CLI locally so builds don't require a global binary
if ! pnpm list eas-cli >/dev/null 2>&1; then
  echo "🔧 Adding EAS CLI to the project (dev dependency)..."
  pnpm add -D eas-cli
fi

echo "🎨 Configuring EAS for builds..."
pnpm exec eas build:configure || true

cat <<'SUMMARY'
✅ Mobile app setup complete!

Next steps:
1. Update API_BASE_URL in src/services/api.ts
2. Replace app icons in assets/ directory
3. Update bundle identifier/package name in app.json
4. Start the app: pnpm exec expo start --clear
5. Build for production: pnpm exec eas build --platform all --profile production
6. Submit to stores: pnpm exec eas submit --platform ios|android
SUMMARY
