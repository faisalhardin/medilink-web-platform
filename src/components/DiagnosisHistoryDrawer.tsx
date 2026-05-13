import { useState, useEffect, useCallback } from 'react';
import Drawer from './Drawer';
import { DiagnosisHistoryEntry, CLINICAL_STATUS_OPTIONS } from '@models/diagnosis';
import { getDiagnosisHistory } from '@requests/diagnosis';

const PAGE_SIZE = 10;

const clinicalStatusLabel = (status: string) => {
  return CLINICAL_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
};

const typeColor: Record<string, string> = {
  primary: 'bg-blue-100 text-blue-700',
  secondary: 'bg-purple-100 text-purple-700',
  comorbidity: 'bg-orange-100 text-orange-700',
};

const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  recurrence: 'bg-yellow-100 text-yellow-700',
  relapse: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-600',
  remission: 'bg-teal-100 text-teal-700',
  resolved: 'bg-slate-100 text-slate-600',
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

interface DiagnosisHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patientUuid: string;
}

export const DiagnosisHistoryDrawer = ({
  isOpen,
  onClose,
  patientUuid,
}: DiagnosisHistoryDrawerProps) => {
  const [entries, setEntries] = useState<DiagnosisHistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchHistory = useCallback(
    async (pageNum: number) => {
      if (!patientUuid) return;
      setIsLoading(true);
      const result = await getDiagnosisHistory(patientUuid, PAGE_SIZE, pageNum * PAGE_SIZE);
      setEntries(result.data);
      setTotal(result.total);
      setIsLoading(false);
    },
    [patientUuid]
  );

  useEffect(() => {
    if (isOpen && patientUuid) {
      setPage(0);
      fetchHistory(0);
    }
  }, [isOpen, patientUuid, fetchHistory]);

  const goToPrev = () => {
    const next = Math.max(0, page - 1);
    setPage(next);
    fetchHistory(next);
  };

  const goToNext = () => {
    const next = Math.min(totalPages - 1, page + 1);
    setPage(next);
    fetchHistory(next);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Riwayat Diagnosa"
      position="right"
      maxWidth="md"
    >
      <div className="flex flex-col h-full">
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span className="text-sm">Memuat riwayat...</span>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <svg
                className="mb-3 h-10 w-10 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm font-medium">Tidak ada riwayat diagnosa</p>
              <p className="mt-1 text-xs">Pasien ini belum memiliki riwayat diagnosa sebelumnya.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  {/* Date + ICD code */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-0.5">{formatDate(entry.visit_date)}</p>
                      <p className="text-sm font-semibold text-gray-800">
                        <span className="font-mono text-blue-600 mr-2">{entry.icd10_code}</span>
                        {entry.icd10_display}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        typeColor[entry.type] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {entry.type}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {entry.case}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColor[entry.clinical_status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {clinicalStatusLabel(entry.clinical_status)}
                    </span>
                  </div>

                  {/* Doctor */}
                  {entry.doctor_name && (
                    <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {entry.doctor_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination footer */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <p className="text-xs text-gray-500">
              Halaman {page + 1} dari {totalPages} &middot; {total} total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={goToPrev}
                disabled={page === 0 || isLoading}
                className="flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>
              <button
                type="button"
                onClick={goToNext}
                disabled={page >= totalPages - 1 || isLoading}
                className="flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default DiagnosisHistoryDrawer;
