const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// iOS Simulator fetches bundles via 127.0.0.1; default Expo host is IPv6-only (::1).
config.server = {
  ...config.server,
  host: '127.0.0.1',
};

module.exports = config;