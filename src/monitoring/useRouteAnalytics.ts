import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { logScreenView } from '@/src/monitoring/analytics';

export function useRouteAnalytics(): void {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const screen = pathname?.trim() || 'unknown';
    if (screen === lastPath.current) {
      return;
    }

    lastPath.current = screen;
    void logScreenView(screen);
  }, [pathname]);
}
