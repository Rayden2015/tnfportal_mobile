import { NativeModules, TurboModuleRegistry } from 'react-native';

/** True when a native module is registered in the current binary (dev client / store build). */
export function isNativeModuleAvailable(moduleName: string): boolean {
  if (TurboModuleRegistry.get(moduleName) != null) {
    return true;
  }

  return NativeModules[moduleName] != null;
}

export function isMobileAdsNativeAvailable(): boolean {
  return isNativeModuleAvailable('RNGoogleMobileAdsModule');
}

export function isFirebaseAnalyticsNativeAvailable(): boolean {
  return isNativeModuleAvailable('RNFBAnalyticsModule');
}
