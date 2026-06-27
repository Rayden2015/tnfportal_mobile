import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isFirebaseConfigured } from '@/src/firebase/config';
import { signInToFirebase, signOutFromFirebase } from '@/src/firebase/client';
import { useAuth } from '@/src/context/AuthContext';

type FirebaseContextValue = {
  ready: boolean;
  enabled: boolean;
  connecting: boolean;
  error: string | null;
  reconnect: () => Promise<void>;
};

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const { token, tenantSlug, isAuthenticated } = useAuth();
  const enabled = isFirebaseConfigured();
  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!enabled || !token || !tenantSlug) {
      setReady(false);
      setError(null);
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      await signInToFirebase({ token, tenantSlug });
      setReady(true);
    } catch (err) {
      setReady(false);
      setError(err instanceof Error ? err.message : 'Could not connect to Firebase chat.');
    } finally {
      setConnecting(false);
    }
  }, [enabled, token, tenantSlug]);

  useEffect(() => {
    if (!isAuthenticated) {
      void signOutFromFirebase();
      setReady(false);
      setError(null);
      return;
    }

    void connect();
  }, [isAuthenticated, connect]);

  const value = useMemo(
    () => ({
      ready,
      enabled,
      connecting,
      error,
      reconnect: connect,
    }),
    [ready, enabled, connecting, error, connect],
  );

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return context;
}
