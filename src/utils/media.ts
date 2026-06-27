import { Alert, Share } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { ProjectMedia } from '@/src/api/types';

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, '_').trim() || 'download';
}

export function mediaDisplayTitle(item: ProjectMedia): string {
  return item.caption?.trim() || item.original_filename?.trim() || item.file_type || 'Project media';
}

export async function downloadProjectMedia(item: ProjectMedia): Promise<string> {
  const filename = sanitizeFilename(item.original_filename || `media-${item.id}`);
  const destination = new File(Paths.cache, filename);
  const file = await File.downloadFileAsync(item.url, destination, { idempotent: true });

  return file.uri;
}

export async function shareProjectMedia(item: ProjectMedia): Promise<void> {
  const title = mediaDisplayTitle(item);

  try {
    const uri = await downloadProjectMedia(item);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: item.mime_type ?? undefined,
        dialogTitle: title,
      });
      return;
    }
  } catch {
    // Fall back to sharing the remote URL below.
  }

  await Share.share({
    url: item.url,
    message: `${title}\n${item.url}`,
  });
}

export async function saveProjectMedia(item: ProjectMedia): Promise<void> {
  try {
    const uri = await downloadProjectMedia(item);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: item.mime_type ?? undefined,
        dialogTitle: 'Save or share file',
        UTI: item.mime_type ?? undefined,
      });
      return;
    }

    Alert.alert('Downloaded', 'File saved to app cache.');
  } catch (error) {
    Alert.alert('Download failed', error instanceof Error ? error.message : 'Could not download this file.');
  }
}
