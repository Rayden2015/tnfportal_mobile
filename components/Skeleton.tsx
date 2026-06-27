import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Card } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type SkeletonBlockProps = {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBlock({ width = '100%', height, borderRadius = 8, style }: SkeletonBlockProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 900, useNativeDriver: true }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

export function AppLoadingSkeleton() {
  return (
    <View style={styles.appLoading}>
      <ProjectDetailSkeleton />
    </View>
  );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={styles.listCard}>
          <SkeletonBlock width="40%" height={16} />
          <SkeletonBlock height={14} style={styles.gapSm} />
          <SkeletonBlock width="85%" height={14} style={styles.gapSm} />
          <SkeletonBlock width="35%" height={12} style={styles.gapSm} />
        </Card>
      ))}
    </View>
  );
}

export function TeamListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={styles.listCard}>
          <View style={styles.listRow}>
            <SkeletonBlock width={52} height={52} borderRadius={26} />
            <View style={styles.listCopy}>
              <SkeletonBlock width="60%" height={16} />
              <SkeletonBlock width="45%" height={13} style={styles.gapSm} />
              <SkeletonBlock width="70%" height={13} style={styles.gapSm} />
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

export function ChatMessageSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.chatMessages}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock
          key={index}
          width={index % 2 === 0 ? '70%' : '50%'}
          height={44}
          borderRadius={16}
          style={index % 2 === 1 ? styles.chatMine : undefined}
        />
      ))}
    </View>
  );
}

export function FormSkeleton() {
  return (
    <View style={styles.detail}>
      <Card>
        <SkeletonBlock width="50%" height={18} />
        <SkeletonBlock height={48} borderRadius={10} style={styles.gapMd} />
        <SkeletonBlock height={48} borderRadius={10} style={styles.gapSm} />
        <SkeletonBlock width="100%" height={48} borderRadius={10} style={styles.gapMd} />
      </Card>
    </View>
  );
}

export function ProjectListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={styles.listCard}>
          <View style={styles.listRow}>
            <SkeletonBlock width={44} height={44} borderRadius={12} />
            <View style={styles.listCopy}>
              <SkeletonBlock width="75%" height={18} />
              <SkeletonBlock width="45%" height={14} style={styles.gapSm} />
              <View style={styles.chipRow}>
                <SkeletonBlock width={72} height={22} borderRadius={999} />
                <SkeletonBlock width={56} height={22} borderRadius={999} />
              </View>
            </View>
          </View>
          <SkeletonBlock height={14} style={styles.gapMd} />
          <SkeletonBlock width="60%" height={14} style={styles.gapSm} />
        </Card>
      ))}
    </View>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <View style={styles.detail}>
      <Card>
        <View style={styles.heroRow}>
          <SkeletonBlock width={56} height={56} borderRadius={16} />
          <View style={styles.heroCopy}>
            <SkeletonBlock width="80%" height={22} />
            <SkeletonBlock width="50%" height={14} style={styles.gapSm} />
          </View>
        </View>
        <View style={styles.chipRow}>
          <SkeletonBlock width={68} height={24} borderRadius={999} />
          <SkeletonBlock width={88} height={24} borderRadius={999} />
        </View>
        <SkeletonBlock height={14} style={styles.gapMd} />
        <SkeletonBlock height={14} style={styles.gapSm} />
        <SkeletonBlock width="90%" height={14} />
      </Card>

      <Card>
        <SkeletonBlock width={140} height={18} style={styles.gapSm} />
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.metaRow}>
            <SkeletonBlock width={36} height={36} borderRadius={10} />
            <View style={styles.metaCopy}>
              <SkeletonBlock width={64} height={12} />
              <SkeletonBlock width="70%" height={16} style={styles.gapSm} />
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <SkeletonBlock width={80} height={18} style={styles.gapSm} />
        <View style={styles.mediaGrid}>
          <SkeletonBlock width="47%" height={120} borderRadius={12} />
          <SkeletonBlock width="47%" height={120} borderRadius={12} />
        </View>
      </Card>
    </View>
  );
}

export function ProjectMediaSkeleton() {
  return (
    <View style={styles.detail}>
      <Card>
        <SkeletonBlock width="70%" height={20} />
        <SkeletonBlock width="40%" height={12} style={styles.gapSm} />
        <SkeletonBlock height={320} borderRadius={12} style={styles.gapMd} />
      </Card>
      <Card>
        <SkeletonBlock width="100%" height={48} borderRadius={10} />
        <SkeletonBlock width="100%" height={48} borderRadius={10} style={styles.gapSm} />
      </Card>
    </View>
  );
}

export function RosterListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.roster}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.rosterRow}>
          <SkeletonBlock width={20} height={20} borderRadius={4} />
          <View style={styles.rosterCopy}>
            <SkeletonBlock width="55%" height={16} />
            <SkeletonBlock width="70%" height={12} style={styles.gapSm} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
  },
  listCard: {
    marginBottom: 12,
  },
  listRow: {
    flexDirection: 'row',
    gap: 12,
  },
  listCopy: {
    flex: 1,
  },
  detail: {
    gap: 0,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  heroCopy: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  gapSm: {
    marginTop: 8,
  },
  gapMd: {
    marginTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  metaCopy: {
    flex: 1,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  roster: {
    gap: 8,
    marginTop: 8,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  rosterCopy: {
    flex: 1,
  },
  chatMessages: {
    gap: 12,
    paddingVertical: 8,
  },
  chatMine: {
    alignSelf: 'flex-end',
  },
  appLoading: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
  },
});
