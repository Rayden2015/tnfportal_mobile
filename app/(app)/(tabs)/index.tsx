import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import { CACHE_TTL, cacheKeys } from '@/src/cache/keys';
import { useAuth } from '@/src/context/AuthContext';
import { useCachedQuery } from '@/src/hooks/useCachedQuery';

type HomeStats = {
  projects: number;
  attendance: number;
  notifications: number;
};

export default function HomeScreen() {
  const { user, tenant, token, tenantSlug, hasAnyRole } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isStaff = hasAnyRole('tenant_admin', 'coordinator', 'super_admin');
  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const statsQuery = useCachedQuery<HomeStats>({
    cacheKey: auth ? cacheKeys.homeStats(auth.tenantSlug, isStaff) : null,
    enabled: Boolean(auth),
    staleTimeMs: CACHE_TTL.homeStats,
    queryFn: async () => {
      const [projects, attendance, notifications] = await Promise.all([
        isStaff ? api.listProjects(auth!, 5) : api.listMyProjects(auth!),
        isStaff ? api.listAttendance(auth!) : api.listMyAttendance(auth!),
        api.listNotifications(auth!),
      ]);

      return {
        projects: Array.isArray(projects) ? projects.length : projects.items.length,
        attendance: Array.isArray(attendance) ? attendance.length : attendance.items.length,
        notifications: notifications.filter((n) => !n.read_at).length,
      };
    },
  });

  const stats = statsQuery.data ?? { projects: 0, attendance: 0, notifications: 0 };
  const onRefresh = useCallback(async () => {
    await statsQuery.refresh();
  }, [statsQuery]);

  return (
    <Screen>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={statsQuery.refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={styles.scroll}>
        <Title>Hello, {user?.name?.split(' ')[0] ?? 'there'}</Title>
        <Subtitle>{tenant?.name ?? 'Your organization'}</Subtitle>

        {statsQuery.error ? <ErrorBanner message={statsQuery.error} /> : null}

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
  scroll: { paddingBottom: 32 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  statCard: {
    flexGrow: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 17,
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
