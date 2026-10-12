import { useEffect, useId, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@utils/common';
import { getApiErrorItems, getApiErrorMessage } from '@utils/apiErrors';
import { showSuccessToast } from '@utils/toast';
import { latestSnapshotsForPeriod, parseOptionalInt, previewSnapshotWage } from '@utils/snapshotWage';
import { GetCompensationPeriod } from '@requests/compensationPeriod';
import { ListStaff } from '@requests/staff';
import { ListStaffWageSnapshots, UpdateStaffWageSnapshot } from '@requests/compensationWage';
import ContentCard from '@components/compensation/ContentCard';
import WageSnapshotGenerate from '@components/compensation/WageSnapshotGenerate';
import { useCompensationTrail } from '@components/compensation/CompensationBreadcrumb';
import type { CompensationPeriod, CompensationPeriodStatus, StaffWageSnapshot } from '@models/compensation';

const periodStatusTone: Record<CompensationPeriodStatus, string> = {
  open: 'bg-[#E8F1FF] text-[#0B57D0]',
  draft: 'bg-[#F3F6FB] text-[#3D4F6F]',
  finalized: 'bg-[#0B57D0] text-white',
};

const fieldClass =
  'h-9 w-full rounded-full border border-[#D7E3F4] bg-white px-4 text-sm text-[#0D1B2A] outline-none transition-shadow placeholder:text-[#8A97AB] focus:border-[#0B57D0] focus:ring-4 focus:ring-[#0B57D0]/15';

const primaryButton =
  'h-9 shrink-0 rounded-full bg-[#0B57D0] px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#0847B0] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/25 disabled:opacity-50';

const SNAPSHOT_ERROR_KEYS: Record<string, string> = {
  WAGE_SNAPSHOT_DAYS_INVALID: 'compensation.wageErrors.daysInvalid',
  WAGE_SNAPSHOT_FINAL_WAGE_INVALID: 'compensation.wageErrors.finalInvalid',
};

const formatShortDate = (iso: string) => {
  const dateOnly = iso.slice(0, 10);
  const d = new Date(`${dateOnly}T00:00:00`);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fieldText = (value: number | null) => (value == null ? '' : String(value));

function messageForSnapshotError(error: unknown, translate: (key: string) => string): string {
  const items = getApiErrorItems(error);
  if (items.length === 0) return getApiErrorMessage(error);
  return items
    .map((item) => {
      const key = SNAPSHOT_ERROR_KEYS[item.error_name];
      if (key) return translate(key);
      return item.error_description || item.error_name;
    })
    .filter(Boolean)
    .join('\n');
}

type WageSnapshotRowProps = {
  snapshot: StaffWageSnapshot;
  name: string;
  onSaved: (next: StaffWageSnapshot) => void;
};

const WageSnapshotRow = ({ snapshot, name, onSaved }: WageSnapshotRowProps) => {
  const { t } = useTranslation();
  const baseId = useId();
  const [mandatory, setMandatory] = useState(() => fieldText(snapshot.mandatory_working_days));
  const [staffDays, setStaffDays] = useState(() => fieldText(snapshot.staff_working_days));
  const [finalWage, setFinalWage] = useState(() => {
    if (snapshot.final_wage != null) return String(snapshot.final_wage);
    if (snapshot.mandatory_working_days != null && snapshot.staff_working_days != null) {
      const next = previewSnapshotWage({
        wageAmount: snapshot.wage_amount,
        wageCadence: snapshot.wage_cadence,
        mandatoryWorkingDays: snapshot.mandatory_working_days,
        staffWorkingDays: snapshot.staff_working_days,
        finalWage: null,
      });
      if (next.ok && next.total != null) return String(next.total);
    }
    return String(snapshot.wage_amount);
  });
  const [finalFocused, setFinalFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mandatoryValue = parseOptionalInt(mandatory);
  const staffDaysValue = parseOptionalInt(staffDays);
  const finalValue = parseOptionalInt(finalWage);
  const parsed = mandatoryValue !== undefined && staffDaysValue !== undefined && finalValue !== undefined;
  const preview = parsed
    ? previewSnapshotWage({
      wageAmount: snapshot.wage_amount,
      wageCadence: snapshot.wage_cadence,
      mandatoryWorkingDays: mandatoryValue,
      staffWorkingDays: staffDaysValue,
      finalWage: finalValue,
    })
    : null;
  const liveError = !parsed
    ? t('compensation.wageInputInvalid')
    : preview && !preview.ok
      ? t(preview.reason === 'days' ? 'compensation.wageErrors.daysInvalid' : 'compensation.wageErrors.finalInvalid')
      : null;
  const shownFinal = typeof finalValue === 'number' ? finalValue : snapshot.wage_amount;
  const totalWage =
    typeof mandatoryValue === 'number' && typeof staffDaysValue === 'number' && preview?.ok
      ? preview.total
      : null;

  const writeFinalFromDays = (nextMandatory: string, nextStaff: string) => {
    const mandatoryDays = parseOptionalInt(nextMandatory);
    const staffWorked = parseOptionalInt(nextStaff);
    if (typeof mandatoryDays !== 'number' || typeof staffWorked !== 'number') return;
    const next = previewSnapshotWage({
      wageAmount: snapshot.wage_amount,
      wageCadence: snapshot.wage_cadence,
      mandatoryWorkingDays: mandatoryDays,
      staffWorkingDays: staffWorked,
      finalWage: null,
    });
    if (next.ok && next.total != null) setFinalWage(String(next.total));
  };

  const save = async () => {
    if (!parsed || !preview?.ok || finalValue === undefined) return;
    setBusy(true);
    setError(null);
    const finalToSave = finalValue === snapshot.wage_amount && snapshot.final_wage == null ? null : finalValue;
    try {
      const next = await UpdateStaffWageSnapshot(snapshot.id, {
        mandatory_working_days: mandatoryValue,
        staff_working_days: staffDaysValue,
        final_wage: finalToSave,
      });
      onSaved(next);
      showSuccessToast(t('compensation.wageSnapshotSaved'));
    } catch (err) {
      setError(messageForSnapshotError(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="border-b border-[#E6EEF8] py-3 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0D1B2A]">{name}</p>
          <p className="mt-0.5 text-[13px] text-[#5C6B80]">
            {t(`compensation.wageCadenceValue.${snapshot.wage_cadence}`)}
            <span className="mx-2 text-[#C5D0E0]">/</span>
            {formatPrice(shownFinal)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalWage != null && typeof finalValue === 'number' && finalValue !== totalWage ? (
            <span className="text-[13px] tabular-nums text-[#5C6B80]">{formatPrice(totalWage)}</span>
          ) : null}
          <span className="rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold tabular-nums text-[#0D1B2A] ring-1 ring-[#D7E3F4]">
            {formatPrice(shownFinal)}
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="w-36 text-[13px] font-medium text-[#3D4F6F]" htmlFor={`${baseId}-mandatory`}>
          {t('compensation.mandatoryWorkingDays')}
          <input
            id={`${baseId}-mandatory`}
            inputMode="numeric"
            className={`${fieldClass} mt-1`}
            value={mandatory}
            onChange={(event) => {
              const next = event.target.value;
              setMandatory(next);
              writeFinalFromDays(next, staffDays);
            }}
          />
        </label>
        <label className="w-36 text-[13px] font-medium text-[#3D4F6F]" htmlFor={`${baseId}-staff-days`}>
          {t('compensation.staffWorkingDays')}
          <input
            id={`${baseId}-staff-days`}
            inputMode="numeric"
            className={`${fieldClass} mt-1`}
            value={staffDays}
            onChange={(event) => {
              const next = event.target.value;
              setStaffDays(next);
              writeFinalFromDays(mandatory, next);
            }}
          />
        </label>
        <label className="w-44 text-[13px] font-medium text-[#3D4F6F]" htmlFor={`${baseId}-final`}>
          {t('compensation.flatWage')}
          <input
            id={`${baseId}-final`}
            inputMode="numeric"
            className={`${fieldClass} mt-1`}
            value={!finalFocused && typeof finalValue === 'number' ? formatPrice(finalValue) : finalWage}
            onFocus={() => setFinalFocused(true)}
            onChange={(event) => setFinalWage(event.target.value)}
            onBlur={() => {
              setFinalFocused(false);
              if (finalWage.trim() === '') setFinalWage(String(snapshot.wage_amount));
            }}
          />
        </label>
        <button type="button" className={primaryButton} disabled={busy || Boolean(liveError)} onClick={save}>
          {t('compensation.saveWage')}
        </button>
      </div>
      {liveError || error ? <p className="mt-2 text-sm text-[#9B2C2C]">{error ?? liveError}</p> : null}
    </li>
  );
};

const WageSnapshotList = () => {
  const { t, i18n } = useTranslation();
  const { periodId = '' } = useParams();
  const [period, setPeriod] = useState<CompensationPeriod | null>(null);
  const [rows, setRows] = useState<StaffWageSnapshot[]>([]);
  const [names, setNames] = useState<Map<string, string>>(() => new Map());
  const [loading, setLoading] = useState(Boolean(periodId));
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!periodId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [loaded, staff, snaps] = await Promise.all([
          GetCompensationPeriod(periodId),
          ListStaff(false),
          ListStaffWageSnapshots(),
        ]);
        if (cancelled) return;
        setPeriod(loaded);
        setNames(new Map((staff.staff ?? []).map((row) => [row.uuid, row.name])));
        setRows(latestSnapshotsForPeriod(snaps.snapshots ?? [], loaded.uuid));
      } catch {
        if (!cancelled) setError(t('compensation.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [periodId, reloadKey, t]);

  useCompensationTrail(
    period
      ? [
        { label: t('compensation.title'), to: '/payroll' },
        { label: period.label, to: `/payroll/period/${period.uuid}` },
        { label: t('compensation.wageList') },
      ]
      : null,
  );

  const ordered = useMemo(
    () =>
      [...rows].sort((a, b) =>
        (names.get(a.staff_id) ?? a.staff_id).localeCompare(names.get(b.staff_id) ?? b.staff_id, i18n.language),
      ),
    [rows, names, i18n.language],
  );

  const onSaved = (next: StaffWageSnapshot) => {
    setRows((current) => current.map((row) => (row.id === next.id ? next : row)));
  };

  return (
    <div className="space-y-4">
      {!periodId ? (
        <div className="rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#9B2C2C]">
          <p>{t('compensation.noPeriod')}</p>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#9B2C2C]">
          <p>{error}</p>
        </div>
      ) : null}
      {period ? (
        <ContentCard>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold leading-none tracking-[-0.03em] text-[#0D1B2A]">
              {t('compensation.wageList')}
            </h1>
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${periodStatusTone[period.status]}`}>
              {t(`compensation.status.${period.status}`)}
            </span>
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-[#5C6B80]">
            {period.label}
            <span className="mx-2 text-[#C5D0E0]">/</span>
            {formatShortDate(period.period_start)} – {formatShortDate(period.period_end)}
          </p>
          <WageSnapshotGenerate periodUuid={period.uuid} onGenerated={() => setReloadKey((key) => key + 1)} />
          {ordered.length === 0 ? (
            <div className="mt-4 rounded-[28px] border border-dashed border-[#D7E3F4] px-6 py-16 text-center">
              <p className="text-[15px] text-[#5C6B80]">{t('compensation.wageListEmpty')}</p>
            </div>
          ) : (
            <ul className="mt-4">
              {ordered.map((row) => (
                <WageSnapshotRow
                  key={row.id}
                  snapshot={row}
                  name={names.get(row.staff_id) ?? row.staff_id}
                  onSaved={onSaved}
                />
              ))}
            </ul>
          )}
        </ContentCard>
      ) : loading ? (
        <div className="rounded-[28px] border border-dashed border-[#D7E3F4] px-6 py-16 text-center">
          <p className="text-[15px] text-[#5C6B80]">{t('common.loading')}</p>
        </div>
      ) : null}
    </div>
  );
};

export default WageSnapshotList;
