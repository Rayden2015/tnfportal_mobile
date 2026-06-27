import { Image, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { resolveAssetUrl } from '@/src/utils/assets';

type Props = {
  name?: string | null;
  photoUrl?: string | null;
  size?: number;
};

function initialsFor(name?: string | null): string {
  const parts = (name ?? 'V').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'V';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function ProfileAvatar({ name, photoUrl, size = 48 }: Props) {
  const uri = resolveAssetUrl(photoUrl);
  const radius = size / 2;

  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius }} />;
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: Colors.primary,
        },
      ]}>
      <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.34), color: '#fff' }]}>
        {initialsFor(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
