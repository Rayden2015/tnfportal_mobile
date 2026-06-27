type CrashlyticsModule = {
  log: (message: string) => void;
  recordError: (error: Error) => void;
  setUserId: (userId: string) => void;
  setAttribute: (key: string, value: string) => void;
};

type CrashlyticsFactory = () => CrashlyticsModule;

function loadCrashlyticsFactory(): CrashlyticsFactory | null {
  try {
    // Native module — available in EAS/dev builds, not Expo Go.
    // Default export is a factory: crashlytics().setUserId(...)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-firebase/crashlytics').default as CrashlyticsFactory;
  } catch {
    return null;
  }
}

const crashlyticsFactory = loadCrashlyticsFactory();

function getCrashlytics(): CrashlyticsModule | null {
  if (!crashlyticsFactory) {
    return null;
  }

  try {
    return crashlyticsFactory();
  } catch {
    return null;
  }
}

export function isCrashlyticsAvailable(): boolean {
  return getCrashlytics() !== null;
}

export function logBreadcrumb(message: string): void {
  const crashlytics = getCrashlytics();
  if (crashlytics) {
    crashlytics.log(message);
    return;
  }

  if (__DEV__) {
    console.debug('[monitor]', message);
  }
}

export function recordError(error: unknown, context?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const crashlytics = getCrashlytics();

  if (crashlytics) {
    if (context) {
      crashlytics.log(context);
    }
    crashlytics.recordError(err);
    return;
  }

  if (__DEV__) {
    console.warn('[monitor]', context ?? 'error', err);
  }
}

export function setMonitoringUser(userId: string, tenantSlug?: string | null): void {
  const crashlytics = getCrashlytics();
  if (!crashlytics) {
    if (__DEV__) {
      console.debug('[monitor] user', userId, tenantSlug ?? '');
    }
    return;
  }

  crashlytics.setUserId(userId);
  if (tenantSlug) {
    crashlytics.setAttribute('tenant_slug', tenantSlug);
  }
}

export function clearMonitoringUser(): void {
  const crashlytics = getCrashlytics();
  if (!crashlytics) {
    return;
  }

  crashlytics.setUserId('');
}
