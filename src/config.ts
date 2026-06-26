import Constants from 'expo-constants';

/**
 * API base URL for TNF Portal Mobile API v1.
 * Override with EXPO_PUBLIC_API_URL in .env or app config.
 *
 * Android emulator: use http://10.0.2.2:8000
 * iOS simulator: use http://localhost:8000
 * Physical device: use your machine's LAN IP, e.g. http://192.168.1.10:8000
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:8000';

export const TENANT_HEADER = 'X-Tenant-Slug';

export const DEFAULT_TENANT_SLUG =
  process.env.EXPO_PUBLIC_TENANT_SLUG ?? 'ganaa-regression';
