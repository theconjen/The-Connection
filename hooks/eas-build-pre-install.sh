#!/bin/bash

# EAS Build hook to fix Folly coroutines issue
# This runs before pod install on EAS Build

echo "🔧 Applying Folly coroutines fix to Podfile..."

PODFILE="ios/Podfile"

if [ -f "$PODFILE" ]; then
  # Check if fix is already applied
  if ! grep -q "FOLLY_CFG_NO_COROUTINES" "$PODFILE"; then
    echo "Adding Folly coroutines fix..."

    # Find the post_install section and add the fix before the end
    sed -i.bak '/^  post_install do |installer|/,/^  end$/{
      /^  end$/i\
\
    # Fix for Folly coroutines issue with react-native-reanimated\
    installer.pods_project.targets.each do |target|\
      if target.name == '\''RCT-Folly'\'' || target.name == '\''React-RCTFabric'\''\
        target.build_configurations.each do |config|\
          config.build_settings['\''GCC_PREPROCESSOR_DEFINITIONS'\''] ||= ['\''$(inherited)'\'']\
          config.build_settings['\''GCC_PREPROCESSOR_DEFINITIONS'\''] << '\''FOLLY_NO_CONFIG=1'\''\
          config.build_settings['\''GCC_PREPROCESSOR_DEFINITIONS'\''] << '\''FOLLY_HAVE_CLOCK_GETTIME=1'\''\
          config.build_settings['\''GCC_PREPROCESSOR_DEFINITIONS'\''] << '\''FOLLY_USE_LIBCPP=1'\''\
          config.build_settings['\''GCC_PREPROCESSOR_DEFINITIONS'\''] << '\''FOLLY_CFG_NO_COROUTINES=1'\''\
          config.build_settings['\''GCC_PREPROCESSOR_DEFINITIONS'\''] << '\''FOLLY_MOBILE=1'\''\
        end\
      end\
    end
    }' "$PODFILE"

    echo "✅ Folly coroutines fix applied successfully"
  else
    echo "✅ Folly coroutines fix already present"
  fi
else
  echo "⚠️  Podfile not found at $PODFILE"
fi
