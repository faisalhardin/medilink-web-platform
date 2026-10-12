export type SnapshotWageCadence = 'monthly' | 'weekly' | 'daily';

export type SnapshotWageInput = {
  wageAmount: number;
  wageCadence: SnapshotWageCadence;
  mandatoryWorkingDays: number | null;
  staffWorkingDays: number | null;
  finalWage: number | null;
};

export type SnapshotWagePreview =
  | { ok: true; total: number | null }
  | { ok: false; reason: 'days' | 'final' };

// A weekly rate covers 7 days. A daily rate covers 1. A monthly rate covers the mandatory days.
function unitDays(cadence: SnapshotWageCadence, mandatoryWorkingDays: number): number {
  if (cadence === 'daily') return 1;
  if (cadence === 'weekly') return 7;
  return mandatoryWorkingDays;
}

// Same rule as backend ApplySnapshotWage. Integer rupiah, truncating toward zero.
export function previewSnapshotWage(input: SnapshotWageInput): SnapshotWagePreview {
  const { wageAmount, wageCadence, mandatoryWorkingDays, staffWorkingDays, finalWage } = input;
  const daysInvalid =
    (mandatoryWorkingDays != null && mandatoryWorkingDays < 0) ||
    (staffWorkingDays != null && staffWorkingDays < 0) ||
    (mandatoryWorkingDays != null && staffWorkingDays != null && mandatoryWorkingDays <= 0);
  if (daysInvalid) return { ok: false, reason: 'days' };
  if (finalWage != null && finalWage < 0) return { ok: false, reason: 'final' };
  if (mandatoryWorkingDays != null && staffWorkingDays != null) {
    return {
      ok: true,
      total: Math.trunc((wageAmount * staffWorkingDays) / unitDays(wageCadence, mandatoryWorkingDays)),
    };
  }
  if (finalWage != null) return { ok: true, total: finalWage };
  return { ok: true, total: null };
}

// Generate can insert another row for the same staff and period, so the highest id is the latest.
export function latestSnapshotsForPeriod<
  T extends { id: number; staff_id: string; compensation_period_uuid: string },
>(snapshots: T[], periodUuid: string): T[] {
  const byStaff = new Map<string, T>();
  for (const row of snapshots) {
    if (row.compensation_period_uuid !== periodUuid) continue;
    const current = byStaff.get(row.staff_id);
    if (!current || row.id > current.id) byStaff.set(row.staff_id, row);
  }
  return [...byStaff.values()];
}

// Empty is null. A non-integer or an unsafe integer is undefined.
export function parseOptionalInt(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (!/^\d+$/.test(trimmed)) return undefined;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value)) return undefined;
  return value;
}
