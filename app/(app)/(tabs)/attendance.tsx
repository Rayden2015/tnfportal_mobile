import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import { Button, Card, EmptyState, ErrorBanner, FieldLabel, Input, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Attendance, Project } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';
import { useOfflineCheckInSync } from '@/src/hooks/useOfflineCheckInSync';
import { queueCheckIn } from '@/src/offline/checkInQueue';
import { queueCheckOut } from '@/src/offline/checkOutQueue';

export default function AttendanceScreen() {
  const { token, tenantSlug, hasAnyRole } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isStaff = hasAnyRole('tenant_admin', 'coordinator', 'super_admin');
  const { pending, pendingCheckOuts, syncing, sync, refreshPending } = useOfflineCheckInSync();

  const [records, setRecords] = useState<Attendance[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    const auth = { token, tenantSlug };
    setError(null);

    try {
      if (isStaff) {
        const result = await api.listAttendance(auth);
        setRecords(result.items);
      } else {
        const [attendance, options] = await Promise.all([
          api.listMyAttendance(auth),
          api.getCheckInOptions(auth),
        ]);
        setRecords(attendance);
        setProjects(options.projects);
        setGeoEnabled(options.geo_fencing_enabled);
        if (!selectedProjectId && options.projects[0]) {
          setSelectedProjectId(options.projects[0].id);
        }
      }
      await refreshPending();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, isStaff, selectedProjectId, refreshPending]);

  useFocusEffect(
    useCallback(() => {
      void load();
      if (!isStaff) void sync();
    }, [load, sync, isStaff]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (!isStaff) await sync();
    await load();
    setRefreshing(false);
  };

  const activeSession = records.find((r) => r.is_checked_in);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const captureLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location required', 'Enable location to check in for this organization.');
      return null;
    }
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  };

  const handleCheckIn = async () => {
    if (!token || !tenantSlug || !selectedProjectId) return;
    setActionLoading(true);
    setError(null);

    try {
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (geoEnabled) {
        const coords = await captureLocation();
        if (!coords) return;
        latitude = coords.latitude;
        longitude = coords.longitude;
      }

      await api.selfCheckIn(
        { token, tenantSlug },
        { project_id: selectedProjectId, latitude, longitude, notes: notes.trim() || undefined },
      );
      setNotes('');
      await load();
      Alert.alert('Checked in', 'Your attendance has been recorded.');
    } catch (err) {
      const message = formatApiError(err);
      const isNetworkError =
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('fetch') ||
        message.toLowerCase().includes('failed');

      if (isNetworkError) {
        let latitude: number | undefined;
        let longitude: number | undefined;
        if (geoEnabled) {
          const coords = await captureLocation();
          if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
          }
        }
        await queueCheckIn({
          project_id: selectedProjectId,
          project_title: selectedProject?.title,
          latitude,
          longitude,
          notes: notes.trim() || undefined,
        });
        setNotes('');
        await refreshPending();
        Alert.alert(
          'Saved offline',
          'Check-in queued and will sync when you are back online.',
        );
      } else {
        setError(message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!token || !tenantSlug || !activeSession) return;
    setActionLoading(true);
    setError(null);

    try {
      await api.selfCheckOut({ token, tenantSlug }, activeSession.id, notes.trim() || undefined);
      setNotes('');
      await load();
      Alert.alert('Checked out', 'Session closed successfully.');
    } catch (err) {
      const message = formatApiError(err);
      const isNetworkError =
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('fetch') ||
        message.toLowerCase().includes('failed');

      if (isNetworkError) {
        await queueCheckOut({
          attendance_id: activeSession.id,
          project_title: activeSession.project?.title,
          notes: notes.trim() || undefined,
        });
        setNotes('');
        await refreshPending();
        Alert.alert('Saved offline', 'Check-out queued and will sync when you are back online.');
      } else {
        setError(message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncPending = async () => {
    const result = await sync();
    await load();
    if (!result) return;
    const syncedTotal = result.checkIns.synced + result.checkOuts.synced;
    const remainingTotal = result.checkIns.remaining + result.checkOuts.remaining;
    if (syncedTotal > 0) {
      Alert.alert('Synced', `${syncedTotal} queued attendance action(s) uploaded.`);
    } else if (remainingTotal > 0) {
      Alert.alert('Sync incomplete', `${remainingTotal} item(s) still pending.`);
    } else {
      Alert.alert('Up to date', 'No pending attendance actions.');
    }
  };

  return (
    <Screen style={styles.container}>
      <Title>{isStaff ? 'Attendance records' : 'Volunteer check-in'}</Title>
      <Subtitle>
        {isStaff ? 'Recent check-ins across your organization' : 'Check in and out of your assigned projects'}
      </Subtitle>
      {error ? <ErrorBanner message={error} /> : null}

      {!isStaff && (pending.length > 0 || pendingCheckOuts.length > 0) ? (
        <Card>
          <Text style={[styles.pendingTitle, { color: colors.text }]}>
            {pending.length + pendingCheckOuts.length} attendance action
            {pending.length + pendingCheckOuts.length === 1 ? '' : 's'} waiting to sync
          </Text>
          {pending.map((item) => (
            <Text key={item.id} style={[styles.pendingItem, { color: colors.textMuted }]}>
              Check-in · {item.project_title ?? `Project #${item.project_id}`} ·{' '}
              {new Date(item.created_at).toLocaleString()}
            </Text>
          ))}
          {pendingCheckOuts.map((item) => (
            <Text key={item.id} style={[styles.pendingItem, { color: colors.textMuted }]}>
              Check-out · {item.project_title ?? `Session #${item.attendance_id}`} ·{' '}
              {new Date(item.created_at).toLocaleString()}
            </Text>
          ))}
          <Button
            label={syncing ? 'Syncing…' : 'Sync now'}
            onPress={handleSyncPending}
            loading={syncing}
            variant="secondary"
          />
        </Card>
      ) : null}

      {!isStaff ? (
        <Card>
          {activeSession ? (
            <>
              <Text style={[styles.activeLabel, { color: colors.success }]}>Currently checked in</Text>
              <Text style={[styles.activeProject, { color: colors.text }]}>
                {activeSession.project?.title ?? `Project #${activeSession.project_id}`}
              </Text>
              <FieldLabel>Checkout notes (optional)</FieldLabel>
              <Input value={notes} onChangeText={setNotes} placeholder="How did it go?" />
              <Button label="Check out" onPress={handleCheckOut} loading={actionLoading} variant="secondary" />
            </>
          ) : (
            <>
              <FieldLabel>Project</FieldLabel>
              {projects.length === 0 ? (
                <Text style={{ color: colors.textMuted, marginBottom: 12 }}>No projects available for check-in.</Text>
              ) : (
                <View style={styles.projectPicker}>
                  {projects.map((project) => {
                    const selected = selectedProjectId === project.id;
                    return (
                      <Pressable key={project.id} onPress={() => setSelectedProjectId(project.id)}>
                        <Text
                          style={[
                            styles.projectChip,
                            {
                              backgroundColor: selected ? Colors.primary : colors.background,
                              color: selected ? '#fff' : colors.text,
                              borderColor: colors.border,
                            },
                          ]}>
                          {project.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              {geoEnabled ? (
                <Text style={[styles.geoHint, { color: colors.textMuted }]}>
                  Location will be captured for this check-in.
                </Text>
              ) : null}
              <FieldLabel>Notes (optional)</FieldLabel>
              <Input value={notes} onChangeText={setNotes} placeholder="Optional notes" />
              <Button
                label="Check in"
                onPress={handleCheckIn}
                loading={actionLoading}
                disabled={!selectedProjectId}
              />
            </>
          )}
        </Card>
      ) : null}

      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading ? <EmptyState title="No attendance records" message="Records will appear here after check-ins." /> : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={isStaff ? () => router.push(`/attendance/${item.id}` as Href) : undefined}
            disabled={!isStaff}>
            <Card>
            <Text style={[styles.recordTitle, { color: colors.text }]}>
              {item.volunteer?.name ?? `Volunteer #${item.volunteer_id}`}
            </Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {item.project?.title ?? `Project #${item.project_id}`}
            </Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {item.status_text ?? item.status} · {formatWhen(item.check_in)}
              {item.check_out ? ` → ${formatWhen(item.check_out)}` : ''}
            </Text>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

function formatWhen(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
  },
  pendingTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  pendingItem: {
    fontSize: 13,
    marginBottom: 4,
  },
  activeLabel: {
    fontWeight: '700',
    marginBottom: 4,
  },
  activeProject: {
    fontSize: 16,
    marginBottom: 12,
  },
  projectPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  projectChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  geoHint: {
    fontSize: 13,
    marginBottom: 8,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  meta: {
    fontSize: 14,
    marginTop: 2,
  },
});
