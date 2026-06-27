export const CACHE_TTL = {
  profile: 5 * 60 * 1000,
  dues: 5 * 60 * 1000,
  volunteers: 10 * 60 * 1000,
  volunteer: 10 * 60 * 1000,
  communityPosts: 2 * 60 * 1000,
  projects: 5 * 60 * 1000,
  project: 5 * 60 * 1000,
  projectInterest: 2 * 60 * 1000,
  attendance: 60 * 1000,
  homeStats: 2 * 60 * 1000,
  notifications: 30 * 1000,
} as const;

export const cacheKeys = {
  volunteerProfile: (tenantSlug: string) => `${tenantSlug}:me:volunteer-profile`,
  myDues: (tenantSlug: string) => `${tenantSlug}:me:dues`,
  volunteers: (tenantSlug: string) => `${tenantSlug}:volunteers`,
  volunteer: (tenantSlug: string, volunteerId: number) => `${tenantSlug}:volunteer:${volunteerId}`,
  communityPosts: (tenantSlug: string) => `${tenantSlug}:community:posts`,
  projectsAll: (tenantSlug: string) => `${tenantSlug}:projects:all`,
  projectsMine: (tenantSlug: string) => `${tenantSlug}:projects:mine`,
  project: (tenantSlug: string, projectId: number) => `${tenantSlug}:project:${projectId}`,
  projectInterest: (tenantSlug: string, projectId: number) => `${tenantSlug}:project:${projectId}:interest`,
  myAttendance: (tenantSlug: string) => `${tenantSlug}:me:attendance`,
  checkInOptions: (tenantSlug: string) => `${tenantSlug}:me:check-in-options`,
  homeStats: (tenantSlug: string, isStaff: boolean) => `${tenantSlug}:home:${isStaff ? 'staff' : 'volunteer'}`,
  notificationsUnread: (tenantSlug: string) => `${tenantSlug}:notifications:unread`,
};
