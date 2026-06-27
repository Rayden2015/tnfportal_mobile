import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect, useRouter, type Href } from 'expo-router';

import { SegmentTabs } from '@/components/SegmentTabs';
import { Button, Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Project } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';
import { sortProjectsByLatest } from '@/src/utils/projects';

type ProjectFilter = 'all' | 'mine';

function formatProjectDate(project: Project) {
  if (project.start_date && project.end_date) {
    return `${project.start_date} → ${project.end_date}`;
  }
  return project.start_date ?? project.end_date ?? 'Date TBC';
}

export default function ProjectsScreen() {
  const { token, tenantSlug, hasAnyRole } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isStaff = hasAnyRole('tenant_admin', 'coordinator', 'super_admin');

  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [myProjectIds, setMyProjectIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    const auth = { token, tenantSlug };
    setError(null);

    try {
      const [all, mine] = await Promise.all([
        api.listAllProjects(auth),
        api.listMyProjects(auth).catch(() => [] as Project[]),
      ]);
      const mineIds = new Set(mine.map((project) => project.id));
      setAllProjects(
        sortProjectsByLatest(
          all.map((project) => ({
            ...project,
            is_mine: mineIds.has(project.id),
          })),
        ),
      );
      setMyProjectIds(mineIds);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

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

  const visibleProjects = useMemo(() => {
    if (filter === 'mine') {
      return allProjects.filter((project) => myProjectIds.has(project.id));
    }
    return allProjects;
  }, [allProjects, filter, myProjectIds]);

  return (
    <Screen style={styles.container}>
      <Title>Projects</Title>
      <Subtitle>Latest first — tap a project to check in, RSVP, or review details</Subtitle>

      {isStaff ? (
        <View style={styles.createRow}>
          <Button label="New project" onPress={() => router.push('/project/create' as Href)} />
        </View>
      ) : null}

      <SegmentTabs
        tabs={[
          { key: 'all', label: 'All projects' },
          { key: 'mine', label: 'My projects' },
        ]}
        active={filter}
        onChange={setFilter}
        badges={{ mine: myProjectIds.size }}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <FlatList
        data={visibleProjects}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={filter === 'mine' ? 'No assigned projects' : 'No projects yet'}
              message={
                filter === 'mine'
                  ? 'Switch to All projects to browse everything in your organization.'
                  : isStaff
                    ? 'Create your first project with the button above.'
                    : 'Projects will appear here when your organization publishes them.'
              }
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Link href={`/project/${item.id}`} asChild>
            <Pressable>
              <Card>
                <View style={styles.cardHeader}>
                  <Text style={[styles.projectTitle, { color: colors.text }]}>{item.title}</Text>
                  {item.is_mine ? (
                    <View style={styles.mineBadge}>
                      <Text style={styles.mineBadgeText}>Mine</Text>
                    </View>
                  ) : null}
                </View>
                {item.location ? (
                  <Text style={[styles.meta, { color: colors.textMuted }]}>{item.location}</Text>
                ) : null}
                <Text style={[styles.meta, { color: colors.textMuted }]}>{formatProjectDate(item)}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {(item.status ?? 'active').replace(/_/g, ' ')}
                  {item.interest_open ? ' · RSVP open' : ''}
                  {item.feedback_open ? ' · Feedback open' : ''}
                </Text>
              </Card>
            </Pressable>
          </Link>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
  },
  createRow: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  projectTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  mineBadge: {
    backgroundColor: '#fff7ed',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mineBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    fontSize: 14,
    marginTop: 2,
  },
});
