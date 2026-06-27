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
      <Stack.Screen name="project/create" options={{ headerShown: true, title: 'New project' }} />
      <Stack.Screen name="project/edit/[id]" options={{ headerShown: true, title: 'Edit project' }} />
      <Stack.Screen name="poll/[id]" options={{ headerShown: true, title: 'Poll' }} />
      <Stack.Screen name="message/[id]" options={{ headerShown: true, title: 'Message' }} />
      <Stack.Screen name="message/compose" options={{ headerShown: true, title: 'Compose' }} />
      <Stack.Screen name="volunteer/[id]" options={{ headerShown: true, title: 'Volunteer' }} />
      <Stack.Screen name="attendance/[id]" options={{ headerShown: true, title: 'Attendance' }} />
      <Stack.Screen name="notification-preferences" options={{ headerShown: true, title: 'Notification preferences' }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: true, title: 'Edit profile' }} />
      <Stack.Screen name="feedback/index" options={{ headerShown: true, title: 'My feedback' }} />
      <Stack.Screen name="feedback/[projectId]" options={{ headerShown: true, title: 'Feedback' }} />
      <Stack.Screen name="community/[id]" options={{ headerShown: true, title: 'Post' }} />
      <Stack.Screen name="community/compose" options={{ headerShown: true, title: 'New post' }} />
      <Stack.Screen name="consent" options={{ headerShown: true, title: 'Consent' }} />
      <Stack.Screen name="account/password" options={{ headerShown: true, title: 'Change password' }} />
    </Stack>
  );
}
