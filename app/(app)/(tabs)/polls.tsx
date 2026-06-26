import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import { Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Survey } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function PollsScreen() {
  const { token, tenantSlug } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [polls, setPolls] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError(null);
    try {
      setPolls(await api.listMyPolls({ token, tenantSlug }));
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
    <Screen style={styles.container}>
      <Title>Polls</Title>
      <Subtitle>Surveys available for you to complete</Subtitle>
      {error ? <ErrorBanner message={error} /> : null}

      <FlatList
        data={polls}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading ? <EmptyState title="No polls right now" message="New surveys will appear here when published." /> : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/poll/${item.id}` as Href)} disabled={item.has_responded && !item.allow_multiple_responses}>
            <Card>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              {item.description ? (
                <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={[styles.meta, { color: item.has_responded ? colors.success : Colors.primary }]}>
                {item.has_responded ? 'Completed' : 'Tap to respond'}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 0 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 14, marginTop: 4 },
});
