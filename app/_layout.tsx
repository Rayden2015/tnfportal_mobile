import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { FirebaseProvider } from '@/src/context/FirebaseContext';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { useChatNotifications } from '@/src/hooks/useChatNotifications';
import { clearMonitoringUser, setMonitoringUser } from '@/src/monitoring/crashlytics';

export { ErrorBoundary } from 'expo-router';

function AppServices() {
  usePushNotifications();
  useChatNotifications();
  const { user, tenantSlug, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setMonitoringUser(String(user.id), tenantSlug);
    } else {
      clearMonitoringUser();
    }
  }, [isAuthenticated, user?.id, tenantSlug]);

  return null;
}

export default function RootLayout() {
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
}
