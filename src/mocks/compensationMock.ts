// @ts-nocheck
import type {
  CompensationPeriod,
  ContributionSource,
  StaffPeriodRow,
  StaffWage,
  VisitContributor,
  VisitCommissionRow,
  Worksheet,
  WorksheetDetail,
  WorksheetGenerateStatus,
} from '@models/compensation';

export const MOCK_PERIODS: CompensationPeriod[] = [
  {
    uuid: 'period-aug-2026',
    label: 'Aug 2026',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    status: 'open',
    total_wage: 0,
    total_commission: 0,
    total_payout: 0,
    staff_count: 5,
    visit_count: 42,
    no_contributor_count: 3,
    drafted_at: null,
    finalized_at: null,
  },
  {
    uuid: 'period-jul-2026',
    label: 'Jul 2026',
    period_start: '2026-07-01',
    period_end: '2026-07-31',
    status: 'finalized',
    total_wage: 18_500_000,
    total_commission: 4_250_000,
    total_payout: 22_750_000,
    staff_count: 5,
    visit_count: 38,
    no_contributor_count: 0,
    drafted_at: '2026-08-01T10:00:00Z',
    finalized_at: '2026-08-02T14:30:00Z',
  },
  {
    uuid: 'period-week-32',
    label: 'Week 32 — 4–10 Aug',
    period_start: '2026-08-04',
    period_end: '2026-08-10',
    status: 'draft',
    total_wage: 2_000_000,
    total_commission: 850_000,
    total_payout: 2_850_000,
    staff_count: 3,
    visit_count: 12,
    no_contributor_count: 1,
    drafted_at: '2026-08-11T09:15:00Z',
    finalized_at: null,
  },
];

export const MOCK_WAGES: StaffWage[] = [
  {
    id: 'wage-1',
    staff_id: 'staff-dr-sari',
    staff_name: 'Dr. Sari Wulandari',
    roles: ['doctor'],
    wage_amount: 8_000_000,
    wage_cadence: 'monthly',
    effective_from: '2026-01-01',
    effective_to: null,
    is_active: true,
  },
  {
    id: 'wage-2',
    staff_id: 'staff-dr-budi',
    staff_name: 'Dr. Budi Santoso',
    roles: ['doctor'],
    wage_amount: 7_500_000,
    wage_cadence: 'monthly',
    effective_from: '2026-03-01',
    effective_to: null,
    is_active: true,
  },
  {
    id: 'wage-3',
    staff_id: 'staff-ns-dewi',
    staff_name: 'Ns. Dewi Lestari',
    roles: ['nurse'],
    wage_amount: 4_500_000,
    wage_cadence: 'monthly',
    effective_from: '2026-01-01',
    effective_to: null,
    is_active: true,
  },
  {
    id: 'wage-4',
    staff_id: 'staff-clerk-ani',
    staff_name: 'Ani Pratama',
    roles: ['clerk'],
    wage_amount: 500_000,
    wage_cadence: 'weekly',
    effective_from: '2026-06-01',
    effective_to: null,
    is_active: true,
  },
  {
    id: 'wage-5',
    staff_id: 'staff-ns-rina',
    staff_name: 'Ns. Rina Kusuma',
    roles: ['nurse'],
    wage_amount: 4_000_000,
    wage_cadence: 'monthly',
    effective_from: '2026-02-01',
    effective_to: null,
    is_active: true,
  },
];

/** Structured sources per TRD Option A — attribution only. */
const src = {
  procedure: (
    label: string,
    opts?: { procedure_id?: number; product_id?: number }
  ): ContributionSource => ({
    type: 'procedure',
    label,
    label_source: 'product_name',
    procedure_id: opts?.procedure_id,
    product_id: opts?.product_id,
  }),
  diagnosis: (label?: string): ContributionSource => ({
    type: 'diagnosis',
    ...(label ? { label, label_source: 'icd10_display' } : {}),
  }),
  anamnesa: (): ContributionSource => ({ type: 'anamnesa' }),
  journey: (label?: string): ContributionSource => ({
    type: 'journey',
    ...(label ? { label, label_source: 'touchpoint' } : {}),
  }),
  manual: (): ContributionSource => ({ type: 'manual' }),
};

