import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Button, Card, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function NotificationPreferencesScreen() {
  const { token, tenantSlug } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [preferences, setPreferences] = useState<Record<string, Record<string, boolean>>>({});
  const [channels, setChannels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError(null);
    try {
      const data = await api.getNotificationPreferences({ token, tenantSlug });
      setPreferences(data.preferences ?? {});
      setChannels(data.channels ?? {});
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

  const toggle = (event: string, channel: string, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [event]: {
        ...(prev[event] ?? {}),
        [channel]: value,
      },
    }));
  };

  const save = async () => {
    if (!token || !tenantSlug) return;
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const data = await api.updateNotificationPreferences({ token, tenantSlug }, preferences);
      setPreferences(data.preferences ?? preferences);
      setStatus('Preferences saved.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>Notification preferences</Title>
        <Subtitle>Choose how you receive alerts</Subtitle>
        {error ? <ErrorBanner message={error} /> : null}
        {status ? <Text style={[styles.status, { color: colors.success }]}>{status}</Text> : null}

        {!loading
          ? Object.entries(preferences).map(([event, channelPrefs]) => (
              <Card key={event}>
                <Text style={[styles.eventTitle, { color: colors.text }]}>{formatEventLabel(event)}</Text>
                {Object.entries(channelPrefs).map(([channel, enabled]) => (
                  <ViewRow
                    key={`${event}-${channel}`}
                    label={channels[channel] ?? channel}
                    value={enabled}
                    onValueChange={(value) => toggle(event, channel, value)}
                    colors={colors}
                  />
                ))}
              </Card>
            ))
          : null}

        <Button label="Save preferences" onPress={save} loading={saving} />
      </ScrollView>
    </Screen>
  );
}

function ViewRow({
  label,
  value,
  onValueChange,
  colors,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: Colors.primary }} />
    </View>
  );
}

function formatEventLabel(event: string) {
  return event.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  status: { marginBottom: 12, fontWeight: '600' },
  eventTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: { fontSize: 15, flex: 1, paddingRight: 12 },
});
