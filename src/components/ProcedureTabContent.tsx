import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ProcedureTable } from './ProcedureTable';
import {
  ProcedureFormRow,
  ProcedureEntry,
  SaveProcedureRow,
  emptyProcedureRow,
  isProcedureRowSaveable,
  missingProcedureRequiredFields,
} from '@models/procedure';
import { Patient } from '@models/patient';
import { getVisitProcedures, saveVisitProcedures } from '@requests/procedure';
import { formatDateTime } from '@utils/common';

/**
 * ISO/API timestamp → value for <input type="datetime-local"> (YYYY-MM-DDTHH:mm).
 * Treats missing/zero/invalid API times as empty so save never hits Invalid Date.
 */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 1970) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/** datetime-local value → ISO UTC for the API, or null when empty/invalid. */
function plannedAtToISO(local: string): string | null {
  const trimmed = local.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return formatDateTime(date);
}

function entryToFormRow(e: ProcedureEntry): ProcedureFormRow {
  return {
    dndId: crypto.randomUUID(),
    id: e.id,
    product_id: e.product_id ?? null,
    product_name: e.product_name ?? '',
    doctor_id: e.doctor_id,
    doctor_name: e.doctor_name,
    nurse_id: e.nurse_id ?? '',
    nurse_name: e.nurse_name ?? '',
    planned_at: toDatetimeLocal(e.planned_at),
    category: e.category ?? '',
    duration: e.duration ?? '',
    icd9cm_code: e.icd9cm_code ?? '',
    icd9cm_display: e.icd9cm_display ?? '',
    description: e.description ?? '',
    notes: e.notes ?? '',
    selected: false,
  };
}

export interface ProcedureTabContentProps {
  visitId: number;
  patient: Patient;
}

export const ProcedureTabContent = ({ visitId }: ProcedureTabContentProps) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ProcedureFormRow[]>([emptyProcedureRow()]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleRowsChange = (nextRows: ProcedureFormRow[]) => {
    setRows(nextRows);
    setHasUnsavedChanges(true);
  };

  const loadProcedures = useCallback(async () => {
    setIsLoading(true);
    try {
      const entries = await getVisitProcedures(visitId);
      setRows(entries.length > 0 ? entries.map(entryToFormRow) : [emptyProcedureRow()]);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error fetching procedures:', err);
    } finally {
      setIsLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    loadProcedures();
  }, [loadProcedures]);

  const handleSave = async () => {
    const validation = rows
      .map((row, index) => {
        const missing = missingProcedureRequiredFields(row);
        if (missing.length === 0) return null;
        const labels = missing
          .map((field) =>
            field === 'doctor'
              ? t('procedure.table.columns.doctor')
              : t('procedure.table.columns.icd9cm')
          )
          .join(', ');
        return t('procedure.errors.rowMissingRequired', {
          row: index + 1,
          fields: labels,
        });
      })
      .filter((msg): msg is string => msg !== null);

    if (validation.length > 0) {
      validation.forEach((msg) => toast.error(msg));
      return;
    }

    const filledRows = rows.filter(isProcedureRowSaveable);

    if (filledRows.length === 0) {
      toast.error(t('procedure.errors.minOneProcedure'));
      return;
    }

    const payload: SaveProcedureRow[] = filledRows.map((r, i) => ({
      id: r.id,
      product_id: r.product_id,
      doctor_id: r.doctor_id,
      nurse_id: r.nurse_id.trim() === '' ? null : r.nurse_id,
      planned_at: plannedAtToISO(r.planned_at),
      category: r.category === '' ? null : r.category,
      duration: r.duration.trim() === '' ? null : r.duration,
      icd9cm_code: r.icd9cm_code.trim() === '' ? null : r.icd9cm_code,
      description: r.description.trim() === '' ? null : r.description,
      notes: r.notes.trim() === '' ? null : r.notes,
      rank: i + 1,
    }));

    setIsSaving(true);
    try {
      await saveVisitProcedures(visitId, { procedures: payload });
      toast.success(t('procedure.messages.saveSuccess'));
      // Re-fetch to hydrate row IDs returned by the backend so subsequent
      // saves update existing rows rather than inserting duplicates.
      await loadProcedures();
    } catch (err: any) {
      console.error('Error saving procedures:', err);
      // 4xx messages are shown by the global API error modal
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm">{t('procedure.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">{t('procedure.table.title')}</h2>
          <p className="text-xs text-gray-400">
            <span className="text-red-500">*</span> {t('procedure.requiredBeforeSave')}
          </p>
        </div>
        <ProcedureTable rows={rows} onRowsChange={handleRowsChange} />
      </section>

      <div className="border-t border-gray-100" />

      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-end">
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
                {t('procedure.saving')}
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
                {t('procedure.saveProcedure')}
              </>
            )}
          </button>
        )}
      </section>
    </div>
  );
};

export default ProcedureTabContent;