let commissionSeq = 1000;

const makeVisit = (
  worksheetUuid: string,
  partial: Partial<VisitCommissionRow> &
    Pick<
      VisitCommissionRow,
      'visit_id' | 'patient_name' | 'visit_date' | 'revenue_base' | 'sources'
    >
): VisitCommissionRow => {
  const type = partial.commission_type ?? 'percent';
  const percent =
    type === 'percent'
      ? partial.commission_percent !== undefined
        ? partial.commission_percent
        : 10
      : null;
  const flat =
    type === 'flat'
      ? partial.commission_flat_amount !== undefined
        ? partial.commission_flat_amount
        : 50_000
      : null;
  const amount =
    partial.commission_amount !== undefined
      ? partial.commission_amount
      : type === 'percent'
        ? Math.round((partial.revenue_base * (percent ?? 0)) / 100)
        : flat ?? 0;

  const included_manually =
    partial.included_manually ??
    partial.sources.some((s) => s.type === 'manual');

  return {
    id: partial.id ?? `comm-${++commissionSeq}`,
    worksheet_uuid: worksheetUuid,
    visit_id: partial.visit_id,
    patient_name: partial.patient_name,
    visit_date: partial.visit_date,
    sources: partial.sources,
    revenue_base: partial.revenue_base,
    commission_type: type,
    commission_percent: percent,
    commission_flat_amount: flat,
    commission_amount: amount,
    has_contributors: partial.has_contributors ?? true,
    included_manually,
    visit_percent_total: partial.visit_percent_total,
    visit_commission_total_idr: partial.visit_commission_total_idr,
    note: partial.note,
  };
};

