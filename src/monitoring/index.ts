import {
  clearAnalyticsUser,
  logAnalyticsEvent,
  logScreenView,
  setAnalyticsUser,
} from '@/src/monitoring/analytics';
import {
  clearSentryUser,
  setSentryUser,
  addSentryBreadcrumb,
  captureSentryException,
} from '@/src/monitoring/sentry';
import {
  clearMonitoringUser as clearCrashlyticsUser,
  logBreadcrumb,
  recordError,
  setMonitoringUser as setCrashlyticsUser,
} from '@/src/monitoring/crashlytics';

export {
  clearAnalyticsUser,
  isAnalyticsAvailable,
  logAnalyticsEvent,
  logScreenView,
  setAnalyticsUser,
} from '@/src/monitoring/analytics';
export {
  clearMonitoringUser as clearCrashlyticsUser,
  isCrashlyticsAvailable,
  logBreadcrumb,
  recordError,
  setMonitoringUser as setCrashlyticsUser,
} from '@/src/monitoring/crashlytics';

export function setMonitoringUser(userId: string, tenantSlug?: string | null): void {
  setCrashlyticsUser(userId, tenantSlug);
  setSentryUser(userId, tenantSlug);
  void setAnalyticsUser(userId, tenantSlug);
}

export function clearMonitoringUser(): void {
  clearCrashlyticsUser();
  clearSentryUser();
  void clearAnalyticsUser();
}

export function trackApiFailure(path: string, status: number, message?: string): void {
  logBreadcrumb(`API ${status} ${path}`);
  addSentryBreadcrumb(`API ${status} ${path}`);

  if (status >= 500) {
    const error = new Error(message ?? `API ${status}`);
    recordError(error, `api:${path}`);
    captureSentryException(error, `api:${path}`);
  }
}

export { logAnalyticsEvent as trackEvent, logScreenView as trackScreenView };
