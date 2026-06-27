import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import { Button, Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import { CardListSkeleton } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { MessageItem } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function MessagesScreen() {
  const { token, tenantSlug } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [direction, setDirection] = useState<'all' | 'outbound' | 'inbound'>('outbound');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError(null);
    try {
      const result = await api.listMessages(
        { token, tenantSlug },
        { direction: direction === 'all' ? undefined : direction },
      );
      setMessages(result.items);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, direction]);

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
      <Title>Messages</Title>
      <Subtitle>Outbound sends and WhatsApp replies</Subtitle>
      <Button label="Compose message" onPress={() => router.push('/message/compose' as Href)} />
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.filters}>
        {(['outbound', 'inbound', 'all'] as const).map((value) => {
          const selected = direction === value;
          return (
            <Pressable
              key={value}
              onPress={() => setDirection(value)}
              style={[
                styles.filterChip,
                { borderColor: selected ? Colors.primary : colors.border, backgroundColor: selected ? Colors.primary : colors.card },
              ]}>
              <Text style={{ color: selected ? '#fff' : colors.text, fontWeight: '600', textTransform: 'capitalize' }}>
                {value}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading && messages.length === 0 ? (
        <CardListSkeleton count={4} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            !loading ? <EmptyState title="No messages" message="Messages for this filter will appear here." /> : null
          }
          renderItem={({ item }) => <MessageRow message={item} colors={colors} onPress={() => router.push(`/message/${item.id}` as Href)} />}
        />
      )}
    </Screen>
  );
}

function MessageRow({
  message,
  colors,
  onPress,
}: {
  message: MessageItem;
  colors: (typeof Colors)['light'];
  onPress: () => void;
}) {
  const preview = message.subject || message.body || '—';
  return (
    <Pressable onPress={onPress}>
      <Card>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {preview}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {message.channel}
          {message.direction ? ` · ${message.direction}` : ''}
          {message.status ? ` · ${message.status}` : ''}
        </Text>
        {message.recipient ? (
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            {message.recipient}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 0 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  rowTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 14, marginTop: 2 },
});
