// Must be first import - provides crypto.getRandomValues for uuid
import 'react-native-get-random-values';

// Register Android widget task handler
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widgets/widget-task-handler';
registerWidgetTaskHandler(widgetTaskHandler);

import 'expo-router/entry';
