import { useCallback, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

import { getPendingCheckOuts } from '@/src/offline/checkOutQueue';
import { getPendingCheckIns } from '@/src/offline/checkInQueue';
import { syncAllPendingAttendance } from '@/src/offline/syncCheckIns';
import type { PendingCheckIn, PendingCheckOut } from '@/src/api/types';
import { useAuth } from '@/src/context/AuthContext';

export function useOfflineCheckInSync() {
  const { token, tenantSlug, isAuthenticated } = useAuth();
  const [pending, setPending] = useState<PendingCheckIn[]>([]);
  const [pendingCheckOuts, setPendingCheckOuts] = useState<PendingCheckOut[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(async () => {
    const [checkIns, checkOuts] = await Promise.all([getPendingCheckIns(), getPendingCheckOuts()]);
    setPending(checkIns);
    setPendingCheckOuts(checkOuts);
  }, []);

  const sync = useCallback(async () => {
    if (!token || !tenantSlug) return null;
    setSyncing(true);
    try {
      const result = await syncAllPendingAttendance({ token, tenantSlug });
      await refreshPending();
      return result;
    } finally {
      setSyncing(false);
    }
  }, [token, tenantSlug, refreshPending]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshPending();
  }, [isAuthenticated, refreshPending]);

  useEffect(() => {
    if (!isAuthenticated || !token || !tenantSlug) return;

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void sync();
      }
    });

    return unsubscribe;
  }, [isAuthenticated, token, tenantSlug, sync]);

  return { pending, pendingCheckOuts, syncing, sync, refreshPending };
}
