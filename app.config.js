const appJson = require('./app.json');
const { materializeFirebaseConfig } = require('./scripts/materialize-firebase-config');

function resolvePlugins(profile) {
  const plugins = appJson.expo.plugins ?? [];
  const crashlyticsDebug = profile !== 'production';

  return plugins.map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === '@react-native-firebase/crashlytics') {
      return [
        plugin[0],
        {
          ...(plugin[1] ?? {}),
          crashlytics_debug_enabled: crashlyticsDebug,
        },
      ];
    }

    return plugin;
  });
}

materializeFirebaseConfig({ required: process.env.EAS_BUILD === 'true' });

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const isReleaseProfile = profile === 'production' || profile === 'preview';

  return {
    ...config,
    ...appJson.expo,
    plugins: resolvePlugins(profile),
    extra: {
      ...appJson.expo.extra,
      apiUrl: isReleaseProfile ? 'https://ngo.cipree.com' : appJson.expo.extra?.apiUrl,
    },
  };
};
