import AsyncStorage from '@react-native-async-storage/async-storage';

import { cacheKeys } from '@/src/cache/keys';

const STORAGE_PREFIX = '@tnf_query_cache:';

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

const memory = new Map<string, CacheEntry<unknown>>();

export function isStale(fetchedAt: number, staleTimeMs: number): boolean {
  return Date.now() - fetchedAt >= staleTimeMs;
}

export async function getCached<T>(key: string): Promise<CacheEntry<T> | null> {
  const fromMemory = memory.get(key);
  if (fromMemory) {
    return fromMemory as CacheEntry<T>;
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) {
      return null;
    }

    const entry = JSON.parse(raw) as CacheEntry<T>;
    memory.set(key, entry);
    return entry;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    fetchedAt: Date.now(),
  };

  memory.set(key, entry as CacheEntry<unknown>);

  try {
    await AsyncStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Keep in-memory cache even if persistence fails.
  }
}

export async function invalidateCache(key: string): Promise<void> {
  memory.delete(key);
  try {
    await AsyncStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Ignore storage errors.
  }
}

export async function invalidateCachePrefix(prefix: string): Promise<void> {
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) {
      memory.delete(key);
    }
  }

  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const toRemove = allKeys.filter((key) => key.startsWith(STORAGE_PREFIX + prefix));
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch {
    // Ignore storage errors.
  }
}

export async function clearAllCache(): Promise<void> {
  memory.clear();

  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter((key) => key.startsWith(STORAGE_PREFIX));
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch {
    // Ignore storage errors.
  }
}

export async function invalidateVolunteerCaches(tenantSlug: string, volunteerId?: number): Promise<void> {
  await Promise.all([
    invalidateCache(cacheKeys.volunteerProfile(tenantSlug)),
    invalidateCache(cacheKeys.volunteers(tenantSlug)),
    volunteerId ? invalidateCache(cacheKeys.volunteer(tenantSlug, volunteerId)) : Promise.resolve(),
  ]);
}

export { cacheKeys };
