import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type ProjectMetaRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  badge?: {
    label: string;
    backgroundColor: string;
    color: string;
  };
  isLast?: boolean;
};

export function ProjectMetaRow({ icon, label, value, badge, isLast }: ProjectMetaRowProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        ) : (
          <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    lineHeight: 21,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
