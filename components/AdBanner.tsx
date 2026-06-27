import { Platform, StyleSheet, View } from 'react-native';

import { isMobileAdsAvailable } from '@/src/ads/mobileAds';

type BannerModule = {
  BannerAd: React.ComponentType<{
    unitId: string;
    size: string;
    requestOptions?: { requestNonPersonalizedAdsOnly?: boolean };
  }>;
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: string };
  TestIds: { BANNER: string };
};

function loadBannerModule(): BannerModule | null {
  if (!isMobileAdsAvailable()) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-google-mobile-ads') as BannerModule;
  } catch {
    return null;
  }
}

function resolveBannerUnitId(testId: string): string {
  if (__DEV__) {
    return testId;
  }

  return (
    Platform.select({
      ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS,
      android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID,
      default: undefined,
    }) ?? testId
  );
}

export function AdBanner() {
  if (!isMobileAdsAvailable()) {
    return null;
  }

  const ads = loadBannerModule();
  if (!ads) {
    return null;
  }

  const unitId = resolveBannerUnitId(ads.TestIds.BANNER);

  return (
    <View style={styles.container} testID="admob-banner">
      <ads.BannerAd
        unitId={unitId}
        size={ads.BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
});
