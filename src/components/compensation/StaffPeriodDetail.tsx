import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@utils/common';
import { getApiErrorMessage } from '@utils/apiErrors';
import { formatSourceChip } from '@utils/compensationSources';
import { getStorageUser } from '@utils/storage';
import { hasPermission } from '@utils/permissions';
import { PERMISSIONS } from 'constants/permissions';
import { GetStaff } from '@requests/staff';
import {
  FinalizeWorksheet,
  GenerateWorksheetCommissions,
  GetWorksheet,
  ListWorksheetCommissions,
  PatchWorksheet,
} from '@requests/worksheet';
import { GetCompensationPeriod, ListCompensationPeriods } from '@requests/compensationPeriod';
import { PatchVisitCommission } from '@requests/visitCommission';
import {
  useCompensationTrail,
  type CompensationCrumb,
  type CompensationNavState,
} from '@components/compensation/CompensationBreadcrumb';
import type {
  CommissionType,
  CompensationPeriod,
  ContributionSourceType,
  VisitCommissionRow,
  Worksheet,
  WorksheetGenerateStatus,
  WorksheetStatus,
} from '@models/compensation';

const commissionAmount = (type: CommissionType, revenueBase: number, value: number) =>
  type === 'percent' ? Math.round((revenueBase * value) / 100) : value;

const formatShortDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusTone: Record<WorksheetStatus, string> = {
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

const sourceTone: Record<ContributionSourceType, string> = {
  procedure: 'bg-[#E8F1FF] text-[#0B57D0]',
  diagnosis: 'bg-[#F3F6FB] text-[#3D4F6F]',
  anamnesa: 'bg-white text-[#3D4F6F] ring-1 ring-[#D7E3F4]',
  journey: 'bg-white text-[#5C6B80] ring-1 ring-[#D7E3F4]',
  manual: 'bg-white text-[#0B57D0] ring-1 ring-[#D7E3F4]',
};

const fieldClass =
  'h-9 w-full rounded-full border border-[#D7E3F4] bg-white px-4 text-sm text-[#0D1B2A] outline-none transition-shadow placeholder:text-[#8A97AB] focus:border-[#0B57D0] focus:ring-4 focus:ring-[#0B57D0]/15';

const ghostButton =
  'h-9 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-[#0B57D0] outline-none ring-1 ring-[#D7E3F4] transition-colors hover:bg-[#E8F1FF] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/20 disabled:opacity-50';

const primaryButton =
  'h-9 shrink-0 rounded-full bg-[#0B57D0] px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#0847B0] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/25 disabled:opacity-50';

const StaffPeriodDetail = () => {
  const { t, i18n } = useTranslation();
  const { worksheetId = '' } = useParams();
  const location = useLocation();
  const user = getStorageUser();
  const canAssign = hasPermission(user, PERMISSIONS.compensation.assign);
  const canFinalize = hasPermission(user, PERMISSIONS.compensation.finalize);
  const locale = i18n.language.startsWith('id') ? 'id' : 'en';

  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [visits, setVisits] = useState<VisitCommissionRow[]>([]);
  const [staffName, setStaffName] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<CompensationPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [linkedPeriodLabel, setLinkedPeriodLabel] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    const [ws, commissions] = await Promise.all([
      GetWorksheet(worksheetId),
      ListWorksheetCommissions(worksheetId),
    ]);
    setWorksheet(ws);
    setVisits(commissions.commissions ?? []);
    const staff = await GetStaff(ws.staff_id);
    setStaffName(staff.name);
    setRoles((staff.roles ?? []).map((r) => r.name));
  }, [worksheetId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await load();
      } catch {
        if (!cancelled) setError(t('compensation.worksheetNotFound'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, t]);

  useEffect(() => {
    if (!worksheet) return;
    let cancelled = false;
    (async () => {
      if (worksheet.compensation_period_uuid) {
        try {
          const period = await GetCompensationPeriod(worksheet.compensation_period_uuid);
          if (!cancelled) setLinkedPeriodLabel(period.label);
        } catch {
          if (!cancelled) setLinkedPeriodLabel('');
        }
        return;
      }
      if (!cancelled) setLinkedPeriodLabel('');
      if (worksheet.status !== 'open' || !canAssign) return;
      try {
        const list = await ListCompensationPeriods();
        if (cancelled) return;
        const options = (list.periods ?? []).filter((period) => period.status !== 'finalized');
        setPeriods(options);
        setSelectedPeriodId((current) =>
          options.some((period) => period.uuid === current) ? current : options[0]?.uuid ?? ''
        );
      } catch {
        if (!cancelled) setLinkError(t('compensation.linkError'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [worksheet, canAssign, t]);

  useEffect(() => {
    if (worksheet?.generate_status !== 'running') return;
    const timer = window.setInterval(() => {
      load().catch(() => undefined);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [worksheet?.generate_status, load]);

  const applyCommissionPatch = (saved: {
    id: number;
    commission_subtotal: number;
    commission_type: CommissionType;
    commission_percent: number | null;
    commission_flat_amount: number | null;
    commission_amount: number;
  }) => {
    setVisits((prev) =>
      prev.map((v) =>
        v.id === saved.id
          ? {
              ...v,
              commission_type: saved.commission_type,
              commission_percent: saved.commission_percent,
              commission_flat_amount: saved.commission_flat_amount,
              commission_amount: saved.commission_amount,
            }
          : v,
      ),
    );
    setWorksheet((ws) => (ws ? { ...ws, total_commission: saved.commission_subtotal } : ws));
  };

  const nav = location.state as CompensationNavState | null;
  const trail = useMemo(() => {
    const payroll: CompensationCrumb = { label: t('compensation.title'), to: '/payroll' };
    const leafLabel = (worksheet?.label || staffName).trim();
    const leaf: CompensationCrumb[] = leafLabel ? [{ label: leafLabel }] : [];
    const linkedPeriodId = worksheet?.compensation_period_uuid || '';
    const fromWorksheets = nav?.via === 'worksheets';
    const fromSummary = nav?.via === 'summary';
    const fromPeriod = nav?.via === 'period';

    if (fromSummary) {
      const periodId = linkedPeriodId || nav?.periodId || '';
      const summaryTo = periodId ? `/payroll/summary?period=${periodId}` : '/payroll/summary';
      const periodCrumb: CompensationCrumb[] = periodId
        ? [{
            label: linkedPeriodLabel || nav?.periodLabel || t('compensation.period'),
            to: `/payroll/period/${periodId}`,
          }]
        : [];
      return [
        payroll,
        ...periodCrumb,
        { label: t('compensation.paymentSummary'), to: summaryTo },
        ...leaf,
      ];
    }

    const periodId = fromWorksheets ? '' : linkedPeriodId || (fromPeriod ? nav?.periodId || '' : '');
    if (periodId) {
      return [
        payroll,
        {
          label: linkedPeriodLabel || nav?.periodLabel || t('compensation.period'),
          to: `/payroll/period/${periodId}`,
        },
        ...leaf,
      ];
    }

    return [
      payroll,
      { label: t('compensation.worksheets'), to: '/payroll/worksheets' },
      ...leaf,
    ];
  }, [
    t,
    worksheet?.label,
    worksheet?.compensation_period_uuid,
    staffName,
    linkedPeriodLabel,
    nav?.via,
    nav?.periodId,
    nav?.periodLabel,
  ]);

  useCompensationTrail(trail);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-dashed border-[#D7E3F4] px-6 py-16 text-center">
        <p className="text-[15px] text-[#5C6B80]">{t('common.loading')}</p>
      </div>
    );
  }

  if (!worksheet || error) {
    return (
      <div className="rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#9B2C2C]">
        <p>{error ?? t('compensation.worksheetNotFound')}</p>
      </div>
    );
  }

  const isFinalized = worksheet.status === 'finalized';
  const linked = Boolean(worksheet.compensation_period_uuid);
  const lockedEdits = isFinalized || linked;
  const isGenerating = worksheet.generate_status === 'running';

  const handleGenerate = async () => {
    await GenerateWorksheetCommissions(worksheet.uuid);
    setToast(t('compensation.generateStarted'));
    await load();
  };

  const handleFinalize = async () => {
    const resp = await FinalizeWorksheet(worksheet.uuid);
    setToast(t('compensation.worksheetFinalized', { count: resp.locked_visit_count }));
    await load();
  };

  const patchPaydayLink = async (compensationPeriodUuid: string, successMessage: string) => {
    setLinking(true);
    setLinkError(null);
    try {
      await PatchWorksheet(worksheet.uuid, { compensation_period_uuid: compensationPeriodUuid });
      setToast(successMessage);
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err);
      setLinkError(message === 'Something went wrong.' ? t('compensation.linkError') : message);
    } finally {
      setLinking(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold leading-none tracking-[-0.03em] text-[#0D1B2A]">
              {worksheet.label || staffName}
            </h1>
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${statusTone[worksheet.status]}`}>
              {t(`compensation.worksheetStatus.${worksheet.status}`)}
            </span>
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-[#5C6B80]">
            {staffName}
            {roles.length > 0 ? (
              <>
                <span className="mx-2 text-[#C5D0E0]">/</span>
                {roles.join(', ')}
              </>
            ) : null}
            <span className="mx-2 text-[#C5D0E0]">/</span>
            {formatShortDate(worksheet.period_start)} – {formatShortDate(worksheet.period_end)}
            <span className="mx-2 text-[#C5D0E0]">/</span>
            {visits.length} {t('compensation.visits')}
          </p>
          <p className={`mt-1 text-[12px] font-medium ${generateTone[worksheet.generate_status]}`}>
            {t(`compensation.generateStatus.${worksheet.generate_status}`)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAssign && !lockedEdits ? (
            <button type="button" className={ghostButton} disabled={isGenerating} onClick={handleGenerate}>
              {isGenerating
                ? t('compensation.generating')
                : visits.length === 0
                  ? t('compensation.generate')
                  : t('compensation.addMissingVisits')}
            </button>
          ) : null}
          {canFinalize && !isFinalized ? (
            <button
              type="button"
              className={primaryButton}
              disabled={isGenerating || visits.length === 0}
              onClick={handleFinalize}
            >
              {t('compensation.finalizeWorksheet')}
            </button>
          ) : null}
        </div>
      </div>

      {toast ? (
        <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl bg-[#E8F1FF] px-4 py-3 text-sm text-[#0B57D0]">
          <p>{toast}</p>
          <button type="button" onClick={() => setToast(null)} className="font-medium underline">
            {t('common.close')}
          </button>
        </div>
      ) : null}
      {worksheet.generate_status === 'failed' ? (
        <div className="mt-4 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#9B2C2C]">
          <p>{worksheet.generate_error || t('compensation.generateFailed')}</p>
        </div>
      ) : null}
      {linkError ? (
        <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#9B2C2C]">
          <p>{linkError}</p>
          <button type="button" onClick={() => setLinkError(null)} className="font-medium underline">
            {t('common.close')}
          </button>
        </div>
      ) : null}

      {(linked || (canAssign && worksheet.status === 'open')) ? (
        <div className="mt-4">
          {linked ? (
            <div className="flex flex-col gap-2 rounded-full bg-[#F4F8FF] p-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="px-3 text-[13px] text-[#5C6B80]">
                {t('compensation.payday')}
                <span className="mx-2 text-[#C5D0E0]">/</span>
                <Link
                  to={`/payroll/period/${worksheet.compensation_period_uuid}`}
                  className="font-semibold text-[#0B57D0] hover:underline"
                >
                  {linkedPeriodLabel || t('compensation.payday')}
                </Link>
              </p>
              {canAssign && worksheet.status === 'open' ? (
                <button
                  type="button"
                  className={ghostButton}
                  disabled={linking}
                  onClick={() => patchPaydayLink('', t('compensation.detachedMsg'))}
                >
                  {t('compensation.detach')}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-full bg-[#F4F8FF] p-1 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="link-period">{t('compensation.payday')}</label>
              <select
                id="link-period"
                className={`${fieldClass} sm:w-72 sm:border-0 sm:bg-transparent sm:px-3 sm:focus:ring-0`}
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
              >
                {periods.map((period) => (
                  <option key={period.uuid} value={period.uuid}>
                    {period.label} / {formatShortDate(period.period_start)} – {formatShortDate(period.period_end)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={ghostButton}
                disabled={linking || !selectedPeriodId}
                onClick={() => patchPaydayLink(selectedPeriodId, t('compensation.linkedMsg'))}
              >
                {t('compensation.linkPayday')}
              </button>
            </div>
          )}
          {linked && !isFinalized ? (
            <p className="mt-2 px-1 text-[13px] text-[#5C6B80]">{t('compensation.paydayLinkedHint')}</p>
          ) : null}
        </div>
      ) : null}

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <dt className="text-[13px] text-[#5C6B80]">{t('compensation.wage')}</dt>
          <dd className="mt-1 text-[15px] font-semibold tabular-nums text-[#0D1B2A]">{formatPrice(0)}</dd>
          <p className="mt-1 text-[13px] text-[#5C6B80]">{t('compensation.wageStub')}</p>
        </div>
        <div>
          <dt className="text-[13px] text-[#5C6B80]">{t('compensation.commission')}</dt>
          <dd className="mt-1 inline-flex rounded-full bg-white px-3 py-1 text-[15px] font-semibold tabular-nums text-[#0D1B2A] ring-1 ring-[#D7E3F4]">
            {formatPrice(worksheet.total_commission)}
          </dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-[#E6EEF8] pt-5">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0D1B2A]">
          {t('compensation.visitCommissions')}
        </h2>
        <p className="mt-1 max-w-xl text-[13px] leading-snug text-[#5C6B80]">
          {t('compensation.visitCommissionsHint')}
        </p>

        {isGenerating ? (
          <div className="mt-4 rounded-[28px] border border-dashed border-[#D7E3F4] px-6 py-16 text-center">
            <p className="text-[15px] text-[#5C6B80]">{t('compensation.generating')}</p>
          </div>
        ) : visits.length === 0 ? (
          <div className="mt-4 rounded-[28px] border border-dashed border-[#D7E3F4] px-6 py-16 text-center">
            <p className="text-[15px] text-[#5C6B80]">{t('compensation.noCommissions')}</p>
          </div>
        ) : (
          <ul className="mt-2">
            {visits.map((visit) => (
              <CommissionRow
                key={visit.id}
                visit={visit}
                locale={locale}
                disabled={!canAssign || lockedEdits || isGenerating}
                onSaved={applyCommissionPatch}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

function CommissionRow({
  visit,
  locale,
  disabled,
  onSaved,
}: {
  visit: VisitCommissionRow;
  locale: 'en' | 'id';
  disabled: boolean;
  onSaved: (saved: {
    id: number;
    commission_subtotal: number;
    commission_type: CommissionType;
    commission_percent: number | null;
    commission_flat_amount: number | null;
    commission_amount: number;
  }) => void;
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<CommissionType>(visit.commission_type ?? 'percent');
  const [value, setValue] = useState(
    visit.commission_type === 'flat'
      ? String(visit.commission_flat_amount ?? '')
      : String(visit.commission_percent ?? '')
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setType(visit.commission_type ?? 'percent');
    setValue(
      visit.commission_type === 'flat'
        ? String(visit.commission_flat_amount ?? '')
        : String(visit.commission_percent ?? '')
    );
  }, [visit]);

  const save = async (nextType = type, nextValue = value) => {
    const n = Number(nextValue);
    if (nextValue === '' || Number.isNaN(n) || n < 0) return;
    setSaving(true);
    try {
      const resp = await PatchVisitCommission(visit.id, {
        commission_type: nextType,
        commission_percent: nextType === 'percent' ? n : null,
        commission_flat_amount: nextType === 'flat' ? n : null,
      });
      onSaved({
        id: visit.id,
        commission_subtotal: resp.commission_subtotal,
        commission_type: nextType,
        commission_percent: nextType === 'percent' ? n : null,
        commission_flat_amount: nextType === 'flat' ? n : null,
        commission_amount: commissionAmount(nextType, visit.revenue_base, n),
      });
    } finally {
      setSaving(false);
    }
  };

  const parsed = Number(value);
  const optimisticAmount =
    saving && value !== '' && !Number.isNaN(parsed)
      ? commissionAmount(type, visit.revenue_base, parsed)
      : null;
  const shownAmount = optimisticAmount ?? visit.commission_amount;
  const sources = visit.sources ?? [];
  const locked = disabled || saving;

  return (
    <li className="[content-visibility:auto]">
      <div className="flex flex-col gap-3 border-b border-[#E6EEF8] px-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#0D1B2A]">
            {visit.patient_name}
          </p>
          <p className="mt-1 text-[13px] text-[#5C6B80]">
            {formatShortDate(visit.visit_date)}
            <span className="mx-2 text-[#C5D0E0]">/</span>
            {t('compensation.visitTotal')} {formatPrice(visit.revenue_base)}
          </p>
          <div className="mt-2 flex max-w-md flex-wrap gap-1.5">
            {sources.length === 0 ? (
              <span className="rounded-full bg-[#FDECEC] px-2.5 py-1 text-[12px] font-medium text-[#9B2C2C]">
                {t('compensation.noSources')}
              </span>
            ) : (
              sources.map((source, idx) => (
                <span
                  key={`${source.type}-${idx}`}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${sourceTone[source.type]}`}
                >
                  {formatSourceChip(source, locale)}
                </span>
              ))
            )}
          </div>
          {!visit.has_contributors ? (
            <p className="mt-2 text-[12px] font-medium text-[#9B2C2C]">{t('compensation.noContributors')}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="inline-flex rounded-full bg-[#F4F8FF] p-0.5" role="group" aria-label={t('compensation.type')}>
            {(['percent', 'flat'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={type === option}
                disabled={locked}
                onClick={() => {
                  if (type === option) return;
                  setType(option);
                  setValue('');
                }}
                className={`h-8 rounded-full px-3 text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#0B57D0] disabled:opacity-40 ${
                  type === option ? 'bg-[#0B57D0] text-white' : 'text-[#3D4F6F] hover:bg-white'
                }`}
              >
                {option === 'percent' ? '%' : 'Rp'}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor={`commission-value-${visit.id}`}>
            {t('compensation.value')}
          </label>
          <input
            id={`commission-value-${visit.id}`}
            type="number"
            min={0}
            inputMode="decimal"
            disabled={locked}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => {
              void save();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="h-8 w-28 rounded-full border border-[#D7E3F4] bg-white px-3 text-sm tabular-nums text-[#0D1B2A] outline-none focus:border-[#0B57D0] focus:ring-4 focus:ring-[#0B57D0]/15 disabled:bg-[#F4F8FF] disabled:text-[#5C6B80]"
          />
          <span className="rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold tabular-nums text-[#0D1B2A] ring-1 ring-[#D7E3F4]">
            {shownAmount == null ? '—' : formatPrice(shownAmount)}
          </span>
        </div>
      </div>
    </li>
  );
}

export default StaffPeriodDetail;