/** Seed visits used when mock generate finishes (per staff). */
export const MOCK_GENERATE_SEEDS: Record<string, Omit<VisitCommissionRow, 'id' | 'worksheet_uuid'>[]> = {
  'staff-dr-sari': [
    {
      visit_id: 'v-001',
      patient_name: 'Ahmad Fauzi',
      visit_date: '2026-08-05',
      sources: [
        src.procedure('Scaling', { procedure_id: 101, product_id: 45 }),
        src.diagnosis('K02.1'),
      ],
      revenue_base: 1_200_000,
      commission_type: 'percent',
      commission_percent: 15,
      commission_flat_amount: null,
      commission_amount: 180_000,
      has_contributors: true,
      visit_percent_total: 25,
      visit_commission_total_idr: 300_000,
    },
    {
      visit_id: 'v-002',
      patient_name: 'Siti Nurhaliza',
      visit_date: '2026-08-06',
      sources: [
        src.procedure('Filling', { procedure_id: 102, product_id: 12 }),
        src.anamnesa(),
      ],
      revenue_base: 850_000,
      commission_type: 'percent',
      commission_percent: 10,
      commission_flat_amount: null,
      commission_amount: 85_000,
      has_contributors: true,
      visit_percent_total: 110,
      visit_commission_total_idr: 935_000,
    },
    {
      visit_id: 'v-003',
      patient_name: 'Budi Hartono',
      visit_date: '2026-08-08',
      sources: [src.procedure('Extraction', { procedure_id: 103, product_id: 8 })],
      revenue_base: 500_000,
      commission_type: 'flat',
      commission_percent: null,
      commission_flat_amount: 75_000,
      commission_amount: 75_000,
      has_contributors: true,
      visit_percent_total: 0,
      visit_commission_total_idr: 75_000,
    },
    {
      visit_id: 'v-004',
      patient_name: 'Maya Putri',
      visit_date: '2026-08-10',
      sources: [src.diagnosis(), src.anamnesa()],
      revenue_base: 0,
      commission_type: 'flat',
      commission_percent: null,
      commission_flat_amount: 25_000,
      commission_amount: 25_000,
      has_contributors: true,
    },
    {
      visit_id: 'v-005',
      patient_name: 'Rizky Maulana',
      visit_date: '2026-08-12',
      sources: [
        src.procedure('Root Canal', { procedure_id: 105, product_id: 22 }),
      ],
      revenue_base: 3_500_000,
      commission_type: 'percent',
      commission_percent: null,
      commission_flat_amount: null,
      commission_amount: 0,
      has_contributors: true,
    },
    {
      visit_id: 'v-006',
      patient_name: 'Lina Marlina',
      visit_date: '2026-08-14',
      sources: [],
      revenue_base: 650_000,
      commission_type: 'percent',
      commission_percent: 0,
      commission_flat_amount: null,
      commission_amount: 0,
      has_contributors: false,
    },
  ],
  'staff-clerk-ani': [
    {
      visit_id: 'v-010',
      patient_name: 'Ahmad Fauzi',
      visit_date: '2026-08-05',
      sources: [src.manual()],
      revenue_base: 1_200_000,
      commission_type: 'flat',
      commission_percent: null,
      commission_flat_amount: 25_000,
      commission_amount: 25_000,
      has_contributors: true,
      included_manually: true,
    },
    {
      visit_id: 'v-011',
      patient_name: 'Dewi Anggraini',
      visit_date: '2026-08-07',
      sources: [src.journey('Reception')],
      revenue_base: 400_000,
      commission_type: 'percent',
      commission_percent: null,
      commission_flat_amount: null,
      commission_amount: 0,
      has_contributors: true,
    },
    {
      visit_id: 'v-012',
      patient_name: 'Hendra Wijaya',
      visit_date: '2026-08-09',
      sources: [src.manual()],
      revenue_base: 900_000,
      commission_type: 'flat',
      commission_percent: null,
      commission_flat_amount: null,
      commission_amount: 0,
      has_contributors: true,
      included_manually: true,
    },
  ],
  'staff-ns-dewi': [
    {
      visit_id: 'v-020',
      patient_name: 'Ahmad Fauzi',
      visit_date: '2026-08-05',
      sources: [
        src.procedure('Scaling', { procedure_id: 101, product_id: 45 }),
        src.anamnesa(),
      ],
      revenue_base: 1_200_000,
      commission_type: 'percent',
      commission_percent: 5,
      commission_flat_amount: null,
      commission_amount: 60_000,
      has_contributors: true,
    },
    {
      visit_id: 'v-021',
      patient_name: 'Siti Nurhaliza',
      visit_date: '2026-08-06',
      sources: [src.anamnesa()],
      revenue_base: 850_000,
      commission_type: 'percent',
      commission_percent: 5,
      commission_flat_amount: null,
      commission_amount: 42_500,
      has_contributors: true,
    },
  ],
  'staff-dr-budi': [
    {
      visit_id: 'v-030',
      patient_name: 'Tono Sukamto',
      visit_date: '2026-08-03',
      sources: [src.procedure('Crown', { procedure_id: 130, product_id: 30 })],
      revenue_base: 4_000_000,
      commission_type: 'percent',
      commission_percent: 12,
      commission_flat_amount: null,
      commission_amount: 480_000,
      has_contributors: true,
    },
    {
      visit_id: 'v-031',
      patient_name: 'Fitri Handayani',
      visit_date: '2026-08-11',
      sources: [
        src.diagnosis('K05.1'),
        src.procedure('Cleaning', { procedure_id: 131, product_id: 3 }),
      ],
      revenue_base: 750_000,
      commission_type: 'percent',
      commission_percent: 10,
      commission_flat_amount: null,
      commission_amount: 75_000,
      has_contributors: true,
    },
  ],
  'staff-ns-rina': [],
};

