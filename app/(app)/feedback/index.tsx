import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { Stack, useFocusEffect, useRouter, type Href } from 'expo-router';

import { Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import { CardListSkeleton } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { MyFeedbackResult } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function FeedbackIndexScreen() {
  const { token, tenantSlug } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [data, setData] = useState<MyFeedbackResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError(null);
    try {
      setData(await api.listMyFeedback({ token, tenantSlug }));
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

  return (
    <>
      <Stack.Screen options={{ title: 'My feedback' }} />
      <Screen style={styles.container}>
        <Title>My feedback</Title>
        <Subtitle>Share reflections on projects you joined</Subtitle>
        {error ? <ErrorBanner message={error} /> : null}

        <Text style={[styles.heading, { color: colors.text }]}>Pending</Text>
        {loading && !data ? (
          <CardListSkeleton count={3} />
        ) : (
          <FlatList
          data={data?.pending ?? []}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={!loading ? <EmptyState title="All caught up" message="No pending feedback right now." /> : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/feedback/${item.id}` as Href)}>
              <Card>
                <Text style={[styles.projectTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>Tap to submit feedback</Text>
              </Card>
            </Pressable>
          )}
        />
        )}

        {(data?.submitted?.length ?? 0) > 0 ? (
          <>
            <Text style={[styles.heading, { color: colors.text }]}>Submitted</Text>
            {data?.submitted.map(({ project, submitted_at }) => (
              <Card key={project.id}>
                <Text style={[styles.projectTitle, { color: colors.text }]}>{project.title}</Text>
                {submitted_at ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>Submitted {new Date(submitted_at).toLocaleDateString()}</Text> : null}
              </Card>
            ))}
          </>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { fontSize: 16, fontWeight: '700', marginVertical: 8 },
  projectTitle: { fontSize: 16, fontWeight: '600' },
});
