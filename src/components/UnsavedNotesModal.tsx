import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'context/ModalContext';

interface UnsavedNotesModalProps {
  onDiscard: () => void;
  onSaveAndContinue: () => Promise<void>;
}

export function UnsavedNotesModal({ onDiscard, onSaveAndContinue }: UnsavedNotesModalProps) {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      await onSaveAndContinue();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="mb-2 text-base font-semibold text-gray-900">
        {t('patient.unsavedNotesTitle')}
      </h2>
      <p className="text-sm leading-relaxed text-gray-600">
        {t('patient.unsavedNotesMessage')}
      </p>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onDiscard}
          disabled={isSaving}
          className="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('patient.discard')}
        </button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={closeModal}
            disabled={isSaving}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('patient.stay')}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSaveAndContinue();
            }}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? t('common.saving') : t('patient.saveAndContinue')}
          </button>
        </div>
      </div>
    </div>
  );
}
