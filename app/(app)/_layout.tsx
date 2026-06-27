import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/src/context/AuthContext';
import { detailScreenOptions, tabsGroupTitle } from '@/src/navigation/stackOptions';

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
      <Stack.Screen name="(tabs)" options={{ title: tabsGroupTitle }} />
      <Stack.Screen name="project/[id]" options={detailScreenOptions('Project')} />
      <Stack.Screen name="project/media/[projectId]" options={detailScreenOptions('Project media')} />
      <Stack.Screen name="project/create" options={detailScreenOptions('New project')} />
      <Stack.Screen name="project/edit/[id]" options={detailScreenOptions('Edit project')} />
      <Stack.Screen name="poll/[id]" options={detailScreenOptions('Poll')} />
      <Stack.Screen name="message/[id]" options={detailScreenOptions('Message')} />
      <Stack.Screen name="message/compose" options={detailScreenOptions('Compose')} />
      <Stack.Screen name="volunteer/[id]" options={detailScreenOptions('Volunteer')} />
      <Stack.Screen name="attendance/[id]" options={detailScreenOptions('Attendance')} />
      <Stack.Screen name="notification-preferences" options={detailScreenOptions('Notification preferences')} />
      <Stack.Screen name="profile/edit" options={detailScreenOptions('Edit profile')} />
      <Stack.Screen name="feedback/index" options={detailScreenOptions('My feedback')} />
      <Stack.Screen name="feedback/[projectId]" options={detailScreenOptions('Feedback')} />
      <Stack.Screen name="community/[id]" options={detailScreenOptions('Post')} />
      <Stack.Screen name="community/compose" options={detailScreenOptions('New post')} />
      <Stack.Screen name="chat/index" options={detailScreenOptions('Chat')} />
      <Stack.Screen name="chat/[peerUserId]" options={detailScreenOptions('Chat')} />
      <Stack.Screen name="consent" options={detailScreenOptions('Consent')} />
      <Stack.Screen name="account/password" options={detailScreenOptions('Change password')} />
    </Stack>
  );
}
