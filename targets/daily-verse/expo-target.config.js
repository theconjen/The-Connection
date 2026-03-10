/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'Daily Verse',
  bundleIdentifier: 'app.theconnection.mobile.daily-verse-widget',
  deploymentTarget: '17.0',
  entitlements: {
    'com.apple.security.application-groups': [
      'group.app.theconnection.mobile',
    ],
  },
};
