import { Stack } from 'expo-router';

import { AuthProvider } from '@/src/context/AuthContext';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';

export { ErrorBoundary } from 'expo-router';

function AppServices() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppServices />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </AuthProvider>
  );
}