function seedVisits(worksheetUuid: string, staffId: string): VisitCommissionRow[] {
  const seeds = MOCK_GENERATE_SEEDS[staffId] ?? [];
  return seeds.map((s) => makeVisit(worksheetUuid, s));
}

function worksheetTotals(visits: VisitCommissionRow[]) {
  return {
    total_commission: visits.reduce((s, v) => s + resolveCommissionAmount(v), 0),
    visit_count: visits.length,
  };
}

/** Primary commission worksheets — linked to payday via compensation_period_uuid. */
export const MOCK_WORKSHEETS: Worksheet[] = [
  {
    uuid: 'ws-aug-sari',
    staff_id: 'staff-dr-sari',
    staff_name: 'Dr. Sari Wulandari',
    roles: ['doctor'],
    label: 'Aug 2026 — Dr. Sari',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    status: 'open',
    generate_status: 'succeeded',
    compensation_period_uuid: 'period-aug-2026',
    total_commission: 1_240_000,
    visit_count: 6,
    generate_started_at: '2026-08-15T08:00:00Z',
    generate_finished_at: '2026-08-15T08:00:02Z',
    generate_error: null,
    finalized_at: null,
  },
  {
    uuid: 'ws-aug-budi',
    staff_id: 'staff-dr-budi',
    staff_name: 'Dr. Budi Santoso',
    roles: ['doctor'],
    label: 'Aug 2026 — Dr. Budi',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    status: 'open',
    generate_status: 'succeeded',
    compensation_period_uuid: 'period-aug-2026',
    total_commission: 980_000,
    visit_count: 2,
    generate_started_at: '2026-08-15T08:01:00Z',
    generate_finished_at: '2026-08-15T08:01:01Z',
    generate_error: null,
    finalized_at: null,
  },
  {
    uuid: 'ws-aug-dewi',
    staff_id: 'staff-ns-dewi',
    staff_name: 'Ns. Dewi Lestari',
    roles: ['nurse'],
    label: 'Aug 2026 — Ns. Dewi',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    status: 'open',
    generate_status: 'succeeded',
    compensation_period_uuid: 'period-aug-2026',
    total_commission: 440_000,
    visit_count: 2,
    generate_started_at: '2026-08-15T08:02:00Z',
    generate_finished_at: '2026-08-15T08:02:01Z',
    generate_error: null,
    finalized_at: null,
  },
  {
    uuid: 'ws-aug-ani',
    staff_id: 'staff-clerk-ani',
    staff_name: 'Ani Pratama',
    roles: ['clerk'],
    label: 'Aug 2026 — Ani',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    status: 'open',
    generate_status: 'idle',
    compensation_period_uuid: 'period-aug-2026',
    total_commission: 0,
    visit_count: 0,
    generate_started_at: null,
    generate_finished_at: null,
    generate_error: null,
    finalized_at: null,
  },
  {
    uuid: 'ws-aug-rina',
    staff_id: 'staff-ns-rina',
    staff_name: 'Ns. Rina Kusuma',
    roles: ['nurse'],
    label: 'Aug 2026 — Ns. Rina',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    status: 'open',
    generate_status: 'succeeded',
    compensation_period_uuid: 'period-aug-2026',
    total_commission: 0,
    visit_count: 0,
    generate_started_at: '2026-08-15T08:03:00Z',
    generate_finished_at: '2026-08-15T08:03:00Z',
    generate_error: null,
    finalized_at: null,
  },
  {
    uuid: 'ws-jul-sari',
    staff_id: 'staff-dr-sari',
    staff_name: 'Dr. Sari Wulandari',
    roles: ['doctor'],
    label: 'Jul 2026 — Dr. Sari',
    period_start: '2026-07-01',
    period_end: '2026-07-31',
    status: 'finalized',
    generate_status: 'succeeded',
    compensation_period_uuid: 'period-jul-2026',
    total_commission: 1_800_000,
    visit_count: 16,
    generate_started_at: '2026-07-28T10:00:00Z',
    generate_finished_at: '2026-07-28T10:00:03Z',
    generate_error: null,
    finalized_at: '2026-08-01T12:00:00Z',
  },
];

