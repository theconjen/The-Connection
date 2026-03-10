/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'TheConnectionWidgets',
  bundleIdentifier: 'app.theconnection.mobile.widgets',
  deploymentTarget: '17.0',
  entitlements: {
    'com.apple.security.application-groups': [
      'group.app.theconnection.mobile',
    ],
  },
};
