import { isMobileAdsNativeAvailable } from '@/src/native/availability';

const ADMOB_ENABLED = process.env.EXPO_PUBLIC_ADMOB_ENABLED !== 'false';

export function isMobileAdsAvailable(): boolean {
  return ADMOB_ENABLED && isMobileAdsNativeAvailable();
}

export async function initializeMobileAds(): Promise<void> {
  if (!ADMOB_ENABLED) {
    return;
  }

  if (!isMobileAdsNativeAvailable()) {
    if (__DEV__) {
      console.debug(
        '[admob] Native module missing — ads disabled until you rebuild: npx expo run:ios (or run:android)',
      );
    }
    return;
  }

  try {
    // Must not require until the native module exists — the package calls getEnforcing at import time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mobileAds = require('react-native-google-mobile-ads').default as () => {
      initialize: () => Promise<void>;
    };
    await mobileAds().initialize();
  } catch (error) {
    if (__DEV__) {
      console.warn('[admob] initialize failed', error);
    }
  }
}
