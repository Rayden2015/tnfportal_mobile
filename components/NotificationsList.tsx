import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Card, EmptyState, ErrorBanner } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { NotificationItem } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';
import { useNotificationBadge } from '@/src/context/NotificationBadgeContext';

export function NotificationsList({ embedded = false }: { embedded?: boolean }) {
  const { token, tenantSlug } = useAuth();
  const { refresh: refreshBadge } = useNotificationBadge();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError(null);
    try {
      setItems(await api.listNotifications({ token, tenantSlug }));
      await refreshBadge();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, refreshBadge]);

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

  const markRead = async (id: string) => {
    if (!token || !tenantSlug) return;
    try {
      await api.markNotificationRead({ token, tenantSlug }, id);
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, read_at: new Date().toISOString() } : item)),
      );
      await refreshBadge();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const markAllRead = async () => {
    if (!token || !tenantSlug) return;
    try {
      await api.markAllNotificationsRead({ token, tenantSlug });
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? now })));
      await refreshBadge();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  return (
    <>
      {error ? <ErrorBanner message={error} /> : null}
      {items.some((item) => !item.read_at) ? (
        <Pressable onPress={markAllRead} style={styles.markAll}>
          <Text style={{ color: Colors.primary, fontWeight: '600' }}>Mark all as read</Text>
        </Pressable>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        scrollEnabled={!embedded}
        style={embedded ? styles.embeddedList : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading ? <EmptyState title="No notifications" message="You're all caught up." /> : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => !item.read_at && markRead(item.id)}>
            <Card style={!item.read_at ? styles.unread : undefined}>
              <Text style={[styles.type, { color: colors.text }]}>{item.type}</Text>
              <Text style={[styles.body, { color: colors.textMuted }]}>{summarizeNotification(item)}</Text>
              <Text style={[styles.time, { color: colors.textMuted }]}>
                {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </>
  );
}

function summarizeNotification(item: NotificationItem) {
  const data = item.data ?? {};
  if (typeof data.message === 'string') return data.message;
  if (typeof data.title === 'string') return data.title;
  return JSON.stringify(data);
}

const styles = StyleSheet.create({
  embeddedList: { flex: 1 },
  markAll: { marginBottom: 8 },
  unread: { borderColor: Colors.primary, borderWidth: 1.5 },
  type: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  body: { fontSize: 14, lineHeight: 20 },
  time: { fontSize: 12, marginTop: 8 },
});
