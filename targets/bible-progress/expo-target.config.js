/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'Bible Progress',
  bundleIdentifier: 'app.theconnection.mobile.bible-progress-widget',
  deploymentTarget: '17.0',
  entitlements: {
    'com.apple.security.application-groups': [
      'group.app.theconnection.mobile',
    ],
  },
};
