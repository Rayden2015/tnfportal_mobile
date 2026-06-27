import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { Button, Card, ErrorBanner, FieldLabel, Input, Screen } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/src/context/AuthContext';
import { useFirebase } from '@/src/context/FirebaseContext';
import {
  ensureDirectChat,
  sendDirectMessage,
  subscribeToMessages,
  type ChatMessage,
} from '@/src/firebase/chat';
import { detailScreenOptionsDynamic } from '@/src/navigation/stackOptions';
import { logAnalyticsEvent } from '@/src/monitoring/analytics';

export default function ChatThreadScreen() {
  const { peerUserId, peerName, peerVolunteerId, peerPhotoUrl } = useLocalSearchParams<{
    peerUserId: string;
    peerName?: string;
    peerVolunteerId?: string;
    peerPhotoUrl?: string;
  }>();
  const peerId = Number(peerUserId);
  const { user, tenant } = useAuth();
  const { ready } = useFirebase();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const title = peerName?.trim() || 'Chat';

  useEffect(() => {
    if (!ready || !user?.id || !tenant?.id || !peerId) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const id = await ensureDirectChat({
          tenantId: tenant.id,
          currentUser: {
            userId: user.id,
            name: user.name,
          },
          peer: {
            userId: peerId,
            volunteerId: peerVolunteerId ? Number(peerVolunteerId) : null,
            name: title,
            photoUrl: peerPhotoUrl || null,
          },
        });

        if (!cancelled) {
          setChatId(id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not open chat.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user?.id, user?.name, tenant?.id, peerId, peerVolunteerId, peerPhotoUrl, title]);

  useEffect(() => {
    if (!ready || !tenant?.id || !chatId) {
      return;
    }

    return subscribeToMessages(tenant.id, chatId, (next) => {
      setMessages(next);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    });
  }, [ready, tenant?.id, chatId]);

  const handleSend = useCallback(async () => {
    if (!user?.id || !tenant?.id || !chatId || !draft.trim()) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendDirectMessage({
        tenantId: tenant.id,
        chatId,
        senderUserId: user.id,
        senderName: user.name,
        text: draft,
      });
      setDraft('');
      void logAnalyticsEvent('chat_message_sent', { tenant_id: String(tenant.id) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  }, [user, tenant, chatId, draft]);

  return (
    <>
      <Stack.Screen options={detailScreenOptionsDynamic(title, 'Chat')} />
      <Screen style={styles.container}>
        {error ? <ErrorBanner message={error} /> : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => {
            const mine = item.senderUserId === String(user?.id);
            return (
              <View
                style={[
                  styles.bubble,
                  mine ? styles.bubbleMine : styles.bubbleTheirs,
                  { backgroundColor: mine ? Colors.primary : colors.card, borderColor: colors.border },
                ]}>
                {!mine ? (
                  <Text style={[styles.sender, { color: colors.textMuted }]}>{item.senderName}</Text>
                ) : null}
                <Text style={{ color: mine ? '#fff' : colors.text }}>{item.text}</Text>
              </View>
            );
          }}
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Card testID={chatId && ready ? 'chat-ready' : undefined}>
            <FieldLabel>Message</FieldLabel>
            <Input
              testID="chat-message-input"
              value={draft}
              onChangeText={setDraft}
              onEndEditing={(event) => setDraft(event.nativeEvent.text)}
              placeholder="Write a message…"
              multiline
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSend}
            />
            <Button testID="chat-send" label="Send" onPress={handleSend} loading={sending} disabled={!ready || !chatId} />
          </Card>
        </KeyboardAvoidingView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 8 },
  messages: { paddingBottom: 12, gap: 8 },
  bubble: {
    maxWidth: '85%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bubbleMine: { alignSelf: 'flex-end' },
  bubbleTheirs: { alignSelf: 'flex-start' },
  sender: { fontSize: 11, marginBottom: 2 },
});
