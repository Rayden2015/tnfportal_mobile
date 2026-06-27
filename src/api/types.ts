export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorBody {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  status?: string;
  currency?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  tenant_id: number;
  email_verified: boolean;
  roles?: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
  tenant_slug: string;
  device_name?: string;
}

export interface LoginResult {
  token: string;
  token_type: string;
  user: User;
  tenant: Tenant;
}

export interface MeResult {
  user: User;
  tenant: Tenant;
}

export interface Project {
  id: number;
  title: string;
  description?: string | null;
  program_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  budget?: number | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  has_coordinates?: boolean;
  interest_open?: boolean;
  feedback_open?: boolean;
  volunteers_count?: number;
  location_beneficiary_id?: number | null;
  program_type_label?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_mine?: boolean;
  media?: ProjectMedia[];
  media_count?: number;
}

export interface ProjectMedia {
  id: number;
  url: string;
  thumbnail_url: string;
  original_filename?: string | null;
  caption?: string | null;
  description?: string | null;
  media_type?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  formatted_file_size?: string | null;
  is_image: boolean;
  is_pdf: boolean;
  is_document: boolean;
  is_video: boolean;
  file_type?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

export interface ProgramTypeOption {
  value: string;
  label: string;
}

export interface ProjectWritePayload {
  title: string;
  description: string;
  program_type?: string;
  start_date: string;
  end_date?: string | null;
  status: string;
  budget?: number | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface MessageItem {
  id: number;
  channel: string;
  direction?: string | null;
  recipient?: string | null;
  subject?: string | null;
  body?: string | null;
  status?: string | null;
  project_id?: number | null;
  sent_at?: string | null;
  created_at?: string | null;
}

export interface MessageTemplate {
  id: number;
  name: string;
  channel: string;
  subject?: string | null;
  body?: string | null;
  template_type?: string | null;
}

export interface MessageComposePayload {
  channel: 'mail' | 'sms' | 'whatsapp';
  body: string;
  subject?: string;
  template_id?: number;
  volunteer_ids?: number[];
  recipient_phone?: string;
  recipient_email?: string;
  project_id?: number;
}

export interface MessageComposeResult {
  message: string;
  sent_count: number;
  failed_count: number;
  skipped_count: number;
  message_ids: number[];
}

export interface VolunteerProfileOptions {
  genders: Record<string, string>;
  education: Record<string, string>;
  preferred_roles: Record<string, string>;
  interests: Record<string, string>;
  availability_days: Record<string, string>;
  availability_times: Record<string, string>;
  tshirt_sizes: Record<string, string>;
}

export interface VolunteerProfileResult extends Volunteer {
  profile_options?: VolunteerProfileOptions;
}

export interface ConsentStatus {
  consent_status?: string | null;
  consent_requested_at?: string | null;
  consent_responded_at?: string | null;
  has_dues_configured: boolean;
  can_respond: boolean;
}

export interface FeedbackProjectItem {
  id: number;
  title: string;
  description?: string | null;
  status?: string | null;
  feedback_open?: boolean;
  end_date?: string | null;
}

export interface MyFeedbackResult {
  pending: FeedbackProjectItem[];
  submitted: Array<{
    project: FeedbackProjectItem;
    feedback_id?: number | null;
    submitted_at?: string | null;
  }>;
}

export interface FeedbackFormSchema {
  project: FeedbackProjectItem;
  rating_fields: Record<string, string>;
  open_fields: Record<string, string>;
  nps_question: string;
  nps_min: number;
  nps_max: number;
}

export interface ProjectInterestState {
  interest_open: boolean;
  statuses: Record<string, string>;
  current: {
    status: string;
    note?: string | null;
    responded_at?: string | null;
  } | null;
}

export interface CommunityPost {
  id: number;
  body?: string | null;
  excerpt?: string;
  author?: { id?: number; name?: string };
  media?: Array<{ id: number; type: string; url: string }>;
  comments_count?: number;
  top_level_comments?: CommunityComment[];
  published_at?: string | null;
}

export interface CommunityComment {
  id: number;
  body: string;
  author?: { id?: number; name?: string };
  parent_id?: number | null;
  replies?: CommunityComment[];
  created_at?: string | null;
}

export interface Volunteer {
  id: number;
  user_id?: number | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  profile_photo_url?: string | null;
  profile_completion_percentage?: number;
  performance_score?: number | null;
  performance_grade?: string | null;
  consent_status?: string | null;
  occupation?: string | null;
  employer?: string | null;
  industry?: string | null;
  years_of_experience?: number | null;
  highest_education?: string | null;
  linkedin_url?: string | null;
  nationality?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  skills?: string | string[] | null;
  languages_spoken?: string | null;
  interests?: string[];
  preferred_roles?: string[];
  availability_days?: string[];
  availability_times?: string[];
  hours_per_week_available?: number | null;
  tshirt_size?: string | null;
  can_travel?: boolean | null;
  has_own_transport?: boolean | null;
  willing_remote?: boolean | null;
  has_volunteered_before?: boolean | null;
  previous_experience?: string | null;
  motivation?: string | null;
}

export interface Attendance {
  id: number;
  project_id: number;
  volunteer_id: number;
  check_in?: string | null;
  check_out?: string | null;
  status?: string | null;
  status_text?: string | null;
  is_checked_in?: boolean;
  duration_hours?: number | null;
  notes?: string | null;
  project?: Project;
  volunteer?: Volunteer;
}

export interface CheckInOptions {
  projects: Project[];
  geo_fencing_enabled: boolean;
  check_in_radius_km: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at?: string | null;
  created_at?: string | null;
}

export interface AttendanceRoster {
  project: Project;
  volunteers: Volunteer[];
  open_attendances?: Attendance[];
  checked_in_volunteer_ids: number[];
}

export interface TenantLookupItem {
  id: number;
  name: string;
  slug: string;
}

export interface PendingCheckIn {
  id: string;
  project_id: number;
  project_title?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  created_at: string;
}

export interface PendingCheckOut {
  id: string;
  attendance_id: number;
  project_title?: string;
  notes?: string;
  created_at: string;
}

export interface NotificationPreferenceChannel {
  key: string;
  label: string;
  description?: string;
  selectable: boolean;
  enabled: boolean;
  default?: boolean;
}

export interface NotificationPreferenceTypeRow {
  type: string;
  label: string;
  description?: string;
  channels: Record<string, NotificationPreferenceChannel>;
}

export interface NotificationPreferencesMatrix {
  preferences: NotificationPreferenceTypeRow[];
  channels?: Record<string, { label?: string; description?: string; selectable?: boolean }>;
  message?: string;
}

export interface DuesSummary {
  total_amount_due: number;
  total_amount_paid: number;
  total_outstanding: number;
  count_paid: number;
  count_partial: number;
  count_unpaid: number;
  count_overdue: number;
  collection_rate: number;
}

export interface DuesOutstandingItem {
  month: string;
  month_display: string;
  amount_due: number;
  amount_paid: number;
  balance: number;
  status: string;
  due_date: string;
  is_overdue: boolean;
}

export interface DuesRecord {
  id: number;
  dues_month: string;
  dues_month_display: string;
  amount_due: number;
  amount_paid: number;
  balance: number;
  payment_status: string;
  due_date: string;
  is_overdue: boolean;
}

export interface DuesPaymentHistoryItem {
  id: number;
  amount: number;
  payment_date?: string | null;
  payment_method?: string | null;
  reference?: string | null;
}

export interface MyDuesResult {
  summary: DuesSummary;
  outstanding: {
    total_outstanding: number;
    details: DuesOutstandingItem[];
  };
  payment_history: DuesPaymentHistoryItem[];
  dues: DuesRecord[];
  payment_options: {
    kowri_enabled: boolean;
    payment_provider_configured: boolean;
    payment_link_url?: string | null;
    currency: string;
  };
}

export interface PaymentInitiationResult {
  method: 'kowri' | 'payment_link';
  checkout_url: string;
  reference?: string;
  amount: number;
  currency: string;
}

export interface SurveyChoice {
  value: string | null;
  label: string;
  image_url?: string | null;
}

export interface SurveyQuestion {
  id: number;
  type: string;
  label: string;
  help_text?: string | null;
  is_required: boolean;
  sort_order: number;
  choices: SurveyChoice[];
  scale_min: number;
  scale_max: number;
}

export interface Survey {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  is_open: boolean;
  allow_multiple_responses: boolean;
  closes_at?: string | null;
  is_accepting_responses: boolean;
  has_responded: boolean;
  can_respond: boolean;
  questions?: SurveyQuestion[];
  responses_count?: number;
}

export interface Donation {
  id: number;
  internal_id?: string | null;
  donor_id?: number | null;
  project_id?: number | null;
  donation_type?: string | null;
  description?: string | null;
  amount: number;
  currency?: string | null;
  payment_method?: string | null;
  status?: string | null;
  payment_date?: string | null;
  donor?: { id: number; name: string };
  project?: { id: number; title: string };
}

export interface MyDonationsResult {
  summary: {
    total_amount: number;
    donation_count: number;
  };
  donations: Donation[];
}

export interface Expense {
  id: number;
  internal_id?: string | null;
  project_id?: number | null;
  amount: number;
  description?: string | null;
  date?: string | null;
  payment_method?: string | null;
  receipt_number?: string | null;
  project?: { id: number; title: string };
  category?: { id: number; name: string };
}
