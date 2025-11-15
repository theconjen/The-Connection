module.exports = function (api) {
  const isWeb = api.caller?.((caller) => caller?.name === 'babel-loader');

  if (!isWeb) {
    api.cache(true);
  }

  const plugins = [
    // expo-router requires its babel plugin to be present so it can
    // transform file-system based routes and entry points during build.
    'expo-router/babel',
    'nativewind/babel',
  ];

  // Reanimated's Babel plugin is needed for native builds but breaks web bundling
  // when invoked through webpack/babel-loader. Only include it for Metro callers.
  if (!isWeb) {
    plugins.push('react-native-reanimated/plugin');
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }]
    ],
    plugins,
  };
};
