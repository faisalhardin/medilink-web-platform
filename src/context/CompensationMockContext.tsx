// @ts-nocheck
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  CommissionType,
  CompensationPeriod,
  StaffPeriodRow,
  StaffWage,
  VisitContributor,
  VisitCommissionRow,
  Worksheet,
  WorksheetDetail,
} from '@models/compensation';
import {
  MOCK_PERIODS,
  MOCK_STAFF_OPTIONS,
  MOCK_VISIT_CONTRIBUTORS,
  MOCK_WAGES,
  MOCK_WORKSHEET_DETAILS,
  MOCK_WORKSHEETS,
  applyGenerateResult,
  recomputePeriodTotals,
  resolveCommissionAmount,
  staffListFromWorksheets,
} from 'mocks/compensationMock';

interface CompensationMockContextValue {
  periods: CompensationPeriod[];
  wages: StaffWage[];
  worksheets: Worksheet[];
  selectedPeriodId: string;
  setSelectedPeriodId: (id: string) => void;
  selectedPeriod: CompensationPeriod | undefined;
  staffList: StaffPeriodRow[];
  getWorksheetDetail: (worksheetUuid: string) => WorksheetDetail | undefined;
  /** Resolve worksheet for staff within the selected payday period. */
  findWorksheetForStaff: (staffId: string) => Worksheet | undefined;
  updateVisitCommission: (
    worksheetUuid: string,
    visitId: string,
    patch: Partial<VisitCommissionRow>
  ) => void;
  applyBulkCommission: (
    worksheetUuid: string,
    type: CommissionType,
    value: number
  ) => void;
  setWageOverride: (worksheetUuid: string, amount: number | null) => void;
  /** Async generate — sets pending/running then polls to succeeded (mock). */
  generateWorksheetCommissions: (worksheetUuid: string) => void;
  createWorksheet: (input: {
    staff_id: string;
    label: string;
    period_start: string;
    period_end: string;
    attach_to_selected_period?: boolean;
  }) => string;
  finalizeWorksheet: (worksheetUuid: string) => void;
  storeDraft: () => void;
  finalizePeriod: () => void;
  reopenPeriod: () => void;
  createPeriod: (label: string, start: string, end: string) => void;
  updateWage: (wage: StaffWage) => void;
  addWage: (wage: Omit<StaffWage, 'id'>) => void;
  removeWage: (wageId: string) => void;
  contributors: VisitContributor[];
  visitLocked: boolean;
  setVisitLocked: (locked: boolean) => void;
  addContributor: (staffId: string, name: string) => void;
  removeContributor: (staffId: string) => void;
  dirty: boolean;
  staffOptions: typeof MOCK_STAFF_OPTIONS;
}

const CompensationMockContext = createContext<CompensationMockContextValue | null>(
  null
);

function cloneDetails(
  source: Record<string, WorksheetDetail>
): Record<string, WorksheetDetail> {
  return JSON.parse(JSON.stringify(source));
}

