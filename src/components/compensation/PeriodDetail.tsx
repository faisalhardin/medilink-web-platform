import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@utils/common';
import { GetCompensationPeriod } from '@requests/compensationPeriod';
import PeriodLifecycleActions from '@components/compensation/PeriodLifecycleActions';
import { ListWorksheetsByDates, ListWorksheetsForPeriod } from '@requests/worksheet';
import { ListStaff } from '@requests/staff';
import ContentCard from '@components/compensation/ContentCard';
import { useCompensationTrail, type CompensationNavState } from '@components/compensation/CompensationBreadcrumb';
import type {
  CompensationPeriod,
  CompensationPeriodStatus,
  Worksheet,
  WorksheetGenerateStatus,
  WorksheetStatus,
} from '@models/compensation';

const periodStatusTone: Record<CompensationPeriodStatus, string> = {
  open: 'bg-[#E8F1FF] text-[#0B57D0]',
  draft: 'bg-[#F3F6FB] text-[#3D4F6F]',
  finalized: 'bg-[#0B57D0] text-white',
};

const worksheetStatusTone: Record<WorksheetStatus, string> = {
  pending: 'bg-[#F3F6FB] text-[#3D4F6F]',
  open: 'bg-[#E8F1FF] text-[#0B57D0]',
  finalized: 'bg-[#0B57D0] text-white',
};

const generateTone: Record<WorksheetGenerateStatus, string> = {
  idle: 'text-[#6B7C93]',
  running: 'text-[#0B57D0]',
  succeeded: 'text-[#0B57D0]',
  failed: 'text-[#9B2C2C]',
};

const worksheetTabClass = (active: boolean) =>
  `relative z-10 rounded-full border-0 px-4 py-1.5 text-left text-[15px] font-semibold tracking-[-0.01em] shadow-none outline-0 ring-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ${
    active ? 'text-white' : 'text-[#3D4F6F] hover:text-[#0D1B2A]'
  }`;

