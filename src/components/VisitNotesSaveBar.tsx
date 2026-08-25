import { t } from 'i18next';

interface VisitNotesSaveBarProps {
  isChanged: boolean;
  isSaving?: boolean;
  onSave: () => void;
}

export function VisitNotesSaveBar({ isChanged, isSaving = false, onSave }: VisitNotesSaveBarProps) {
  return (
    <div className="flex items-center justify-end gap-3 border-b border-gray-200 py-2">
      {isChanged ? (
        <span className="hidden text-xs font-medium text-amber-600 sm:inline">
          {t('patient.unsavedNotes')}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onSave}
        disabled={!isChanged || isSaving}
        className={`min-h-11 rounded-lg px-4 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm
          ${isChanged && !isSaving
            ? 'cursor-pointer border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            : 'cursor-not-allowed border border-gray-400 bg-transparent text-gray-400'
          }`}
      >
        {isSaving ? t('common.saving') : t('patient.saveNotes')}
      </button>
    </div>
  );
}