export const MOCK_WORKSHEET_DETAILS: Record<string, WorksheetDetail> = {
  'ws-aug-sari': {
    worksheet: MOCK_WORKSHEETS[0],
    computed_wage: 8_000_000,
    wage_formula: 'Rp 8.000.000 × 1 month',
    wage_override: null,
    visits: seedVisits('ws-aug-sari', 'staff-dr-sari'),
  },
  'ws-aug-budi': {
    worksheet: MOCK_WORKSHEETS[1],
    computed_wage: 7_500_000,
    wage_formula: 'Rp 7.500.000 × 1 month',
    wage_override: null,
    visits: seedVisits('ws-aug-budi', 'staff-dr-budi'),
  },
  'ws-aug-dewi': {
    worksheet: MOCK_WORKSHEETS[2],
    computed_wage: 4_500_000,
    wage_formula: 'Rp 4.500.000 × 1 month',
    wage_override: null,
    visits: seedVisits('ws-aug-dewi', 'staff-ns-dewi'),
  },
  'ws-aug-ani': {
    worksheet: MOCK_WORKSHEETS[3],
    computed_wage: 2_500_000,
    wage_formula: 'Rp 500.000 × 5 weeks',
    wage_override: null,
    // Not generated yet — empty until generate mock runs
    visits: [],
  },
  'ws-aug-rina': {
    worksheet: MOCK_WORKSHEETS[4],
    computed_wage: 4_000_000,
    wage_formula: 'Rp 4.000.000 × 1 month',
    wage_override: null,
    visits: [],
  },
  'ws-jul-sari': {
    worksheet: MOCK_WORKSHEETS[5],
    computed_wage: 8_000_000,
    wage_formula: 'Rp 8.000.000 × 1 month',
    wage_override: null,
    visits: seedVisits('ws-jul-sari', 'staff-dr-sari').slice(0, 3),
  },
};

export const MOCK_VISIT_CONTRIBUTORS: VisitContributor[] = [
  {
    staff_id: 'staff-dr-sari',
    name: 'Dr. Sari Wulandari',
    source: src.procedure('Scaling', { procedure_id: 101, product_id: 45 }),
    added_manually: false,
  },
  {
    staff_id: 'staff-ns-dewi',
    name: 'Ns. Dewi Lestari',
    source: src.anamnesa(),
    added_manually: false,
  },
  {
    staff_id: 'staff-clerk-ani',
    name: 'Ani Pratama',
    source: src.manual(),
    added_manually: true,
  },
];

export const MOCK_STAFF_OPTIONS = MOCK_WAGES.map((w) => ({
  staff_id: w.staff_id,
  name: w.staff_name,
  roles: w.roles,
}));

export function resolveCommissionAmount(row: VisitCommissionRow): number {
  if (row.commission_type === 'percent') {
    return Math.round((row.revenue_base * (row.commission_percent ?? 0)) / 100);
  }
  return row.commission_flat_amount ?? 0;
}

export function assignmentStatusFromVisits(
  visits: VisitCommissionRow[]
): StaffPeriodRow['assignment_status'] {
  if (visits.length === 0) return 'complete';
  const assigned = visits.filter((v) => {
    if (v.commission_type === 'percent') return v.commission_percent !== null;
    return v.commission_flat_amount !== null;
  }).length;
  if (assigned === 0) return 'unassigned';
  if (assigned < visits.length) return 'partial';
  return 'complete';
}

