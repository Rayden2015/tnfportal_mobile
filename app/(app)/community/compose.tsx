import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Stack, useRouter, type Href } from 'expo-router';

import { Button, Card, ErrorBanner, FieldLabel, Input, Screen, Subtitle, Title } from '@/components/ui';
import * as api from '@/src/api';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function CommunityComposeScreen() {
  const { token, tenantSlug } = useAuth();
  const router = useRouter();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!token || !tenantSlug || !body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const post = await api.createCommunityPost({ token, tenantSlug }, body.trim());
      router.replace(`/community/${post.id}` as Href);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New post' }} />
      <Screen>
        <Title>New post</Title>
        <Subtitle>Share an update with your organisation</Subtitle>
        {error ? <ErrorBanner message={error} /> : null}
        <Card>
          <FieldLabel>Message</FieldLabel>
          <Input value={body} onChangeText={setBody} multiline placeholder="What's happening?" />
        </Card>
        <Button label="Publish" onPress={submit} loading={submitting} />
      </Screen>
    </>
  );
}
