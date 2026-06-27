import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import {
  directChatId,
  firebaseUid,
  getCurrentFirebaseUid,
  getFirebaseFirestore,
  tenantChatsCollection,
} from '@/src/firebase/client';

export type ChatParticipant = {
  userId: number;
  volunteerId?: number | null;
  name: string;
  photoUrl?: string | null;
};

export type DirectChatSummary = {
  id: string;
  peer: ChatParticipant;
  lastMessage?: string | null;
  lastMessageAt?: Date | null;
};

export type ChatMessage = {
  id: string;
  senderUserId: string;
  senderName: string;
  text: string;
  createdAt: Date | null;
};

type EnsureChatInput = {
  tenantId: number;
  currentUser: ChatParticipant;
  peer: ChatParticipant;
};

export async function ensureDirectChat(input: EnsureChatInput): Promise<string> {
  const db = getFirebaseFirestore();
  if (!db) {
    throw new Error('Firebase chat is not configured');
  }

  const chatId = directChatId(input.currentUser.userId, input.peer.userId);
  const chatRef = doc(db, tenantChatsCollection(input.tenantId), chatId);
  const existing = await getDoc(chatRef);
  const participantUserIds = [
    firebaseUid(input.tenantId, input.currentUser.userId),
    firebaseUid(input.tenantId, input.peer.userId),
  ];

  if (!existing.exists()) {
    await setDoc(chatRef, {
      participantUserIds,
      participants: {
        [String(input.currentUser.userId)]: {
          userId: input.currentUser.userId,
          volunteerId: input.currentUser.volunteerId ?? null,
          name: input.currentUser.name,
          photoUrl: input.currentUser.photoUrl ?? null,
        },
        [String(input.peer.userId)]: {
          userId: input.peer.userId,
          volunteerId: input.peer.volunteerId ?? null,
          name: input.peer.name,
          photoUrl: input.peer.photoUrl ?? null,
        },
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    const storedIds = (existing.data().participantUserIds ?? []) as string[];
    const needsMigration = storedIds.some((id) => !String(id).startsWith('tenant_'));
    if (needsMigration) {
      await updateDoc(chatRef, { participantUserIds });
    }
  }

  return chatId;
}

export function subscribeToMyChats(
  tenantId: number,
  currentUserId: number,
  onUpdate: (chats: DirectChatSummary[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseFirestore();
  const currentFirebaseUid = getCurrentFirebaseUid();
  if (!db || !currentFirebaseUid) {
    onUpdate([]);
    return () => undefined;
  }

  const chatsQuery = query(
    collection(db, tenantChatsCollection(tenantId)),
    where('participantUserIds', 'array-contains', currentFirebaseUid),
    orderBy('updatedAt', 'desc'),
  );

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const chats = snapshot.docs.map((chatDoc) => {
        const data = chatDoc.data();
        const participants = (data.participants ?? {}) as Record<
          string,
          { userId: number; volunteerId?: number; name: string; photoUrl?: string }
        >;
        const peerEntry = Object.values(participants).find((item) => item.userId !== currentUserId);
        const peer: ChatParticipant = peerEntry
          ? {
              userId: peerEntry.userId,
              volunteerId: peerEntry.volunteerId,
              name: peerEntry.name,
              photoUrl: peerEntry.photoUrl,
            }
          : { userId: 0, name: 'Volunteer' };

        return {
          id: chatDoc.id,
          peer,
          lastMessage: (data.lastMessage as string | undefined) ?? null,
          lastMessageAt: data.updatedAt?.toDate?.() ?? null,
        };
      });

      onUpdate(chats);
    },
    (error) => onError?.(error),
  );
}

export function subscribeToMessages(
  tenantId: number,
  chatId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseFirestore();
  if (!db) {
    onUpdate([]);
    return () => undefined;
  }

  const messagesQuery = query(
    collection(db, tenantChatsCollection(tenantId), chatId, 'messages'),
    orderBy('createdAt', 'asc'),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      onUpdate(
        snapshot.docs.map((messageDoc) => {
          const data = messageDoc.data();
          return {
            id: messageDoc.id,
            senderUserId: String(data.senderUserId),
            senderName: String(data.senderName ?? 'Volunteer'),
            text: String(data.text ?? ''),
            createdAt: data.createdAt?.toDate?.() ?? null,
          };
        }),
      );
    },
    (error) => onError?.(error),
  );
}

export async function sendDirectMessage(input: {
  tenantId: number;
  chatId: string;
  senderUserId: number;
  senderName: string;
  text: string;
}): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db) {
    throw new Error('Firebase chat is not configured');
  }

  const trimmed = input.text.trim();
  if (!trimmed) {
    return;
  }

  const chatRef = doc(db, tenantChatsCollection(input.tenantId), input.chatId);
  await addDoc(collection(db, tenantChatsCollection(input.tenantId), input.chatId, 'messages'), {
    senderUserId: String(input.senderUserId),
    senderName: input.senderName,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  await updateDoc(chatRef, {
    lastMessage: trimmed,
    updatedAt: serverTimestamp(),
  });
}
