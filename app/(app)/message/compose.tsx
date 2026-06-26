import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { Button, Card, ErrorBanner, FieldLabel, Input, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { MessageComposePayload, MessageTemplate, Volunteer } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

const CHANNELS = ['sms', 'whatsapp', 'mail'] as const;

export default function ComposeMessageScreen() {
  const router = useRouter();
  const { token, tenantSlug } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const [channel, setChannel] = useState<MessageComposePayload['channel']>('sms');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<number[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    void api.listVolunteers(auth).then(setVolunteers).catch(() => undefined);
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    void api.listMessageTemplates(auth, channel).then(setTemplates).catch(() => setTemplates([]));
    setSelectedTemplateId(null);
  }, [auth, channel]);

  const toggleVolunteer = (id: number) => {
    setSelectedVolunteerIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const applyTemplate = (template: MessageTemplate) => {
    setSelectedTemplateId(template.id);
    if (template.subject) setSubject(template.subject);
    setBody(template.body ?? '');
  };

  const handleSend = async () => {
    if (!auth) return;
    const payload: MessageComposePayload = {
      channel,
      body: body.trim(),
      subject: channel === 'mail' ? subject.trim() : subject.trim() || undefined,
      template_id: selectedTemplateId ?? undefined,
      volunteer_ids: selectedVolunteerIds.length ? selectedVolunteerIds : undefined,
      recipient_phone: recipientPhone.trim() || undefined,
      recipient_email: recipientEmail.trim() || undefined,
    };

    setSending(true);
    setError(null);
    try {
      const result = await api.sendMessage(auth, payload);
      Alert.alert(
        'Message sent',
        `${result.sent_count} sent, ${result.failed_count} failed, ${result.skipped_count} skipped.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Compose message' }} />
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Title>Compose</Title>
          <Subtitle>Send SMS, WhatsApp, or email to volunteers or an ad-hoc recipient</Subtitle>
          {error ? <ErrorBanner message={error} /> : null}

          <Card>
            <FieldLabel>Channel</FieldLabel>
            <View style={styles.chipRow}>
              {CHANNELS.map((value) => {
                const selected = channel === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setChannel(value)}
                    style={[
                      styles.chip,
                      { borderColor: selected ? Colors.primary : colors.border, backgroundColor: selected ? Colors.primary : colors.card },
                    ]}>
                    <Text style={{ color: selected ? '#fff' : colors.text, textTransform: 'uppercase' }}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>

            {templates.length > 0 ? (
              <>
                <FieldLabel>Template (optional)</FieldLabel>
                <View style={styles.templateList}>
                  {templates.map((template) => (
                    <Pressable key={template.id} onPress={() => applyTemplate(template)}>
                      <Text style={{ color: selectedTemplateId === template.id ? Colors.primary : colors.text }}>
                        {template.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            {channel === 'mail' ? (
              <>
                <FieldLabel>Subject</FieldLabel>
                <Input value={subject} onChangeText={setSubject} placeholder="Email subject" />
              </>
            ) : null}

            <FieldLabel>Message</FieldLabel>
            <Input value={body} onChangeText={setBody} multiline placeholder="Write your message" />

            <FieldLabel>Volunteers (optional)</FieldLabel>
            <View style={styles.volunteerList}>
              {volunteers.map((volunteer) => {
                const selected = selectedVolunteerIds.includes(volunteer.id);
                return (
                  <Pressable key={volunteer.id} onPress={() => toggleVolunteer(volunteer.id)} style={styles.choiceRow}>
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: selected ? Colors.primary : colors.border, backgroundColor: selected ? Colors.primary : 'transparent' },
                      ]}
                    />
                    <Text style={{ color: colors.text, flex: 1 }}>{volunteer.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            <FieldLabel>Or ad-hoc phone</FieldLabel>
            <Input value={recipientPhone} onChangeText={setRecipientPhone} placeholder="+233..." keyboardType="phone-pad" />
            <FieldLabel>Or ad-hoc email</FieldLabel>
            <Input value={recipientEmail} onChangeText={setRecipientEmail} placeholder="name@example.com" autoCapitalize="none" />
          </Card>

          <Button label="Send message" onPress={handleSend} loading={sending} />
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  templateList: { gap: 8, marginBottom: 12 },
  volunteerList: { gap: 8, marginBottom: 12 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2 },
});
