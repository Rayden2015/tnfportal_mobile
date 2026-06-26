import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter, type Href } from 'expo-router';

import { Button, Card, ErrorBanner, FieldLabel, Input, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { ProgramTypeOption, Project, ProjectWritePayload } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

const STATUS_OPTIONS = ['planning', 'active', 'completed', 'on_hold', 'cancelled'] as const;

type Props = {
  mode: 'create' | 'edit';
  project?: Project | null;
};

export function ProjectFormScreen({ mode, project }: Props) {
  const router = useRouter();
  const { token, tenantSlug } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const [programTypes, setProgramTypes] = useState<ProgramTypeOption[]>([]);
  const [title, setTitle] = useState(project?.title ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [programType, setProgramType] = useState(project?.program_type ?? '');
  const [startDate, setStartDate] = useState(project?.start_date ?? '');
  const [endDate, setEndDate] = useState(project?.end_date ?? '');
  const [status, setStatus] = useState(project?.status ?? 'planning');
  const [budget, setBudget] = useState(project?.budget != null ? String(project.budget) : '');
  const [location, setLocation] = useState(project?.location ?? '');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    void api.listProgramTypes(auth).then(setProgramTypes).catch(() => undefined);
  }, [auth]);

  const selectedProgramLabel = useMemo(
    () => programTypes.find((item) => item.value === programType)?.label ?? programType,
    [programType, programTypes],
  );

  const buildPayload = (): ProjectWritePayload => ({
    title: title.trim(),
    description: description.trim(),
    program_type: programType || undefined,
    start_date: startDate.trim(),
    end_date: endDate.trim() || null,
    status,
    budget: budget.trim() ? Number(budget) : null,
    location: location.trim() || null,
  });

  const handleSave = async () => {
    if (!auth) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === 'create') {
        const created = await api.createProject(auth, buildPayload());
        Alert.alert('Project created', created.title, [{ text: 'OK', onPress: () => router.replace(`/project/${created.id}` as Href) }]);
      } else if (project) {
        await api.updateProject(auth, project.id, buildPayload());
        Alert.alert('Saved', 'Project updated.', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!auth || !project) return;
    Alert.alert('Delete project', `Delete "${project.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          setError(null);
          try {
            await api.deleteProject(auth, project.id);
            router.replace('/projects' as Href);
          } catch (err) {
            setError(formatApiError(err));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: mode === 'create' ? 'New project' : 'Edit project' }} />
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Title>{mode === 'create' ? 'Create project' : 'Edit project'}</Title>
          <Subtitle>Core project details for your organization</Subtitle>
          {error ? <ErrorBanner message={error} /> : null}

          <Card>
            <FieldLabel>Title</FieldLabel>
            <Input value={title} onChangeText={setTitle} placeholder="Project title" />
            <FieldLabel>Description</FieldLabel>
            <Input value={description} onChangeText={setDescription} multiline placeholder="What is this project about?" />
            <FieldLabel>Program type</FieldLabel>
            <View style={styles.choiceList}>
              {programTypes.map((option) => {
                const selected = programType === option.value;
                return (
                  <Pressable key={option.value} onPress={() => setProgramType(option.value)} style={styles.choiceRow}>
                    <View
                      style={[
                        styles.radio,
                        { borderColor: selected ? Colors.primary : colors.border, backgroundColor: selected ? Colors.primary : 'transparent' },
                      ]}
                    />
                    <Text style={{ color: colors.text, flex: 1 }}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {selectedProgramLabel ? (
              <Text style={[styles.hint, { color: colors.textMuted }]}>Selected: {selectedProgramLabel}</Text>
            ) : null}
            <FieldLabel>Start date (YYYY-MM-DD)</FieldLabel>
            <Input value={startDate} onChangeText={setStartDate} placeholder="2026-01-15" autoCapitalize="none" />
            <FieldLabel>End date (optional)</FieldLabel>
            <Input value={endDate} onChangeText={setEndDate} placeholder="2026-12-31" autoCapitalize="none" />
            <FieldLabel>Status</FieldLabel>
            <View style={styles.chipRow}>
              {STATUS_OPTIONS.map((option) => {
                const selected = status === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setStatus(option)}
                    style={[
                      styles.chip,
                      { borderColor: selected ? Colors.primary : colors.border, backgroundColor: selected ? Colors.primary : colors.card },
                    ]}>
                    <Text style={{ color: selected ? '#fff' : colors.text, fontSize: 13 }}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
            <FieldLabel>Budget (optional)</FieldLabel>
            <Input value={budget} onChangeText={setBudget} keyboardType="decimal-pad" placeholder="0.00" />
            <FieldLabel>Location (optional)</FieldLabel>
            <Input value={location} onChangeText={setLocation} placeholder="City or site name" />
          </Card>

          <Button label={mode === 'create' ? 'Create project' : 'Save changes'} onPress={handleSave} loading={loading} />
          {mode === 'edit' ? <Button label="Delete project" onPress={handleDelete} loading={deleting} variant="danger" /> : null}
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  choiceList: { gap: 8, marginBottom: 8 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  hint: { fontSize: 13, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
});
