import { apiRequest, apiUpload } from '@/src/api/client';
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
  ProgramTypeOption,
  ProjectWritePayload,
  MessageItem,
  MessageTemplate,
  MessageComposePayload,
  MessageComposeResult,
  VolunteerProfileResult,
  VolunteerProfileOptions,
  ConsentStatus,
  MyFeedbackResult,
  FeedbackFormSchema,
  ProjectInterestState,
  CommunityPost,
  CommunityComment,
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

export async function listProjects(auth: AuthContext, perPage = 15, page = 1) {
  const result = await apiRequest<Project[]>('/api/v1/projects', {
    ...authHeaders(auth),
    query: { per_page: perPage, page },
  });
  return { items: result.data, meta: result.meta as PaginationMeta | undefined };
}

export async function listAllProjects(auth: AuthContext, perPage = 50) {
  const first = await listProjects(auth, perPage, 1);
  const items = [...first.items];
  const lastPage = first.meta?.last_page ?? 1;

  for (let page = 2; page <= lastPage; page += 1) {
    const next = await listProjects(auth, perPage, page);
    items.push(...next.items);
  }

  return items;
}

export async function listMyProjects(auth: AuthContext, perPage = 50) {
  const result = await apiRequest<Project[]>('/api/v1/projects/mine', {
    ...authHeaders(auth),
    query: { per_page: perPage },
  });
  return result.data;
}

export async function getProject(auth: AuthContext, projectId: number) {
  const result = await apiRequest<Project>(`/api/v1/projects/${projectId}`, authHeaders(auth));
  return result.data;
}

export async function listProgramTypes(auth: AuthContext) {
  const result = await apiRequest<ProgramTypeOption[]>('/api/v1/program-types', authHeaders(auth));
  return result.data;
}

export async function createProject(auth: AuthContext, payload: ProjectWritePayload) {
  const result = await apiRequest<Project>('/api/v1/projects', {
    method: 'POST',
    body: payload,
    ...authHeaders(auth),
  });
  return result.data;
}

export async function updateProject(auth: AuthContext, projectId: number, payload: ProjectWritePayload) {
  const result = await apiRequest<Project>(`/api/v1/projects/${projectId}`, {
    method: 'PUT',
    body: payload,
    ...authHeaders(auth),
  });
  return result.data;
}

export async function deleteProject(auth: AuthContext, projectId: number) {
  await apiRequest(`/api/v1/projects/${projectId}`, {
    method: 'DELETE',
    ...authHeaders(auth),
  });
}

export async function listMessages(
  auth: AuthContext,
  params?: { direction?: string; search?: string; per_page?: number },
) {
  const result = await apiRequest<MessageItem[]>('/api/v1/messages', {
    ...authHeaders(auth),
    query: params,
  });
  return { items: result.data, meta: result.meta as PaginationMeta | undefined };
}

export async function getMessage(auth: AuthContext, messageId: number) {
  const result = await apiRequest<MessageItem>(`/api/v1/messages/${messageId}`, authHeaders(auth));
  return result.data;
}

export async function sendMessage(auth: AuthContext, payload: MessageComposePayload) {
  const result = await apiRequest<MessageComposeResult>('/api/v1/messages', {
    method: 'POST',
    body: payload,
    ...authHeaders(auth),
  });
  return result.data;
}

