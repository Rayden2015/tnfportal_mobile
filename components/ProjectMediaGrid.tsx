import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import type { ProjectMedia } from '@/src/api/types';
import { mediaDisplayTitle } from '@/src/utils/media';

type Props = {
  items: ProjectMedia[];
  onPressItem: (index: number) => void;
};

export function ProjectMediaGrid({ items, onPressItem }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {items.map((item, index) => (
        <Pressable
          key={item.id}
          onPress={() => onPressItem(index)}
          style={[styles.tile, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {item.is_image ? (
            <Image source={{ uri: item.thumbnail_url || item.url }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.fileTile, { backgroundColor: colors.background }]}>
              <Ionicons
                name={item.is_video ? 'videocam' : item.is_pdf ? 'document-text' : 'document'}
                size={28}
                color={Colors.primary}
              />
              <Text style={[styles.fileType, { color: colors.textMuted }]} numberOfLines={1}>
                {item.file_type ?? 'File'}
              </Text>
            </View>
          )}
          <Text style={[styles.caption, { color: colors.text }]} numberOfLines={2}>
            {mediaDisplayTitle(item)}
          </Text>
          {item.formatted_file_size ? (
            <Text style={[styles.meta, { color: colors.textMuted }]}>{item.formatted_file_size}</Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
  },
  fileTile: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  fileType: {
    fontSize: 12,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  meta: {
    fontSize: 11,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
  },
});
