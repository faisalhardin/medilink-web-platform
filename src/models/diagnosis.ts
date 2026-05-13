export type DiagnosisType = 'primary' | 'secondary' | 'comorbidity';
export type DiagnosisCase = 'new' | 'chronic' | 'acute_on_chronic';
export type ClinicalStatus =
  | 'active'
  | 'recurrence'
  | 'relapse'
  | 'inactive'
  | 'remission'
  | 'resolved';
export type VerificationStatus =
  | 'confirmed'
  | 'unconfirmed'
  | 'provisional'
  | 'differential'
  | 'refuted'
  | 'entered_in_error';
export type Prognosis =
  | 'sanam'
  | 'bonam'
  | 'malam'
  | 'dubia_ad_sanam'
  | 'dubia_ad_malam';

export interface ICD10Option {
  code: string;
  display: string;
}

export interface DoctorOption {
  id: string;
  name: string;
}

export interface DiagnosisEntry {
  id: number | null;
  visit_id: number;
  icd10_code: string;
  icd10_display: string;
  type: DiagnosisType;
  case: DiagnosisCase;
  clinical_status: ClinicalStatus;
  verification_status: VerificationStatus;
  onset_date: string;
  prognosis?: Prognosis;
  doctor_id: string;
  doctor_name: string;
  rank: number;
  /** Present on visit-detail API payloads */
  updated_at?: string;
  created_at?: string;
  note?: string | null;
}

export interface SaveDiagnosisRow {
  id: number | null;
  icd10_code: string;
  type: DiagnosisType;
  case: DiagnosisCase;
  clinical_status: ClinicalStatus;
  verification_status: VerificationStatus;
  onset_date: string;
  doctor_id: string;
  rank: number;
}

export interface SaveDiagnosisRequest {
  diagnoses: SaveDiagnosisRow[];
  prognosis: Prognosis | '';
}

export interface SaveDiagnosisResponse {
  message: string;
  data: {
    saved: number;
    deleted: number;
  };
}

export interface DiagnosisHistoryEntry {
  visit_id: number;
  visit_date: string;
  icd10_code: string;
  icd10_display: string;
  type: DiagnosisType;
  case: DiagnosisCase;
  clinical_status: ClinicalStatus;
  doctor_name: string;
}

export interface GetDiagnosisHistoryResponse {
  data: DiagnosisHistoryEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface DiagnosisFormRow {
  id: number | null;
  icd10_code: string;
  icd10_display: string;
  type: DiagnosisType;
  case: DiagnosisCase;
  clinical_status: ClinicalStatus;
  verification_status: VerificationStatus;
  onset_date: string;
  doctor_id: string;
  doctor_name: string;
  selected: boolean;
}

export const DIAGNOSIS_TYPE_OPTIONS: { value: DiagnosisType; label: string }[] = [
  { value: 'primary', label: 'Primer' },
  { value: 'secondary', label: 'Sekunder' },
  { value: 'comorbidity', label: 'Komorbiditas' },
];

export const DIAGNOSIS_CASE_OPTIONS: { value: DiagnosisCase; label: string }[] = [
  { value: 'new', label: 'Baru' },
  { value: 'chronic', label: 'Kronis' },
  { value: 'acute_on_chronic', label: 'Akut pada Kronis' },
];

export const CLINICAL_STATUS_OPTIONS: { value: ClinicalStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'recurrence', label: 'Kambuh' },
  { value: 'relapse', label: 'Relaps' },
  { value: 'inactive', label: 'Tidak Aktif' },
  { value: 'remission', label: 'Remisi' },
  { value: 'resolved', label: 'Sembuh' },
];

export const VERIFICATION_STATUS_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: 'confirmed', label: 'Terkonfirmasi' },
  { value: 'unconfirmed', label: 'Belum Terkonfirmasi' },
  { value: 'provisional', label: 'Sementara' },
  { value: 'differential', label: 'Diferensial' },
  { value: 'refuted', label: 'Dibantah' },
  { value: 'entered_in_error', label: 'Salah Input' },
];

export const PROGNOSIS_OPTIONS: { value: Prognosis; label: string }[] = [
  { value: 'sanam', label: 'Sanam' },
  { value: 'bonam', label: 'Bonam' },
  { value: 'malam', label: 'Malam' },
  { value: 'dubia_ad_sanam', label: 'Dubia ad Sanam' },
  { value: 'dubia_ad_malam', label: 'Dubia ad Malam' },
];

export function emptyDiagnosisRow(): DiagnosisFormRow {
  return {
    id: null,
    icd10_code: '',
    icd10_display: '',
    type: 'primary',
    case: 'new',
    clinical_status: 'active',
    verification_status: 'confirmed',
    onset_date: new Date().toISOString().split('T')[0],
    doctor_id: '',
    doctor_name: '',
    selected: false,
  };
}
