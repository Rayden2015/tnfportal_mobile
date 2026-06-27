import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card, ErrorBanner, FieldLabel, Input, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { FeedbackFormSchema } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';
import { detailScreenOptionsDynamic } from '@/src/navigation/stackOptions';

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.ratingRow}>
      <Text style={[styles.ratingLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.ratingButtons}>
        {[1, 2, 3, 4, 5].map((score) => (
          <Button
            key={score}
            label={String(score)}
            variant={value === score ? 'primary' : 'secondary'}
            onPress={() => onChange(score)}
          />
        ))}
      </View>
    </View>
  );
}

export default function FeedbackFormScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const id = Number(projectId);
  const { token, tenantSlug } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [schema, setSchema] = useState<FeedbackFormSchema | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [openAnswers, setOpenAnswers] = useState<Record<string, string>>({});
  const [nps, setNps] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const load = useCallback(async () => {
    if (!auth || !id) return;
    setError(null);
    try {
      const data = await api.getFeedbackForm(auth, id);
      setSchema(data);
      const initialRatings: Record<string, number> = {};
      Object.keys(data.rating_fields).forEach((key) => {
        initialRatings[key] = 4;
      });
      setRatings(initialRatings);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [auth, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const submit = async () => {
    if (!auth || !schema) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.submitProjectFeedback(auth, id, {
        ...ratings,
        ...openAnswers,
        nps_score: nps ? Number(nps) : null,
      });
      Alert.alert('Thank you', 'Your feedback has been recorded.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !schema) {
    return (
      <Screen>
        <Title>Project feedback</Title>
        <Subtitle>{loading ? 'Loading…' : 'Unavailable'}</Subtitle>
        {error ? <ErrorBanner message={error} /> : null}
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={detailScreenOptionsDynamic(schema.project.title, 'Feedback')} />
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Title>{schema.project.title}</Title>
          <Subtitle>Rate your experience (1 = poor, 5 = excellent)</Subtitle>
          {error ? <ErrorBanner message={error} /> : null}

          <Card>
            {Object.entries(schema.rating_fields).map(([key, label]) => (
              <RatingRow key={key} label={label} value={ratings[key] ?? 4} onChange={(value) => setRatings((r) => ({ ...r, [key]: value }))} />
            ))}
          </Card>

          <Card>
            <FieldLabel>{schema.nps_question}</FieldLabel>
            <Input value={nps} onChangeText={setNps} keyboardType="numeric" placeholder={`${schema.nps_min}-${schema.nps_max}`} />
          </Card>

          <Card>
            {Object.entries(schema.open_fields).map(([key, label]) => (
              <View key={key} style={styles.openField}>
                <FieldLabel>{label}</FieldLabel>
                <Input value={openAnswers[key] ?? ''} onChangeText={(text) => setOpenAnswers((a) => ({ ...a, [key]: text }))} multiline />
              </View>
            ))}
          </Card>

          <Button label="Submit feedback" onPress={submit} loading={submitting} />
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  ratingRow: { marginBottom: 16 },
  ratingLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  ratingButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  openField: { marginBottom: 12 },
});
