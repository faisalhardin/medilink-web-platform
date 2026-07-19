/**
 * Models for visit procedures (Tindakan).
 * Each line links to an institution product (treatment) and/or an ICD-9-CM code.
 */

/**
 * SNOMED-CT codes used by e-Puskesmas for procedure category.
 * Keeping the SNOMED code as the wire value so backends can interop
 * with BPJS / national reporting systems without translation.
 */
export type ProcedureCategory =
  | '103693007' // Prosedur Diagnostik
  | '24642003' // Prosedur Psikiatri / Pelayanan Psikiatri
  | '277132007' // Prosedur Terapeutik
  | '387713003' // Prosedur Pembedahan
  | '409063005' // Konseling
  | '409073007' // Edukasi
  | '410606002' // Prosedur Pelayanan Sosial
  | '46947000'; // Terapi Chiropractic

export const PROCEDURE_CATEGORY_OPTIONS: { value: ProcedureCategory; label: string }[] = [
  { value: '103693007', label: 'Prosedur Diagnostik' },
  { value: '24642003', label: 'Prosedur Psikiatri / Pelayanan Psikiatri' },
  { value: '277132007', label: 'Prosedur Terapeutik' },
  { value: '387713003', label: 'Prosedur Pembedahan' },
  { value: '409063005', label: 'Konseling' },
  { value: '409073007', label: 'Edukasi' },
  { value: '410606002', label: 'Prosedur Pelayanan Sosial' },
  { value: '46947000', label: 'Terapi Chiropractic' },
];

export function procedureCategoryLabel(code: string | null | undefined): string {
  if (!code) return '';
  return PROCEDURE_CATEGORY_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

export interface ProcedureProductOption {
  id: number;
  name: string;
}

export interface ICD9CMOption {
  code: string;
  display: string;
  depth: number;
  is_leaf: boolean;
}

export interface NurseOption {
  id: string;
  name: string;
}

export interface DoctorOption {
  id: string;
  name: string;
}

/**
 * One persisted procedure entry as returned by the API.
 */
export interface ProcedureEntry {
  id: number | null;
  visit_id: number;

  /** FK to institution product (treatment). Optional. */
  product_id?: number | null;
  product_name?: string | null;

  /** Doctor in charge. Required. */
  doctor_id: string;
  doctor_name: string;

  /** Optional assistant (nurse / midwife / nutritionist / sanitarian). */
  nurse_id?: string | null;
  nurse_name?: string | null;

  /** ISO-8601 datetime in the patient's TZ. Optional. */
  planned_at?: string | null;

  category?: ProcedureCategory | null;

  /** Free-text duration, e.g. "30 menit" or "1 jam". Optional. */
  duration?: string | null;

  /** ICD-9-CM procedure code. Optional. */
  icd9cm_code?: string | null;
  icd9cm_display?: string | null;

  /** Procedure description / free-text steps. Optional. */
  description?: string | null;

  /** Free-form notes / "Keterangan". Optional. */
  notes?: string | null;

  rank: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Row shape used by the editable form. Numbers can be empty strings to
 * keep controlled inputs ergonomic.
 */
export interface ProcedureFormRow {
  /** Stable client-side identity used by DnD-kit for sortable rows. */
  dndId: string;
  id: number | null;
  product_id: number | null;
  product_name: string;
  doctor_id: string;
  doctor_name: string;
  nurse_id: string;
  nurse_name: string;
  planned_at: string;
  category: ProcedureCategory | '';
  duration: string;
  icd9cm_code: string;
  icd9cm_display: string;
  description: string;
  notes: string;
  selected: boolean;
}

export interface SaveProcedureRow {
  id: number | null;
  product_id: number | null;
  doctor_id: string;
  nurse_id: string | null;
  planned_at: string | null;
  category: ProcedureCategory | null;
  duration: string | null;
  icd9cm_code: string | null;
  description: string | null;
  notes: string | null;
  rank: number;
}

export interface SaveProcedureRequest {
  procedures: SaveProcedureRow[];
}

export interface SaveProcedureResponse {
  message: string;
  data: {
    saved: number;
    deleted: number;
  };
}

export interface ProcedureHistoryEntry {
  visit_id: number;
  visit_date: string;
  product_name?: string | null;
  icd9cm_code?: string | null;
  icd9cm_display?: string | null;
  doctor_name: string;
}

export interface GetProcedureHistoryResponse {
  data: ProcedureHistoryEntry[];
  total: number;
  limit: number;
  offset: number;
}

export function emptyProcedureRow(): ProcedureFormRow {
  return {
    dndId: crypto.randomUUID(),
    id: null,
    product_id: null,
    product_name: '',
    doctor_id: '',
    doctor_name: '',
    nurse_id: '',
    nurse_name: '',
    planned_at: '',
    category: '',
    duration: '',
    icd9cm_code: '',
    icd9cm_display: '',
    description: '',
    notes: '',
    selected: false,
  };
}

/** Row is saveable when doctor and ICD-9-CM code are set. */
export function isProcedureRowSaveable(row: ProcedureFormRow): boolean {
  return row.doctor_id.trim() !== '' && row.icd9cm_code.trim() !== '';
}

/** Returns human-readable missing required fields for a procedure row. */
export function missingProcedureRequiredFields(row: ProcedureFormRow): string[] {
  const missing: string[] = [];
  if (row.doctor_id.trim() === '') missing.push('doctor');
  if (row.icd9cm_code.trim() === '') missing.push('icd9cm');
  return missing;
}
