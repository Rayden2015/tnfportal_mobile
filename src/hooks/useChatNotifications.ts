import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter, type Href } from 'expo-router';

import { useAuth } from '@/src/context/AuthContext';
import { useFirebase } from '@/src/context/FirebaseContext';
import { subscribeToMyChats, type DirectChatSummary } from '@/src/firebase/chat';

function chatSignature(chat: DirectChatSummary): string {
  const stamp = chat.lastMessageAt?.getTime?.() ?? 0;
  return `${chat.lastMessage ?? ''}:${stamp}`;
}

function isViewingPeer(pathname: string, peerUserId: number): boolean {
  return pathname === `/chat/${peerUserId}` || pathname.startsWith(`/chat/${peerUserId}?`);
}

async function showLocalChatNotification(chat: DirectChatSummary) {
  const preview = chat.lastMessage?.trim();
  if (!preview) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: chat.peer.name,
      body: preview,
      data: {
        type: 'chat.message_received',
        peerUserId: String(chat.peer.userId),
        peerName: chat.peer.name,
        peerVolunteerId: chat.peer.volunteerId ? String(chat.peer.volunteerId) : '',
        peerPhotoUrl: chat.peer.photoUrl ?? '',
        chatId: chat.id,
      },
    },
    trigger: null,
  });
}

export function useChatNotifications() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, tenant } = useAuth();
  const { ready } = useFirebase();
  const lastSeenRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!ready || !user?.id || !tenant?.id) {
      return;
    }

    return subscribeToMyChats(tenant.id, user.id, (chats) => {
      chats.forEach((chat) => {
        const signature = chatSignature(chat);
        const previous = lastSeenRef.current.get(chat.id);
        lastSeenRef.current.set(chat.id, signature);

        if (previous === undefined || previous === signature) {
          return;
        }

        if (isViewingPeer(pathname, chat.peer.userId)) {
          return;
        }

        void showLocalChatNotification(chat);
      });
    });
  }, [ready, user?.id, tenant?.id, pathname]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string | undefined>;
      if (data?.type !== 'chat.message_received' || !data.peerUserId) {
        return;
      }

      const params = new URLSearchParams({
        peerName: data.peerName ?? 'Chat',
        peerVolunteerId: data.peerVolunteerId ?? '',
        peerPhotoUrl: data.peerPhotoUrl ?? '',
      });

      router.push(`/chat/${data.peerUserId}?${params.toString()}` as Href);
    });

    return () => subscription.remove();
  }, [router]);
}
