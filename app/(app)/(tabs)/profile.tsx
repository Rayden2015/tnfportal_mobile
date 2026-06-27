import { useCallback, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { MyDuesResult, VolunteerProfileResult } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

export default function ProfileScreen() {
  const { user, tenant, token, tenantSlug, logout, hasAnyRole } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isStaff = hasAnyRole('tenant_admin', 'coordinator', 'super_admin');

  const [profile, setProfile] = useState<VolunteerProfileResult | null>(null);
  const [dues, setDues] = useState<MyDuesResult | null>(null);
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setLoading(true);
    setError(null);
    try {
      const auth = { token, tenantSlug };
      const profilePromise = api.getVolunteerProfile(auth).catch(() => null);
      const duesPromise = isStaff ? Promise.resolve(null) : api.getMyDues(auth).catch(() => null);
      const [profileResult, duesResult] = await Promise.all([profilePromise, duesPromise]);
      setProfile(profileResult);
      setDues(duesResult);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, isStaff]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const signOutAllDevices = async () => {
    if (!token || !tenantSlug) return;
    try {
      await api.logoutAll({ token, tenantSlug });
      await logout();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const handlePayDues = async () => {
    if (!token || !tenantSlug) return;
    setPaying(true);
    setError(null);
    try {
      const result = await api.initiateDuesPayment({ token, tenantSlug });
      await Linking.openURL(result.checkout_url);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPaying(false);
    }
  };

  const currency = dues?.payment_options.currency ?? tenant?.currency ?? 'GHS';
  const outstanding = dues?.summary.total_outstanding ?? 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>Profile</Title>
        <Subtitle>{tenant?.name}</Subtitle>
        {error ? <ErrorBanner message={error} /> : null}

        {!isStaff ? (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dues status</Text>
            {dues ? (
              <>
                <Text style={[styles.duesLabel, { color: colors.textMuted }]}>Outstanding balance</Text>
                <Text style={[styles.duesValue, { color: colors.text }]}>
                  {currency} {outstanding.toFixed(2)}
                </Text>
                <Text style={[styles.duesHint, { color: outstanding > 0 ? colors.danger : colors.success }]}>
                  {outstanding > 0 ? 'Payment due — settle your balance to stay current.' : 'You are up to date.'}
                </Text>
                <View style={styles.duesActions}>
                  {outstanding > 0 ? <Button label="Pay now" onPress={handlePayDues} loading={paying} /> : null}
                  <Button
                    label="View dues history"
                    onPress={() => router.push('/(app)/(tabs)/dues' as Href)}
                    variant="secondary"
                  />
                </View>
              </>
            ) : (
              <Text style={{ color: colors.textMuted }}>
                {loading ? 'Loading dues…' : 'No dues information available.'}
              </Text>
            )}
          </Card>
        ) : null}

        <Card>
          {profile?.profile_photo_url ? (
            <Image source={{ uri: profile.profile_photo_url }} style={styles.photo} />
          ) : null}
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{user?.email}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {(user?.roles ?? []).join(', ') || 'Volunteer'}
          </Text>

          {profile ? (
            <>
              <Text style={[styles.completion, { color: colors.textMuted }]}>
                Profile {profile.profile_completion_percentage ?? 0}% complete
              </Text>
              {profile.performance_score != null ? (
                <Text style={{ color: colors.text, marginBottom: 8 }}>
                  Performance: {profile.performance_score}
                  {profile.performance_grade ? ` (${profile.performance_grade})` : ''}
                </Text>
              ) : null}
              {profile.bio ? <Text style={{ color: colors.textMuted, marginBottom: 8 }}>{profile.bio}</Text> : null}
              {profile.city || profile.country ? (
                <Text style={{ color: colors.textMuted, marginBottom: 8 }}>
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </Text>
              ) : null}
              <Button label="Edit profile" onPress={() => router.push('/profile/edit' as Href)} variant="secondary" />
            </>
          ) : !loading && !isStaff ? (
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>No linked volunteer profile for this account.</Text>
          ) : null}
        </Card>

        <Card>
          <ProfileLink
            label="Change password"
            icon="key-outline"
            colors={colors}
            onPress={() => router.push('/account/password' as Href)}
          />
          <ProfileLink
            label="Notification preferences"
            icon="options-outline"
            colors={colors}
            onPress={() => router.push('/notification-preferences' as Href)}
            isLast
          />
        </Card>

        <Button label="Sign out" onPress={logout} variant="danger" />
        <Button label="Sign out all devices" onPress={signOutAllDevices} variant="secondary" />
      </ScrollView>
    </Screen>
  );
}

function ProfileLink({
  label,
  icon,
  colors,
  onPress,
  isLast,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: (typeof Colors)['light'];
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.linkRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={[styles.linkLabel, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  duesLabel: { fontSize: 13 },
  duesValue: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  duesHint: { fontSize: 14, marginTop: 6, marginBottom: 12, lineHeight: 20 },
  duesActions: { gap: 8 },
  photo: { width: 96, height: 96, borderRadius: 48, marginBottom: 12, alignSelf: 'center' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 14, marginBottom: 2 },
  completion: { fontSize: 14, marginTop: 10, marginBottom: 8 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
});
