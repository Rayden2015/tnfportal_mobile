import * as api from '@/src/api';
import { getPendingCheckOuts, removePendingCheckOut } from '@/src/offline/checkOutQueue';
import { getPendingCheckIns, removePendingCheckIn } from '@/src/offline/checkInQueue';

type Auth = { token: string; tenantSlug: string };

export type SyncResult = {
  synced: number;
  failed: number;
  remaining: number;
};

export async function syncPendingCheckIns(auth: Auth): Promise<SyncResult> {
  const pending = await getPendingCheckIns();
  let synced = 0;
  let failed = 0;

  for (const item of [...pending].reverse()) {
    try {
      await api.selfCheckIn(auth, {
        project_id: item.project_id,
        latitude: item.latitude,
        longitude: item.longitude,
        notes: item.notes,
      });
      await removePendingCheckIn(item.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  const remaining = (await getPendingCheckIns()).length;
  return { synced, failed, remaining };
}

export async function syncPendingCheckOuts(auth: Auth): Promise<SyncResult> {
  const pending = await getPendingCheckOuts();
  let synced = 0;
  let failed = 0;

  for (const item of [...pending].reverse()) {
    try {
      await api.selfCheckOut(auth, item.attendance_id, item.notes);
      await removePendingCheckOut(item.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  const remaining = (await getPendingCheckOuts()).length;
  return { synced, failed, remaining };
}

export async function syncAllPendingAttendance(auth: Auth): Promise<{
  checkIns: SyncResult;
  checkOuts: SyncResult;
}> {
  const checkIns = await syncPendingCheckIns(auth);
  const checkOuts = await syncPendingCheckOuts(auth);
  return { checkIns, checkOuts };
}
