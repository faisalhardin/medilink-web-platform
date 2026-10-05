import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@utils/common';
import { getStorageUser } from '@utils/storage';
import { hasPermission } from '@utils/permissions';
import { PERMISSIONS } from 'constants/permissions';
import { CreateCompensationPeriod, ListCompensationPeriods } from '@requests/compensationPeriod';
import type { CompensationPeriod, CompensationPeriodStatus } from '@models/compensation';
import WorksheetDateRange from '@components/compensation/WorksheetDateRange';
import MonthRange from '@components/compensation/MonthRange';
import { getApiErrorMessage } from '@utils/apiErrors';

const MAX_MONTH_SPAN = 12;

const statusTone: Record<CompensationPeriodStatus, string> = {
  open: 'bg-[#E8F1FF] text-[#0B57D0]',
  draft: 'bg-[#F3F6FB] text-[#3D4F6F]',
  finalized: 'bg-[#0B57D0] text-white',
};

const fieldClass =
  'h-9 w-full rounded-full border border-[#D7E3F4] bg-white px-4 text-sm text-[#0D1B2A] outline-none transition-shadow placeholder:text-[#8A97AB] focus:border-[#0B57D0] focus:ring-4 focus:ring-[#0B57D0]/15';

const ghostButton =
  'h-9 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-[#0B57D0] outline-none ring-1 ring-[#D7E3F4] transition-colors hover:bg-[#E8F1FF] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/20';

const primaryButton =
  'h-9 shrink-0 rounded-full bg-[#0B57D0] px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#0847B0] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/25 disabled:opacity-50';

