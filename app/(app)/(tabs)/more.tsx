import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Card, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/src/context/AuthContext';

type MenuItem = {
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  staffOnly?: boolean;
  volunteerOnly?: boolean;
};

export default function MoreScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { hasAnyRole } = useAuth();
  const isStaff = hasAnyRole('tenant_admin', 'coordinator', 'super_admin');

  const items: MenuItem[] = [
    {
      label: isStaff ? 'Attendance records' : 'Quick check-in',
      subtitle: isStaff ? 'View and manage volunteer sessions' : 'Check in without opening a project first',
      icon: 'time-outline',
      href: '/(app)/(tabs)/attendance' as Href,
    },
    {
      label: 'Polls & surveys',
      subtitle: 'Respond to organization polls',
      icon: 'clipboard-outline',
      href: '/(app)/(tabs)/polls' as Href,
    },
    {
      label: isStaff ? 'Finance' : 'My giving',
      subtitle: isStaff ? 'Donations and expenses' : 'Donation history and contributions',
      icon: isStaff ? 'cash-outline' : 'heart-outline',
      href: '/(app)/(tabs)/donations' as Href,
    },
    {
      label: 'My feedback',
      subtitle: 'Pending and submitted project feedback',
      icon: 'chatbox-ellipses-outline',
      href: '/feedback' as Href,
      volunteerOnly: true,
    },
    {
      label: 'Volunteer consent',
      subtitle: 'Review and respond to consent requests',
      icon: 'shield-checkmark-outline',
      href: '/consent' as Href,
      volunteerOnly: true,
    },
    {
      label: 'Dues & payments',
      subtitle: 'Full balance history and pay online',
      icon: 'wallet-outline',
      href: '/(app)/(tabs)/dues' as Href,
      volunteerOnly: true,
    },
    {
      label: 'Messages',
      subtitle: 'Inbox and outbound communications',
      icon: 'mail-outline',
      href: '/(app)/(tabs)/messages' as Href,
      staffOnly: true,
    },
    {
      label: 'Notification preferences',
      subtitle: 'Choose how you receive alerts',
      icon: 'options-outline',
      href: '/notification-preferences' as Href,
    },
    {
      label: 'Change password',
      subtitle: 'Update your account password',
      icon: 'key-outline',
      href: '/account/password' as Href,
    },
  ];

  const visibleItems = items.filter((item) => {
    if (item.staffOnly && !isStaff) return false;
    if (item.volunteerOnly && isStaff) return false;
    return true;
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>More</Title>
        <Subtitle>Everything else in one place</Subtitle>

        <Card>
          {visibleItems.map((item, index) => (
            <MenuRow
              key={item.label}
              item={item}
              colors={colors}
              isLast={index === visibleItems.length - 1}
              onPress={() => router.push(item.href)}
            />
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function MenuRow({
  item,
  colors,
  isLast,
  onPress,
}: {
  item: MenuItem;
  colors: (typeof Colors)['light'];
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={20} color={Colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
        {item.subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{item.subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 2, lineHeight: 18 },
});
