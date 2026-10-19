import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@utils/common';
import { getApiErrorItems } from '@utils/apiErrors';
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
} from '@requests/worksheet';
import { GetCompensationPeriod } from '@requests/compensationPeriod';
import { PatchVisitCommission } from '@requests/visitCommission';
import { GenerateStaffWageSnapshots, ListWages, UpdateStaffWageSnapshot, loadStaffWageSnapshot } from '@requests/compensationWage';
import {
  useCompensationTrail,
  type CompensationCrumb,
  type CompensationNavState,
} from '@components/compensation/CompensationBreadcrumb';
import WageSnapshotEditor from '@components/compensation/WageSnapshotEditor';
import { snapshotWageErrorMessage } from '@utils/snapshotWage';
import type {
  CommissionType,
  CompensationPeriodStatus,
  ContributionSourceType,
  StaffWage,
  StaffWageSnapshot,
  UpdateStaffWageSnapshotRequest,
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

// shortcut: preview uses the active wage. Generate copies the contract that covers the payday.
function activeWage(wages: StaffWage[], staffId: string): StaffWage | null {
  let best: StaffWage | null = null;
  for (const wage of wages) {
    if (wage.staff_id !== staffId) continue;
    if (
      !best ||
      wage.effective_from > best.effective_from ||
      (wage.effective_from === best.effective_from && wage.id > best.id)
    ) {
      best = wage;
    }
  }
  return best;
}

function draftSnapshot(wage: StaffWage, periodUuid: string, staffId: string): StaffWageSnapshot {
  return {
    id: 0,
    staff_id: staffId,
    compensation_period_uuid: periodUuid,
    period_start: wage.effective_from,
    period_end: wage.effective_to ?? '',
    wage_amount: wage.wage_amount,
    wage_cadence: wage.wage_cadence,
    mandatory_working_days: null,
    staff_working_days: null,
    final_wage: null,
    total_wage: null,
    created_at: '',
    updated_at: '',
  };
}

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

const ghostButton =
  'h-9 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-[#0B57D0] outline-none ring-1 ring-[#D7E3F4] transition-colors hover:bg-[#E8F1FF] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/20 disabled:opacity-50';

const primaryButton =
  'h-9 shrink-0 rounded-full bg-[#0B57D0] px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#0847B0] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/25 disabled:opacity-50';

function Subsection({
  title,
  loud = false,
  busy = false,
  children,
}: {
  title: string;
  loud?: boolean;
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={
        loud
          ? 'mt-6 border-l-[3px] border-[#0B57D0] bg-[#F4F8FF] px-5 py-5'
          : 'mt-6 rounded-2xl border border-[#E6EEF8] bg-white px-5 py-4'
      }
      aria-busy={busy}
    >
      <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0D1B2A]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function WageSnapshotBand({
  linked,
  loading,
  error,
  snapshot,
  draft,
  commission,
  editable,
  onGenerate,
  onCancel,
  onCommit,
  onSaved,
}: {
  linked: boolean;
  loading: boolean;
  error: string | null;
  snapshot: StaffWageSnapshot | null;
  draft: StaffWageSnapshot | null;
  commission: number;
  editable: boolean;
  onGenerate: () => void;
  onCancel: () => void;
  onCommit: (body: UpdateStaffWageSnapshotRequest) => Promise<StaffWageSnapshot>;
  onSaved: (next: StaffWageSnapshot) => void;
}) {
  const { t } = useTranslation();
  const wageShown = snapshot ? (snapshot.total_wage ?? 0) : null;

  return loading ? (
    <p className="text-[13px] text-[#5C6B80]">{t('common.loading')}</p>
  ) : snapshot && wageShown != null ? (
        <>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div>
              <dt className="text-[13px] text-[#5C6B80]">
                {t(snapshot.final_wage != null ? 'compensation.flatWage' : 'compensation.wage')}
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-[#0D1B2A]">{formatPrice(wageShown)}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-[#5C6B80]">{t('compensation.commission')}</dt>
              <dd className="mt-1 inline-flex rounded-full bg-white px-3 py-1 text-[15px] font-semibold tabular-nums text-[#0D1B2A] ring-1 ring-[#D7E3F4]">
                {formatPrice(commission)}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-[#5C6B80]">{t('compensation.payTotal')}</dt>
              <dd className="mt-1 inline-flex rounded-full bg-white px-3 py-1 text-[15px] font-semibold tabular-nums text-[#0D1B2A] ring-1 ring-[#D7E3F4]">
                {formatPrice(wageShown + commission)}
              </dd>
            </div>
          </dl>
          {editable ? (
            <WageSnapshotEditor
              key={`${snapshot.id}-${snapshot.updated_at}`}
              snapshot={snapshot}
              onSaved={onSaved}
            />
          ) : null}
        </>
      ) : draft ? (
        <WageSnapshotEditor
          key={`draft-${draft.wage_amount}`}
          snapshot={draft}
          commit={onCommit}
          onCancel={onCancel}
          onSaved={onSaved}
        />
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[15px] font-semibold leading-snug text-[#0D1B2A]">
              {linked ? t('compensation.wageSnapshotMissing') : t('compensation.wageNoPayday')}
            </p>
            {linked ? (
              <p className="mt-1 text-[13px] leading-snug text-[#5C6B80]">
                {t('compensation.wageSnapshotMissingHint')}
              </p>
            ) : null}
            {error ? <p className="mt-2 text-sm text-[#9B2C2C]">{error}</p> : null}
          </div>
          {linked && editable ? (
            <button type="button" className={primaryButton} onClick={onGenerate}>
              {t('compensation.generateWageSnapshot')}
            </button>
          ) : null}
        </div>
  );
}

const StaffPeriodDetail = () => {
  const { t, i18n } = useTranslation();
  const { worksheetId = '' } = useParams();
  const location = useLocation();
  const user = getStorageUser();
  const canAssign = hasPermission(user, PERMISSIONS.compensation.assign);
  const canFinalize = hasPermission(user, PERMISSIONS.compensation.finalize);
  const canManage = hasPermission(user, PERMISSIONS.compensation.manage);
  const locale = i18n.language.startsWith('id') ? 'id' : 'en';

  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [visits, setVisits] = useState<VisitCommissionRow[]>([]);
  const [staffName, setStaffName] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paydayLabel, setPaydayLabel] = useState('');
  const [paydayStatus, setPaydayStatus] = useState<CompensationPeriodStatus | null>(null);
  const [snapshot, setSnapshot] = useState<StaffWageSnapshot | null>(null);
  const [contract, setContract] = useState<StaffWage | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [wageError, setWageError] = useState<string | null>(null);
  const [wageLoading, setWageLoading] = useState(false);

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
      if (!worksheet.compensation_period_uuid) {
        if (!cancelled) {
          setPaydayLabel('');
          setPaydayStatus(null);
        }
        return;
      }
      try {
        const period = await GetCompensationPeriod(worksheet.compensation_period_uuid);
        if (!cancelled) {
          setPaydayLabel(period.label);
          setPaydayStatus(period.status);
        }
      } catch {
        if (!cancelled) {
          setPaydayLabel('');
          setPaydayStatus(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [worksheet]);

  useEffect(() => {
    const periodUuid = worksheet?.compensation_period_uuid;
    const staffId = worksheet?.staff_id;
    if (!canManage || !periodUuid || !staffId) {
      setSnapshot(null);
      setContract(null);
      setDrafting(false);
      setWageError(null);
      setWageLoading(false);
      return;
    }
    let cancelled = false;
    setSnapshot(null);
    setContract(null);
    setDrafting(false);
    setWageLoading(true);
    setWageError(null);
    (async () => {
      try {
        const next = await loadStaffWageSnapshot(periodUuid, staffId);
        if (cancelled) return;
        setSnapshot(next);
        if (next) return;
        const listed = await ListWages(staffId);
        if (!cancelled) setContract(activeWage(listed.wages ?? [], staffId));
      } catch (err) {
        if (!cancelled) {
          setSnapshot(null);
          setContract(null);
          setWageError(snapshotWageErrorMessage(err, t));
        }
      } finally {
        if (!cancelled) setWageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canManage, worksheet?.compensation_period_uuid, worksheet?.staff_id, t]);

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
    const periodName = paydayLabel || nav?.periodLabel || t('compensation.period');
    const fromWorksheets = nav?.via === 'worksheets';
    const fromSummary = nav?.via === 'summary';
    const fromPeriod = nav?.via === 'period';

    if (fromSummary) {
      const periodId = linkedPeriodId || nav?.periodId || '';
      const summaryTo = periodId ? `/payroll/summary?period=${periodId}` : '/payroll/summary';
      const periodCrumb: CompensationCrumb[] = periodId
        ? [{
            label: periodName,
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
          label: periodName,
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
    paydayLabel,
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
  const isGenerating = worksheet.generate_status === 'running';
  const paydayFinalized = paydayStatus === 'finalized';
  const lockedEdits = isFinalized || isGenerating || paydayFinalized;

  const openWageDraft = () => {
    if (!contract) {
      setWageError(t('compensation.wageErrors.contractNotFound'));
      return;
    }
    setWageError(null);
    setDrafting(true);
  };

  const commitWageDraft = async (body: UpdateStaffWageSnapshotRequest) => {
    const periodUuid = worksheet.compensation_period_uuid;
    if (!periodUuid) throw new Error('wage snapshot was not created');
    try {
      await GenerateStaffWageSnapshots({
        compensation_period_uuid: periodUuid,
        staff_ids: [worksheet.staff_id],
      });
    } catch (err) {
      const alreadyExists = getApiErrorItems(err).some(
        (item) => item.error_name === 'WAGE_SNAPSHOT_ALREADY_EXISTS',
      );
      if (!alreadyExists) throw err;
    }
    const created = await loadStaffWageSnapshot(periodUuid, worksheet.staff_id);
    if (!created) throw new Error('wage snapshot was not created');
    return UpdateStaffWageSnapshot(created.id, body);
  };

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
      {linked ? (
        <Subsection title={t('compensation.payday')}>
          <p className="text-[13px]">
            <Link
              to={`/payroll/period/${worksheet.compensation_period_uuid}`}
              className="font-semibold text-[#0B57D0] hover:underline"
            >
              {paydayLabel || t('compensation.payday')}
            </Link>
          </p>
        </Subsection>
      ) : null}

      {canManage ? (
        <Subsection
          title={t('compensation.wage')}
          loud={!wageLoading && snapshot == null && !drafting}
          busy={linked && wageLoading}
        >
          <WageSnapshotBand
            linked={linked}
            editable={!paydayFinalized}
            loading={linked && wageLoading}
            error={wageError}
            snapshot={snapshot}
            draft={
              drafting && contract && worksheet.compensation_period_uuid
                ? draftSnapshot(contract, worksheet.compensation_period_uuid, worksheet.staff_id)
                : null
            }
            commission={worksheet.total_commission}
            onGenerate={openWageDraft}
            onCancel={() => {
              setDrafting(false);
              setWageError(null);
            }}
            onCommit={commitWageDraft}
            onSaved={(next) => {
              setDrafting(false);
              setSnapshot(next);
            }}
          />
        </Subsection>
      ) : null}

      <Subsection title={t('compensation.visitCommissions')}>
        <p className="max-w-xl text-[13px] leading-snug text-[#5C6B80]">
          {t('compensation.visitCommissionsHint')}
        </p>
        {canManage ? null : (
          <p className="mt-3">
            <span className="text-[13px] text-[#5C6B80]">{t('compensation.commission')}</span>
            <span className="mt-1 block text-[15px] font-semibold tabular-nums text-[#0D1B2A]">
              {formatPrice(worksheet.total_commission)}
            </span>
          </p>
        )}

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
      </Subsection>
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
