import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import { NotificationsList } from '@/components/NotificationsList';
import { SegmentTabs } from '@/components/SegmentTabs';
import { Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { CommunityPost, Volunteer } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';
import { useNotificationBadge } from '@/src/context/NotificationBadgeContext';

type CommunityTab = 'posts' | 'team' | 'notifications';

export default function CommunityScreen() {
  const { token, tenantSlug } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { unreadCount } = useNotificationBadge();

  const [tab, setTab] = useState<CommunityTab>('posts');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    if (!token || !tenantSlug) return;
    const result = await api.listCommunityPosts({ token, tenantSlug });
    setPosts(result.items);
  }, [token, tenantSlug]);

  const loadVolunteers = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setVolunteers(await api.listVolunteers({ token, tenantSlug }));
  }, [token, tenantSlug]);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError(null);
    try {
      await Promise.all([loadPosts(), loadVolunteers()]);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, loadPosts, loadVolunteers]);

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
      <Title>Community</Title>
      <Subtitle>Posts, team directory, and alerts</Subtitle>
      {error ? <ErrorBanner message={error} /> : null}

      <SegmentTabs
        tabs={[
          { key: 'posts', label: 'Posts' },
          { key: 'team', label: 'Team' },
          { key: 'notifications', label: 'Alerts' },
        ]}
        active={tab}
        onChange={setTab}
        badges={{ notifications: unreadCount }}
      />

      {tab === 'posts' ? (
        <>
          <Pressable onPress={() => router.push('/community/compose' as Href)} style={styles.composeLink}>
            <Text style={{ color: Colors.primary, fontWeight: '600' }}>+ New post</Text>
          </Pressable>
          <FlatList
            data={posts}
            keyExtractor={(item) => String(item.id)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={
              !loading ? <EmptyState title="No posts yet" message="Be the first to share an update." /> : null
            }
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/community/${item.id}` as Href)}>
                <Card>
                  <Text style={[styles.author, { color: colors.textMuted }]}>{item.author?.name ?? 'Team member'}</Text>
                  <Text style={[styles.body, { color: colors.text }]}>{item.excerpt || item.body || 'Shared photos'}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {item.comments_count ?? 0} comment{(item.comments_count ?? 0) === 1 ? '' : 's'}
                  </Text>
                </Card>
              </Pressable>
            )}
          />
        </>
      ) : null}

      {tab === 'team' ? (
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
      ) : null}

      {tab === 'notifications' ? (
        <View style={styles.notificationsPane}>
          <NotificationsList embedded />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 0 },
  composeLink: { marginBottom: 8 },
  author: { fontSize: 12, marginBottom: 4 },
  body: { fontSize: 15, marginBottom: 6 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 14, marginTop: 2 },
  notificationsPane: { flex: 1 },
});
