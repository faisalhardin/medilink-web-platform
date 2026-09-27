export type CompensationPeriodStatus = 'open' | 'draft' | 'finalized';
export type WorksheetStatus = 'pending' | 'open' | 'finalized';
export type WorksheetGenerateStatus = 'idle' | 'running' | 'succeeded' | 'failed';
export type WageCadence = 'monthly' | 'weekly';
export type CommissionType = 'percent' | 'flat';
export type AssignmentStatus = 'unassigned' | 'partial' | 'complete';

export type ContributionSourceType =
  | 'procedure'
  | 'diagnosis'
  | 'anamnesa'
  | 'journey'
  | 'manual';

export const COMPENSATION_PERIOD_STATUSES: CompensationPeriodStatus[] = [
  'open',
  'draft',
  'finalized',
];

export const WAGE_CADENCES: WageCadence[] = ['monthly', 'weekly'];

export interface ContributionSource {
  type: ContributionSourceType;
  procedure_id?: number | null;
  diagnosis_id?: number | null;
  product_id?: number | null;
  label?: string | null;
  label_source?: string | null;
}

export interface CompensationPeriod {
  uuid: string;
  label: string;
  period_start: string;
  period_end: string;
  status: CompensationPeriodStatus;
  total_wage: number;
  total_commission: number;
  total_payout: number;
  staff_count: number;
  visit_count: number;
  no_contributor_count: number;
  drafted_at?: string | null;
  finalized_at?: string | null;
}

export interface ListCompensationPeriodsResponse {
  periods: CompensationPeriod[];
  total: number;
}

export interface Worksheet {
  uuid: string;
  staff_id: string;
  label: string;
  period_start: string;
  period_end: string;
  status: WorksheetStatus;
  generate_status: WorksheetGenerateStatus;
  compensation_period_uuid: string | null;
  total_commission: number;
  visit_count: number;
  generate_started_at?: string | null;
  generate_finished_at?: string | null;
  generate_error?: string | null;
  finalized_at?: string | null;
}

export interface ListWorksheetsResponse {
  worksheets: Worksheet[];
  next_cursor: string | null;
}

export interface StaffPeriodRow {
  staff_id: string;
  name: string;
  roles: string[];
  visit_count: number;
  wage: number;
  commission_subtotal: number;
  pay_total: number;
  assignment_status: AssignmentStatus;
}

export interface ListPeriodStaffResponse {
  staff: StaffPeriodRow[];
  total: number;
}

export interface PeriodStaffHeader {
  staff_info: {
    staff_id: string;
    name: string;
    roles: string[];
  };
  computed_wage: number;
  wage_override: number | null;
}

export interface VisitCommissionRow {
  id: number;
  worksheet_uuid: string;
  visit_id: number;
  patient_name: string;
  visit_date: string;
  sources: ContributionSource[] | null;
  revenue_base: number;
  commission_type: CommissionType | null;
  commission_percent: number | null;
  commission_flat_amount: number | null;
  commission_amount: number | null;
  has_contributors: boolean;
  approved_at?: string | null;
}

export interface ListVisitCommissionsResponse {
  commissions: VisitCommissionRow[];
  total: number;
}

export interface PatchCommissionResponse {
  updated_count: number;
  commission_subtotal: number;
}

export interface PatchCommissionRequest {
  commission_type: CommissionType;
  commission_percent?: number | null;
  commission_flat_amount?: number | null;
  note?: string | null;
}

export interface FinalizeWorksheetResponse {
  worksheet: Worksheet;
  locked_visit_count: number;
}

export interface FinalizePeriodResponse {
  period: CompensationPeriod;
  locked_visit_count: number;
}

export interface VisitContributor {
  staff_id: string;
  name: string;
  source: ContributionSource;
  added_manually: boolean;
}

export interface ListVisitContributorsResponse {
  contributors: VisitContributor[];
  compensation_locked_at: string | null;
}
