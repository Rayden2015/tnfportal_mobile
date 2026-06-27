import { Pressable, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export function SegmentTabs<T extends string>({
  tabs,
  active,
  onChange,
  badges,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
  badges?: Partial<Record<T, number>>;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}>
      {tabs.map((tab) => {
        const selected = tab.key === active;
        const badge = badges?.[tab.key] ?? 0;
        return (
          <Pressable
            key={tab.key}
            testID={`segment-${tab.key}`}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, selected && { backgroundColor: '#fff7ed' }]}>
            <Text style={[styles.label, { color: selected ? Colors.primary : colors.textMuted }]}>{tab.label}</Text>
            {badge > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
