import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function HomeScreen() {
  const { user, tenant, token, tenantSlug, hasAnyRole } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isStaff = hasAnyRole('tenant_admin', 'coordinator', 'super_admin');

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ projects: 0, attendance: 0, notifications: 0 });

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    const auth = { token, tenantSlug };
    setError(null);

    try {
      const [projects, attendance, notifications] = await Promise.all([
        isStaff ? api.listProjects(auth, 5) : api.listMyProjects(auth),
        isStaff ? api.listAttendance(auth) : api.listMyAttendance(auth),
        api.listNotifications(auth),
      ]);

      setStats({
        projects: Array.isArray(projects) ? projects.length : projects.items.length,
        attendance: Array.isArray(attendance) ? attendance.length : attendance.items.length,
        notifications: notifications.filter((n) => !n.read_at).length,
      });
    } catch (err) {
      setError(formatApiError(err));
    }
  }, [token, tenantSlug, isStaff]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}>
        <Title>Hello, {user?.name?.split(' ')[0] ?? 'there'}</Title>
        <Subtitle>{tenant?.name ?? 'Your organization'}</Subtitle>

        {error ? <ErrorBanner message={error} /> : null}

        <View style={styles.grid}>
          <StatCard label="Projects" value={stats.projects} colors={colors} />
          <StatCard label={isStaff ? 'Attendance' : 'My sessions'} value={stats.attendance} colors={colors} />
          <StatCard label="Unread alerts" value={stats.notifications} colors={colors} />
        </View>

        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Your role</Text>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>
            {(user?.roles ?? []).join(', ') || 'Volunteer'}
          </Text>
          <Text style={[styles.cardHint, { color: colors.textMuted }]}>
            {isStaff
              ? 'Use Projects to manage programs. Community covers posts, team, and alerts.'
              : 'Open Projects to check in or RSVP. Community has posts, volunteers, and alerts.'}
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function StatCard({
  label,
  value,
  colors,
}: {
  label: string;
  value: number;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: Colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    flexGrow: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 15,
    marginBottom: 8,
  },
  cardHint: {
    fontSize: 14,
    lineHeight: 20,
  },
});
