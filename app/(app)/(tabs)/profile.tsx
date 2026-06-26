import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import { Button, Card, ErrorBanner, FieldLabel, Input, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Volunteer } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function ProfileScreen() {
  const { user, tenant, token, tenantSlug, logout } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [profile, setProfile] = useState<Volunteer | null>(null);
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVolunteerProfile({ token, tenantSlug });
      setProfile(data);
      setBio(data.bio ?? '');
      setCity(data.city ?? '');
      setSkills(data.skills ?? '');
    } catch (err) {
      const message = formatApiError(err);
      if (!message.toLowerCase().includes('volunteer')) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const saveProfile = async () => {
    if (!token || !tenantSlug) return;
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const updated = await api.updateVolunteerProfile(
        { token, tenantSlug },
        { bio, city, skills },
      );
      setProfile(updated);
      setStatus('Profile updated.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const signOutAllDevices = async () => {
    if (!token || !tenantSlug) return;
    setSigningOutAll(true);
    setError(null);
    try {
      await api.logoutAll({ token, tenantSlug });
      await logout();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSigningOutAll(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>Profile</Title>
        <Subtitle>{tenant?.name}</Subtitle>
        {error ? <ErrorBanner message={error} /> : null}
        {status ? <Text style={[styles.status, { color: colors.success }]}>{status}</Text> : null}

        <Card>
          <Text style={[styles.label, { color: colors.textMuted }]}>Name</Text>
          <Text style={[styles.value, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
          <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>Roles</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {(user?.roles ?? []).join(', ') || '—'}
          </Text>
        </Card>

        {profile ? (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Volunteer profile</Text>
            <Text style={[styles.completion, { color: colors.textMuted }]}>
              {profile.profile_completion_percentage ?? 0}% complete
            </Text>
            <FieldLabel>Bio</FieldLabel>
            <Input value={bio} onChangeText={setBio} multiline placeholder="Tell us about yourself" />
            <FieldLabel>City</FieldLabel>
            <Input value={city} onChangeText={setCity} placeholder="City" />
            <FieldLabel>Skills</FieldLabel>
            <Input value={skills} onChangeText={setSkills} placeholder="e.g. facilitation, mentoring" />
            <Button label="Save profile" onPress={saveProfile} loading={saving} />
          </Card>
        ) : !loading ? (
          <Card>
            <Text style={{ color: colors.textMuted }}>
              No linked volunteer profile. Staff accounts may not have a volunteer record.
            </Text>
          </Card>
        ) : null}

        <Button
          label="Notification preferences"
          onPress={() => router.push('/notification-preferences' as Href)}
          variant="secondary"
        />

        <Button label="Sign out" onPress={logout} variant="danger" />
        <Button
          label="Sign out all devices"
          onPress={signOutAllDevices}
          loading={signingOutAll}
          variant="secondary"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 32,
  },
  label: {
    fontSize: 13,
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  completion: {
    fontSize: 14,
    marginBottom: 12,
  },
  status: {
    marginBottom: 12,
    fontWeight: '600',
  },
});
