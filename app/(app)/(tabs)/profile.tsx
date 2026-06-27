import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Button, Card, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { MyDuesResult, VolunteerProfileResult } from '@/src/api/types';
import { CACHE_TTL, cacheKeys } from '@/src/cache/keys';
import { formatApiError, useAuth } from '@/src/context/AuthContext';
import { useCachedQuery } from '@/src/hooks/useCachedQuery';

export default function ProfileScreen() {
  const { user, tenant, token, tenantSlug, logout, hasAnyRole } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isStaff = hasAnyRole('tenant_admin', 'coordinator', 'super_admin');
  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const profileQuery = useCachedQuery<VolunteerProfileResult | null>({
    cacheKey: auth && !isStaff ? cacheKeys.volunteerProfile(auth.tenantSlug) : null,
    enabled: Boolean(auth && !isStaff),
    staleTimeMs: CACHE_TTL.profile,
    queryFn: async () => {
      try {
        return await api.getVolunteerProfile(auth!);
      } catch {
        return null;
      }
    },
  });

  const duesQuery = useCachedQuery<MyDuesResult | null>({
    cacheKey: auth && !isStaff ? cacheKeys.myDues(auth.tenantSlug) : null,
    enabled: Boolean(auth && !isStaff),
    staleTimeMs: CACHE_TTL.dues,
    queryFn: async () => {
      try {
        return await api.getMyDues(auth!);
      } catch {
        return null;
      }
    },
  });

  const profile = profileQuery.data;
  const dues = duesQuery.data;
  const loading = profileQuery.loading || duesQuery.loading;
  const [paying, setPaying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const error = profileQuery.error ?? duesQuery.error ?? actionError;

  const signOutAllDevices = async () => {
    if (!auth) return;
    setActionError(null);
    try {
      await api.logoutAll(auth);
      await logout();
    } catch (err) {
      setActionError(formatApiError(err));
    }
  };

  const handlePayDues = async () => {
    if (!auth) return;
    setPaying(true);
    setActionError(null);
    try {
      const result = await api.initiateDuesPayment(auth);
      await Linking.openURL(result.checkout_url);
    } catch (err) {
      setActionError(formatApiError(err));
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
                    onPress={() => router.push('/dues' as Href)}
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
          <View style={styles.profileHeader}>
            <ProfileAvatar name={user?.name} photoUrl={profile?.profile_photo_url} size={96} />
          </View>
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
  profileHeader: { alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  meta: { fontSize: 14, marginBottom: 2, textAlign: 'center' },
  completion: { fontSize: 14, marginTop: 10, marginBottom: 8, textAlign: 'center' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
});
