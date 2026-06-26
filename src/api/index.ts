import { apiRequest } from '@/src/api/client';
import type {
  Attendance,
  AttendanceRoster,
  CheckInOptions,
  LoginPayload,
  LoginResult,
  MeResult,
  MyDuesResult,
  NotificationItem,
  NotificationPreferencesMatrix,
  PaginationMeta,
  PaymentInitiationResult,
  Project,
  Survey,
  TenantLookupItem,
  Volunteer,
  Donation,
  MyDonationsResult,
  Expense,
} from '@/src/api/types';

type AuthContext = {
  token: string;
  tenantSlug: string;
};

function authHeaders(auth: AuthContext) {
  return { token: auth.token, tenantSlug: auth.tenantSlug };
}

export async function lookupTenants(query: string, limit = 15) {
  const result = await apiRequest<TenantLookupItem[]>('/api/v1/tenants/lookup', {
    query: { q: query, limit },
  });
  return result.data;
}

export async function login(payload: LoginPayload) {
  const result = await apiRequest<LoginResult>('/api/v1/auth/login', {
    method: 'POST',
    body: payload,
    tenantSlug: payload.tenant_slug,
  });
  return result.data;
}

export async function logout(auth: AuthContext) {
  await apiRequest('/api/v1/auth/logout', {
    method: 'POST',
    ...authHeaders(auth),
  });
}

export async function logoutAll(auth: AuthContext) {
  await apiRequest('/api/v1/auth/logout-all', {
    method: 'POST',
    ...authHeaders(auth),
  });
}

export async function getMe(auth: AuthContext) {
  const result = await apiRequest<MeResult>('/api/v1/me', authHeaders(auth));
  return result.data;
}

export async function listProjects(auth: AuthContext, perPage = 15) {
  const result = await apiRequest<Project[]>('/api/v1/projects', {
    ...authHeaders(auth),
    query: { per_page: perPage },
  });
  return { items: result.data, meta: result.meta as PaginationMeta | undefined };
}

export async function listMyProjects(auth: AuthContext) {
  const result = await apiRequest<Project[]>('/api/v1/projects/mine', authHeaders(auth));
  return result.data;
}

export async function getProject(auth: AuthContext, projectId: number) {
  const result = await apiRequest<Project>(`/api/v1/projects/${projectId}`, authHeaders(auth));
  return result.data;
}

export async function listVolunteers(auth: AuthContext) {
  const result = await apiRequest<Volunteer[]>('/api/v1/volunteers', authHeaders(auth));
  return result.data;
}

export async function getVolunteer(auth: AuthContext, volunteerId: number) {
  const result = await apiRequest<Volunteer>(`/api/v1/volunteers/${volunteerId}`, authHeaders(auth));
  return result.data;
}

export async function listAttendance(auth: AuthContext, perPage = 20) {
  const result = await apiRequest<Attendance[]>('/api/v1/attendance', {
    ...authHeaders(auth),
    query: { per_page: perPage },
  });
  return { items: result.data, meta: result.meta as PaginationMeta | undefined };
}

export async function getAttendance(auth: AuthContext, attendanceId: number) {
  const result = await apiRequest<Attendance>(`/api/v1/attendance/${attendanceId}`, authHeaders(auth));
  return result.data;
}

export async function adminCheckOut(
  auth: AuthContext,
  attendanceId: number,
  payload?: { check_out?: string; notes?: string },
) {
  const result = await apiRequest<Attendance>(`/api/v1/attendance/${attendanceId}/checkout`, {
    method: 'POST',
    body: payload ?? {},
    ...authHeaders(auth),
  });
  return result.data;
}

export async function deleteAttendance(auth: AuthContext, attendanceId: number) {
  await apiRequest(`/api/v1/attendance/${attendanceId}`, {
    method: 'DELETE',
    ...authHeaders(auth),
  });
}

export async function listMyAttendance(auth: AuthContext) {
  const result = await apiRequest<Attendance[]>('/api/v1/me/attendance', authHeaders(auth));
  return result.data;
}

export async function getCheckInOptions(auth: AuthContext) {
  const result = await apiRequest<CheckInOptions>('/api/v1/me/attendance/check-in-options', authHeaders(auth));
  return result.data;
}

export async function selfCheckIn(
  auth: AuthContext,
  payload: { project_id: number; latitude?: number; longitude?: number; notes?: string },
) {
  const result = await apiRequest<Attendance>('/api/v1/me/attendance/check-in', {
    method: 'POST',
    body: payload,
    ...authHeaders(auth),
  });
  return result.data;
}

export async function selfCheckOut(auth: AuthContext, attendanceId: number, notes?: string) {
  const result = await apiRequest<Attendance>(`/api/v1/me/attendance/${attendanceId}/check-out`, {
    method: 'POST',
    body: notes ? { notes } : {},
    ...authHeaders(auth),
  });
  return result.data;
}

export async function getProjectRoster(auth: AuthContext, projectId: number) {
  const result = await apiRequest<AttendanceRoster>(
    `/api/v1/projects/${projectId}/attendance/roster`,
    authHeaders(auth),
  );
  return result.data;
}

