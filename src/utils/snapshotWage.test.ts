import { describe, expect, it } from 'vitest';
import { latestSnapshotsForPeriod, parseOptionalInt, previewSnapshotWage } from './snapshotWage';

describe('previewSnapshotWage', () => {
  it('prorates and keeps the flat wage from replacing that total', () => {
    expect(
      previewSnapshotWage({
        wageAmount: 1000,
        wageCadence: 'monthly',
        mandatoryWorkingDays: 22,
        staffWorkingDays: 20,
        finalWage: 500,
      }),
    ).toEqual({ ok: true, total: 909 });
  });

  it('copies the flat wage when either day count is missing', () => {
    expect(
      previewSnapshotWage({
        wageAmount: 1000,
        wageCadence: 'monthly',
        mandatoryWorkingDays: null,
        staffWorkingDays: null,
        finalWage: 750,
      }),
    ).toEqual({ ok: true, total: 750 });
    expect(
      previewSnapshotWage({
        wageAmount: 1000,
        wageCadence: 'monthly',
        mandatoryWorkingDays: 22,
        staffWorkingDays: null,
        finalWage: 400,
      }),
    ).toEqual({ ok: true, total: 400 });
  });

  it('stays empty when nothing was entered and treats zero days worked as zero', () => {
    expect(
      previewSnapshotWage({
        wageAmount: 1000,
        wageCadence: 'monthly',
        mandatoryWorkingDays: null,
        staffWorkingDays: null,
        finalWage: null,
      }),
    ).toEqual({ ok: true, total: null });
    expect(
      previewSnapshotWage({
        wageAmount: 1000,
        wageCadence: 'monthly',
        mandatoryWorkingDays: 22,
        staffWorkingDays: 0,
        finalWage: null,
      }),
    ).toEqual({ ok: true, total: 0 });
  });

  it('scales a weekly rate by the days worked in a 7-day week', () => {
    expect(
      previewSnapshotWage({
        wageAmount: 3_000_000,
        wageCadence: 'weekly',
        mandatoryWorkingDays: 22,
        staffWorkingDays: 21,
        finalWage: null,
      }),
    ).toEqual({ ok: true, total: 9_000_000 });
  });

  it('rejects a non-positive required-day count and a negative flat wage', () => {
    expect(
      previewSnapshotWage({
        wageAmount: 1000,
        wageCadence: 'monthly',
        mandatoryWorkingDays: 0,
        staffWorkingDays: 20,
        finalWage: null,
      }),
    ).toEqual({ ok: false, reason: 'days' });
    expect(
      previewSnapshotWage({
        wageAmount: 1000,
        wageCadence: 'monthly',
        mandatoryWorkingDays: null,
        staffWorkingDays: null,
        finalWage: -1,
      }),
    ).toEqual({ ok: false, reason: 'final' });
  });
});

describe('latestSnapshotsForPeriod', () => {
  it('keeps the highest id for the same staff and period', () => {
    const rows = latestSnapshotsForPeriod(
      [
        { id: 1, staff_id: 'a', compensation_period_uuid: 'p' },
        { id: 4, staff_id: 'a', compensation_period_uuid: 'p' },
        { id: 3, staff_id: 'a', compensation_period_uuid: 'other' },
        { id: 2, staff_id: 'b', compensation_period_uuid: 'p' },
      ],
      'p',
    );
    expect(rows.map((row) => row.id).sort((a, b) => a - b)).toEqual([2, 4]);
  });
});

describe('parseOptionalInt', () => {
  it('treats a blank field as empty and rejects a non-integer', () => {
    expect(parseOptionalInt('')).toBeNull();
    expect(parseOptionalInt('  ')).toBeNull();
    expect(parseOptionalInt('20')).toBe(20);
    expect(parseOptionalInt('20.5')).toBeUndefined();
    expect(parseOptionalInt('-1')).toBeUndefined();
  });
});
