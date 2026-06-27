import { API_BASE_URL, TENANT_HEADER } from '@/src/config';
import type { ApiErrorBody, ApiResponse } from '@/src/api/types';
import { applySentryTraceHeaders } from '@/src/monitoring/sentry';
import { trackApiFailure } from '@/src/monitoring/index';

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.errors = body.errors;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  tenantSlug?: string | null;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token, tenantSlug, query }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (tenantSlug) {
    headers[TENANT_HEADER] = tenantSlug;
  }

  applySentryTraceHeaders(headers);

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    trackApiFailure(path, response.status, json?.message ?? response.statusText);
    throw new ApiError(response.status, json ?? { message: response.statusText });
  }

  return json as ApiResponse<T>;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  { token, tenantSlug, method = 'POST' }: { token?: string | null; tenantSlug?: string | null; method?: string } = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (tenantSlug) {
    headers[TENANT_HEADER] = tenantSlug;
  }

  applySentryTraceHeaders(headers);

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: formData,
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    trackApiFailure(path, response.status, json?.message ?? response.statusText);
    throw new ApiError(response.status, json ?? { message: response.statusText });
  }

  return json as ApiResponse<T>;
}
