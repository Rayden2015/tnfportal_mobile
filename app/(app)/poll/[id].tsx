import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card, ErrorBanner, Input, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Survey, SurveyQuestion } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';
import { detailScreenOptionsDynamic } from '@/src/navigation/stackOptions';

export default function PollDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const surveyId = Number(id);
  const router = useRouter();
  const { token, tenantSlug } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [poll, setPoll] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const load = useCallback(async () => {
    if (!auth || !surveyId) return;
    setError(null);
    try {
      setPoll(await api.getPoll(auth, surveyId));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [auth, surveyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const questions = useMemo(() => poll?.questions ?? [], [poll?.questions]);

  const setAnswer = (questionId: number, value: string | number | string[]) => {
    setAnswers((current) => ({ ...current, [String(questionId)]: value }));
  };

  const toggleCheckbox = (questionId: number, value: string) => {
    const key = String(questionId);
    const current = answers[key];
    const list = Array.isArray(current) ? current : [];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    setAnswer(questionId, next);
  };

  const handleSubmit = async () => {
    if (!auth || !poll) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.submitPollResponse(auth, poll.id, answers);
      Alert.alert('Thank you', 'Your response has been recorded.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !poll) {
    return (
      <Screen>
        <Text style={{ color: colors.textMuted }}>Loading poll…</Text>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={detailScreenOptionsDynamic(poll?.title, 'Poll')} />
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Title>{poll?.title}</Title>
          {poll?.description ? <Subtitle>{poll.description}</Subtitle> : null}
          {error ? <ErrorBanner message={error} /> : null}

          {poll && !poll.can_respond ? (
            <Card>
              <Text style={{ color: colors.textMuted }}>
                {poll.has_responded ? 'You have already completed this poll.' : 'This poll is not accepting responses.'}
              </Text>
            </Card>
          ) : null}

          {poll?.can_respond
            ? questions.map((question) => (
                <QuestionBlock
                  key={question.id}
                  question={question}
                  value={answers[String(question.id)]}
                  colors={colors}
                  onTextChange={(value) => setAnswer(question.id, value)}
                  onSelect={(value) => setAnswer(question.id, value)}
                  onToggleCheckbox={(value) => toggleCheckbox(question.id, value)}
                  onScaleSelect={(value) => setAnswer(question.id, value)}
                />
              ))
            : null}

          {poll?.can_respond ? (
            <Button label="Submit response" onPress={handleSubmit} loading={submitting} />
          ) : null}
        </ScrollView>
      </Screen>
    </>
  );
}

function QuestionBlock({
  question,
  value,
  colors,
  onTextChange,
  onSelect,
  onToggleCheckbox,
  onScaleSelect,
}: {
  question: SurveyQuestion;
  value?: string | number | string[];
  colors: (typeof Colors)['light'];
  onTextChange: (value: string) => void;
  onSelect: (value: string) => void;
  onToggleCheckbox: (value: string) => void;
  onScaleSelect: (value: number) => void;
}) {
  const type = question.type;

  return (
    <Card>
      <Text style={[styles.questionLabel, { color: colors.text }]}>
        {question.label}
        {question.is_required ? ' *' : ''}
      </Text>
      {question.help_text ? (
        <Text style={[styles.help, { color: colors.textMuted }]}>{question.help_text}</Text>
      ) : null}

      {type === 'textarea' ? (
        <Input
          value={typeof value === 'string' ? value : ''}
          onChangeText={onTextChange}
          multiline
          placeholder="Your answer"
        />
      ) : null}

      {type === 'text' ? (
        <Input value={typeof value === 'string' ? value : ''} onChangeText={onTextChange} placeholder="Your answer" />
      ) : null}

      {['radio', 'select', 'image_choice'].includes(type) ? (
        <View style={styles.choiceList}>
          {question.choices.map((choice) => {
            const choiceValue = String(choice.value ?? '');
            const selected = value === choiceValue;
            return (
              <Pressable key={choiceValue} onPress={() => onSelect(choiceValue)} style={styles.choiceRow}>
                <View
                  style={[
                    styles.radio,
                    { borderColor: selected ? Colors.primary : colors.border, backgroundColor: selected ? Colors.primary : 'transparent' },
                  ]}
                />
                <Text style={{ color: colors.text, flex: 1 }}>{choice.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {type === 'checkbox' ? (
        <View style={styles.choiceList}>
          {question.choices.map((choice) => {
            const choiceValue = String(choice.value ?? '');
            const selected = Array.isArray(value) && value.includes(choiceValue);
            return (
              <Pressable key={choiceValue} onPress={() => onToggleCheckbox(choiceValue)} style={styles.choiceRow}>
                <View
                  style={[
                    styles.radio,
                    { borderColor: selected ? Colors.primary : colors.border, backgroundColor: selected ? Colors.primary : 'transparent' },
                  ]}
                />
                <Text style={{ color: colors.text, flex: 1 }}>{choice.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {['rating', 'nps', 'linear_scale'].includes(type) ? (
        <View style={styles.scaleRow}>
          {Array.from({ length: question.scale_max - question.scale_min + 1 }, (_, index) => {
            const num = question.scale_min + index;
            const selected = value === num;
            return (
              <Pressable
                key={num}
                onPress={() => onScaleSelect(num)}
                style={[
                  styles.scaleChip,
                  {
                    borderColor: selected ? Colors.primary : colors.border,
                    backgroundColor: selected ? Colors.primary : colors.card,
                  },
                ]}>
                <Text style={{ color: selected ? '#fff' : colors.text, fontWeight: '600' }}>{num}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  questionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  help: { fontSize: 14, marginBottom: 10, lineHeight: 20 },
  choiceList: { gap: 8, marginTop: 4 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  scaleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  scaleChip: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
});
