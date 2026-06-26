import { useEffect } from 'react';

import { registerForPushNotifications, registerPushTokenWithApi } from '@/src/notifications/push';
import { useAuth } from '@/src/context/AuthContext';

export function usePushNotifications() {
  const { token, tenantSlug, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token || !tenantSlug) return;

    let cancelled = false;

    (async () => {
      const result = await registerForPushNotifications();
      if (cancelled || !result.expoPushToken) return;
      await registerPushTokenWithApi(
        { token, tenantSlug },
        result.expoPushToken,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token, tenantSlug]);
}
