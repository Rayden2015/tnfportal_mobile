import { useCallback, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { Button, Card, ErrorBanner, FieldLabel, Input, Screen, Subtitle, Title } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { CommunityComment, CommunityPost } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';

function CommentBlock({ comment, colors }: { comment: CommunityComment; colors: typeof Colors.light }) {
  return (
    <View style={styles.comment}>
      <Text style={[styles.commentAuthor, { color: colors.textMuted }]}>{comment.author?.name ?? 'Member'}</Text>
      <Text style={{ color: colors.text }}>{comment.body}</Text>
      {comment.replies?.map((reply) => (
        <View key={reply.id} style={styles.reply}>
          <Text style={[styles.commentAuthor, { color: colors.textMuted }]}>{reply.author?.name ?? 'Member'}</Text>
          <Text style={{ color: colors.text }}>{reply.body}</Text>
        </View>
      ))}
    </View>
  );
}

export default function CommunityPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const { token, tenantSlug } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const load = useCallback(async () => {
    if (!auth || !postId) return;
    setError(null);
    try {
      setPost(await api.getCommunityPost(auth, postId));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [auth, postId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const submitComment = async () => {
    if (!auth || !comment.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createCommunityComment(auth, postId, comment.trim());
      setComment('');
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) {
    return (
      <Screen>
        <Title>Community post</Title>
        <Subtitle>{loading ? 'Loading…' : 'Not found'}</Subtitle>
        {error ? <ErrorBanner message={error} /> : null}
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Post' }} />
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card>
            <Text style={[styles.author, { color: colors.textMuted }]}>{post.author?.name ?? 'Team member'}</Text>
            <Text style={[styles.body, { color: colors.text }]}>{post.body ?? post.excerpt}</Text>
          </Card>

          <Title>Comments</Title>
          {(post.top_level_comments ?? []).map((item) => (
            <CommentBlock key={item.id} comment={item} colors={colors} />
          ))}

          <Card>
            <FieldLabel>Add a comment</FieldLabel>
            <Input value={comment} onChangeText={setComment} multiline placeholder="Write a reply…" />
            <Button label="Post comment" onPress={submitComment} loading={submitting} />
          </Card>
          {error ? <ErrorBanner message={error} /> : null}
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  author: { fontSize: 12, marginBottom: 6 },
  body: { fontSize: 16, lineHeight: 22 },
  comment: { marginBottom: 12, paddingLeft: 4 },
  commentAuthor: { fontSize: 12, marginBottom: 2 },
  reply: { marginTop: 8, marginLeft: 12, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: '#fed7aa' },
});
