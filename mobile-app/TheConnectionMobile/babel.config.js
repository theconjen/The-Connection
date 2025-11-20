module.exports = function (api) {
  // Detect whether Babel is running under webpack (web) to avoid adding
  // native-only plugins when building for web (webpack/babel-loader).
  const isWeb = api.caller && api.caller((caller) => caller && caller.name === 'babel-loader');

  if (!isWeb) api.cache(true);

  const plugins = ['expo-router/babel'];
  if (!isWeb) plugins.push('react-native-reanimated/plugin');

  return {
    // Put nativewind in presets because it exports an object with `plugins`.
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins,
  };
};
  
