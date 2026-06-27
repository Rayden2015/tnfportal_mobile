import type { Ionicons } from '@expo/vector-icons';

import type { Project } from '@/src/api/types';

export type ProjectStatusStyle = {
  label: string;
  backgroundColor: string;
  color: string;
};

const STATUS_STYLES: Record<string, Omit<ProjectStatusStyle, 'label'>> = {
  active: { backgroundColor: '#DCFCE7', color: '#166534' },
  planning: { backgroundColor: '#FEF9C3', color: '#854D0E' },
  completed: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
  on_hold: { backgroundColor: '#FFEDD5', color: '#9A3412' },
  cancelled: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  draft: { backgroundColor: '#F3F4F6', color: '#374151' },
};

export function formatProjectStatus(status?: string | null): ProjectStatusStyle {
  const key = (status ?? 'active').toLowerCase();
  const label = key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const palette = STATUS_STYLES[key] ?? STATUS_STYLES.active;

  return { label, ...palette };
}

function formatDateLabel(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatProjectDateRange(project: Project): string {
  const start = formatDateLabel(project.start_date);
  const end = formatDateLabel(project.end_date);

  if (start && end) {
    return `${start} – ${end}`;
  }

  return start ?? end ?? 'Date TBC';
}

export function getProgramTypeIcon(programType?: string | null): keyof typeof Ionicons.glyphMap {
  const key = (programType ?? '').toLowerCase();

  if (key.includes('health') || key.includes('medical')) {
    return 'medkit-outline';
  }
  if (key.includes('education') || key.includes('school')) {
    return 'school-outline';
  }
  if (key.includes('outreach') || key.includes('community')) {
    return 'people-outline';
  }
  if (key.includes('fund') || key.includes('donation')) {
    return 'heart-outline';
  }

  return 'folder-open-outline';
}

export function sortProjectsByLatest(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const aDate = projectSortDate(a);
    const bDate = projectSortDate(b);
    if (aDate !== bDate) {
      return bDate.localeCompare(aDate);
    }
    return b.id - a.id;
  });
}

function projectSortDate(project: Project): string {
  return project.start_date ?? project.end_date ?? project.created_at ?? '';
}
