import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Attendance } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function AttendanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const attendanceId = Number(id);
  const router = useRouter();
  const { token, tenantSlug } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [record, setRecord] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug || !attendanceId) return;
    setError(null);
    try {
      setRecord(await api.getAttendance({ token, tenantSlug }, attendanceId));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, attendanceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const checkout = async () => {
    if (!token || !tenantSlug || !record) return;
    setActionLoading(true);
    try {
      await api.adminCheckOut({ token, tenantSlug }, record.id);
      await load();
      Alert.alert('Checked out', 'Attendance session closed.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const remove = async () => {
    if (!token || !tenantSlug || !record) return;
    Alert.alert('Delete attendance', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await api.deleteAttendance({ token, tenantSlug }, record.id);
            router.back();
          } catch (err) {
            setError(formatApiError(err));
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading && !record) {
    return (
      <Screen>
        <Text style={{ color: colors.textMuted }}>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>Attendance detail</Title>
        <Subtitle>Session #{record?.id}</Subtitle>
        {error ? <ErrorBanner message={error} /> : null}

        {record ? (
          <Card>
            <Text style={[styles.label, { color: colors.textMuted }]}>Volunteer</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {record.volunteer?.name ?? `#${record.volunteer_id}`}
            </Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>Project</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {record.project?.title ?? `#${record.project_id}`}
            </Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>Check-in</Text>
            <Text style={[styles.value, { color: colors.text }]}>{formatWhen(record.check_in)}</Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>Check-out</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {record.check_out ? formatWhen(record.check_out) : 'Open'}
            </Text>
            {record.notes ? (
              <>
                <Text style={[styles.label, { color: colors.textMuted }]}>Notes</Text>
                <Text style={[styles.value, { color: colors.text }]}>{record.notes}</Text>
              </>
            ) : null}
          </Card>
        ) : null}

        {record && !record.check_out ? (
          <Button label="Check out volunteer" onPress={checkout} loading={actionLoading} />
        ) : null}
        <Button label="Delete record" onPress={remove} loading={actionLoading} variant="danger" />
      </ScrollView>
    </Screen>
  );
}

function formatWhen(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  label: { fontSize: 13, marginTop: 8 },
  value: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
});
