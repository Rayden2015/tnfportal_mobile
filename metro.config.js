const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// iOS Simulator fetches bundles via 127.0.0.1; default Expo host is IPv6-only (::1).
config.server = {
  ...config.server,
  host: '127.0.0.1',
};

module.exports = config;