export async function bulkCheckIn(
  auth: AuthContext,
  projectId: number,
  volunteerIds: number[],
  notes?: string,
) {
  const result = await apiRequest<unknown>(`/api/v1/projects/${projectId}/attendance/bulk-check-in`, {
    method: 'POST',
    body: { volunteer_ids: volunteerIds, notes },
    ...authHeaders(auth),
  });
  return result.data;
}

export async function listNotifications(auth: AuthContext) {
  const result = await apiRequest<NotificationItem[]>('/api/v1/notifications', authHeaders(auth));
  return result.data;
}

export async function markNotificationRead(auth: AuthContext, notificationId: string) {
  await apiRequest(`/api/v1/notifications/${notificationId}/read`, {
    method: 'POST',
    ...authHeaders(auth),
  });
}

export async function markAllNotificationsRead(auth: AuthContext) {
  await apiRequest('/api/v1/notifications/read-all', {
    method: 'POST',
    ...authHeaders(auth),
  });
}

export async function getVolunteerProfile(auth: AuthContext) {
  const result = await apiRequest<Volunteer>('/api/v1/me/volunteer-profile', authHeaders(auth));
  return result.data;
}

export async function updateVolunteerProfile(auth: AuthContext, payload: Partial<Volunteer>) {
  const result = await apiRequest<Volunteer>('/api/v1/me/volunteer-profile', {
    method: 'PUT',
    body: payload,
    ...authHeaders(auth),
  });
  return result.data;
}

export async function getNotificationPreferences(auth: AuthContext) {
  const result = await apiRequest<NotificationPreferencesMatrix>(
    '/api/v1/me/notification-preferences',
    authHeaders(auth),
  );
  return result.data;
}

export async function updateNotificationPreferences(
  auth: AuthContext,
  preferences: Record<string, Record<string, boolean>>,
) {
  const result = await apiRequest<NotificationPreferencesMatrix>('/api/v1/me/notification-preferences', {
    method: 'PUT',
    body: { preferences },
    ...authHeaders(auth),
  });
  return result.data;
}

export async function getMyDues(auth: AuthContext, perPage = 20) {
  const result = await apiRequest<MyDuesResult>('/api/v1/me/dues', {
    ...authHeaders(auth),
    query: { per_page: perPage },
  });
  return result.data;
}

export async function initiateDuesPayment(auth: AuthContext, amount?: number) {
  const result = await apiRequest<PaymentInitiationResult>('/api/v1/me/dues/initiate-payment', {
    method: 'POST',
    body: amount ? { amount } : {},
    ...authHeaders(auth),
  });
  return result.data;
}

export async function registerPushToken(
  auth: AuthContext,
  expoPushToken: string,
  platform?: string,
  deviceName?: string,
) {
  await apiRequest('/api/v1/me/push-token', {
    method: 'POST',
    body: {
      expo_push_token: expoPushToken,
      platform,
      device_name: deviceName,
    },
    ...authHeaders(auth),
  });
}

export async function unregisterPushToken(auth: AuthContext, expoPushToken: string) {
  await apiRequest('/api/v1/me/push-token', {
    method: 'DELETE',
    body: { expo_push_token: expoPushToken },
    ...authHeaders(auth),
  });
}

export async function listMyPolls(auth: AuthContext) {
  const result = await apiRequest<Survey[]>('/api/v1/me/polls', authHeaders(auth));
  return result.data;
}

export async function getPoll(auth: AuthContext, surveyId: number) {
  const result = await apiRequest<Survey>(`/api/v1/me/polls/${surveyId}`, authHeaders(auth));
  return result.data;
}

export async function submitPollResponse(
  auth: AuthContext,
  surveyId: number,
  answers: Record<string, string | number | string[]>,
) {
  const result = await apiRequest<{ message: string; response_id: number }>(
    `/api/v1/me/polls/${surveyId}/responses`,
    {
      method: 'POST',
      body: { answers },
      ...authHeaders(auth),
    },
  );
  return result.data;
}

export async function getMyDonations(auth: AuthContext, perPage = 20) {
  const result = await apiRequest<MyDonationsResult>('/api/v1/me/donations', {
    ...authHeaders(auth),
    query: { per_page: perPage },
  });
  return result.data;
}

export async function listDonations(auth: AuthContext, perPage = 20) {
  const result = await apiRequest<Donation[]>('/api/v1/donations', {
    ...authHeaders(auth),
    query: { per_page: perPage },
  });
  return { items: result.data, meta: result.meta as PaginationMeta | undefined };
}

export async function listExpenses(auth: AuthContext, perPage = 20) {
  const result = await apiRequest<Expense[]>('/api/v1/expenses', {
    ...authHeaders(auth),
    query: { per_page: perPage },
  });
  return { items: result.data, meta: result.meta as PaginationMeta | undefined };
}

export async function contributeToProject(auth: AuthContext, projectId: number, amount: number) {
  const result = await apiRequest<PaymentInitiationResult>(`/api/v1/projects/${projectId}/contribute`, {
    method: 'POST',
    body: { amount },
    ...authHeaders(auth),
  });
  return result.data;
}
