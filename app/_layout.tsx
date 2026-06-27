import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { initializeMobileAds } from '@/src/ads/mobileAds';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { FirebaseProvider } from '@/src/context/FirebaseContext';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { useChatNotifications } from '@/src/hooks/useChatNotifications';
import { MonitoringErrorBoundary } from '@/src/monitoring/MonitoringErrorBoundary';
import { clearMonitoringUser, setMonitoringUser } from '@/src/monitoring/index';
import { initSentry, Sentry } from '@/src/monitoring/sentry';
import { useRouteAnalytics } from '@/src/monitoring/useRouteAnalytics';

initSentry();

export { MonitoringErrorBoundary as ErrorBoundary };

function AppServices() {
  usePushNotifications();
  useChatNotifications();
  useRouteAnalytics();
  const { user, tenantSlug, isAuthenticated } = useAuth();

  useEffect(() => {
    void initializeMobileAds();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setMonitoringUser(String(user.id), tenantSlug);
    } else {
      clearMonitoringUser();
    }
  }, [isAuthenticated, user?.id, tenantSlug]);

  return null;
}

export default Sentry.wrap(function RootLayout() {
  return (
    <AuthProvider>
      <FirebaseProvider>
        <AppServices />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ title: 'Sign in' }} />
          <Stack.Screen name="(app)" options={{ title: 'Home' }} />
        </Stack>
      </FirebaseProvider>
    </AuthProvider>
  );
});
