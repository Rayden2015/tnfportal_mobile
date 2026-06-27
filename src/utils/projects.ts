import type { Project } from '@/src/api/types';

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
