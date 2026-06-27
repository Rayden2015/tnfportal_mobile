import { API_BASE_URL } from '@/src/config';

export function resolveAssetUrl(url?: string | null): string | null {
  if (!url) {
    return null;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const base = API_BASE_URL.replace(/\/$/, '');

  if (url.startsWith('/')) {
    return `${base}${url}`;
  }

  return `${base}/${url}`;
}
