import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PendingCheckOut } from '@/src/api/types';

const QUEUE_KEY = 'tnf_pending_checkouts';

export async function getPendingCheckOuts(): Promise<PendingCheckOut[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingCheckOut[];
  } catch {
    return [];
  }
}

export async function queueCheckOut(
  entry: Omit<PendingCheckOut, 'id' | 'created_at'>,
): Promise<PendingCheckOut> {
  const pending = await getPendingCheckOuts();
  const item: PendingCheckOut = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    created_at: new Date().toISOString(),
  };
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([item, ...pending]));
  return item;
}

export async function removePendingCheckOut(id: string): Promise<void> {
  const pending = await getPendingCheckOuts();
  await AsyncStorage.setItem(
    QUEUE_KEY,
    JSON.stringify(pending.filter((item) => item.id !== id)),
  );
}
