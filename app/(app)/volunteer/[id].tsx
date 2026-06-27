import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Card, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Volunteer } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function VolunteerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const volunteerId = Number(id);
  const { token, tenantSlug } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantSlug || !volunteerId) return;
    setError(null);
    try {
      setVolunteer(await api.getVolunteer({ token, tenantSlug }, volunteerId));
    } catch (err) {
      setError(formatApiError(err));
    }
  }, [token, tenantSlug, volunteerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>{volunteer?.name ?? 'Volunteer'}</Title>
        <Subtitle>Volunteer profile</Subtitle>
        {error ? <ErrorBanner message={error} /> : null}

        {volunteer ? (
          <Card>
            {volunteer.email ? <FieldRow label="Email" value={volunteer.email} colors={colors} /> : null}
            {volunteer.phone ? <FieldRow label="Phone" value={volunteer.phone} colors={colors} /> : null}
            {volunteer.city ? <FieldRow label="City" value={volunteer.city} colors={colors} /> : null}
            {volunteer.bio ? <FieldRow label="Bio" value={volunteer.bio} colors={colors} /> : null}
            {volunteer.skills ? (
              <FieldRow
                label="Skills"
                value={Array.isArray(volunteer.skills) ? volunteer.skills.join(', ') : volunteer.skills}
                colors={colors}
              />
            ) : null}
            <FieldRow
              label="Profile completion"
              value={`${volunteer.profile_completion_percentage ?? 0}%`}
              colors={colors}
            />
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function FieldRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: (typeof Colors)['light'];
}) {
  return (
    <>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  label: { fontSize: 13, marginTop: 8 },
  value: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
});
