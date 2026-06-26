import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { Button, Card, EmptyState, ErrorBanner, FieldLabel, Input, Screen } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { AttendanceRoster, Project } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = Number(id);
  const router = useRouter();
  const { token, tenantSlug, tenant, hasAnyRole } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isStaff = hasAnyRole('tenant_admin', 'coordinator', 'super_admin');

  const [project, setProject] = useState<Project | null>(null);
  const [roster, setRoster] = useState<AttendanceRoster | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const load = useCallback(async () => {
    if (!auth || !projectId) return;
    setError(null);
    try {
      setProject(await api.getProject(auth, projectId));
    } catch (err) {
      setError(formatApiError(err));
    }
  }, [auth, projectId]);

  const loadRoster = useCallback(async () => {
    if (!auth || !projectId || !isStaff) return;
    setLoadingRoster(true);
    setError(null);
    try {
      const data = await api.getProjectRoster(auth, projectId);
      setRoster(data);
      setSelectedIds([]);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoadingRoster(false);
    }
  }, [auth, projectId, isStaff]);

  useFocusEffect(
    useCallback(() => {
      void load();
      void loadRoster();
    }, [load, loadRoster]),
  );

  const checkedInSet = new Set(roster?.checked_in_volunteer_ids ?? []);

  const toggleVolunteer = (volunteerId: number) => {
    if (checkedInSet.has(volunteerId)) return;
    setSelectedIds((current) =>
      current.includes(volunteerId)
        ? current.filter((id) => id !== volunteerId)
        : [...current, volunteerId],
    );
  };

  const selectAllAvailable = () => {
    if (!roster) return;
    const available = roster.volunteers
      .filter((v) => !checkedInSet.has(v.id))
      .map((v) => v.id);
    setSelectedIds(available);
  };

  const handleContribute = async () => {
    if (!auth || !projectId) return;
    const amount = Number(contributeAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid contribution amount.');
      return;
    }
    setContributing(true);
    setError(null);
    try {
      const result = await api.contributeToProject(auth, projectId, amount);
      await Linking.openURL(result.checkout_url);
      setContributeAmount('');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setContributing(false);
    }
  };

  const handleBulkCheckIn = async () => {
    if (!auth || !projectId || selectedIds.length === 0) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.bulkCheckIn(auth, projectId, selectedIds, notes.trim() || undefined);
      setNotes('');
      setSuccess(`Checked in ${selectedIds.length} volunteer(s).`);
      await loadRoster();
      Alert.alert('Success', `${selectedIds.length} volunteer(s) checked in.`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: project?.title ?? 'Project' }} />
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          {error ? <ErrorBanner message={error} /> : null}
          {success ? <Text style={[styles.success, { color: colors.success }]}>{success}</Text> : null}
          {!project && !error ? <EmptyState title="Loading project…" /> : null}

          {project ? (
            <>
              <Card>
                <Text style={[styles.title, { color: colors.text }]}>{project.title}</Text>
                {project.description ? (
                  <Text style={[styles.body, { color: colors.textMuted }]}>{project.description}</Text>
                ) : null}
                {isStaff ? (
                  <Button
                    label="Edit project"
                    variant="secondary"
                    onPress={() => router.push(`/project/edit/${project.id}` as Href)}
                  />
                ) : null}
              </Card>
              <Card>
                <DetailRow label="Status" value={project.status ?? '—'} colors={colors} />
                <DetailRow label="Location" value={project.location ?? '—'} colors={colors} />
                <DetailRow
                  label="Dates"
                  value={[project.start_date, project.end_date].filter(Boolean).join(' → ') || '—'}
                  colors={colors}
                />
                <DetailRow
                  label="Volunteers"
                  value={project.volunteers_count != null ? String(project.volunteers_count) : '—'}
                  colors={colors}
                />
              </Card>

              {!isStaff ? (
                <Card>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Contribute</Text>
                  <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                    Support this project with an online contribution.
                  </Text>
                  <FieldLabel>Amount ({tenant?.currency ?? 'GHS'})</FieldLabel>
                  <Input
                    value={contributeAmount}
                    onChangeText={setContributeAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                  <Button label="Continue to payment" onPress={handleContribute} loading={contributing} />
                </Card>
              ) : null}

              {isStaff ? (
                <Card>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Bulk check-in</Text>
                  <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                    Select volunteers to check in for this project session.
                  </Text>

                  {loadingRoster && !roster ? (
                    <Text style={{ color: colors.textMuted, marginVertical: 12 }}>Loading roster…</Text>
                  ) : null}

                  {roster && roster.volunteers.length === 0 ? (
                    <EmptyState title="No volunteers assigned" message="Assign volunteers to this project in the web portal." />
                  ) : null}

                  {roster && roster.volunteers.length > 0 ? (
                    <>
                      <Pressable onPress={selectAllAvailable} style={styles.selectAll}>
                        <Text style={{ color: Colors.primary, fontWeight: '600' }}>Select all not checked in</Text>
                      </Pressable>
                      <View style={styles.roster}>
                        {roster.volunteers.map((volunteer) => {
                          const checkedIn = checkedInSet.has(volunteer.id);
                          const selected = selectedIds.includes(volunteer.id);
                          return (
                            <Pressable
                              key={volunteer.id}
                              onPress={() => toggleVolunteer(volunteer.id)}
                              disabled={checkedIn}
                              style={[
                                styles.volunteerRow,
                                {
                                  borderColor: colors.border,
                                  backgroundColor: checkedIn
                                    ? colors.background
                                    : selected
                                      ? '#FFF7ED'
                                      : colors.card,
                                },
                              ]}>
                              <View
                                style={[
                                  styles.checkbox,
                                  {
                                    borderColor: checkedIn ? colors.textMuted : Colors.primary,
                                    backgroundColor: checkedIn || selected ? Colors.primary : 'transparent',
                                  },
                                ]}
                              />
                              <View style={styles.volunteerInfo}>
                                <Text style={[styles.volunteerName, { color: colors.text }]}>{volunteer.name}</Text>
                                {volunteer.email ? (
                                  <Text style={[styles.volunteerMeta, { color: colors.textMuted }]}>
                                    {volunteer.email}
                                  </Text>
                                ) : null}
                              </View>
                              {checkedIn ? (
                                <Text style={[styles.badge, { color: colors.success }]}>In</Text>
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                      <FieldLabel>Notes (optional)</FieldLabel>
                      <Input value={notes} onChangeText={setNotes} placeholder="Session notes" />
                      <Button
                        label={`Check in ${selectedIds.length || ''} volunteer${selectedIds.length === 1 ? '' : 's'}`.trim()}
                        onPress={handleBulkCheckIn}
                        loading={submitting}
                        disabled={selectedIds.length === 0}
                      />
                    </>
                  ) : null}
                </Card>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </Screen>
    </>
  );
}

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: (typeof Colors)['light'];
}) {
  return (
    <Text style={[styles.row, { color: colors.text }]}>
      <Text style={{ color: colors.textMuted }}>{label}: </Text>
      {value}
    </Text>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    fontSize: 15,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  success: {
    fontWeight: '600',
    marginBottom: 12,
  },
  selectAll: {
    marginBottom: 10,
  },
  roster: {
    gap: 8,
    marginBottom: 12,
  },
  volunteerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  volunteerMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
  },
});
