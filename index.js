// Must be first import - provides crypto.getRandomValues for uuid
import 'react-native-get-random-values';

// Register Android widget task handler (safe to fail in Expo Go)
try {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widgets/widget-task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
} catch (e) {
  // Native module not available (Expo Go) — skip widget registration
}

import 'expo-router/entry';
