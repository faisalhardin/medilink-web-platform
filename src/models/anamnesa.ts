export type HeightMeasurement = 'berdiri' | 'telentang';
export type Consciousness = 'COMPOS MENTIS' | 'SOMNOLEN' | 'SOPOR' | 'COMA';
export type HeartRhythm = 'REGULAR' | 'IREGULAR';
export type Triage = 'GAWAT DARURAT' | 'DARURAT' | 'TIDAK GAWAT DARURAT' | 'MENINGGAL';
export type PainQuality =
  | 'tekanan'
  | 'terbakar'
  | 'melilit'
  | 'tertusuk'
  | 'diiris'
  | 'mencengkram';
export type PainPattern = 'intermittent' | 'continuous';

export interface NurseOption {
  id: string;
  name: string;
}

export interface IllnessDuration {
  years: number;
  months: number;
  days: number;
}

export interface MedicalHistory {
  current: string;
  past: string;
  family: string;
}

export interface Allergies {
  drug: string;
  food: string;
  air: string;
  other: string;
}

export interface VitalSigns {
  systolic: number | '';
  diastolic: number | '';
  map?: number;
  heart_rate: number | '';
  respiratory_rate: number | '';
  spo2: number | '';
  temperature: number | '';
  height: number | '';
  weight: number | '';
  height_measurement: HeightMeasurement;
  abdominal_circumference: number | '';
  bmi?: number;
  bmi_result?: string;
  consciousness: Consciousness | '';
  heart_rhythm: HeartRhythm | '';
  pregnancy_status: boolean;
  triage: Triage | '';
}

export interface GCS {
  eye: number;
  verbal: number;
  motor: number;
}

export interface PainAssessment {
  has_pain: boolean;
  trigger: string;
  quality: PainQuality | '';
  location: string;
  scale: number;
  pattern: PainPattern;
}

export interface FallRisk {
  gait: boolean;
  support: boolean;
}

export interface Lifestyle {
  smoking: boolean;
  alcohol: boolean;
  low_vegetable_fruit: boolean;
}

export interface AnamnesaData {
  id?: number;
  visit_id?: number;
  doctor_id: string;
  doctor_name: string;
  nurse_id: string;
  nurse_name: string;
  chief_complaint: string;
  secondary_complaint: string;
  illness_duration: IllnessDuration;
  medical_history: MedicalHistory;
  allergies: Allergies;
  vital_signs: VitalSigns;
  gcs: GCS;
  pain_assessment: PainAssessment;
  fall_risk: FallRisk;
  lifestyle: Lifestyle;
}

export interface GetAnamnesaResponse {
  data: AnamnesaData | null;
}

export interface SaveAnamnesaRequest {
  doctor_id: string;
  nurse_id: string;
  chief_complaint: string;
  secondary_complaint: string;
  illness_duration: IllnessDuration;
  medical_history: MedicalHistory;
  allergies: Allergies;
  vital_signs: Omit<VitalSigns, 'map' | 'bmi' | 'bmi_result'>;
  gcs: GCS;
  pain_assessment: PainAssessment;
  fall_risk: FallRisk;
  lifestyle: Lifestyle;
}

export interface SaveAnamnesaResponse {
  message: string;
  data: { id: number };
}

export const defaultAnamnesa = (): AnamnesaData => ({
  doctor_id: '',
  doctor_name: '',
  nurse_id: '',
  nurse_name: '',
  chief_complaint: '',
  secondary_complaint: '',
  illness_duration: { years: 0, months: 0, days: 0 },
  medical_history: { current: '', past: '', family: '' },
  allergies: { drug: '', food: '', air: '', other: '' },
  vital_signs: {
    systolic: '',
    diastolic: '',
    heart_rate: '',
    respiratory_rate: '',
    spo2: '',
    temperature: '',
    height: '',
    weight: '',
    height_measurement: 'berdiri',
    abdominal_circumference: '',
    consciousness: '',
    heart_rhythm: '',
    pregnancy_status: false,
    triage: '',
  },
  gcs: { eye: 4, verbal: 5, motor: 6 },
  pain_assessment: {
    has_pain: false,
    trigger: '',
    quality: '',
    location: '',
    scale: 0,
    pattern: 'intermittent',
  },
  fall_risk: { gait: false, support: false },
  lifestyle: { smoking: false, alcohol: false, low_vegetable_fruit: false },
});

export const CONSCIOUSNESS_OPTIONS: { value: Consciousness; label: string }[] = [
  { value: 'COMPOS MENTIS', label: 'Compos Mentis' },
  { value: 'SOMNOLEN', label: 'Somnolen' },
  { value: 'SOPOR', label: 'Sopor' },
  { value: 'COMA', label: 'Koma' },
];

export const TRIAGE_OPTIONS: { value: Triage; label: string; color: string }[] = [
  { value: 'GAWAT DARURAT', label: 'Gawat Darurat', color: 'text-red-600' },
  { value: 'DARURAT', label: 'Darurat', color: 'text-orange-600' },
  { value: 'TIDAK GAWAT DARURAT', label: 'Tidak Gawat Darurat', color: 'text-green-600' },
  { value: 'MENINGGAL', label: 'Meninggal', color: 'text-gray-600' },
];

export const PAIN_QUALITY_OPTIONS: { value: PainQuality; label: string }[] = [
  { value: 'tekanan', label: 'Tekanan' },
  { value: 'terbakar', label: 'Terbakar' },
  { value: 'melilit', label: 'Melilit' },
  { value: 'tertusuk', label: 'Tertusuk' },
  { value: 'diiris', label: 'Diiris' },
  { value: 'mencengkram', label: 'Mencengkram' },
];

export const GCS_EYE_OPTIONS = [
  { value: 4, label: 'E4 — Spontan' },
  { value: 3, label: 'E3 — Rangsang Suara' },
  { value: 2, label: 'E2 — Rangsang Nyeri' },
  { value: 1, label: 'E1 — Tidak Ada Respons' },
];

export const GCS_VERBAL_OPTIONS = [
  { value: 5, label: 'V5 — Orientasi Baik' },
  { value: 4, label: 'V4 — Bingung' },
  { value: 3, label: 'V3 — Kata-kata Tidak Tepat' },
  { value: 2, label: 'V2 — Suara Tidak Bermakna' },
  { value: 1, label: 'V1 — Tidak Ada Respons' },
];

export const GCS_MOTOR_OPTIONS = [
  { value: 6, label: 'M6 — Mengikuti Perintah' },
  { value: 5, label: 'M5 — Melokalisir Nyeri' },
  { value: 4, label: 'M4 — Menarik' },
  { value: 3, label: 'M3 — Fleksi Abnormal' },
  { value: 2, label: 'M2 — Ekstensi Abnormal' },
  { value: 1, label: 'M1 — Tidak Ada Respons' },
];
