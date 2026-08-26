import { CheckIcon } from '@heroicons/react/20/solid';
import { t } from 'i18next';

interface VisitNotesSaveBarProps {
  isChanged: boolean;
  isSaving?: boolean;
  showSaved?: boolean;
  onSave: () => void;
}

export function VisitNotesSaveBar({
  isChanged,
  isSaving = false,
  showSaved = false,
  onSave,
}: VisitNotesSaveBarProps) {
  if (!isChanged && !isSaving && !showSaved) {
    return null;
  }

  const isSavedState = !isChanged && !isSaving && showSaved;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[100] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-2.5 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
        {isSavedState ? (
          <p
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"
            aria-live="polite"
          >
            <CheckIcon className="h-4 w-4" aria-hidden="true" />
            {t('patient.notesSaved')}
          </p>
        ) : (
          <>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800"
              aria-live="polite"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              {t('patient.unsavedNotes')}
            </span>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
              ) : null}
              {isSaving ? t('common.saving') : t('patient.saveNotes')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
