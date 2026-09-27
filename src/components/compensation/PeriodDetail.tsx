import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@utils/common';
import { GetCompensationPeriod } from '@requests/compensationPeriod';
import { ListWorksheetsForPeriod } from '@requests/worksheet';
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

  useEffect(() => {
    if (!periodId) return;
    let cancelled = false;
    setPeriod(null);
    setWorksheets([]);
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
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0D1B2A]">
              {t('compensation.linkedWorksheets')}
            </h2>
            {worksheets.length === 0 ? (
              <div className="mt-3 rounded-[28px] border border-dashed border-[#D7E3F4] px-6 py-16 text-center">
                <p className="text-[15px] text-[#5C6B80]">{t('compensation.noLinkedWorksheets')}</p>
              </div>
            ) : (
              <ul className="mt-2">
                {worksheets.map((row) => (
                  <LinkedWorksheetRow
                    key={row.uuid}
                    row={row}
                    staffName={staffNames.get(row.staff_id) ?? row.staff_id}
                    statusLabel={t(`compensation.worksheetStatus.${row.status}`)}
                    generateLabel={t(`compensation.generateStatus.${row.generate_status}`)}
                    visitsLabel={t('compensation.visits')}
                    onOpen={(uuid) =>
                      navigate(`/payroll/worksheet/${uuid}`, {
                        state: {
                          via: 'period',
                          periodId: period.uuid,
                          periodLabel: period.label,
                        } satisfies CompensationNavState,
                      })
                    }
                  />
                ))}
              </ul>
            )}
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
