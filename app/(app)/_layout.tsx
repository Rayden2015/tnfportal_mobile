import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/src/context/AuthContext';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="project/[id]" options={{ headerShown: true, title: 'Project' }} />
      <Stack.Screen name="poll/[id]" options={{ headerShown: true, title: 'Poll' }} />
      <Stack.Screen name="volunteer/[id]" options={{ headerShown: true, title: 'Volunteer' }} />
      <Stack.Screen name="attendance/[id]" options={{ headerShown: true, title: 'Attendance' }} />
      <Stack.Screen
        name="notification-preferences"
        options={{ headerShown: true, title: 'Notification preferences' }}
      />
    </Stack>
  );
}
