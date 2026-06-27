import { Alert, Linking } from 'react-native';

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export async function openPhone(phone: string): Promise<void> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return;
  }

  const url = `tel:${normalized}`;
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert('Unable to call', 'Phone calls are not supported on this device.');
    return;
  }

  await Linking.openURL(url);
}

export async function openEmail(email: string, subject?: string): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) {
    return;
  }

  const url = subject
    ? `mailto:${encodeURIComponent(trimmed)}?subject=${encodeURIComponent(subject)}`
    : `mailto:${encodeURIComponent(trimmed)}`;
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert('Unable to email', 'Email is not configured on this device.');
    return;
  }

  await Linking.openURL(url);
}
