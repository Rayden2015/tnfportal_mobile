import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Button, Card, ErrorBanner, FieldLabel, Input, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Volunteer, VolunteerProfileOptions, VolunteerProfileResult } from '@/src/api/types';
import { CACHE_TTL, cacheKeys } from '@/src/cache/keys';
import { invalidateCache, invalidateVolunteerCaches, setCached } from '@/src/cache/queryCache';
import { formatApiError, useAuth } from '@/src/context/AuthContext';
import { detailScreenOptions } from '@/src/navigation/stackOptions';
import { useCachedQuery } from '@/src/hooks/useCachedQuery';

function tagsToString(value?: string | string[] | null) {
  if (!value) return '';
  return Array.isArray(value) ? value.join(', ') : value;
}

function OptionChips({
  options,
  selected,
  onToggle,
}: {
  options: Record<string, string>;
  selected: string[];
  onToggle: (key: string) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.chipRow}>
      {Object.entries(options).map(([key, label]) => {
        const active = selected.includes(key);
        return (
          <Pressable
            key={key}
            onPress={() => onToggle(key)}
            style={[styles.chip, { borderColor: active ? Colors.primary : colors.border, backgroundColor: active ? '#fff7ed' : colors.card }]}>
            <Text style={{ color: active ? Colors.primary : colors.text, fontSize: 13 }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function EditProfileScreen() {
  const { token, tenantSlug } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [profile, setProfile] = useState<Volunteer | null>(null);
  const [options, setOptions] = useState<VolunteerProfileOptions | null>(null);
  const [form, setForm] = useState<Partial<Volunteer>>({});
  const [skills, setSkills] = useState('');
  const [languages, setLanguages] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const profileQuery = useCachedQuery<VolunteerProfileResult>({
    cacheKey: auth ? cacheKeys.volunteerProfile(auth.tenantSlug) : null,
    enabled: Boolean(auth),
    staleTimeMs: CACHE_TTL.profile,
    queryFn: () => api.getVolunteerProfile(auth!),
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setProfile(profileQuery.data);
    setOptions(profileQuery.data.profile_options ?? null);
    setForm(profileQuery.data);
    setSkills(tagsToString(profileQuery.data.skills));
    setLanguages(tagsToString(profileQuery.data.languages_spoken));
  }, [profileQuery.data]);

  const loading = profileQuery.loading && !profile;

  const toggleArray = (field: 'interests' | 'preferred_roles' | 'availability_days' | 'availability_times', key: string) => {
    setForm((current) => {
      const list = [...(current[field] ?? [])];
      const index = list.indexOf(key);
      if (index >= 0) list.splice(index, 1);
      else list.push(key);
      return { ...current, [field]: list };
    });
  };

  const save = async () => {
    if (!auth) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateVolunteerProfile(auth, {
        ...form,
        skills,
        languages_spoken: languages,
      });
      await invalidateVolunteerCaches(auth.tenantSlug, profile?.id);
      await profileQuery.refresh();
      Alert.alert('Saved', 'Your volunteer profile has been updated.');
      router.back();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const pickPhoto = async () => {
    if (!auth) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadingPhoto(true);
    setError(null);
    try {
      const updated = await api.uploadVolunteerPhoto(
        auth,
        asset.uri,
        asset.fileName ?? 'photo.jpg',
        asset.mimeType ?? 'image/jpeg',
      );
      setProfile(updated);
      setForm(updated);
      await setCached(cacheKeys.volunteerProfile(auth.tenantSlug), updated);
      if (profile?.id) {
        await setCached(cacheKeys.volunteer(auth.tenantSlug, profile.id), updated);
      }
      await invalidateCache(cacheKeys.volunteers(auth.tenantSlug));
      Alert.alert('Photo updated', 'Your profile photo has been saved.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    if (!auth || !profile?.profile_photo_url) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const updated = await api.deleteVolunteerPhoto(auth);
      setProfile(updated);
      setForm(updated);
      await setCached(cacheKeys.volunteerProfile(auth.tenantSlug), updated);
      if (profile?.id) {
        await setCached(cacheKeys.volunteer(auth.tenantSlug, profile.id), updated);
      }
      await invalidateCache(cacheKeys.volunteers(auth.tenantSlug));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Title>Edit profile</Title>
        <Subtitle>Loading…</Subtitle>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <Title>Edit profile</Title>
        <ErrorBanner message={error ?? 'No volunteer profile linked to this account.'} />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={detailScreenOptions('Edit volunteer profile')} />
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Title>Edit profile</Title>
          <Subtitle>{profile.profile_completion_percentage ?? 0}% complete</Subtitle>
          {error || profileQuery.error ? <ErrorBanner message={error ?? profileQuery.error ?? ''} /> : null}

          <Card>
            <Text style={[styles.section, { color: colors.text }]}>Profile photo</Text>
            <View style={styles.photoRow}>
              <ProfileAvatar name={profile.name} photoUrl={profile.profile_photo_url} size={88} />
              <View style={styles.photoActions}>
                <Button label="Choose photo" onPress={pickPhoto} loading={uploadingPhoto} variant="secondary" />
                {profile.profile_photo_url ? (
                  <Button label="Remove photo" onPress={removePhoto} loading={uploadingPhoto} variant="secondary" />
                ) : null}
              </View>
            </View>
          </Card>

          <Card>
            <Text style={[styles.section, { color: colors.text }]}>About you</Text>
            <FieldLabel>Bio</FieldLabel>
            <Input value={form.bio ?? ''} onChangeText={(bio) => setForm((f) => ({ ...f, bio }))} multiline />
            <FieldLabel>City</FieldLabel>
            <Input value={form.city ?? ''} onChangeText={(city) => setForm((f) => ({ ...f, city }))} />
            <FieldLabel>Country</FieldLabel>
            <Input value={form.country ?? ''} onChangeText={(country) => setForm((f) => ({ ...f, country }))} />
            <FieldLabel>Skills (comma-separated)</FieldLabel>
            <Input value={skills} onChangeText={setSkills} />
            <FieldLabel>Languages (comma-separated)</FieldLabel>
            <Input value={languages} onChangeText={setLanguages} />
            <FieldLabel>Motivation</FieldLabel>
            <Input value={form.motivation ?? ''} onChangeText={(motivation) => setForm((f) => ({ ...f, motivation }))} multiline />
          </Card>

          <Card>
            <Text style={[styles.section, { color: colors.text }]}>Work & education</Text>
            <FieldLabel>Occupation</FieldLabel>
            <Input value={form.occupation ?? ''} onChangeText={(occupation) => setForm((f) => ({ ...f, occupation }))} />
            <FieldLabel>Employer</FieldLabel>
            <Input value={form.employer ?? ''} onChangeText={(employer) => setForm((f) => ({ ...f, employer }))} />
            <FieldLabel>LinkedIn URL</FieldLabel>
            <Input value={form.linkedin_url ?? ''} onChangeText={(linkedin_url) => setForm((f) => ({ ...f, linkedin_url }))} autoCapitalize="none" />
          </Card>

          <Card>
            <Text style={[styles.section, { color: colors.text }]}>Emergency contact</Text>
            <FieldLabel>Name</FieldLabel>
            <Input value={form.emergency_contact_name ?? ''} onChangeText={(emergency_contact_name) => setForm((f) => ({ ...f, emergency_contact_name }))} />
            <FieldLabel>Phone</FieldLabel>
            <Input value={form.emergency_contact_phone ?? ''} onChangeText={(emergency_contact_phone) => setForm((f) => ({ ...f, emergency_contact_phone }))} />
            <FieldLabel>Relationship</FieldLabel>
            <Input value={form.emergency_contact_relationship ?? ''} onChangeText={(emergency_contact_relationship) => setForm((f) => ({ ...f, emergency_contact_relationship }))} />
          </Card>

          {options ? (
            <>
              <Card>
                <Text style={[styles.section, { color: colors.text }]}>Interests</Text>
                <OptionChips options={options.interests} selected={form.interests ?? []} onToggle={(key) => toggleArray('interests', key)} />
              </Card>
              <Card>
                <Text style={[styles.section, { color: colors.text }]}>Preferred roles</Text>
                <OptionChips options={options.preferred_roles} selected={form.preferred_roles ?? []} onToggle={(key) => toggleArray('preferred_roles', key)} />
              </Card>
              <Card>
                <Text style={[styles.section, { color: colors.text }]}>Availability</Text>
                <FieldLabel>Days</FieldLabel>
                <OptionChips options={options.availability_days} selected={form.availability_days ?? []} onToggle={(key) => toggleArray('availability_days', key)} />
                <FieldLabel>Times</FieldLabel>
                <OptionChips options={options.availability_times} selected={form.availability_times ?? []} onToggle={(key) => toggleArray('availability_times', key)} />
                <FieldLabel>Hours per week</FieldLabel>
                <Input
                  value={form.hours_per_week_available != null ? String(form.hours_per_week_available) : ''}
                  onChangeText={(value) => setForm((f) => ({ ...f, hours_per_week_available: value ? Number(value) : null }))}
                  keyboardType="numeric"
                />
              </Card>
            </>
          ) : null}

          <Button label="Save profile" onPress={save} loading={saving} />
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  section: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  photo: { width: 88, height: 88, borderRadius: 44 },
  photoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: { flex: 1, gap: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
});
