import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { ContactLink } from '@/components/ContactLink';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Volunteer } from '@/src/api/types';
import { CACHE_TTL, cacheKeys } from '@/src/cache/keys';
import { useAuth } from '@/src/context/AuthContext';
import { useCachedQuery } from '@/src/hooks/useCachedQuery';

export default function VolunteersScreen() {
  const { token, tenantSlug } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const volunteersQuery = useCachedQuery<Volunteer[]>({
    cacheKey: auth ? cacheKeys.volunteers(auth.tenantSlug) : null,
    enabled: Boolean(auth),
    staleTimeMs: CACHE_TTL.volunteers,
    queryFn: () => api.listVolunteers(auth!),
  });

  const volunteers = volunteersQuery.data ?? [];

  return (
    <Screen style={styles.container}>
      <Title>Volunteers</Title>
      <Subtitle>Organization volunteer directory</Subtitle>
      {volunteersQuery.error ? <ErrorBanner message={volunteersQuery.error} /> : null}

      <FlatList
        data={volunteers}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={volunteersQuery.refreshing}
            onRefresh={volunteersQuery.refresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          !volunteersQuery.loading ? (
            <EmptyState title="No volunteers" message="Volunteers will appear here once added." />
          ) : null
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.teamRow}>
              <Pressable onPress={() => router.push(`/volunteer/${item.id}` as Href)}>
                <ProfileAvatar name={item.name} photoUrl={item.profile_photo_url} size={52} />
              </Pressable>
              <View style={styles.teamDetails}>
                <Pressable onPress={() => router.push(`/volunteer/${item.id}` as Href)}>
                  <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                </Pressable>
                {item.email ? <ContactLink type="email" value={item.email} /> : null}
                {item.phone ? <ContactLink type="phone" value={item.phone} /> : null}
              </View>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 0 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teamDetails: { flex: 1 },
});
