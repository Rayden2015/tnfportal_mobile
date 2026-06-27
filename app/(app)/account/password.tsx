import { useState } from 'react';
import { Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { Button, Card, ErrorBanner, FieldLabel, Input, Screen, Subtitle, Title } from '@/components/ui';
import * as api from '@/src/api';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function ChangePasswordScreen() {
  const { token, tenantSlug } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!token || !tenantSlug) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.updatePassword({ token, tenantSlug }, currentPassword, password, confirmation);
      Alert.alert('Password updated', result.message, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Change password' }} />
      <Screen>
        <Title>Change password</Title>
        <Subtitle>Update your account password</Subtitle>
        {error ? <ErrorBanner message={error} /> : null}
        <Card>
          <FieldLabel>Current password</FieldLabel>
          <Input value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          <FieldLabel>New password</FieldLabel>
          <Input value={password} onChangeText={setPassword} secureTextEntry />
          <FieldLabel>Confirm new password</FieldLabel>
          <Input value={confirmation} onChangeText={setConfirmation} secureTextEntry />
        </Card>
        <Button label="Update password" onPress={submit} loading={submitting} />
      </Screen>
    </>
  );
}
