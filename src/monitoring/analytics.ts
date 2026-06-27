import { isFirebaseAnalyticsNativeAvailable } from '@/src/native/availability';

type AnalyticsModule = {
  logEvent: (name: string, params?: Record<string, string | number>) => Promise<void>;
  logScreenView: (params: { screen_class?: string; screen_name: string }) => Promise<void>;
  setUserId: (userId: string | null) => Promise<void>;
  setUserProperty: (name: string, value: string | null) => Promise<void>;
};

type AnalyticsFactory = () => AnalyticsModule;

function loadAnalyticsFactory(): AnalyticsFactory | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-firebase/analytics').default as AnalyticsFactory;
  } catch {
    return null;
  }
}

const analyticsFactory = loadAnalyticsFactory();

function getAnalytics(): AnalyticsModule | null {
  if (!analyticsFactory || !isFirebaseAnalyticsNativeAvailable()) {
    return null;
  }

  try {
    return analyticsFactory();
  } catch {
    return null;
  }
}

export function isAnalyticsAvailable(): boolean {
  return isFirebaseAnalyticsNativeAvailable() && analyticsFactory !== null;
}

export async function logAnalyticsEvent(
  name: string,
  params?: Record<string, string | number>,
): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) {
    if (__DEV__) {
      console.debug('[analytics]', name, params ?? {});
    }
    return;
  }

  try {
    await analytics.logEvent(name, params);
  } catch (error) {
    if (__DEV__) {
      console.warn('[analytics] logEvent failed', name, error);
    }
  }
}

export async function logScreenView(screenName: string, screenClass?: string): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) {
    if (__DEV__) {
      console.debug('[analytics] screen', screenName);
    }
    return;
  }

  try {
    await analytics.logScreenView({
      screen_name: screenName,
      screen_class: screenClass ?? screenName,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[analytics] logScreenView failed', screenName, error);
    }
  }
}

export async function setAnalyticsUser(userId: string, tenantSlug?: string | null): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) {
    return;
  }

  try {
    await analytics.setUserId(userId);
    if (tenantSlug) {
      await analytics.setUserProperty('tenant_slug', tenantSlug);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[analytics] setUser failed', error);
    }
  }
}

export async function clearAnalyticsUser(): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) {
    return;
  }

  try {
    await analytics.setUserId(null);
    await analytics.setUserProperty('tenant_slug', null);
  } catch (error) {
    if (__DEV__) {
      console.warn('[analytics] clearUser failed', error);
    }
  }
}
