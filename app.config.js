const { copyFileSync, existsSync, mkdirSync } = require('fs');
const path = require('path');

const appJson = require('./app.json');

const MYFIREBASE_DIR = path.join(__dirname, 'myfirebase');

/** Copy Firebase native config from EAS file env vars into myfirebase/ before prebuild. */
function materializeFirebaseConfigFiles() {
  mkdirSync(MYFIREBASE_DIR, { recursive: true });

  const fileMappings = [
    [process.env.GOOGLE_SERVICES_JSON, path.join(MYFIREBASE_DIR, 'google-services.json')],
    [process.env.GOOGLE_SERVICE_INFO_PLIST, path.join(MYFIREBASE_DIR, 'GoogleService-Info.plist')],
  ];

  for (const [sourcePath, targetPath] of fileMappings) {
    if (!sourcePath || !existsSync(sourcePath)) {
      continue;
    }

    copyFileSync(sourcePath, targetPath);
    console.log(`[config] Installed ${path.basename(targetPath)} from EAS file secret`);
  }
}

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

materializeFirebaseConfigFiles();

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
