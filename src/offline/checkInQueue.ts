import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PendingCheckIn } from '@/src/api/types';

const QUEUE_KEY = 'tnf_pending_checkins';

export async function getPendingCheckIns(): Promise<PendingCheckIn[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingCheckIn[];
  } catch {
    return [];
  }
}

export async function queueCheckIn(
  entry: Omit<PendingCheckIn, 'id' | 'created_at'>,
): Promise<PendingCheckIn> {
  const pending = await getPendingCheckIns();
  const item: PendingCheckIn = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    created_at: new Date().toISOString(),
  };
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([item, ...pending]));
  return item;
}

export async function removePendingCheckIn(id: string): Promise<void> {
  const pending = await getPendingCheckIns();
  await AsyncStorage.setItem(
    QUEUE_KEY,
    JSON.stringify(pending.filter((item) => item.id !== id)),
  );
}

export async function clearPendingCheckIns(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
