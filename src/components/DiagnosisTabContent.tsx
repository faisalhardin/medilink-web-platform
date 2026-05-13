import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { DiagnosisTable } from './DiagnosisTable';
import {
  DiagnosisFormRow,
  Prognosis,
  PROGNOSIS_OPTIONS,
  emptyDiagnosisRow,
  SaveDiagnosisRow,
} from '@models/diagnosis';
import { Patient } from '@models/patient';
import { getVisitDiagnoses, saveVisitDiagnoses } from '@requests/diagnosis';
import { normalizeDateForInput } from '@utils/common';
import { useTranslation } from 'react-i18next';

export interface DiagnosisTabContentProps {
  visitId: number;
  patient: Patient;
}

export const DiagnosisTabContent = ({ visitId, patient: _patient }: DiagnosisTabContentProps) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<DiagnosisFormRow[]>([emptyDiagnosisRow()]);
  const [prognosis, setPrognosis] = useState<Prognosis | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleRowsChange = (nextRows: DiagnosisFormRow[]) => {
    setRows(nextRows);
    setHasUnsavedChanges(true);
  };

  const handlePrognosisChange = (value: Prognosis | '') => {
    setPrognosis(value);
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    const fetchDiagnoses = async () => {
      setIsLoading(true);
      try {
        const entries = await getVisitDiagnoses(visitId);
        if (entries.length > 0) {
          setRows(
            entries.map((e) => ({
              id: e.id,
              icd10_code: e.icd10_code,
              icd10_display: e.icd10_display,
              type: e.type,
              case: e.case,
              clinical_status: e.clinical_status,
              verification_status: e.verification_status,
              onset_date: normalizeDateForInput(e.onset_date),
              doctor_id: e.doctor_id,
              doctor_name: e.doctor_name,
              selected: false,
            }))
          );
          if (entries[0].prognosis) {
            setPrognosis(entries[0].prognosis);
          }
        }
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error('Error fetching diagnoses:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDiagnoses();
  }, [visitId]);

  const handleSave = async () => {
    const filledRows = rows.filter((r) => r.icd10_code.trim() !== '');
    if (filledRows.length === 0) {
      toast.error(t('diagnosis.errors.minOneDiagnosis'));
      return;
    }

    const diagnosesPayload: SaveDiagnosisRow[] = filledRows.map((r, i) => ({
      id: r.id,
      icd10_code: r.icd10_code,
      type: r.type,
      case: r.case,
      clinical_status: r.clinical_status,
      verification_status: r.verification_status,
      onset_date: normalizeDateForInput(r.onset_date),
      doctor_id: r.doctor_id,
      rank: i + 1,
    }));

    setIsSaving(true);
    try {
      await saveVisitDiagnoses(visitId, { diagnoses: diagnosesPayload, prognosis });
      toast.success(t('diagnosis.messages.saveSuccess'));
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error saving diagnoses:', err);
      toast.error(t('diagnosis.errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm">{t('diagnosis.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Diagnosis table */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">{t('diagnosis.table.title')}</h2>
          <p className="text-xs text-gray-400">
            <span className="text-red-500">*</span> {t('diagnosis.requiredBeforeSave')}
          </p>
        </div>
        <DiagnosisTable rows={rows} onRowsChange={handleRowsChange} />
      </section>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Prognosis + save */}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:w-64">
          <label
            htmlFor="prognosis-select"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            {t('diagnosis.prognosis')}
          </label>
          <select
            id="prognosis-select"
            value={prognosis}
            onChange={(e) => handlePrognosisChange(e.target.value as Prognosis | '')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">{t('diagnosis.selectPrognosis')}</option>
            {PROGNOSIS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {hasUnsavedChanges && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('diagnosis.saving')}
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t('diagnosis.saveDiagnosis')}
              </>
            )}
          </button>
        )}
      </section>
    </div>
  );
};

export default DiagnosisTabContent;
