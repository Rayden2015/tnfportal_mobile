import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { NotificationBadgeProvider, useNotificationBadge } from '@/src/context/NotificationBadgeContext';

function TabLayoutInner() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { unreadCount } = useNotificationBadge();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />

      {/* Hidden routes — reachable from More, Community, or deep links */}
      <Tabs.Screen name="attendance" options={{ href: null, title: 'Attendance' }} />
      <Tabs.Screen name="volunteers" options={{ href: null, title: 'Volunteers' }} />
      <Tabs.Screen name="dues" options={{ href: null, title: 'My dues' }} />
      <Tabs.Screen name="polls" options={{ href: null, title: 'Polls' }} />
      <Tabs.Screen name="donations" options={{ href: null, title: 'Donations' }} />
      <Tabs.Screen name="messages" options={{ href: null, title: 'Messages' }} />
      <Tabs.Screen name="notifications" options={{ href: null, title: 'Notifications' }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <NotificationBadgeProvider>
      <TabLayoutInner />
    </NotificationBadgeProvider>
  );
}
