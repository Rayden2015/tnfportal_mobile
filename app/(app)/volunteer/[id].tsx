import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { ContactLink } from '@/components/ContactLink';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Button, Card, ErrorBanner, Screen, Subtitle, Title } from '@/components/ui';
import { FormSkeleton } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Volunteer } from '@/src/api/types';
import { CACHE_TTL, cacheKeys } from '@/src/cache/keys';
import { useAuth } from '@/src/context/AuthContext';
import { useFirebase } from '@/src/context/FirebaseContext';
import { useCachedQuery } from '@/src/hooks/useCachedQuery';

export default function VolunteerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const volunteerId = Number(id);
  const router = useRouter();
  const { token, tenantSlug, user } = useAuth();
  const { enabled: chatEnabled } = useFirebase();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const volunteerQuery = useCachedQuery<Volunteer>({
    cacheKey: auth && volunteerId ? cacheKeys.volunteer(auth.tenantSlug, volunteerId) : null,
    enabled: Boolean(auth && volunteerId),
    staleTimeMs: CACHE_TTL.volunteer,
    queryFn: () => api.getVolunteer(auth!, volunteerId),
  });

  const volunteer = volunteerQuery.data;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>{volunteer?.name ?? 'Volunteer'}</Title>
        <Subtitle>Volunteer profile</Subtitle>
        {volunteerQuery.error ? <ErrorBanner message={volunteerQuery.error} /> : null}

        {volunteer ? (
          <Card>
            <View style={styles.header}>
              <ProfileAvatar name={volunteer.name} photoUrl={volunteer.profile_photo_url} size={88} />
              <Text style={[styles.volunteerName, { color: colors.text }]}>{volunteer.name}</Text>
            </View>
            {volunteer.email ? (
              <ContactFieldRow label="Email" type="email" value={volunteer.email} colors={colors} />
            ) : null}
            {volunteer.phone ? (
              <ContactFieldRow label="Phone" type="phone" value={volunteer.phone} colors={colors} />
            ) : null}
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
            {chatEnabled && volunteer.user_id && volunteer.user_id !== user?.id ? (
              <Button
                label="Message"
                onPress={() => {
                  const params = new URLSearchParams({
                    peerName: volunteer.name,
                    peerVolunteerId: String(volunteer.id),
                    peerPhotoUrl: volunteer.profile_photo_url ?? '',
                  });
                  router.push(`/chat/${volunteer.user_id}?${params.toString()}` as Href);
                }}
              />
            ) : null}
          </Card>
        ) : volunteerQuery.loading ? (
          <FormSkeleton />
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

function ContactFieldRow({
  label,
  type,
  value,
  colors,
}: {
  label: string;
  type: 'email' | 'phone';
  value: string;
  colors: (typeof Colors)['light'];
}) {
  return (
    <>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <ContactLink type={type} value={value} style={{ ...styles.value, color: Colors.primary }} />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 16, gap: 10 },
  volunteerName: { fontSize: 20, fontWeight: '700' },
  label: { fontSize: 13, marginTop: 8 },
  value: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
});
