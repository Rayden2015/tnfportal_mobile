import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useFocusEffect } from 'expo-router';

import { Button, Card, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { ConsentStatus } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function ConsentScreen() {
  const { token, tenantSlug } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError(null);
    try {
      setStatus(await api.getConsentStatus({ token, tenantSlug }));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const approve = async () => {
    if (!token || !tenantSlug) return;
    setWorking(true);
    try {
      const result = await api.approveConsent({ token, tenantSlug });
      Alert.alert('Consent approved', result.message);
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setWorking(false);
    }
  };

  const decline = async () => {
    if (!token || !tenantSlug) return;
    Alert.alert('Decline consent?', 'Your response will be recorded.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          setWorking(true);
          try {
            const result = await api.declineConsent({ token, tenantSlug });
            Alert.alert('Recorded', result.message);
            await load();
          } catch (err) {
            setError(formatApiError(err));
          } finally {
            setWorking(false);
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Volunteer consent' }} />
      <Screen>
        <Title>Volunteer consent</Title>
        <Subtitle>Review and respond to your organisation's consent request</Subtitle>
        {error ? <ErrorBanner message={error} /> : null}

        <Card>
          <Text style={[styles.label, { color: colors.textMuted }]}>Status</Text>
          <Text style={[styles.value, { color: colors.text }]}>{status?.consent_status ?? (loading ? '…' : 'Unknown')}</Text>
          {status?.has_dues_configured ? (
            <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 13 }}>
              This organisation collects volunteer dues. Consent may include dues acknowledgement.
            </Text>
          ) : null}
        </Card>

        {status?.can_respond ? (
          <>
            <Button label="Approve consent" onPress={approve} loading={working} />
            <Button label="Decline" onPress={decline} variant="danger" disabled={working} />
          </>
        ) : (
          <Card>
            <Text style={{ color: colors.textMuted }}>Your consent response is already on file.</Text>
          </Card>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13 },
  value: { fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
});
