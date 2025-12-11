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
