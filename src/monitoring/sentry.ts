import { getTraceData } from '@sentry/core';
import * as Sentry from '@sentry/react-native';

import { API_BASE_URL } from '@/src/config';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

function buildTracePropagationTargets(): (string | RegExp)[] {
  const targets: (string | RegExp)[] = [
    'localhost',
    '127.0.0.1',
    '10.0.2.2',
    /^https?:\/\/.*\/api\/v1/,
  ];

  try {
    const origin = new URL(API_BASE_URL).origin;
    targets.push(origin);
    targets.push(new RegExp(`^${origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  } catch {
    // Ignore invalid API URL during local setup.
  }

  return targets;
}

let initialized = false;

export function initSentry(): void {
  if (initialized || !SENTRY_DSN) {
    if (__DEV__ && !SENTRY_DSN) {
      console.debug('[sentry] EXPO_PUBLIC_SENTRY_DSN not set; skipping init');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: true,
    enableLogs: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    tracePropagationTargets: buildTracePropagationTargets(),
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [
      Sentry.reactNativeTracingIntegration(),
      Sentry.mobileReplayIntegration(),
      Sentry.feedbackIntegration(),
    ],
  });

  initialized = true;
}

export function isSentryEnabled(): boolean {
  return initialized;
}

export function applySentryTraceHeaders(headers: Record<string, string>): void {
  if (!initialized) {
    return;
  }

  try {
    const trace = getTraceData();
    if (trace['sentry-trace']) {
      headers['sentry-trace'] = trace['sentry-trace'];
    }
    if (trace.baggage) {
      headers.baggage = trace.baggage;
    }
  } catch {
    // Ignore trace header failures.
  }
}

export function setSentryUser(userId: string, tenantSlug?: string | null): void {
  if (!initialized) {
    return;
  }

  Sentry.setUser({
    id: userId,
    tenant_slug: tenantSlug ?? undefined,
  });
}

export function clearSentryUser(): void {
  if (!initialized) {
    return;
  }

  Sentry.setUser(null);
}

export function addSentryBreadcrumb(message: string): void {
  if (!initialized) {
    return;
  }

  Sentry.addBreadcrumb({ message, category: 'monitor' });
}

export function captureSentryException(error: unknown, context?: string): void {
  if (!initialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setTag('context', context);
    }
    Sentry.captureException(error);
  });
}

export { Sentry };
