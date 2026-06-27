import * as Device from 'expo-device';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as api from '@/src/api';
import { ApiError } from '@/src/api/client';
import type { LoginPayload, Tenant, User } from '@/src/api/types';
import { DEFAULT_TENANT_SLUG } from '@/src/config';
import { clearAllCache } from '@/src/cache/queryCache';
import { deleteStoredItem, getStoredItem, setStoredItem } from '@/src/storage/secureStorage';
import { logAnalyticsEvent } from '@/src/monitoring/analytics';

const STORAGE_KEYS = {
  token: 'tnf_token',
  tenantSlug: 'tnf_tenant_slug',
  user: 'tnf_user',
  tenant: 'tnf_tenant',
} as const;

type AuthState = {
  token: string | null;
  tenantSlug: string | null;
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  login: (payload: Omit<LoginPayload, 'device_name'>) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshMe: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
  authError: string | null;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readStoredSession(): Promise<Pick<AuthState, 'token' | 'tenantSlug' | 'user' | 'tenant'>> {
  const [token, tenantSlug, userJson, tenantJson] = await Promise.all([
    getStoredItem(STORAGE_KEYS.token),
    getStoredItem(STORAGE_KEYS.tenantSlug),
    getStoredItem(STORAGE_KEYS.user),
    getStoredItem(STORAGE_KEYS.tenant),
  ]);

  return {
    token,
    tenantSlug,
    user: userJson ? (JSON.parse(userJson) as User) : null,
    tenant: tenantJson ? (JSON.parse(tenantJson) as Tenant) : null,
  };
}

async function persistSession(
  token: string,
  tenantSlug: string,
  user: User,
  tenant: Tenant,
): Promise<void> {
  await Promise.all([
    setStoredItem(STORAGE_KEYS.token, token),
    setStoredItem(STORAGE_KEYS.tenantSlug, tenantSlug),
    setStoredItem(STORAGE_KEYS.user, JSON.stringify(user)),
    setStoredItem(STORAGE_KEYS.tenant, JSON.stringify(tenant)),
  ]);
}

async function clearSession(): Promise<void> {
  await Promise.all([
    deleteStoredItem(STORAGE_KEYS.token),
    deleteStoredItem(STORAGE_KEYS.tenantSlug),
    deleteStoredItem(STORAGE_KEYS.user),
    deleteStoredItem(STORAGE_KEYS.tenant),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const auth = useMemo(
    () => (token && tenantSlug ? { token, tenantSlug } : null),
    [token, tenantSlug],
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const stored = await readStoredSession();
        if (!mounted) return;

        setToken(stored.token);
        setTenantSlug(stored.tenantSlug);
        setUser(stored.user);
        setTenant(stored.tenant);

        if (stored.token && stored.tenantSlug) {
          try {
            const me = await api.getMe({ token: stored.token, tenantSlug: stored.tenantSlug });
            if (!mounted) return;
            setUser(me.user);
            setTenant(me.tenant);
            await persistSession(stored.token, stored.tenantSlug, me.user, me.tenant);
          } catch {
            await clearSession();
            if (!mounted) return;
            setToken(null);
            setTenantSlug(null);
            setUser(null);
            setTenant(null);
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (payload: Omit<LoginPayload, 'device_name'>) => {
    setAuthError(null);
    const deviceName = Device.deviceName ?? Device.modelName ?? 'TNF Mobile';
    const result = await api.login({
      ...payload,
      tenant_slug: payload.tenant_slug || DEFAULT_TENANT_SLUG,
      device_name: deviceName,
    });

    await persistSession(result.token, result.tenant.slug, result.user, result.tenant);
    setToken(result.token);
    setTenantSlug(result.tenant.slug);
    setUser(result.user);
    setTenant(result.tenant);
    void logAnalyticsEvent('login', { method: 'email', tenant_slug: result.tenant.slug });
  }, []);

  const logout = useCallback(async () => {
    if (auth) {
      try {
        await api.logout(auth);
      } catch {
        // Ignore network errors on logout.
      }
    }
    await clearSession();
    await clearAllCache();
    setToken(null);
    setTenantSlug(null);
    setUser(null);
    setTenant(null);
    setAuthError(null);
  }, [auth]);

  const logoutAll = useCallback(async () => {
    if (auth) {
      try {
        await api.logoutAll(auth);
      } catch {
        // Ignore network errors on logout.
      }
    }
    await clearSession();
    await clearAllCache();
    setToken(null);
    setTenantSlug(null);
    setUser(null);
    setTenant(null);
    setAuthError(null);
  }, [auth]);

  const refreshMe = useCallback(async () => {
    if (!auth) return;
    const me = await api.getMe(auth);
    setUser(me.user);
    setTenant(me.tenant);
    await persistSession(auth.token, auth.tenantSlug, me.user, me.tenant);
  }, [auth]);

  const hasRole = useCallback(
    (role: string) => user?.roles?.includes(role) ?? false,
    [user?.roles],
  );

  const hasAnyRole = useCallback(
    (...roles: string[]) => roles.some((role) => user?.roles?.includes(role)),
    [user?.roles],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      tenantSlug,
      user,
      tenant,
      isLoading,
      isAuthenticated: Boolean(token && tenantSlug && user),
      login,
      logout,
      logoutAll,
      refreshMe,
      hasRole,
      hasAnyRole,
      authError,
      clearAuthError: () => setAuthError(null),
    }),
    [
      token,
      tenantSlug,
      user,
      tenant,
      isLoading,
      login,
      logout,
      logoutAll,
      refreshMe,
      hasRole,
      hasAnyRole,
      authError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const firstFieldError = error.errors
      ? Object.values(error.errors).flat()[0]
      : undefined;
    return firstFieldError ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
