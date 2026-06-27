import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { ContactLink } from '@/components/ContactLink';
import { NotificationsList } from '@/components/NotificationsList';
import { SegmentTabs } from '@/components/SegmentTabs';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { CommunityPost, Volunteer } from '@/src/api/types';
import { CACHE_TTL, cacheKeys } from '@/src/cache/keys';
import { useAuth } from '@/src/context/AuthContext';
import { useNotificationBadge } from '@/src/context/NotificationBadgeContext';
import { useCachedQuery } from '@/src/hooks/useCachedQuery';
import ChatListScreen from '@/app/(app)/chat/index';

type CommunityTab = 'posts' | 'team' | 'chat' | 'notifications';

export default function CommunityScreen() {
  const { token, tenantSlug } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { unreadCount } = useNotificationBadge();
  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const [tab, setTab] = useState<CommunityTab>('posts');

  const postsQuery = useCachedQuery<CommunityPost[]>({
    cacheKey: auth ? cacheKeys.communityPosts(auth.tenantSlug) : null,
    enabled: Boolean(auth),
    staleTimeMs: CACHE_TTL.communityPosts,
    queryFn: async () => {
      const result = await api.listCommunityPosts(auth!);
      return result.items;
    },
  });

  const volunteersQuery = useCachedQuery<Volunteer[]>({
    cacheKey: auth ? cacheKeys.volunteers(auth.tenantSlug) : null,
    enabled: Boolean(auth),
    staleTimeMs: CACHE_TTL.volunteers,
    queryFn: () => api.listVolunteers(auth!),
  });

  const posts = postsQuery.data ?? [];
  const volunteers = volunteersQuery.data ?? [];
  const loading = postsQuery.loading || volunteersQuery.loading;
  const refreshing = postsQuery.refreshing || volunteersQuery.refreshing;
  const error = postsQuery.error ?? volunteersQuery.error;

  const onRefresh = useCallback(async () => {
    await Promise.all([postsQuery.refresh(), volunteersQuery.refresh()]);
  }, [postsQuery, volunteersQuery]);

  return (
    <Screen style={styles.container}>
      <Title>Community</Title>
      <Subtitle>Posts, team directory, and alerts</Subtitle>
      {error ? <ErrorBanner message={error} /> : null}

      <SegmentTabs
        tabs={[
          { key: 'posts', label: 'Posts' },
          { key: 'team', label: 'Team' },
          { key: 'chat', label: 'Chat' },
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
            <Card>
              <View style={styles.teamRow}>
                <Pressable onPress={() => router.push(`/volunteer/${item.id}` as Href)}>
                  <ProfileAvatar name={item.name} photoUrl={item.profile_photo_url} size={52} />
                </Pressable>
                <View style={styles.teamDetails}>
                  <Pressable onPress={() => router.push(`/volunteer/${item.id}` as Href)}>
                    <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                  </Pressable>
                  {item.email ? (
                    <ContactLink type="email" value={item.email} style={{ color: Colors.primary }} />
                  ) : null}
                  {item.phone ? (
                    <ContactLink type="phone" value={item.phone} style={{ color: Colors.primary }} />
                  ) : null}
                </View>
              </View>
            </Card>
          )}
        />
      ) : null}

      {tab === 'chat' ? (
        <View style={styles.chatPane}>
          <ChatListScreen embedded />
        </View>
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
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teamDetails: { flex: 1 },
  chatPane: { flex: 1 },
  notificationsPane: { flex: 1 },
});
