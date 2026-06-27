import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getCached, isStale, setCached } from '@/src/cache/queryCache';
import { formatApiError } from '@/src/context/AuthContext';

type UseCachedQueryOptions<T> = {
  cacheKey: string | null;
  queryFn: () => Promise<T>;
  staleTimeMs?: number;
  enabled?: boolean;
};

export function useCachedQuery<T>({
  cacheKey,
  queryFn,
  staleTimeMs = 5 * 60 * 1000,
  enabled = true,
}: UseCachedQueryOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(enabled && cacheKey));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const run = useCallback(
    async (force = false) => {
      if (!enabled || !cacheKey) {
        return;
      }

      const cached = await getCached<T>(cacheKey);
      const hasCached = cached !== null;

      if (hasCached) {
        setData(cached.data);
        setLoading(false);
      }

      if (hasCached && !force && !isStale(cached.fetchedAt, staleTimeMs)) {
        return;
      }

      if (hasCached && !force) {
        setRefreshing(true);
      } else if (!hasCached) {
        setLoading(true);
      }

      try {
        const result = await queryFnRef.current();
        await setCached(cacheKey, result);
        setData(result);
        setError(null);
      } catch (err) {
        if (!hasCached) {
          setError(formatApiError(err));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [cacheKey, enabled, staleTimeMs],
  );

  useFocusEffect(
    useCallback(() => {
      void run(false);
    }, [run]),
  );

  const refresh = useCallback(() => run(true), [run]);

  return { data, loading, refreshing, error, refresh, setData };
}
