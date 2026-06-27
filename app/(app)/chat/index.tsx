import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Button, Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/src/context/AuthContext';
import { useFirebase } from '@/src/context/FirebaseContext';
import { subscribeToMyChats, type DirectChatSummary } from '@/src/firebase/chat';

export default function ChatListScreen({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const { user, tenant } = useAuth();
  const { ready, enabled, connecting, error, reconnect } = useFirebase();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [chats, setChats] = useState<DirectChatSummary[]>([]);
  const [listenError, setListenError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user?.id || !tenant?.id) {
      return;
    }

    return subscribeToMyChats(
      tenant.id,
      user.id,
      setChats,
      (err) => setListenError(err.message),
    );
  }, [ready, user?.id, tenant?.id]);

  const openChat = useCallback(
    (chat: DirectChatSummary) => {
      const params = new URLSearchParams({
        peerName: chat.peer.name,
        peerVolunteerId: chat.peer.volunteerId ? String(chat.peer.volunteerId) : '',
        peerPhotoUrl: chat.peer.photoUrl ?? '',
      });
      router.push(`/chat/${chat.peer.userId}?${params.toString()}` as Href);
    },
    [router],
  );

  if (!enabled) {
    return (
      <Screen style={embedded ? styles.embeddedContainer : undefined}>
        {!embedded ? (
          <>
            <Title>Chat</Title>
            <Subtitle>Direct messages with volunteers</Subtitle>
          </>
        ) : null}
        <EmptyState
          title="Chat not configured"
          message="Add Firebase keys to the mobile .env and enable FIREBASE_ENABLED on the API server."
        />
      </Screen>
    );
  }

  return (
    <Screen style={embedded ? styles.embeddedContainer : styles.container}>
      {!embedded ? (
        <>
          <Title>Chat</Title>
          <Subtitle>Message other volunteers in your organization</Subtitle>
        </>
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}
      {listenError ? <ErrorBanner message={listenError} /> : null}

      {connecting ? <Text style={{ color: colors.textMuted, marginBottom: 8 }}>Connecting…</Text> : null}

      {!ready && !connecting ? (
        <Button label="Connect chat" onPress={reconnect} />
      ) : null}

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          ready ? (
            <EmptyState
              title="No conversations yet"
              message="Open a volunteer profile from Team and tap Message to start chatting."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => openChat(item)}>
            <Card>
              <View style={styles.row}>
                <ProfileAvatar name={item.peer.name} photoUrl={item.peer.photoUrl} size={48} />
                <View style={styles.details}>
                  <Text style={[styles.name, { color: colors.text }]}>{item.peer.name}</Text>
                  <Text style={[styles.preview, { color: colors.textMuted }]} numberOfLines={1}>
                    {item.lastMessage ?? 'Start a conversation'}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 0 },
  embeddedContainer: { flex: 1, paddingBottom: 0, paddingHorizontal: 0, paddingTop: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  details: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  preview: { fontSize: 14, marginTop: 2 },
});
