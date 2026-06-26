import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import { Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Volunteer } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function VolunteersScreen() {
  const { token, tenantSlug } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError(null);
    try {
      setVolunteers(await api.listVolunteers({ token, tenantSlug }));
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
      <Title>Volunteers</Title>
      <Subtitle>Organization volunteer directory</Subtitle>
      {error ? <ErrorBanner message={error} /> : null}

      <FlatList
        data={volunteers}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading ? <EmptyState title="No volunteers" message="Volunteers will appear here once added." /> : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/volunteer/${item.id}` as Href)}>
            <Card>
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              {item.email ? <Text style={[styles.meta, { color: colors.textMuted }]}>{item.email}</Text> : null}
              {item.phone ? <Text style={[styles.meta, { color: colors.textMuted }]}>{item.phone}</Text> : null}
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 0 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 14, marginTop: 2 },
});
