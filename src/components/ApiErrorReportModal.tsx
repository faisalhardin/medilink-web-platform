import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  ApiErrorReportPayload,
  clearApiErrorReport,
  setApiErrorReportListener,
} from '@utils/apiErrorReport';

const ApiErrorReportModal = () => {
  const { t } = useTranslation();
  const [payload, setPayload] = useState<ApiErrorReportPayload | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setApiErrorReportListener(setPayload);
    return () => setApiErrorReportListener(null);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!payload || !dialog) return;
    const onDialogClose = () => clearApiErrorReport();
    dialog.addEventListener('close', onDialogClose);
    if (!dialog.open) dialog.showModal();
    return () => {
      dialog.removeEventListener('close', onDialogClose);
      if (dialog.open) dialog.close();
    };
  }, [payload]);

  const handleClose = () => {
    clearApiErrorReport();
  };

  if (!payload) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-0 h-auto max-h-none w-auto max-w-none border-0 bg-transparent p-4 backdrop:bg-black/50 open:flex open:items-center open:justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') e.stopPropagation();
      }}
      aria-labelledby="api-error-title"
      aria-describedby="api-error-message"
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label={t('common.close', 'Close')}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-50">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id="api-error-title"
                className="text-lg font-semibold text-gray-900"
              >
                {t('common.error', 'Error')}
              </h2>
              <p
                id="api-error-message"
                className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600"
              >
                {payload.message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              autoFocus
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t('common.close', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default ApiErrorReportModal;
