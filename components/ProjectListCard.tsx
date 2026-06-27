import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import type { Project } from '@/src/api/types';
import {
  formatProjectDateRange,
  formatProjectStatus,
  getProgramTypeIcon,
} from '@/src/utils/projects';

type ProjectListCardProps = {
  project: Project;
  onPress?: () => void;
};

function StatusChip({ label, backgroundColor, color }: { label: string; backgroundColor: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

function MetaLine({
  icon,
  text,
  mutedColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  mutedColor: string;
}) {
  return (
    <View style={styles.metaLine}>
      <Ionicons name={icon} size={15} color={mutedColor} />
      <Text style={[styles.metaText, { color: mutedColor }]} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

export function ProjectListCard({ project, onPress }: ProjectListCardProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const status = formatProjectStatus(project.status);
  const programLabel = project.program_type_label ?? project.program_type?.replace(/_/g, ' ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={[styles.card, project.is_mine ? styles.mineCard : undefined]}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name={getProgramTypeIcon(project.program_type)} size={22} color={Colors.primary} />
          </View>

          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {project.title}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>

            {programLabel ? (
              <Text style={[styles.programType, { color: colors.textMuted }]} numberOfLines={1}>
                {programLabel}
              </Text>
            ) : null}

            <View style={styles.chipRow}>
              <StatusChip {...status} />
              {project.is_mine ? (
                <View style={styles.mineBadge}>
                  <Ionicons name="bookmark" size={11} color={Colors.primary} />
                  <Text style={styles.mineBadgeText}>Mine</Text>
                </View>
              ) : null}
              {project.interest_open ? (
                <StatusChip label="RSVP open" backgroundColor="#EFF6FF" color="#1D4ED8" />
              ) : null}
              {project.feedback_open ? (
                <StatusChip label="Feedback" backgroundColor="#F5F3FF" color="#6D28D9" />
              ) : null}
            </View>
          </View>
        </View>

        <View style={[styles.metaBlock, { borderTopColor: colors.border }]}>
          {project.location ? (
            <MetaLine icon="location-outline" text={project.location} mutedColor={colors.textMuted} />
          ) : null}
          <MetaLine icon="calendar-outline" text={formatProjectDateRange(project)} mutedColor={colors.textMuted} />
          {project.volunteers_count != null ? (
            <MetaLine
              icon="people-outline"
              text={`${project.volunteers_count} volunteer${project.volunteers_count === 1 ? '' : 's'}`}
              mutedColor={colors.textMuted}
            />
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.88,
  },
  card: {
    marginBottom: 12,
  },
  mineCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  programType: {
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff7ed',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mineBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  metaBlock: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
