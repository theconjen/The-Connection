#!/bin/bash

# The Connection Mobile App Setup Script
# This script sets up the mobile app for App Store deployment

echo "🚀 Setting up The Connection Mobile App..."

# Navigate to mobile app directory
cd "$(dirname "$0")/TheConnectionMobile" || exit 1

echo "📦 Installing dependencies..."
npm install

# Install additional React Native dependencies that need to be installed after initial setup
echo "📱 Installing React Native navigation dependencies..."
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-gesture-handler react-native-reanimated
npx expo install @react-native-async-storage/async-storage

echo "🔧 Installing EAS CLI for App Store builds..."
npm install -g eas-cli

echo "🎨 Setting up project for EAS builds..."
eas build:configure

echo "✅ Mobile app setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update API_BASE_URL in src/services/api.ts"
echo "2. Replace app icons in assets/ directory"  
echo "3. Update bundle identifier in app.json"
echo "4. Test the app: npx expo start"
echo "5. Build for production: eas build --platform all --profile production"
echo "6. Submit to app stores: eas submit --platform ios/android"
echo ""
echo "📖 See mobile-app/README.md for detailed deployment instructions"