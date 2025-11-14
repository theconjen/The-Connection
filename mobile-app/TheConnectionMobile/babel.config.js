module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }]
    ],
    plugins: [
      // expo-router requires its babel plugin to be present so it can
      // transform file-system based routes and entry points during build.
      'expo-router/babel',
      'nativewind/babel',
      'react-native-reanimated/plugin',
    ],
  };
};
