const nativewind = require('nativewind/babel');

const ensureWorkletsPlugin = (plugins) => {
  return plugins
    .map((plugin) => {
      if (plugin === 'react-native-worklets/plugin') {
        try {
          require.resolve('react-native-worklets/plugin');
          return plugin;
        } catch (error) {
          return () => ({ name: 'noop-react-native-worklets-plugin' });
        }
      }
      return plugin;
    })
    .filter(Boolean);
};

process.env.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT ?? './app';
process.env.EXPO_ROUTER_IMPORT_MODE = process.env.EXPO_ROUTER_IMPORT_MODE ?? 'sync';

module.exports = function (api) {
  api.cache(true);

  const nativewindConfig = nativewind();
  const nativewindPlugins = ensureWorkletsPlugin(nativewindConfig.plugins ?? []);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        require.resolve('babel-plugin-transform-inline-environment-variables'),
        {
          include: ['EXPO_ROUTER_APP_ROOT', 'EXPO_ROUTER_IMPORT_MODE'],
        },
      ],
      ...nativewindPlugins,
    ],
  };
};
