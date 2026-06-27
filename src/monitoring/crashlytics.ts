type CrashlyticsModule = {
  log: (message: string) => void;
  recordError: (error: Error) => void;
  setUserId: (userId: string) => void;
  setAttribute: (key: string, value: string) => void;
};

function loadCrashlytics(): CrashlyticsModule | null {
  try {
    // Native module — available in EAS/dev builds, not Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-firebase/crashlytics').default as CrashlyticsModule;
  } catch {
    return null;
  }
}

const crashlytics = loadCrashlytics();

export function isCrashlyticsAvailable(): boolean {
  return crashlytics !== null;
}

export function logBreadcrumb(message: string): void {
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
  if (!crashlytics) {
    return;
  }

  crashlytics.setUserId('');
}