const formatShortDate = (iso: string) => {
  const dateOnly = iso.slice(0, 10);
  const d = new Date(`${dateOnly}T00:00:00`);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const currentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const monthIndex = (value: string) => {
  const [year, month] = value.split('-').map(Number);
  return year * 12 + (month - 1);
};

const fromMonthIndex = (index: number) => {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
};

const clampMonthRange = (from: string, to: string) => {
  let start = from;
  let end = to;
  if (!start) start = currentMonthValue();
  if (!end) end = start;
  if (monthIndex(end) < monthIndex(start)) end = start;
  if (monthIndex(end) - monthIndex(start) + 1 > MAX_MONTH_SPAN) {
    end = fromMonthIndex(monthIndex(start) + MAX_MONTH_SPAN - 1);
  }
  return { from: start, to: end };
};

const rangeBounds = (from: string, to: string) => {
  const [year, month] = to.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${from}-01`,
    end: `${to}-${String(lastDay).padStart(2, '0')}`,
  };
};

const overlapsRange = (period: CompensationPeriod, start: string, end: string) => {
  const periodStart = period.period_start.slice(0, 10);
  const periodEnd = period.period_end.slice(0, 10);
  return periodStart <= end && periodEnd >= start;
};

type PeriodRowProps = {
  period: CompensationPeriod;
  statusLabel: string;
  staffLabel: string;
  visitsLabel: string;
  onOpen: (uuid: string) => void;
};

const PeriodRow = ({ period, statusLabel, staffLabel, visitsLabel, onOpen }: PeriodRowProps) => (
  <li className="[content-visibility:auto]">
    <div className="group flex flex-col gap-2 border-b border-[#E6EEF8] px-1 py-2.5 transition-colors duration-150 hover:bg-[#F7FAFF] sm:flex-row sm:items-center sm:justify-between sm:px-3">
      <button
        type="button"
        onClick={() => onOpen(period.uuid)}
        className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#0B57D0] focus-visible:ring-offset-2"
      >
        <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#0D1B2A]">
          {period.label}
        </p>
        <p className="mt-1 text-[13px] text-[#5C6B80]">
          {formatShortDate(period.period_start)} – {formatShortDate(period.period_end)}
        </p>
      </button>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${statusTone[period.status]}`}>
          {statusLabel}
        </span>
        <span className="px-1 text-[12px] font-medium text-[#5C6B80]">
          {period.staff_count} {staffLabel}
          <span className="mx-2 text-[#C5D0E0]">/</span>
          {period.visit_count} {visitsLabel}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold tabular-nums text-[#0D1B2A] ring-1 ring-[#D7E3F4]">
          {formatPrice(period.total_payout)}
        </span>
      </div>
    </div>
  </li>
);

const PaydayHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = getStorageUser();
  const canAssign = hasPermission(user, PERMISSIONS.compensation.assign);
  const canManage = hasPermission(user, PERMISSIONS.compensation.manage);

  const [periods, setPeriods] = useState<CompensationPeriod[]>([]);
  const [monthFrom, setMonthFrom] = useState(currentMonthValue);
  const [monthTo, setMonthTo] = useState(currentMonthValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadPeriods = useCallback(async () => {
    const list = await ListCompensationPeriods();
    setPeriods(list.periods ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadPeriods();
      } catch {
        if (!cancelled) setError(t('compensation.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPeriods, t]);

  const visiblePeriods = useMemo(() => {
    const { start, end } = rangeBounds(monthFrom, monthTo);
    return periods.filter((period) => overlapsRange(period, start, end));
  }, [periods, monthFrom, monthTo]);

  const setRange = (from: string, to: string) => {
    const next = clampMonthRange(from, to);
    setMonthFrom(next.from);
    setMonthTo(next.to);
  };

  const handleCreate = async () => {
    if (!newLabel.trim() || !newStart || !newEnd) return;
    setBusy(true);
    setCreateError(null);
    try {
      const created = await CreateCompensationPeriod({
        label: newLabel.trim(),
        period_start: newStart,
        period_end: newEnd,
      });
      navigate(`/payroll/period/${created.uuid}`);
    } catch (err) {
      setCreateError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = Boolean(newLabel.trim() && newStart && newEnd);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="text-2xl font-semibold leading-none tracking-[-0.03em] text-[#0D1B2A]">
            {t('compensation.title')}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={ghostButton} onClick={() => navigate('/payroll/worksheets')}>
            {t('compensation.worksheets')}
          </button>
          {canManage ? (
            <button type="button" className={ghostButton} onClick={() => navigate('/payroll/wages')}>
              {t('compensation.wageConfig')}
            </button>
          ) : null}
          {canAssign ? (
            <button
              type="button"
              className={primaryButton}
              onClick={() => {
                setCreateError(null);
                setCreateOpen(true);
              }}
            >
              {t('compensation.newPeriod')}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#9B2C2C]">
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)} className="font-medium underline">
            {t('common.close')}
          </button>
        </div>
      ) : null}

      <div className="mt-4 flex rounded-full bg-[#F4F8FF] p-1">
        <MonthRange from={monthFrom} to={monthTo} onChange={setRange} />
      </div>

      <div className="mt-4">
        {loading || visiblePeriods.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#D7E3F4] px-6 py-16 text-center">
            <p className="text-[15px] text-[#5C6B80]">
              {loading ? t('common.loading') : t('compensation.emptyMonthRange')}
            </p>
          </div>
        ) : (
          <ul>
            {visiblePeriods.map((period) => (
              <PeriodRow
                key={period.uuid}
                period={period}
                statusLabel={t(`compensation.status.${period.status}`)}
                staffLabel={t('compensation.staffInPeriod')}
                visitsLabel={t('compensation.visits')}
                onOpen={(uuid) => navigate(`/payroll/period/${uuid}`)}
              />
            ))}
          </ul>
        )}
      </div>

      {createOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0D1B2A]/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => setCreateOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payday-create-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(13,27,42,0.16)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="payday-create-title" className="text-xl font-semibold tracking-[-0.02em] text-[#0D1B2A]">
              {t('compensation.newPeriod')}
            </h2>
            <label className="mt-5 block text-[13px] font-medium text-[#3D4F6F]" htmlFor="payday-label">
              {t('compensation.periodLabel')}
            </label>
            <input
              id="payday-label"
              autoFocus
              className={`${fieldClass} mt-2`}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <p className="mb-1 mt-4 text-[13px] font-medium text-[#3D4F6F]">{t('compensation.dateRange')}</p>
            <WorksheetDateRange
              start={newStart}
              end={newEnd}
              onChange={(nextStart, nextEnd) => {
                setNewStart(nextStart);
                setNewEnd(nextEnd);
              }}
            />
            {createError ? <p className="mt-3 text-sm text-[#9B2C2C]">{createError}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="h-11 rounded-full px-4 text-sm font-semibold text-[#3D4F6F] hover:bg-[#F4F8FF]"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={busy || !canSubmit}
                onClick={handleCreate}
                className="h-11 rounded-full bg-[#0B57D0] px-5 text-sm font-semibold text-white hover:bg-[#0847B0] disabled:opacity-50"
              >
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PaydayHome;
