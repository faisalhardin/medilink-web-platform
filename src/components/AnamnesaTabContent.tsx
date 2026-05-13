import {
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  useLayoutEffect,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import debounce from 'lodash.debounce';
import toast from 'react-hot-toast';
import {
  AnamnesaData,
  VitalSigns,
  GCS,
  PainAssessment,
  MedicalHistory,
  Allergies,
  IllnessDuration,
  Consciousness,
  HeartRhythm,
  Triage,
  PainQuality,
  PainPattern,
  SaveAnamnesaRequest,
  defaultAnamnesa,
  CONSCIOUSNESS_OPTIONS,
  TRIAGE_OPTIONS,
  PAIN_QUALITY_OPTIONS,
  GCS_EYE_OPTIONS,
  GCS_VERBAL_OPTIONS,
  GCS_MOTOR_OPTIONS,
} from '@models/anamnesa';
import { DoctorOption } from '@models/diagnosis';
import { NurseOption } from '@models/anamnesa';
import { Patient } from '@models/patient';
import { getAnamnesa, saveAnamnesa, searchNurses } from '@requests/anamnesa';
import { searchDoctors } from '@requests/diagnosis';

interface AnamnesaTabContentProps {
  visitId: number;
  patient: Patient;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const calcMAP = (sys: number | '', dia: number | ''): number | null => {
  if (sys === '' || dia === '') return null;
  return Math.round(dia + (sys - dia) / 3);
};

const calcBMI = (
  height: number | '',
  weight: number | ''
): { bmi: number; result: string } | null => {
  if (height === '' || weight === '' || height === 0) return null;
  const h = Number(height) / 100;
  const bmi = Number(weight) / (h * h);
  const rounded = Math.round(bmi * 10) / 10;
  let result = 'Normal';
  if (bmi < 18.5) result = 'Kurus';
  else if (bmi < 25) result = 'Normal';
  else if (bmi < 30) result = 'Gemuk';
  else result = 'Obesitas';
  return { bmi: rounded, result };
};

// ── Section wrapper ───────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const Section = ({ title, children, defaultOpen = true }: SectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left hover:bg-gray-100 focus:outline-none"
      >
        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 py-4 bg-white space-y-4">{children}</div>}
    </div>
  );
};

// ── Field helpers ─────────────────────────────────────────────────────────────

const Label = ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-600 mb-1">
    {children}
  </label>
);

const inputCls =
  'w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