/** Build payday staff list from worksheets linked to a period + wage stubs. */
export function staffListFromWorksheets(
  periodId: string,
  worksheets: Worksheet[],
  details: Record<string, WorksheetDetail>,
  wages: StaffWage[]
): StaffPeriodRow[] {
  const linked = worksheets.filter((w) => w.compensation_period_uuid === periodId);
  const byStaff = new Map<string, Worksheet>();
  for (const w of linked) {
    const prev = byStaff.get(w.staff_id);
    if (!prev || w.period_start > prev.period_start) byStaff.set(w.staff_id, w);
  }

  const rows: StaffPeriodRow[] = [];
  for (const w of byStaff.values()) {
    const detail = details[w.uuid];
    const visits = detail?.visits ?? [];
    const commission =
      detail != null
        ? visits.reduce((s, v) => s + resolveCommissionAmount(v), 0)
        : w.total_commission;
    const wage = detail?.wage_override ?? detail?.computed_wage ?? 0;
    rows.push({
      staff_id: w.staff_id,
      name: w.staff_name,
      roles: w.roles,
      visit_count: visits.length || w.visit_count,
      wage,
      wage_formula: detail?.wage_formula ?? '',
      is_wage_override: detail?.wage_override != null,
      commission_subtotal: commission,
      pay_total: wage + commission,
      worksheet_uuid: w.uuid,
      worksheet_status: w.status,
      generate_status: w.generate_status,
      assignment_status: assignmentStatusFromVisits(visits),
    });
  }

  // Wage-only staff with no worksheet for this period (e.g. Rina when worksheet empty still listed)
  for (const wage of wages) {
    if (byStaff.has(wage.staff_id)) continue;
    // Only add wage-only for open demo period if we want — skip to keep focused
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export function recomputePeriodTotals(
  period: CompensationPeriod,
  staff: StaffPeriodRow[]
): CompensationPeriod {
  const total_wage = staff.reduce((s, r) => s + r.wage, 0);
  const total_commission = staff.reduce((s, r) => s + r.commission_subtotal, 0);
  return {
    ...period,
    total_wage,
    total_commission,
    total_payout: total_wage + total_commission,
    staff_count: staff.length,
    visit_count: staff.reduce((s, r) => s + r.visit_count, 0),
  };
}

export function applyGenerateResult(
  worksheet: Worksheet,
  detail: WorksheetDetail,
  generateStatus: WorksheetGenerateStatus = 'succeeded'
): { worksheet: Worksheet; detail: WorksheetDetail } {
  const visits =
    detail.visits.length > 0
      ? detail.visits
      : seedVisits(worksheet.uuid, worksheet.staff_id);
  const totals = worksheetTotals(visits);
  const nextWs: Worksheet = {
    ...worksheet,
    status: 'open',
    generate_status: generateStatus,
    generate_finished_at: new Date().toISOString(),
    generate_error: generateStatus === 'failed' ? 'Mock generate failed' : null,
    ...totals,
  };
  return {
    worksheet: nextWs,
    detail: {
      ...detail,
      worksheet: nextWs,
      visits,
    },
  };
}

/** @deprecated Use staffListFromWorksheets */
export function recomputeStaffListTotals(
  staff: StaffPeriodRow[],
  details: Record<string, WorksheetDetail>,
  _periodId: string
): StaffPeriodRow[] {
  return staff.map((row) => {
    const key = row.worksheet_uuid;
    if (!key) return row;
    const detail = details[key];
    if (!detail) return row;
    const commission = detail.visits.reduce(
      (sum, v) => sum + resolveCommissionAmount(v),
      0
    );
    const wage = detail.wage_override ?? detail.computed_wage;
    return {
      ...row,
      visit_count: detail.visits.length,
      wage,
      is_wage_override: detail.wage_override !== null,
      commission_subtotal: commission,
      pay_total: wage + commission,
      assignment_status: assignmentStatusFromVisits(detail.visits),
      worksheet_status: detail.worksheet.status,
      generate_status: detail.worksheet.generate_status,
    };
  });
}
