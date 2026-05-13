export type HeightMeasurement = 'berdiri' | 'telentang';
export type Consciousness = 'compos mentis' | 'somnolen' | 'sopor' | 'coma';
export type HeartRhythm = 'regular' | 'irregular';
export type Triage = 'gawat darurat' | 'darurat' | 'tidak gawat darurat' | 'meninggal';
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
  eye?: number;
  verbal?: number;
  motor?: number;
}

export interface PainAssessment {
  has_pain?: boolean | null;
  trigger?: string | null;
  quality?: PainQuality | '' | null;
  location?: string | null;
  scale?: number | null;
  pattern?: PainPattern | null;
}

export interface AnamnesaData {
  /** API may return UUID string */
  id?: string | null;
  visit_id: number;
  doctor_id: string;
  doctor_name: string;
  nurse_id: string;
  nurse_name: string;
  chief_complaint: string;
  secondary_complaint?: string | null;
  illness_duration?: IllnessDuration | null;
  medical_history?: MedicalHistory | null;
  allergies?: Allergies | null;
  vital_signs?: VitalSigns | null;
  gcs?: GCS | null;
  pain_assessment?: PainAssessment | null;
}

export interface GetAnamnesaResponse {
  data: AnamnesaData | null;
}

export interface VitalSignsInput {
  systolic?: number | null;
  diastolic?: number | null;
  pulse?: number | null;
  temperature?: number | null;
  respiratory_rate?: number | null;
  oxygen_saturation?: number | null;
  weight?: number | null;
  height?: number | null;
  abdominal_circumference?: number | null;
  consciousness?: Consciousness | null;
  heart_rhythm?: HeartRhythm | null;
  triage?: Triage | null;
}

export interface GCSInput {
  eye?: number | null;
  verbal?: number | null;
  motor?: number | null;
}

/** POST body: only `chief_complaint` is required; other keys may be omitted or explicitly `null`. */
export interface SaveAnamnesaRequest {
  doctor_id?: string | null;
  nurse_id?: string | null;
  chief_complaint: string;
  secondary_complaint?: string | null;
  history_of_illness?: string | null;
  illness_duration?: IllnessDuration | null;
  medical_history?: MedicalHistory | null;
  allergies?: Allergies | null;
  vital_signs?: VitalSignsInput | null;
  gcs?: GCSInput | null;
  pain_assessment?: PainAssessment | null;
}

export interface SaveAnamnesaResponse {
  message: string;
  data: { id: number };
}

export const defaultAnamnesa = (): AnamnesaData => ({
  visit_id: 0,
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
    quality: undefined,
    location: '',
    scale: 0,
    pattern: 'intermittent',
  },
});

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

const numOrEmpty = (v: unknown): number | '' => {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
};

const optFiniteNumber = (v: unknown): number | undefined => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Merges sparse GET /anamnesa JSON into full `AnamnesaData` so the form never reads
 * `undefined` for nested groups (e.g. `medical_history`) when the backend omits keys.
 */