const YesNoRadio = ({
  id,
  value,
  onChange,
  yesLabel = 'Ya',
  noLabel = 'Tidak',
}: {
  id: string;
  value: boolean;
  onChange: (v: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}) => (
  <div className="flex gap-4">
    {[true, false].map((opt) => (
      <label key={String(opt)} className="flex items-center gap-1.5 cursor-pointer text-sm">
        <input
          type="radio"
          name={id}
          checked={value === opt}
          onChange={() => onChange(opt)}
          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500"
        />
        {opt ? yesLabel : noLabel}
      </label>
    ))}
  </div>
);

// ── Autocomplete combobox (reused from DiagnosisTable pattern) ────────────────

interface ComboboxProps {
  displayValue: string;
  placeholder: string;
  onSearch: (q: string) => Promise<{ id: string; label: string }[]>;
  onSelect: (id: string, label: string) => void;
}

const Combobox = ({ displayValue, placeholder, onSearch, onSelect }: ComboboxProps) => {
  const [query, setQuery] = useState(displayValue);
  const [results, setResults] = useState<{ id: string; label: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setQuery(displayValue);
  }, [displayValue]);

  const updateMenuPosition = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || results.length === 0) {
      setMenuPos(null);
      return;
    }
    updateMenuPosition();
  }, [isOpen, results, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen || results.length === 0) return;
    updateMenuPosition();

    const scrollableAncestors: (HTMLElement | Window)[] = [window];
    let p: HTMLElement | null = wrapperRef.current?.parentElement ?? null;
    while (p) {
      const { overflow, overflowY, overflowX } = getComputedStyle(p);
      if (/(auto|scroll|overlay)/.test(`${overflow}${overflowY}${overflowX}`)) {
        scrollableAncestors.push(p);
      }
      p = p.parentElement;
    }

    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('resize', onScrollOrResize);
    scrollableAncestors.forEach((node) =>
      node === window
        ? window.addEventListener('scroll', onScrollOrResize, true)
        : node.addEventListener('scroll', onScrollOrResize, true)
    );

    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      scrollableAncestors.forEach((node) =>
        node === window
          ? window.removeEventListener('scroll', onScrollOrResize, true)
          : node.removeEventListener('scroll', onScrollOrResize, true)
      );
    };
  }, [isOpen, results.length, updateMenuPosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapperRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const debouncedSearch = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) { setResults([]); setIsOpen(false); return; }
      setIsLoading(true);
      const found = await onSearch(q);
      setResults(found);
      setIsOpen(found.length > 0);
      setIsLoading(false);
    }, 300),
    [onSearch]
  );

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); debouncedSearch(e.target.value); }}
        placeholder={placeholder}
        className={inputCls}
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
      {isOpen &&
        results.length > 0 &&
        menuPos &&
        createPortal(
          <ul
            ref={listRef}
            className="fixed z-[300] max-h-48 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
            }}
          >
            {results.map((item) => (
              <li
                key={item.id}
                onMouseDown={() => { setQuery(item.label); setIsOpen(false); onSelect(item.id, item.label); }}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-blue-50"
              >
                {item.label}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const AnamnesaTabContent = ({ visitId, patient: _patient }: AnamnesaTabContentProps) => {
  const [form, setForm] = useState<AnamnesaData>(defaultAnamnesa());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const formDefaults = defaultAnamnesa();
  const vitalSigns = form.vital_signs ?? formDefaults.vital_signs!;
  const gcsForm = form.gcs ?? formDefaults.gcs!;
  const painForm = form.pain_assessment ?? formDefaults.pain_assessment!;
  const durationForm = form.illness_duration ?? formDefaults.illness_duration!;
  const mhForm = form.medical_history ?? formDefaults.medical_history!;
  const allergiesForm = form.allergies ?? formDefaults.allergies!;

  // Derived display values (not submitted)
  const mapValue = calcMAP(vitalSigns.systolic, vitalSigns.diastolic);
  const bmiValue = calcBMI(vitalSigns.height, vitalSigns.weight);
  const gcsTotal = (gcsForm.eye ?? 0) + (gcsForm.verbal ?? 0) + (gcsForm.motor ?? 0);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const data = await getAnamnesa(visitId);
      if (data) setForm(data);
      setIsLoading(false);
    };
    fetch();
  }, [visitId]);

  // Generic patch helpers
  const patch = (partial: Partial<AnamnesaData>) => setForm((f) => ({ ...f, ...partial }));
  const patchVS = (partial: Partial<VitalSigns>) =>
    setForm((f) => {
      const baseVs = f.vital_signs ?? formDefaults.vital_signs!;
      return { ...f, vital_signs: { ...baseVs, ...partial } };
    });
  const patchGCS = (partial: Partial<GCS>) =>
    setForm((f) => {
      const baseG = f.gcs ?? formDefaults.gcs!;
      return { ...f, gcs: { ...baseG, ...partial } };
    });
  const patchPain = (partial: Partial<PainAssessment>) =>
    setForm((f) => {
      const baseP = f.pain_assessment ?? formDefaults.pain_assessment!;
      return { ...f, pain_assessment: { ...baseP, ...partial } };
    });
  const patchHistory = (partial: Partial<MedicalHistory>) =>
    setForm((f) => {
      const baseH = f.medical_history ?? formDefaults.medical_history!;
      return { ...f, medical_history: { ...baseH, ...partial } };
    });
  const patchAllergies = (partial: Partial<Allergies>) =>
    setForm((f) => {
      const baseA = f.allergies ?? formDefaults.allergies!;
      return { ...f, allergies: { ...baseA, ...partial } };
    });
  const patchDuration = (partial: Partial<IllnessDuration>) =>
    setForm((f) => {
      const baseD = f.illness_duration ?? formDefaults.illness_duration!;
      return { ...f, illness_duration: { ...baseD, ...partial } };
    });

  // Search adapters
  const handleDoctorSearch = async (q: string) =>
    (await searchDoctors(q)).map((d: DoctorOption) => ({ id: d.id, label: d.name }));
  const handleNurseSearch = async (q: string) =>
    (await searchNurses(q)).map((n: NurseOption) => ({ id: n.id, label: n.name }));

  const handleSave = async () => {
    if (!form.chief_complaint.trim()) {
      toast.error('Keluhan utama wajib diisi');
      return;
    }
    const hasDoctor = Boolean(form.doctor_id);
    const hasNurse = Boolean(form.nurse_id);
    if (!hasDoctor && !hasNurse) {
      toast.error('Dokter atau perawat/bidan wajib diisi');
      return;
    }
    const numOrNull = (v: number | ''): number | null => (v === '' ? null : v);
    const consciousnessRaw = vitalSigns.consciousness as Consciousness | '';
    const consciousnessOut: Consciousness | null =
      consciousnessRaw === '' ? null : consciousnessRaw;
    const triageRaw = vitalSigns.triage as Triage | '';
    const triageOut: Triage | null = triageRaw === '' ? null : triageRaw;
    const heartRhythmRaw = vitalSigns.heart_rhythm as HeartRhythm | '';
    const heartRhythmOut: HeartRhythm | null =
      heartRhythmRaw === '' ? null : heartRhythmRaw;

    const payload: SaveAnamnesaRequest = {
      chief_complaint: form.chief_complaint,
      doctor_id: form.doctor_id?.trim() ? form.doctor_id : null,
      nurse_id: form.nurse_id?.trim() ? form.nurse_id : null,
      secondary_complaint: form.secondary_complaint ?? null,
      illness_duration: form.illness_duration ?? null,
      medical_history: form.medical_history ?? null,
      allergies: form.allergies ?? null,
      vital_signs: {
        systolic: numOrNull(vitalSigns.systolic),
        diastolic: numOrNull(vitalSigns.diastolic),
        pulse: numOrNull(vitalSigns.heart_rate),
        temperature: numOrNull(vitalSigns.temperature),
        respiratory_rate: numOrNull(vitalSigns.respiratory_rate),
        oxygen_saturation: numOrNull(vitalSigns.spo2),
        weight: numOrNull(vitalSigns.weight),
        height: numOrNull(vitalSigns.height),
        abdominal_circumference: numOrNull(vitalSigns.abdominal_circumference),
        consciousness: consciousnessOut,
        heart_rhythm: heartRhythmOut,
        triage: triageOut,
      },
      gcs: {
        eye: gcsForm.eye ?? null,
        verbal: gcsForm.verbal ?? null,
        motor: gcsForm.motor ?? null,
      },
      pain_assessment: form.pain_assessment ?? null,
    };
    setIsSaving(true);
    try {
      await saveAnamnesa(visitId, payload);
      toast.success('Anamnesa berhasil disimpan');
    } catch (err) {
      console.error('Error saving anamnesa:', err);
      toast.error('Gagal menyimpan anamnesa. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm">Memuat anamnesa...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── 1. Dokter & Perawat ─────────────────────────────────────────── */}
      <Section title="Dokter & Perawat">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Dokter / Tenaga Medis</Label>
            <Combobox
              displayValue={form.doctor_name}
              placeholder="Cari dokter..."
              onSearch={handleDoctorSearch}
              onSelect={(id, name) => patch({ doctor_id: id, doctor_name: name })}
            />
          </div>
          <div>
            <Label>Perawat / Bidan</Label>
            <Combobox
              displayValue={form.nurse_name}
              placeholder="Cari perawat / bidan..."
              onSearch={handleNurseSearch}
              onSelect={(id, name) => patch({ nurse_id: id, nurse_name: name })}
            />
          </div>
        </div>
      </Section>

      {/* ── 2. Keluhan ──────────────────────────────────────────────────── */}
      <Section title="Keluhan">
        <div className="space-y-3">
          <div>
            <Label htmlFor="chief_complaint">Keluhan Utama *</Label>
            <textarea
              id="chief_complaint"
              rows={2}
              value={form.chief_complaint}
              onChange={(e) => patch({ chief_complaint: e.target.value })}
              placeholder="Tulis keluhan utama pasien..."
              className={inputCls}
            />
          </div>
          <div>
            <Label htmlFor="secondary_complaint">Keluhan Tambahan / Anamnesa</Label>
            <textarea
              id="secondary_complaint"
              rows={2}
              value={form.secondary_complaint ?? ''}
              onChange={(e) => patch({ secondary_complaint: e.target.value })}
              placeholder="Tulis keluhan tambahan..."
              className={inputCls}
            />
          </div>
          <div>
            <Label>Lama Sakit</Label>
            <div className="flex items-center gap-2">
              {(
                [
                  { key: 'years' as const, label: 'Thn' },
                  { key: 'months' as const, label: 'Bln' },
                  { key: 'days' as const, label: 'Hr' },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={durationForm[key]}
                    onChange={(e) => patchDuration({ [key]: Number(e.target.value) })}
                    className="w-16 rounded border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── 3. Riwayat Penyakit ─────────────────────────────────────────── */}
      <Section title="Riwayat Penyakit" defaultOpen={false}>
        <div className="space-y-3">
          {(
            [
              { key: 'current' as const, label: 'Riwayat Penyakit Sekarang (RPS)' },
              { key: 'past' as const, label: 'Riwayat Penyakit Dahulu (RPD)' },
              { key: 'family' as const, label: 'Riwayat Penyakit Keluarga (RPK)' },
            ] as const
          ).map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <Label>{label}</Label>
                <button
                  type="button"
                  onClick={() => patchHistory({ [key]: mhForm[key] ? '' : 'Tidak Ada' })}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  {mhForm[key] === 'Tidak Ada' ? 'Hapus' : 'Tidak Ada'}
                </button>
              </div>
              <textarea
                rows={2}
                value={mhForm[key]}
                onChange={(e) => patchHistory({ [key]: e.target.value })}
                placeholder={`Tulis ${label.toLowerCase()}...`}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ── 4. Alergi ───────────────────────────────────────────────────── */}
      <Section title="Alergi" defaultOpen={false}>
        <p className="text-xs text-gray-400 mb-3">Pisahkan beberapa alergi dengan koma</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              { key: 'drug' as const, label: 'Obat', placeholder: 'cth: Amoxicillin, Penicillin' },
              { key: 'food' as const, label: 'Makanan', placeholder: 'cth: Seafood, Kacang' },
              { key: 'air' as const, label: 'Udara / Debu / Polen', placeholder: 'cth: Debu, Polen' },
              { key: 'other' as const, label: 'Lainnya', placeholder: 'cth: Lateks' },
            ] as const
          ).map(({ key, label, placeholder }) => (
            <div key={key}>
              <Label>{label}</Label>
              <input
                type="text"
                value={allergiesForm[key]}
                onChange={(e) => patchAllergies({ [key]: e.target.value })}
                placeholder={placeholder}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ── 5. Tanda-Tanda Vital ────────────────────────────────────────── */}
      <Section title="Tanda-Tanda Vital">
        <div className="space-y-5">
          {/* Blood pressure row */}
          <div>
            <Label>Tekanan Darah (mmHg)</Label>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={vitalSigns.systolic}
                  onChange={(e) => patchVS({ systolic: e.target.value === '' ? '' : Number(e.target.value) })}
                  placeholder="Sistole"
                  className="w-24 rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
                <span className="text-gray-400">/</span>
                <input
                  type="number"
                  min={0}
                  value={vitalSigns.diastolic}
                  onChange={(e) => patchVS({ diastolic: e.target.value === '' ? '' : Number(e.target.value) })}
                  placeholder="Diastole"
                  className="w-24 rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              {mapValue !== null && (
                <div className="flex items-center gap-1 rounded bg-blue-50 px-2.5 py-1.5 text-sm">
                  <span className="text-gray-500 text-xs">MAP:</span>
                  <span className="font-semibold text-blue-700">{mapValue}</span>
                  <span className="text-xs text-gray-400">mmHg</span>
                </div>
              )}
            </div>
          </div>

          {/* Grid of vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              [
                { key: 'heart_rate' as const, label: 'Nadi', unit: 'x/mnt' },
                { key: 'respiratory_rate' as const, label: 'Nafas', unit: 'x/mnt' },
                { key: 'spo2' as const, label: 'Saturasi O₂', unit: '%' },
                { key: 'temperature' as const, label: 'Suhu', unit: '°C' },
              ] as const
            ).map(({ key, label, unit }) => (
              <div key={key}>
                <Label>{label}</Label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={key === 'temperature' ? 0.1 : 1}
                    value={vitalSigns[key]}
                    onChange={(e) =>
                      patchVS({ [key]: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                    className="w-full rounded border border-gray-300 px-2.5 py-1.5 pr-10 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    {unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Anthropometry */}
          <div>
            <Label>Antropometri</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-xs text-gray-500">Tinggi (cm)</span>
                <input
                  type="number"
                  min={0}
                  value={vitalSigns.height}
                  onChange={(e) => patchVS({ height: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-xs text-gray-500">Berat (kg)</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={vitalSigns.weight}
                  onChange={(e) => patchVS({ weight: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-xs text-gray-500">Lingkar Perut (cm)</span>
                <input
                  type="number"
                  min={0}
                  value={vitalSigns.abdominal_circumference}
                  onChange={(e) =>
                    patchVS({ abdominal_circumference: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-xs text-gray-500">Cara Ukur Tinggi</span>
                <select
                  value={vitalSigns.height_measurement}
                  onChange={(e) => patchVS({ height_measurement: e.target.value as 'berdiri' | 'telentang' })}
                  className="mt-1 w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="berdiri">Berdiri</option>
                  <option value="telentang">Telentang</option>
                </select>
              </div>
            </div>
            {bmiValue && (
              <div className="mt-2 flex items-center gap-2 rounded bg-blue-50 px-3 py-2 text-sm w-fit">
                <span className="text-gray-500 text-xs">IMT:</span>
                <span className="font-semibold text-blue-700">{bmiValue.bmi}</span>
                <span className="text-xs text-gray-400 ml-1">kg/m²</span>
                <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-blue-600 border border-blue-200">
                  {bmiValue.result}
                </span>
              </div>
            )}
          </div>

          {/* Status & Triage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="consciousness">Kesadaran</Label>
              <select
                id="consciousness"
                value={vitalSigns.consciousness}
                onChange={(e) => patchVS({ consciousness: e.target.value as Consciousness | '' })}
                className={inputCls}
              >
                <option value="">— Pilih —</option>
                {CONSCIOUSNESS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Detak Jantung</Label>
              <div className="flex gap-4 mt-1">
                {(['regular', 'irregular'] as HeartRhythm[]).map((v) => (
                  <label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="heart_rhythm"
                      checked={vitalSigns.heart_rhythm === v}
                      onChange={() => patchVS({ heart_rhythm: v })}
                      className="h-3.5 w-3.5 text-blue-600"
                    />
                    {v === 'regular' ? 'Regular' : 'Iregular'}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Status Hamil</Label>
              <YesNoRadio
                id="pregnancy_status"
                value={vitalSigns.pregnancy_status}
                onChange={(v) => patchVS({ pregnancy_status: v })}
                yesLabel="Hamil"
                noLabel="Tidak"
              />
            </div>
            <div>
              <Label>Triage</Label>
              <div className="flex flex-wrap gap-3 mt-1">
                {TRIAGE_OPTIONS.map((o) => (
                  <label key={o.value} className={`flex items-center gap-1.5 cursor-pointer text-sm ${o.color}`}>
                    <input
                      type="radio"
                      name="triage"
                      checked={vitalSigns.triage === o.value}
                      onChange={() => patchVS({ triage: o.value as Triage })}
                      className="h-3.5 w-3.5 text-blue-600"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 6. GCS ──────────────────────────────────────────────────────── */}
      <Section title="GCS (Glasgow Coma Scale)" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="gcs_eye">Buka Mata (E)</Label>
            <select
              id="gcs_eye"
              value={gcsForm.eye}
              onChange={(e) => patchGCS({ eye: Number(e.target.value) })}
              className={inputCls}
            >
              {GCS_EYE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="gcs_verbal">Respons Verbal (V)</Label>
            <select
              id="gcs_verbal"
              value={gcsForm.verbal}
              onChange={(e) => patchGCS({ verbal: Number(e.target.value) })}
              className={inputCls}
            >
              {GCS_VERBAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="gcs_motor">Respons Motorik (M)</Label>
            <select
              id="gcs_motor"
              value={gcsForm.motor}
              onChange={(e) => patchGCS({ motor: Number(e.target.value) })}
              className={inputCls}
            >
              {GCS_MOTOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded bg-blue-50 px-3 py-2 w-fit">
          <span className="text-xs text-gray-500">Total GCS:</span>
          <span className="text-lg font-bold text-blue-700">{gcsTotal}</span>
          <span className="text-xs text-gray-400">/ 15</span>
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium border ${gcsTotal >= 13 ? 'bg-green-50 text-green-700 border-green-200'
            : gcsTotal >= 9 ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'bg-red-50 text-red-700 border-red-200'
            }`}>
            {gcsTotal >= 13 ? 'Ringan' : gcsTotal >= 9 ? 'Sedang' : 'Berat'}
          </span>
        </div>
      </Section>

      {/* ── 7. Asesmen Nyeri ────────────────────────────────────────────── */}
      <Section title="Asesmen Nyeri" defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label>Merasakan Nyeri?</Label>
            <YesNoRadio
              id="has_pain"
              value={Boolean(painForm.has_pain)}
              onChange={(v) => patchPain({ has_pain: v })}
            />
          </div>
          {Boolean(painForm.has_pain) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2 border-l-2 border-blue-200">
              <div>
                <Label htmlFor="pain_trigger">Pencetus</Label>
                <input
                  id="pain_trigger"
                  type="text"
                  value={painForm.trigger ?? ''}
                  onChange={(e) => patchPain({ trigger: e.target.value })}
                  placeholder="cth: Aktivitas fisik"
                  className={inputCls}
                />
              </div>
              <div>
                <Label htmlFor="pain_quality">Kualitas Nyeri</Label>
                <select
                  id="pain_quality"
                  value={painForm.quality ?? ''}
                  onChange={(e) => patchPain({ quality: e.target.value as PainQuality | '' })}
                  className={inputCls}
                >
                  <option value="">— Pilih —</option>
                  {PAIN_QUALITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="pain_location">Lokasi Nyeri</Label>
                <input
                  id="pain_location"
                  type="text"
                  value={painForm.location ?? ''}
                  onChange={(e) => patchPain({ location: e.target.value })}
                  placeholder="cth: Kepala bagian depan"
                  className={inputCls}
                />
              </div>
              <div>
                <Label>Pola Nyeri</Label>
                <div className="flex gap-4 mt-1">
                  {(['intermittent', 'continuous'] as PainPattern[]).map((v) => (
                    <label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="pain_pattern"
                        checked={painForm.pattern === v}
                        onChange={() => patchPain({ pattern: v })}
                        className="h-3.5 w-3.5 text-blue-600"
                      />
                      {v === 'intermittent' ? 'Hilang Timbul' : 'Terus-menerus'}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="pain_scale">
                  Skala Nyeri:{' '}
                  <span className="font-semibold tabular-nums text-blue-600">{painForm.scale ?? 0}</span>
                  <span className="font-normal text-gray-500"> / 10</span>
                </Label>
                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 shadow-sm">
                  <input
                    id="pain_scale"
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={painForm.scale ?? 0}
                    onChange={(e) => patchPain({ scale: Number(e.target.value) })}
                    className="pain-scale-range w-full cursor-pointer"
                    style={
                      {
                        '--pain-scale-fill': `${((painForm.scale ?? 0) / 10) * 100}%`,
                      } as CSSProperties & { '--pain-scale-fill': string }
                    }
                  />
                  <div className="mt-2.5 flex justify-between text-xs text-gray-500">
                    <span>0 — Tidak nyeri</span>
                    <span>5 — Sedang</span>
                    <span>10 — Sangat nyeri</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── Save ─────────────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Menyimpan...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Simpan Anamnesa
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AnamnesaTabContent;
