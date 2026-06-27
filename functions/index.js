const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();

const laravelChatNotifyUrl = defineString('LARAVEL_CHAT_NOTIFY_URL');
const chatNotifySecret = defineString('CHAT_NOTIFY_SECRET');

exports.onDirectChatMessageCreated = onDocumentCreated(
  'tenants/{tenantId}/directChats/{chatId}/messages/{messageId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      return;
    }

    const message = snapshot.data();
    const { tenantId, chatId } = event.params;
    const senderUserId = String(message.senderUserId ?? '');
    const senderName = String(message.senderName ?? 'Volunteer');
    const text = String(message.text ?? '').trim();

    if (!senderUserId || !text) {
      return;
    }

    const chatSnap = await snapshot.ref.parent.parent.get();
    if (!chatSnap.exists) {
      return;
    }

    const participants = chatSnap.data()?.participants ?? {};
    const recipientEntry = Object.values(participants).find(
      (participant) => String(participant.userId) !== senderUserId,
    );

    if (!recipientEntry?.userId) {
      return;
    }

    const notifyUrl = laravelChatNotifyUrl.value();
    const secret = chatNotifySecret.value();

    if (!notifyUrl || !secret) {
      console.warn('Chat notify skipped: LARAVEL_CHAT_NOTIFY_URL or CHAT_NOTIFY_SECRET not set.');
      return;
    }

    const response = await fetch(notifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Chat-Notify-Secret': secret,
      },
      body: JSON.stringify({
        tenant_id: Number(tenantId),
        recipient_user_id: Number(recipientEntry.userId),
        sender_user_id: Number(senderUserId),
        sender_name: senderName,
        text,
        chat_id: chatId,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('Chat notify webhook failed', response.status, body);
    }
  },
);
