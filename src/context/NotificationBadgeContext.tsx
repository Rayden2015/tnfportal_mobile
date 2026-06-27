import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useFocusEffect } from 'expo-router';

import * as api from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';

type NotificationBadgeContextValue = {
  unreadCount: number;
  refresh: () => Promise<void>;
};

const NotificationBadgeContext = createContext<NotificationBadgeContextValue | null>(null);

export function NotificationBadgeProvider({ children }: { children: ReactNode }) {
  const { token, tenantSlug, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!token || !tenantSlug) {
      setUnreadCount(0);
      return;
    }

    try {
      const items = await api.listNotifications({ token, tenantSlug });
      setUnreadCount(items.filter((item) => !item.read_at).length);
    } catch {
      // Keep the last known count if refresh fails offline.
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const value = useMemo(() => ({ unreadCount, refresh }), [unreadCount, refresh]);

  return <NotificationBadgeContext.Provider value={value}>{children}</NotificationBadgeContext.Provider>;
}

export function useNotificationBadge() {
  const context = useContext(NotificationBadgeContext);
  if (!context) {
    throw new Error('useNotificationBadge must be used within NotificationBadgeProvider');
  }
  return context;
}