export function normalizeAnamnesaApiResponse(raw: unknown): AnamnesaData {
  if (!isRecord(raw)) return defaultAnamnesa();

  const base = defaultAnamnesa();
  const vsIn = isRecord(raw.vital_signs) ? raw.vital_signs : {};
  const gcsIn = isRecord(raw.gcs) ? raw.gcs : {};
  const painIn = isRecord(raw.pain_assessment) ? raw.pain_assessment : {};
  const mhIn = isRecord(raw.medical_history) ? raw.medical_history : null;
  const alIn = isRecord(raw.allergies) ? raw.allergies : null;
  const durIn = isRecord(raw.illness_duration) ? raw.illness_duration : null;

  const heightM = vsIn.height_measurement;
  const height_measurement: HeightMeasurement =
    heightM === 'telentang' ? 'telentang' : heightM === 'berdiri' ? 'berdiri' : base.vital_signs!.height_measurement;

  const consciousnessRaw = vsIn.consciousness;
  const consciousness: Consciousness | '' =
    consciousnessRaw === 'compos mentis' ||
      consciousnessRaw === 'somnolen' ||
      consciousnessRaw === 'sopor' ||
      consciousnessRaw === 'coma'
      ? consciousnessRaw
      : '';

  const rhythmRaw = vsIn.heart_rhythm;
  const heart_rhythm: HeartRhythm | '' = (() => {
    if (rhythmRaw === 'regular' || rhythmRaw === 'irregular') return rhythmRaw;
    if (typeof rhythmRaw === 'string') {
      const u = rhythmRaw.toUpperCase();
      if (u === 'REGULAR') return 'regular';
      if (u === 'IREGULAR' || u === 'IRREGULAR') return 'irregular';
    }
    return '';
  })();

  const triageRaw = vsIn.triage;
  const triage: Triage | '' =
    triageRaw === 'gawat darurat' ||
      triageRaw === 'darurat' ||
      triageRaw === 'tidak gawat darurat' ||
      triageRaw === 'meninggal'
      ? triageRaw
      : '';

  const qualityRaw = painIn.quality;
  const painQuality: PainQuality | '' | undefined =
    qualityRaw === null || qualityRaw === undefined || qualityRaw === ''
      ? undefined
      : qualityRaw === 'tekanan' ||
        qualityRaw === 'terbakar' ||
        qualityRaw === 'melilit' ||
        qualityRaw === 'tertusuk' ||
        qualityRaw === 'diiris' ||
        qualityRaw === 'mencengkram'
        ? qualityRaw
        : undefined;

  const patternRaw = painIn.pattern;
  const painPattern: PainPattern =
    patternRaw === 'continuous' || patternRaw === 'intermittent'
      ? patternRaw
      : base.pain_assessment!.pattern ?? 'intermittent';

  const scaleRaw = painIn.scale;
  const scale =
    typeof scaleRaw === 'number' && Number.isFinite(scaleRaw)
      ? scaleRaw
      : typeof scaleRaw === 'string' && scaleRaw !== ''
        ? Number(scaleRaw) || 0
        : base.pain_assessment!.scale ?? 0;

  return {
    ...base,
    id: raw.id !== undefined && raw.id !== null ? (raw.id as string | undefined) : base.id,
    visit_id: typeof raw.visit_id === 'number' ? raw.visit_id : base.visit_id,
    doctor_id: str(raw.doctor_id),
    doctor_name: str(raw.doctor_name),
    nurse_id: str(raw.nurse_id),
    nurse_name: str(raw.nurse_name),
    chief_complaint: str(raw.chief_complaint),
    secondary_complaint: str(raw.secondary_complaint ?? raw.history_of_illness),
    illness_duration: durIn
      ? {
        years: Number(durIn.years) || 0,
        months: Number(durIn.months) || 0,
        days: Number(durIn.days) || 0,
      }
      : base.illness_duration,
    medical_history: mhIn
      ? {
        current: str(mhIn.current),
        past: str(mhIn.past),
        family: str(mhIn.family),
      }
      : base.medical_history,
    allergies: alIn
      ? {
        drug: str(alIn.drug),
        food: str(alIn.food),
        air: str(alIn.air),
        other: str(alIn.other),
      }
      : base.allergies,
    vital_signs: {
      ...base.vital_signs!,
      systolic: numOrEmpty(vsIn.systolic),
      diastolic: numOrEmpty(vsIn.diastolic),
      heart_rate: numOrEmpty(vsIn.heart_rate ?? vsIn.pulse),
      respiratory_rate: numOrEmpty(vsIn.respiratory_rate),
      spo2: numOrEmpty(vsIn.spo2 ?? vsIn.oxygen_saturation),
      temperature: numOrEmpty(vsIn.temperature),
      height: numOrEmpty(vsIn.height),
      weight: numOrEmpty(vsIn.weight),
      map: optFiniteNumber(vsIn.map),
      bmi: optFiniteNumber(vsIn.bmi),
      bmi_result: vsIn.bmi_result == null || vsIn.bmi_result === '' ? undefined : str(vsIn.bmi_result),
      height_measurement,
      abdominal_circumference: numOrEmpty(vsIn.abdominal_circumference),
      consciousness,
      heart_rhythm,
      pregnancy_status:
        typeof vsIn.pregnancy_status === 'boolean' ? vsIn.pregnancy_status : base.vital_signs!.pregnancy_status,
      triage,
    },
    gcs: {
      eye: typeof gcsIn.eye === 'number' ? gcsIn.eye : base.gcs!.eye,
      verbal: typeof gcsIn.verbal === 'number' ? gcsIn.verbal : base.gcs!.verbal,
      motor: typeof gcsIn.motor === 'number' ? gcsIn.motor : base.gcs!.motor,
    },
    pain_assessment: {
      has_pain: typeof painIn.has_pain === 'boolean' ? painIn.has_pain : base.pain_assessment!.has_pain ?? false,
      trigger: str(painIn.trigger),
      quality: painQuality,
      location: str(painIn.location),
      scale,
      pattern: painPattern,
    },
  };
}

export const CONSCIOUSNESS_OPTIONS: { value: Consciousness; label: string }[] = [
  { value: 'compos mentis', label: 'Compos Mentis' },
  { value: 'somnolen', label: 'Somnolen' },
  { value: 'sopor', label: 'Sopor' },
  { value: 'coma', label: 'Koma' },
];

export const TRIAGE_OPTIONS: { value: Triage; label: string; color: string }[] = [
  { value: 'gawat darurat', label: 'Gawat Darurat', color: 'text-red-600' },
  { value: 'darurat', label: 'Darurat', color: 'text-orange-600' },
  { value: 'tidak gawat darurat', label: 'Tidak Gawat Darurat', color: 'text-green-600' },
  { value: 'meninggal', label: 'Meninggal', color: 'text-gray-600' },
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
