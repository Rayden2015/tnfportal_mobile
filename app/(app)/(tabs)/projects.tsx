import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { ProjectListCard } from '@/components/ProjectListCard';
import { ProjectListSkeleton } from '@/components/Skeleton';
import { SegmentTabs } from '@/components/SegmentTabs';
import { Button, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import * as api from '@/src/api';
import type { Project } from '@/src/api/types';
import { CACHE_TTL, cacheKeys } from '@/src/cache/keys';
import { useAuth } from '@/src/context/AuthContext';
import { useCachedQuery } from '@/src/hooks/useCachedQuery';
import { sortProjectsByLatest } from '@/src/utils/projects';

type ProjectFilter = 'all' | 'mine';

type ProjectsCache = {
  allProjects: Project[];
  myProjectIds: number[];
};

export default function ProjectsScreen() {
  const { token, tenantSlug, hasAnyRole } = useAuth();
  const router = useRouter();
  const isStaff = hasAnyRole('tenant_admin', 'coordinator', 'super_admin');

  const [filter, setFilter] = useState<ProjectFilter>('all');
  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const projectsQuery = useCachedQuery<ProjectsCache>({
    cacheKey: auth ? cacheKeys.projectsAll(auth.tenantSlug) : null,
    enabled: Boolean(auth),
    staleTimeMs: CACHE_TTL.projects,
    queryFn: async () => {
      const [all, mine] = await Promise.all([
        api.listAllProjects(auth!),
        api.listMyProjects(auth!).catch(() => [] as Project[]),
      ]);
      const mineIds = new Set(mine.map((project) => project.id));

      return {
        allProjects: sortProjectsByLatest(
          all.map((project) => ({
            ...project,
            is_mine: mineIds.has(project.id),
          })),
        ),
        myProjectIds: [...mineIds],
      };
    },
  });

  const allProjects = projectsQuery.data?.allProjects ?? [];
  const myProjectIds = useMemo(() => new Set(projectsQuery.data?.myProjectIds ?? []), [projectsQuery.data?.myProjectIds]);
  const loading = projectsQuery.loading;
  const refreshing = projectsQuery.refreshing;
  const error = projectsQuery.error;

  const onRefresh = async () => {
    await projectsQuery.refresh();
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

      {loading && allProjects.length === 0 ? (
        <ProjectListSkeleton />
      ) : (
        <FlatList
          data={visibleProjects}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
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
            <ProjectListCard project={item} onPress={() => router.push(`/project/${item.id}` as Href)} />
          )}
        />
      )}
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
  listContent: {
    paddingBottom: 24,
  },
});
