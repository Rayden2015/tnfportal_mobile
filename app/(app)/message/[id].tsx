import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { Card, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { MessageItem } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';
import { detailScreenOptionsDynamic } from '@/src/navigation/stackOptions';

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const messageId = Number(id);
  const { token, tenantSlug } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [message, setMessage] = useState<MessageItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug || !messageId) return;
    setError(null);
    try {
      setMessage(await api.getMessage({ token, tenantSlug }, messageId));
    } catch (err) {
      setError(formatApiError(err));
    }
  }, [token, tenantSlug, messageId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <Stack.Screen options={detailScreenOptionsDynamic(message?.subject, 'Message')} />
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          {error ? <ErrorBanner message={error} /> : null}
          {!message && !error ? <Text style={{ color: colors.textMuted }}>Loading…</Text> : null}
          {message ? (
            <>
              <Title>{message.subject || 'Message'}</Title>
              <Subtitle>
                {message.channel}
                {message.direction ? ` · ${message.direction}` : ''}
                {message.status ? ` · ${message.status}` : ''}
              </Subtitle>
              <Card>
                {message.recipient ? (
                  <Text style={[styles.row, { color: colors.text }]}>
                    <Text style={{ color: colors.textMuted }}>To: </Text>
                    {message.recipient}
                  </Text>
                ) : null}
                {message.sent_at || message.created_at ? (
                  <Text style={[styles.row, { color: colors.text }]}>
                    <Text style={{ color: colors.textMuted }}>When: </Text>
                    {message.sent_at ?? message.created_at}
                  </Text>
                ) : null}
                <Text style={[styles.body, { color: colors.text }]}>{message.body}</Text>
              </Card>
            </>
          ) : null}
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  row: { fontSize: 15, marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 24, marginTop: 8 },
});