export function CompensationMockProvider({ children }: { children: ReactNode }) {
  const [periods, setPeriods] = useState<CompensationPeriod[]>(() =>
    JSON.parse(JSON.stringify(MOCK_PERIODS))
  );
  const [wages, setWages] = useState<StaffWage[]>(() =>
    JSON.parse(JSON.stringify(MOCK_WAGES))
  );
  const [worksheets, setWorksheets] = useState<Worksheet[]>(() =>
    JSON.parse(JSON.stringify(MOCK_WORKSHEETS))
  );
  const [details, setDetails] = useState<Record<string, WorksheetDetail>>(() =>
    cloneDetails(MOCK_WORKSHEET_DETAILS)
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState('period-aug-2026');
  const [contributors, setContributors] = useState<VisitContributor[]>(() =>
    JSON.parse(JSON.stringify(MOCK_VISIT_CONTRIBUTORS))
  );
  const [visitLocked, setVisitLocked] = useState(false);
  const [dirty, setDirty] = useState(false);
  const generateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const selectedPeriod = useMemo(
    () => periods.find((p) => p.uuid === selectedPeriodId),
    [periods, selectedPeriodId]
  );

  const staffList = useMemo(
    () => staffListFromWorksheets(selectedPeriodId, worksheets, details, wages),
    [selectedPeriodId, worksheets, details, wages]
  );

  const syncPeriodFromWorksheets = useCallback(
    (
      periodId: string,
      nextWorksheets: Worksheet[],
      nextDetails: Record<string, WorksheetDetail>
    ) => {
      const staff = staffListFromWorksheets(
        periodId,
        nextWorksheets,
        nextDetails,
        wages
      );
      setPeriods((prev) =>
        prev.map((p) => (p.uuid === periodId ? recomputePeriodTotals(p, staff) : p))
      );
    },
    [wages]
  );

  const getWorksheetDetail = useCallback(
    (worksheetUuid: string) => details[worksheetUuid],
    [details]
  );

  const findWorksheetForStaff = useCallback(
    (staffId: string) =>
      worksheets.find(
        (w) =>
          w.staff_id === staffId && w.compensation_period_uuid === selectedPeriodId
      ),
    [worksheets, selectedPeriodId]
  );

  const patchWorksheetState = useCallback(
    (
      worksheetUuid: string,
      updater: (detail: WorksheetDetail) => WorksheetDetail
    ) => {
      setDetails((prev) => {
        const detail = prev[worksheetUuid];
        if (!detail) return prev;
        const nextDetail = updater(detail);
        const nextDetails = { ...prev, [worksheetUuid]: nextDetail };
        setWorksheets((wsPrev) => {
          const nextWs = wsPrev.map((w) =>
            w.uuid === worksheetUuid ? nextDetail.worksheet : w
          );
          const periodId =
            nextDetail.worksheet.compensation_period_uuid ?? selectedPeriodId;
          queueMicrotask(() =>
            syncPeriodFromWorksheets(periodId, nextWs, nextDetails)
          );
          return nextWs;
        });
        return nextDetails;
      });
    },
    [selectedPeriodId, syncPeriodFromWorksheets]
  );

  const updateVisitCommission = useCallback(
    (
      worksheetUuid: string,
      visitId: string,
      patch: Partial<VisitCommissionRow>
    ) => {
      patchWorksheetState(worksheetUuid, (detail) => {
        const visits = detail.visits.map((v) => {
          if (v.visit_id !== visitId) return v;
          const next = { ...v, ...patch };
          if (patch.commission_type === 'percent') {
            next.commission_flat_amount = null;
            if (next.commission_percent === null) next.commission_percent = 0;
          }
          if (patch.commission_type === 'flat') {
            next.commission_percent = null;
            if (next.commission_flat_amount === null) {
              next.commission_flat_amount = 0;
            }
          }
          next.commission_amount = resolveCommissionAmount(next);
          return next;
        });
        const total_commission = visits.reduce(
          (s, v) => s + resolveCommissionAmount(v),
          0
        );
        const worksheet = {
          ...detail.worksheet,
          total_commission,
          visit_count: visits.length,
        };
        return { ...detail, worksheet, visits };
      });
      setDirty(true);
    },
    [patchWorksheetState]
  );

  const applyBulkCommission = useCallback(
    (worksheetUuid: string, type: CommissionType, value: number) => {
      patchWorksheetState(worksheetUuid, (detail) => {
        const visits = detail.visits.map((v) => {
          const next: VisitCommissionRow = {
            ...v,
            commission_type: type,
            commission_percent: type === 'percent' ? value : null,
            commission_flat_amount: type === 'flat' ? value : null,
            commission_amount: 0,
          };
          next.commission_amount = resolveCommissionAmount(next);
          return next;
        });
        const total_commission = visits.reduce(
          (s, v) => s + resolveCommissionAmount(v),
          0
        );
        const worksheet = {
          ...detail.worksheet,
          total_commission,
          visit_count: visits.length,
        };
        return { ...detail, worksheet, visits };
      });
      setDirty(true);
    },
    [patchWorksheetState]
  );

  const setWageOverride = useCallback(
    (worksheetUuid: string, amount: number | null) => {
      patchWorksheetState(worksheetUuid, (detail) => ({
        ...detail,
        wage_override: amount,
      }));
      setDirty(true);
    },
    [patchWorksheetState]
  );

  const generateWorksheetCommissions = useCallback(
    (worksheetUuid: string) => {
      const existing = details[worksheetUuid];
      if (!existing) return;
      if (
        existing.worksheet.status === 'finalized' ||
        existing.worksheet.generate_status === 'running'
      ) {
        return;
      }

      const started = new Date().toISOString();
      patchWorksheetState(worksheetUuid, (detail) => ({
        ...detail,
        worksheet: {
          ...detail.worksheet,
          status: 'pending',
          generate_status: 'running',
          generate_started_at: started,
          generate_finished_at: null,
          generate_error: null,
        },
      }));

      if (generateTimers.current[worksheetUuid]) {
        clearTimeout(generateTimers.current[worksheetUuid]);
      }
      // Conceptual poll: after ~1.2s mock worker finishes → open + succeeded
      generateTimers.current[worksheetUuid] = setTimeout(() => {
        setDetails((prev) => {
          const detail = prev[worksheetUuid];
          if (!detail) return prev;
          const { worksheet, detail: nextDetail } = applyGenerateResult(
            detail.worksheet,
            detail,
            'succeeded'
          );
          const nextDetails = { ...prev, [worksheetUuid]: nextDetail };
          setWorksheets((wsPrev) => {
            const nextWs = wsPrev.map((w) =>
              w.uuid === worksheetUuid ? worksheet : w
            );
            const periodId =
              worksheet.compensation_period_uuid ?? selectedPeriodId;
            queueMicrotask(() =>
              syncPeriodFromWorksheets(periodId, nextWs, nextDetails)
            );
            return nextWs;
          });
          return nextDetails;
        });
        delete generateTimers.current[worksheetUuid];
      }, 1200);
    },
    [details, patchWorksheetState, selectedPeriodId, syncPeriodFromWorksheets]
  );

  const createWorksheet = useCallback(
    (input: {
      staff_id: string;
      label: string;
      period_start: string;
      period_end: string;
      attach_to_selected_period?: boolean;
    }) => {
      const staff = MOCK_STAFF_OPTIONS.find((s) => s.staff_id === input.staff_id);
      const uuid = `ws-${Date.now()}`;
      const wage = wages.find((w) => w.staff_id === input.staff_id);
      const worksheet: Worksheet = {
        uuid,
        staff_id: input.staff_id,
        staff_name: staff?.name ?? input.staff_id,
        roles: staff?.roles ?? [],
        label: input.label,
        period_start: input.period_start,
        period_end: input.period_end,
        status: 'open',
        generate_status: 'idle',
        compensation_period_uuid: input.attach_to_selected_period
          ? selectedPeriodId
          : null,
        total_commission: 0,
        visit_count: 0,
        generate_started_at: null,
        generate_finished_at: null,
        generate_error: null,
        finalized_at: null,
      };
      const detail: WorksheetDetail = {
        worksheet,
        computed_wage: wage?.wage_amount ?? 0,
        wage_formula:
          wage?.wage_cadence === 'weekly'
            ? `Rp ${wage.wage_amount.toLocaleString('id-ID')} × weeks`
            : wage
              ? `Rp ${wage.wage_amount.toLocaleString('id-ID')} × 1 month`
              : 'No wage configured',
        wage_override: null,
        visits: [],
      };
      setWorksheets((prev) => {
        const next = [worksheet, ...prev];
        if (worksheet.compensation_period_uuid) {
          queueMicrotask(() =>
            syncPeriodFromWorksheets(
              worksheet.compensation_period_uuid!,
              next,
              { ...details, [uuid]: detail }
            )
          );
        }
        return next;
      });
      setDetails((prev) => ({ ...prev, [uuid]: detail }));
      return uuid;
    },
    [details, selectedPeriodId, syncPeriodFromWorksheets, wages]
  );

  const finalizeWorksheet = useCallback(
    (worksheetUuid: string) => {
      patchWorksheetState(worksheetUuid, (detail) => ({
        ...detail,
        worksheet: {
          ...detail.worksheet,
          status: 'finalized',
          finalized_at: new Date().toISOString(),
        },
      }));
      setVisitLocked(true);
      setDirty(false);
    },
    [patchWorksheetState]
  );

  const storeDraft = useCallback(() => {
    setPeriods((prev) =>
      prev.map((p) =>
        p.uuid === selectedPeriodId
          ? {
              ...p,
              status: p.status === 'finalized' ? 'finalized' : 'draft',
              drafted_at: new Date().toISOString(),
            }
          : p
      )
    );
    setDirty(false);
  }, [selectedPeriodId]);

  const finalizePeriod = useCallback(() => {
    // Payday finalize = rollup only; visits already locked by worksheet finalize
    setPeriods((prev) =>
      prev.map((p) =>
        p.uuid === selectedPeriodId
          ? {
              ...p,
              status: 'finalized',
              finalized_at: new Date().toISOString(),
              drafted_at: p.drafted_at ?? new Date().toISOString(),
            }
          : p
      )
    );
    setDirty(false);
  }, [selectedPeriodId]);

  const reopenPeriod = useCallback(() => {
    setPeriods((prev) =>
      prev.map((p) =>
        p.uuid === selectedPeriodId
          ? { ...p, status: 'draft', finalized_at: null }
          : p
      )
    );
  }, [selectedPeriodId]);

  const createPeriod = useCallback((label: string, start: string, end: string) => {
    const uuid = `period-${Date.now()}`;
    const period: CompensationPeriod = {
      uuid,
      label,
      period_start: start,
      period_end: end,
      status: 'open',
      total_wage: 0,
      total_commission: 0,
      total_payout: 0,
      staff_count: 0,
      visit_count: 0,
      no_contributor_count: 0,
    };
    setPeriods((prev) => [period, ...prev]);
    setSelectedPeriodId(uuid);
    setDirty(false);
  }, []);

  const updateWage = useCallback((wage: StaffWage) => {
    setWages((prev) => prev.map((w) => (w.id === wage.id ? wage : w)));
  }, []);

  const addWage = useCallback((wage: Omit<StaffWage, 'id'>) => {
    setWages((prev) => [...prev, { ...wage, id: `wage-${Date.now()}` }]);
  }, []);

  const removeWage = useCallback((wageId: string) => {
    setWages((prev) => prev.filter((w) => w.id !== wageId));
  }, []);

  const addContributor = useCallback((staffId: string, name: string) => {
    setContributors((prev) => {
      if (prev.some((c) => c.staff_id === staffId)) return prev;
      return [
        ...prev,
        {
          staff_id: staffId,
          name,
          source: { type: 'manual' },
          added_manually: true,
        },
      ];
    });
  }, []);

  const removeContributor = useCallback((staffId: string) => {
    setContributors((prev) =>
      prev.filter((c) => !(c.staff_id === staffId && c.added_manually))
    );
  }, []);

  const value: CompensationMockContextValue = {
    periods,
    wages,
    worksheets,
    selectedPeriodId,
    setSelectedPeriodId,
    selectedPeriod,
    staffList,
    getWorksheetDetail,
    findWorksheetForStaff,
    updateVisitCommission,
    applyBulkCommission,
    setWageOverride,
    generateWorksheetCommissions,
    createWorksheet,
    finalizeWorksheet,
    storeDraft,
    finalizePeriod,
    reopenPeriod,
    createPeriod,
    updateWage,
    addWage,
    removeWage,
    contributors,
    visitLocked,
    setVisitLocked,
    addContributor,
    removeContributor,
    dirty,
    staffOptions: MOCK_STAFF_OPTIONS,
  };

  return (
    <CompensationMockContext.Provider value={value}>
      {children}
    </CompensationMockContext.Provider>
  );
}

export function useCompensationMock() {
  const ctx = useContext(CompensationMockContext);
  if (!ctx) {
    throw new Error('useCompensationMock must be used within CompensationMockProvider');
  }
  return ctx;
}
