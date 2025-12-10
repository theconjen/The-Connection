<<<<<<< HEAD
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
=======
import { NativeModules } from 'react-native';

// Expo's Metro runtime expects `NativeModules.SourceCode.getDevServer` to be a
// function. When React Native provides the dev server info as an object, calling
// it causes a runtime error ("getDevServer is not a function"). To keep the
// existing signature, wrap the object in a function before loading the Expo
// Router entry.
const sourceCode = NativeModules?.SourceCode;
if (
  sourceCode &&
  sourceCode.getDevServer &&
  typeof sourceCode.getDevServer !== 'function'
) {
  // eslint-disable-next-line no-param-reassign
  sourceCode.getDevServer = () => sourceCode.getDevServer;
}

import 'expo-router/entry';
>>>>>>> ac45fc3a6c3924d8097539d8b77e9bf9e5a9b1b8