const formatShortDate = (iso: string) => {
  const dateOnly = iso.slice(0, 10);
  const d = new Date(`${dateOnly}T00:00:00`);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

type LinkedWorksheetRowProps = {
  row: Worksheet;
  staffName: string;
  statusLabel: string;
  generateLabel: string;
  visitsLabel: string;
  onOpen: (uuid: string) => void;
};

const LinkedWorksheetRow = ({
  row,
  staffName,
  statusLabel,
  generateLabel,
  visitsLabel,
  onOpen,
}: LinkedWorksheetRowProps) => (
  <li className="[content-visibility:auto]">
    <div className="group flex flex-col gap-2 border-b border-[#E6EEF8] px-1 py-2.5 transition-colors duration-150 hover:bg-[#F7FAFF] sm:flex-row sm:items-center sm:justify-between sm:px-3">
      <button
        type="button"
        onClick={() => onOpen(row.uuid)}
        className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#0B57D0] focus-visible:ring-offset-2"
      >
        <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#0D1B2A]">
          {row.label}
        </p>
        <p className="mt-1 text-[13px] text-[#5C6B80]">
          {staffName}
          <span className="mx-2 text-[#C5D0E0]">/</span>
          {formatShortDate(row.period_start)} – {formatShortDate(row.period_end)}
        </p>
      </button>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${worksheetStatusTone[row.status]}`}>
          {statusLabel}
        </span>
        <span className={`px-1 text-[12px] font-medium ${generateTone[row.generate_status]}`}>
          {generateLabel}
        </span>
        <span className="px-1 text-[12px] font-medium text-[#5C6B80]">
          {row.visit_count} {visitsLabel}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold tabular-nums text-[#0D1B2A] ring-1 ring-[#D7E3F4]">
          {formatPrice(row.total_commission)}
        </span>
      </div>
    </div>
  </li>
);

const PeriodDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { periodId = '' } = useParams();
  const [period, setPeriod] = useState<CompensationPeriod | null>(null);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [staffNames, setStaffNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(Boolean(periodId));
  const [error, setError] = useState<string | null>(null);
  const [worksheetTab, setWorksheetTab] = useState<'linked' | 'dates'>('linked');
  const tablistRef = useRef<HTMLDivElement>(null);
  const linkedTabRef = useRef<HTMLButtonElement>(null);
  const datesTabRef = useRef<HTMLButtonElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [indicatorMoves, setIndicatorMoves] = useState(false);
  const [sameDateWorksheets, setSameDateWorksheets] = useState<Worksheet[] | null>(null);
  const [sameDateLoading, setSameDateLoading] = useState(false);
  const [sameDateError, setSameDateError] = useState<string | null>(null);

  useEffect(() => {
    if (!periodId) return;
    let cancelled = false;
    setPeriod(null);
    setWorksheets([]);
    setWorksheetTab('linked');
    setSameDateWorksheets(null);
    setSameDateError(null);
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [loaded, linked, staff] = await Promise.all([
          GetCompensationPeriod(periodId),
          ListWorksheetsForPeriod(periodId),
          ListStaff(false),
        ]);
        if (cancelled) return;
        setPeriod(loaded);
        setWorksheets(linked);
        setStaffNames(new Map((staff.staff ?? []).map((row) => [row.uuid, row.name])));
      } catch {
        if (!cancelled) setError(t('compensation.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [periodId, t]);

  useCompensationTrail(
    period
      ? [
          { label: t('compensation.title'), to: '/payroll' },
          { label: period.label },
        ]
      : null,
  );

  const loadSameDateWorksheets = async () => {
    if (!period) return;
    const start = period.period_start.slice(0, 10);
    const end = period.period_end.slice(0, 10);
    setSameDateLoading(true);
    setSameDateError(null);
    try {
      const rows = await ListWorksheetsByDates(start, end);
      setSameDateWorksheets(
        rows.filter(
          (row) => row.period_start.slice(0, 10) === start && row.period_end.slice(0, 10) === end
        )
      );
    } catch {
      setSameDateError(t('compensation.loadError'));
    } finally {
      setSameDateLoading(false);
    }
  };

  const dateRangeLabel = period
    ? `${formatShortDate(period.period_start)} – ${formatShortDate(period.period_end)}`
    : '';
  const placeIndicator = useCallback(() => {
    const list = tablistRef.current;
    const button = (worksheetTab === 'linked' ? linkedTabRef : datesTabRef).current;
    if (!list || !button) return;
    const listRect = list.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    setIndicator({
      left: buttonRect.left - listRect.left,
      top: buttonRect.top - listRect.top,
      width: buttonRect.width,
      height: buttonRect.height,
    });
  }, [worksheetTab]);

  useLayoutEffect(() => {
    placeIndicator();
  }, [placeIndicator, dateRangeLabel]);

  useEffect(() => {
    const list = tablistRef.current;
    if (!list) return;
    const observer = new ResizeObserver(() => placeIndicator());
    observer.observe(list);
    return () => observer.disconnect();
  }, [placeIndicator, dateRangeLabel]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIndicatorMoves(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const visibleWorksheets = worksheetTab === 'linked' ? worksheets : sameDateWorksheets ?? [];
  const openWorksheet = (uuid: string) => {
    if (!period) return;
    navigate(`/payroll/worksheet/${uuid}`, {
      state: {
        via: 'period',
        periodId: period.uuid,
        periodLabel: period.label,
      } satisfies CompensationNavState,
    });
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
        <div className="space-y-4">
          <ContentCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold leading-none tracking-[-0.03em] text-[#0D1B2A]">
                    {period.label}
                  </h1>
                  <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${periodStatusTone[period.status]}`}>
                    {t(`compensation.status.${period.status}`)}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-snug text-[#5C6B80]">
                  {formatShortDate(period.period_start)} – {formatShortDate(period.period_end)}
                </p>
                {period.status === 'draft' || period.status === 'finalized' ? (
                  <Link
                    to={`/payroll/summary?period=${period.uuid}`}
                    className="mt-2 inline-flex text-[13px] font-semibold text-[#0B57D0] hover:underline"
                  >
                    {t('compensation.paymentSummary')}
                  </Link>
                ) : null}
              </div>
              <PeriodLifecycleActions period={period} onPeriodChange={setPeriod} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <div>
                <dt className="text-[13px] text-[#5C6B80]">{t('compensation.worksheets')}</dt>
                <dd className="mt-1 text-[15px] font-semibold tabular-nums text-[#0D1B2A]">
                  {worksheets.length}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-[#5C6B80]">{t('compensation.wage')}</dt>
                <dd className="mt-1 text-[15px] font-semibold tabular-nums text-[#0D1B2A]">
                  {formatPrice(period.total_wage)}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-[#5C6B80]">{t('compensation.commission')}</dt>
                <dd className="mt-1 text-[15px] font-semibold tabular-nums text-[#0D1B2A]">
                  {formatPrice(period.total_commission)}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-[#5C6B80]">{t('compensation.totalPayout')}</dt>
                <dd className="mt-1 inline-flex rounded-full bg-white px-3 py-1 text-[15px] font-semibold tabular-nums text-[#0D1B2A] ring-1 ring-[#D7E3F4]">
                  {formatPrice(period.total_payout)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-[13px] text-[#5C6B80]">
              {period.staff_count} {t('compensation.staffInPeriod')}
              <span className="mx-2 text-[#C5D0E0]">/</span>
              {period.visit_count} {t('compensation.visits')}
            </p>
            {period.no_contributor_count > 0 ? (
              <p className="mt-1 text-[13px] text-[#5C6B80]">
                {period.no_contributor_count} {t('compensation.noContributorVisits')}
              </p>
            ) : null}
          </ContentCard>

          <ContentCard>
            <div ref={tablistRef} role="tablist" aria-label={t('compensation.worksheets')} className="relative inline-flex max-w-full flex-wrap gap-1 rounded-[20px] bg-[#F4F8FF] p-1">
              {indicator ? (
                <span
                  aria-hidden
                  className={`pointer-events-none absolute rounded-full bg-[#0B57D0] ${
                    indicatorMoves
                      ? 'motion-safe:transition-[left,top,width,height] motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none'
                      : ''
                  }`}
                  style={{ left: indicator.left, top: indicator.top, width: indicator.width, height: indicator.height }}
                />
              ) : null}
              <button
                ref={linkedTabRef}
                type="button"
                role="tab"
                id="period-worksheets-linked"
                aria-selected={worksheetTab === 'linked'}
                aria-controls="period-worksheets-panel"
                className={worksheetTabClass(worksheetTab === 'linked')}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setWorksheetTab('linked')}
              >
                {t('compensation.linkedWorksheets')}
              </button>
              <button
                ref={datesTabRef}
                type="button"
                role="tab"
                id="period-worksheets-dates"
                aria-selected={worksheetTab === 'dates'}
                aria-controls="period-worksheets-panel"
                aria-label={t('compensation.sameDateWorksheetsHeading', { range: dateRangeLabel })}
                className={worksheetTabClass(worksheetTab === 'dates')}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setWorksheetTab('dates');
                  if (sameDateWorksheets === null && !sameDateLoading) {
                    void loadSameDateWorksheets();
                  }
                }}
              >
                {dateRangeLabel}
              </button>
            </div>
            <div
              role="tabpanel"
              id="period-worksheets-panel"
              aria-labelledby={worksheetTab === 'linked' ? 'period-worksheets-linked' : 'period-worksheets-dates'}
            >
              {worksheetTab === 'dates' && sameDateLoading ? (
                <div className="mt-3 rounded-[28px] border border-dashed border-[#D7E3F4] px-6 py-16 text-center">
                  <p className="text-[15px] text-[#5C6B80]">{t('common.loading')}</p>
                </div>
              ) : worksheetTab === 'dates' && sameDateError ? (
                <p className="mt-3 text-sm text-[#9B2C2C]">{sameDateError}</p>
              ) : visibleWorksheets.length === 0 ? (
                <div className="mt-3 rounded-[28px] border border-dashed border-[#D7E3F4] px-6 py-16 text-center">
                  <p className="text-[15px] text-[#5C6B80]">
                    {worksheetTab === 'linked'
                      ? t('compensation.noLinkedWorksheets')
                      : t('compensation.noSameDateWorksheets')}
                  </p>
                </div>
              ) : (
                <ul className="mt-2">
                  {visibleWorksheets.map((row) => (
                    <LinkedWorksheetRow
                      key={row.uuid}
                      row={row}
                      staffName={staffNames.get(row.staff_id) ?? row.staff_id}
                      statusLabel={t(`compensation.worksheetStatus.${row.status}`)}
                      generateLabel={t(`compensation.generateStatus.${row.generate_status}`)}
                      visitsLabel={t('compensation.visits')}
                      onOpen={openWorksheet}
                    />
                  ))}
                </ul>
              )}
            </div>
          </ContentCard>
        </div>
      ) : loading ? (
        <div className="rounded-[28px] border border-dashed border-[#D7E3F4] px-6 py-16 text-center">
          <p className="text-[15px] text-[#5C6B80]">{t('common.loading')}</p>
        </div>
      ) : null}
    </div>
  );
};

export default PeriodDetail;
