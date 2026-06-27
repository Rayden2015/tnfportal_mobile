import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Button, Card, EmptyState, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import { CardListSkeleton } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { NotificationPreferenceTypeRow } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

function matrixToPayload(matrix: NotificationPreferenceTypeRow[]): Record<string, Record<string, boolean>> {
  const payload: Record<string, Record<string, boolean>> = {};

  for (const row of matrix) {
    payload[row.type] = {};
    for (const channel of Object.values(row.channels)) {
      if (channel.selectable) {
        payload[row.type][channel.key] = channel.enabled;
      }
    }
  }

  return payload;
}

function channelIcon(channelKey: string): keyof typeof Ionicons.glyphMap {
  switch (channelKey) {
    case 'mail':
      return 'mail-outline';
    case 'database':
      return 'notifications-outline';
    case 'webpush':
      return 'globe-outline';
    case 'expo':
      return 'phone-portrait-outline';
    case 'sms':
      return 'chatbubble-outline';
    case 'whatsapp':
      return 'logo-whatsapp';
    default:
      return 'radio-outline';
  }
}

export default function NotificationPreferencesScreen() {
  const { token, tenantSlug } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [matrix, setMatrix] = useState<NotificationPreferenceTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError(null);
    try {
      const data = await api.getNotificationPreferences({ token, tenantSlug });
      setMatrix(Array.isArray(data.preferences) ? data.preferences : []);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const toggle = (type: string, channelKey: string, value: boolean) => {
    setMatrix((current) =>
      current.map((row) => {
        if (row.type !== type) {
          return row;
        }

        const channel = row.channels[channelKey];
        if (!channel?.selectable) {
          return row;
        }

        return {
          ...row,
          channels: {
            ...row.channels,
            [channelKey]: {
              ...channel,
              enabled: value,
            },
          },
        };
      }),
    );
  };

  const save = async () => {
    if (!token || !tenantSlug) return;
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const data = await api.updateNotificationPreferences({ token, tenantSlug }, matrixToPayload(matrix));
      setMatrix(Array.isArray(data.preferences) ? data.preferences : matrix);
      setStatus(data.message ?? 'Preferences saved.');
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
        <Subtitle>Choose what you want to hear about and how we should reach you.</Subtitle>
        {error ? <ErrorBanner message={error} /> : null}
        {status ? <Text style={[styles.status, { color: colors.success }]}>{status}</Text> : null}

        {loading ? (
          <CardListSkeleton count={2} />
        ) : matrix.length === 0 ? (
          <EmptyState
            title="Nothing to configure yet"
            message="There are no notification types for your role. Options appear when your organization enables alerts you can manage."
          />
        ) : (
          matrix.map((row) => (
            <Card key={row.type}>
              <Text style={[styles.eventTitle, { color: colors.text }]}>{row.label}</Text>
              {row.description ? (
                <Text style={[styles.eventDescription, { color: colors.textMuted }]}>{row.description}</Text>
              ) : null}

              {Object.values(row.channels).map((channel, index, channels) => (
                <ChannelRow
                  key={`${row.type}-${channel.key}`}
                  channel={channel}
                  colors={colors}
                  isLast={index === channels.length - 1}
                  onValueChange={(value) => toggle(row.type, channel.key, value)}
                />
              ))}
            </Card>
          ))
        )}

        {!loading && matrix.length > 0 ? (
          <Button label="Save preferences" onPress={save} loading={saving} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function ChannelRow({
  channel,
  colors,
  isLast,
  onValueChange,
}: {
  channel: NotificationPreferenceTypeRow['channels'][string];
  colors: (typeof Colors)['light'];
  isLast: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        !channel.selectable && styles.rowDisabled,
      ]}>
      <View style={styles.iconWrap}>
        <Ionicons name={channelIcon(channel.key)} size={18} color={Colors.primary} />
      </View>
      <View style={styles.rowCopy}>
        <View style={styles.rowHeader}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>{channel.label}</Text>
          {channel.default && channel.selectable ? (
            <Text style={[styles.defaultBadge, { color: colors.textMuted }]}>Default</Text>
          ) : null}
        </View>
        {channel.description ? (
          <Text style={[styles.rowDescription, { color: colors.textMuted }]}>{channel.description}</Text>
        ) : null}
        {!channel.selectable ? (
          <Text style={[styles.comingSoon, { color: colors.textMuted }]}>Coming soon for this alert type.</Text>
        ) : null}
      </View>
      <Switch
        value={channel.enabled}
        onValueChange={onValueChange}
        disabled={!channel.selectable}
        trackColor={{ true: Colors.primary, false: colors.border }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  status: { marginBottom: 12, fontWeight: '600' },
  eventTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  eventDescription: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowDisabled: {
    opacity: 0.65,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  defaultBadge: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rowDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  comingSoon: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
