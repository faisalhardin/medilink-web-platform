import { useEffect, useState } from 'react';
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

  useEffect(() => {
    setApiErrorReportListener(setPayload);
    return () => setApiErrorReportListener(null);
  }, []);

  useEffect(() => {
    if (!payload) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [payload]);

  const handleClose = () => {
    clearApiErrorReport();
  };

  if (!payload) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="api-error-title"
        aria-describedby="api-error-message"
        className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl"
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
    </div>
  );
};

export default ApiErrorReportModal;