export async function listMessageTemplates(auth: AuthContext, channel?: string) {
  const result = await apiRequest<MessageTemplate[]>('/api/v1/message-templates', {
    ...authHeaders(auth),
    query: channel ? { channel } : undefined,
  });
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

export async function getVolunteerProfile(auth: AuthContext): Promise<VolunteerProfileResult> {
  const result = await apiRequest<{
    volunteer: Volunteer;
    profile_completion_percentage: number;
    options: VolunteerProfileOptions;
  }>('/api/v1/me/volunteer-profile', authHeaders(auth));

  return {
    ...result.data.volunteer,
    profile_completion_percentage: result.data.profile_completion_percentage,
    profile_options: result.data.options,
  };
}

export async function updateVolunteerProfile(auth: AuthContext, payload: Partial<Volunteer>) {
  const body = {
    ...payload,
    skills: Array.isArray(payload.skills) ? payload.skills.join(', ') : payload.skills,
    languages_spoken: Array.isArray(payload.languages_spoken)
      ? payload.languages_spoken.join(', ')
      : payload.languages_spoken,
  };
  const result = await apiRequest<Volunteer>('/api/v1/me/volunteer-profile', {
    method: 'PUT',
    body,
    ...authHeaders(auth),
  });
  return result.data;
}

export async function uploadVolunteerPhoto(auth: AuthContext, uri: string, fileName = 'photo.jpg', mimeType = 'image/jpeg') {
  const formData = new FormData();
  formData.append('profile_photo', {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
  const result = await apiUpload<Volunteer>('/api/v1/me/volunteer-profile/photo', formData, authHeaders(auth));
  return result.data;
}

export async function deleteVolunteerPhoto(auth: AuthContext) {
  const result = await apiRequest<Volunteer>('/api/v1/me/volunteer-profile/photo', {
    method: 'DELETE',
    ...authHeaders(auth),
  });
  return result.data;
}

export async function getConsentStatus(auth: AuthContext) {
  const result = await apiRequest<ConsentStatus>('/api/v1/me/consent', authHeaders(auth));
  return result.data;
}

export async function approveConsent(auth: AuthContext, notes?: string) {
  const result = await apiRequest<{ message: string; consent_status: string }>('/api/v1/me/consent/approve', {
    method: 'POST',
    body: notes ? { notes } : {},
    ...authHeaders(auth),
  });
  return result.data;
}

export async function declineConsent(auth: AuthContext, notes?: string) {
  const result = await apiRequest<{ message: string; consent_status: string }>('/api/v1/me/consent/decline', {
    method: 'POST',
    body: notes ? { notes } : {},
    ...authHeaders(auth),
  });
  return result.data;
}

export async function updatePassword(auth: AuthContext, currentPassword: string, password: string, passwordConfirmation: string) {
  const result = await apiRequest<{ message: string }>('/api/v1/me/password', {
    method: 'PUT',
    body: {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    },
    ...authHeaders(auth),
  });
  return result.data;
}

export async function listMyFeedback(auth: AuthContext) {
  const result = await apiRequest<MyFeedbackResult>('/api/v1/me/feedback', authHeaders(auth));
  return result.data;
}

export async function getFeedbackForm(auth: AuthContext, projectId: number) {
  const result = await apiRequest<FeedbackFormSchema>(`/api/v1/me/feedback/projects/${projectId}`, authHeaders(auth));
  return result.data;
}

export async function submitProjectFeedback(
  auth: AuthContext,
  projectId: number,
  payload: Record<string, string | number | boolean | null | undefined>,
) {
  const result = await apiRequest<{ message: string; feedback_id: number }>(
    `/api/v1/me/feedback/projects/${projectId}`,
    {
      method: 'POST',
      body: payload,
      ...authHeaders(auth),
    },
  );
  return result.data;
}

export async function getProjectInterest(auth: AuthContext, projectId: number) {
  const result = await apiRequest<ProjectInterestState>(`/api/v1/me/projects/${projectId}/interest`, authHeaders(auth));
  return result.data;
}

export async function saveProjectInterest(auth: AuthContext, projectId: number, status: string, note?: string) {
  const result = await apiRequest<{ message: string; status: string }>(`/api/v1/me/projects/${projectId}/interest`, {
    method: 'POST',
    body: { status, note },
    ...authHeaders(auth),
  });
  return result.data;
}

export async function listCommunityPosts(auth: AuthContext, perPage = 15) {
  const result = await apiRequest<CommunityPost[]>('/api/v1/community/posts', {
    ...authHeaders(auth),
    query: { per_page: perPage },
  });
  return { items: result.data, meta: result.meta as PaginationMeta | undefined };
}

export async function getCommunityPost(auth: AuthContext, postId: number) {
  const result = await apiRequest<CommunityPost>(`/api/v1/community/posts/${postId}`, authHeaders(auth));
  return result.data;
}

export async function createCommunityPost(auth: AuthContext, body: string) {
  const result = await apiRequest<CommunityPost>('/api/v1/community/posts', {
    method: 'POST',
    body: { body },
    ...authHeaders(auth),
  });
  return result.data;
}

export async function createCommunityComment(auth: AuthContext, postId: number, body: string, parentId?: number) {
  const result = await apiRequest<CommunityComment>(`/api/v1/community/posts/${postId}/comments`, {
    method: 'POST',
    body: { body, parent_id: parentId },
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

export interface FirebaseTokenResult {
  token: string;
  firebase_uid: string;
  expires_in: number;
  project_id?: string | null;
}

export async function getFirebaseToken(auth: AuthContext) {
  const result = await apiRequest<FirebaseTokenResult>('/api/v1/me/firebase-token', authHeaders(auth));
  return result.data;
}

export async function contributeToProject(auth: AuthContext, projectId: number, amount: number) {
  const result = await apiRequest<PaymentInitiationResult>(`/api/v1/projects/${projectId}/contribute`, {
    method: 'POST',
    body: { amount },
    ...authHeaders(auth),
  });
  return result.data;
}
