import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { Button, Card, EmptyState, ErrorBanner, Screen } from '@/components/ui';
import { ProjectMediaSkeleton } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as api from '@/src/api';
import type { Project, ProjectMedia } from '@/src/api/types';
import { formatApiError, useAuth } from '@/src/context/AuthContext';
import { detailScreenOptionsDynamic } from '@/src/navigation/stackOptions';
import { mediaDisplayTitle, saveProjectMedia, shareProjectMedia } from '@/src/utils/media';

export default function ProjectMediaViewerScreen() {
  const { projectId, index } = useLocalSearchParams<{ projectId: string; index?: string }>();
  const numericProjectId = Number(projectId);
  const initialIndex = Math.max(0, Number(index ?? 0));
  const { token, tenantSlug } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const auth = token && tenantSlug ? { token, tenantSlug } : null;

  const [project, setProject] = useState<Project | null>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const media = project?.media ?? [];
  const current = media[currentIndex] ?? null;

  useEffect(() => {
    setCurrentIndex(Math.max(0, Number(index ?? 0)));
  }, [index, projectId]);

  const load = useCallback(async () => {
    if (!auth || !numericProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const nextProject = await api.getProject(auth, numericProjectId);
      setProject(nextProject);
      const maxIndex = Math.max(0, (nextProject.media?.length ?? 1) - 1);
      setCurrentIndex((value) => Math.min(Math.max(0, value), maxIndex));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [auth, numericProjectId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const title = useMemo(() => {
    if (!current) return 'Project media';
    return mediaDisplayTitle(current);
  }, [current]);

  const handleOpenExternal = async (item: ProjectMedia) => {
    await WebBrowser.openBrowserAsync(item.url);
  };

  const handleShare = async () => {
    if (!current) return;
    setWorking(true);
    try {
      await shareProjectMedia(current);
    } catch (err) {
      Alert.alert('Share failed', formatApiError(err));
    } finally {
      setWorking(false);
    }
  };

  const handleDownload = async () => {
    if (!current) return;
    setWorking(true);
    try {
      await saveProjectMedia(current);
    } finally {
      setWorking(false);
    }
  };

  const goPrevious = () => setCurrentIndex((value) => Math.max(0, value - 1));
  const goNext = () => setCurrentIndex((value) => Math.min(media.length - 1, value + 1));

  return (
    <>
      <Stack.Screen
        options={detailScreenOptionsDynamic(
          project?.title ? `${project.title} media` : null,
          'Project media',
        )}
      />
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          {error ? <ErrorBanner message={error} /> : null}
          {loading && !project ? <ProjectMediaSkeleton /> : null}

          {!loading && project && media.length === 0 ? (
            <EmptyState title="No media yet" message="Photos and files for this project will appear here." />
          ) : null}

          {current ? (
            <>
              <Card>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                {current.description ? (
                  <Text style={[styles.description, { color: colors.textMuted }]}>{current.description}</Text>
                ) : null}
                {current.formatted_file_size ? (
                  <Text style={[styles.meta, { color: colors.textMuted }]}>
                    {[current.file_type, current.formatted_file_size].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}

                {current.is_image ? (
                  <Image source={{ uri: current.url }} style={styles.previewImage} resizeMode="contain" />
                ) : (
                  <View style={[styles.filePreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons
                      name={current.is_video ? 'videocam' : current.is_pdf ? 'document-text' : 'document'}
                      size={48}
                      color={Colors.primary}
                    />
                    <Text style={[styles.filePreviewText, { color: colors.text }]}>
                      {current.is_video ? 'Video file' : current.is_pdf ? 'PDF document' : 'Document'}
                    </Text>
                    <Button label="Open" variant="secondary" onPress={() => handleOpenExternal(current)} />
                  </View>
                )}

                {media.length > 1 ? (
                  <View style={styles.pager}>
                    <Button label="Previous" variant="secondary" onPress={goPrevious} disabled={currentIndex === 0} />
                    <Text style={[styles.counter, { color: colors.textMuted }]}>
                      {currentIndex + 1} / {media.length}
                    </Text>
                    <Button
                      label="Next"
                      variant="secondary"
                      onPress={goNext}
                      disabled={currentIndex >= media.length - 1}
                    />
                  </View>
                ) : null}
              </Card>

              <Card>
                <View style={styles.actions}>
                  <Button label="Share" onPress={handleShare} loading={working} />
                  <Button label="Download" variant="secondary" onPress={handleDownload} loading={working} />
                  {!current.is_image ? (
                    <Button label="Open in browser" variant="secondary" onPress={() => handleOpenExternal(current)} />
                  ) : null}
                </View>
              </Card>
            </>
          ) : null}

          {working ? <ActivityIndicator color={Colors.primary} style={styles.spinner} /> : null}
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    marginBottom: 6,
  },
  meta: {
    fontSize: 12,
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  filePreview: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  filePreviewText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  counter: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    gap: 10,
  },
  spinner: {
    marginTop: 8,
  },
});
