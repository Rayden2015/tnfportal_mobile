import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';

import { Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Project } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function ProjectsScreen() {
  const { token, tenantSlug, hasAnyRole } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isStaff = hasAnyRole('tenant_admin', 'coordinator', 'super_admin');

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    const auth = { token, tenantSlug };
    setError(null);

    try {
      if (isStaff) {
        const result = await api.listProjects(auth);
        setProjects(result.items);
      } else {
        setProjects(await api.listMyProjects(auth));
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
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
    <Screen style={styles.container}>
      <Title>{isStaff ? 'All projects' : 'My projects'}</Title>
      <Subtitle>Programs you can view or volunteer on</Subtitle>
      {error ? <ErrorBanner message={error} /> : null}

      <FlatList
        data={projects}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="No projects yet"
              message={isStaff ? 'Create projects in the web portal.' : 'You are not assigned to any projects.'}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Link href={`/project/${item.id}`} asChild>
            <Pressable>
              <Card>
                <Text style={[styles.projectTitle, { color: colors.text }]}>{item.title}</Text>
                {item.location ? (
                  <Text style={[styles.meta, { color: colors.textMuted }]}>{item.location}</Text>
                ) : null}
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {item.status ?? 'active'}
                  {item.start_date ? ` · ${item.start_date}` : ''}
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
  projectTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  meta: {
    fontSize: 14,
    marginTop: 2,
  },
});
