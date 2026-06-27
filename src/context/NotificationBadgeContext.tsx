import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useFocusEffect } from 'expo-router';

import * as api from '@/src/api';
import { CACHE_TTL, cacheKeys } from '@/src/cache/keys';
import { getCached, isStale, setCached } from '@/src/cache/queryCache';
import { useAuth } from '@/src/context/AuthContext';

type NotificationBadgeContextValue = {
  unreadCount: number;
  refresh: () => Promise<void>;
};

const NotificationBadgeContext = createContext<NotificationBadgeContextValue | null>(null);

export function NotificationBadgeProvider({ children }: { children: ReactNode }) {
  const { token, tenantSlug, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(
    async (force = false) => {
      if (!token || !tenantSlug) {
        setUnreadCount(0);
        return;
      }

      const unreadKey = cacheKeys.notificationsUnread(tenantSlug);
      const cached = await getCached<number>(unreadKey);

      if (cached && !force && !isStale(cached.fetchedAt, CACHE_TTL.notifications)) {
        setUnreadCount(cached.data);
        return;
      }

      try {
        const items = await api.listNotifications({ token, tenantSlug });
        const count = items.filter((item) => !item.read_at).length;
        setUnreadCount(count);
        await setCached(unreadKey, count);
      } catch {
        if (cached) {
          setUnreadCount(cached.data);
        }
      }
    },
    [token, tenantSlug],
  );

  useEffect(() => {
    if (isAuthenticated) {
      void refresh(false);
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh(false);
    }, [refresh]),
  );

  const value = useMemo(
    () => ({
      unreadCount,
      refresh: () => refresh(true),
    }),
    [unreadCount, refresh],
  );

  return <NotificationBadgeContext.Provider value={value}>{children}</NotificationBadgeContext.Provider>;
}

export function useNotificationBadge() {
  const context = useContext(NotificationBadgeContext);
  if (!context) {
    throw new Error('useNotificationBadge must be used within NotificationBadgeProvider');
  }
  return context;
}
