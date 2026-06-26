import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { ProjectFormScreen } from '@/components/ProjectFormScreen';
import { Screen } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import * as api from '@/src/api';
import type { Project } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = Number(id);
  const { token, tenantSlug } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug || !projectId) return;
    setError(null);
    try {
      setProject(await api.getProject({ token, tenantSlug }, projectId));
    } catch (err) {
      setError(formatApiError(err));
    }
  }, [token, tenantSlug, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Edit project' }} />
        <Screen>
          <Text style={{ color: colors.danger }}>{error}</Text>
        </Screen>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Stack.Screen options={{ title: 'Edit project' }} />
        <Screen>
          <Text style={{ color: colors.textMuted }}>Loading project…</Text>
        </Screen>
      </>
    );
  }

  return <ProjectFormScreen mode="edit" project={project} />;
}
