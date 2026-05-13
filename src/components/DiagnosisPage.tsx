import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DiagnosisTabContent } from './DiagnosisTabContent';
import { PatientInfoDrawer } from './PatientInfoDrawer';
import { DiagnosisHistoryDrawer } from './DiagnosisHistoryDrawer';
import { useDrawer } from 'hooks/useDrawer';
import { Patient } from '@models/patient';
import { GetPatientVisitDetailedByID } from '@requests/patient';

interface DiagnosisPageProps {
  visitId: number;
}

export const DiagnosisPageComponent = ({ visitId }: DiagnosisPageProps) => {
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient>({} as Patient);
  const [isLoadingVisit, setIsLoadingVisit] = useState(true);

  const patientInfoDrawer = useDrawer();
  const historyDrawer = useDrawer();

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const data = await GetPatientVisitDetailedByID(visitId);
        setPatient(data.patient);
      } catch (err) {
        console.error('Error fetching visit:', err);
        toast.error('Gagal memuat data kunjungan');
      } finally {
        setIsLoadingVisit(false);
      }
    };
    fetchVisit();
  }, [visitId]);

  return (
    <div className="flex-1 lg:p-6 min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/patient-visit/${visitId}`)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </button>
            <span className="text-gray-300">|</span>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Buat Diagnosa Baru</h1>
              {!isLoadingVisit && patient.name && (
                <p className="text-sm text-gray-500">{patient.name}</p>
              )}
            </div>
          </div>

          {/* Drawer trigger buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={historyDrawer.openDrawer}
              disabled={isLoadingVisit}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Riwayat Diagnosa
            </button>

            <button
              type="button"
              onClick={patientInfoDrawer.openDrawer}
              disabled={isLoadingVisit}
              className="flex items-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Info Pasien
            </button>
          </div>
        </div>

        {/* Form content */}
        <div className="px-6 py-6">
          {isLoadingVisit ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span className="text-sm">Memuat data kunjungan...</span>
              </div>
            </div>
          ) : (
            <DiagnosisTabContent visitId={visitId} patient={patient} />
          )}
        </div>
      </div>

      {/* Right-side drawers */}
      <PatientInfoDrawer
        isOpen={patientInfoDrawer.isOpen}
        onClose={patientInfoDrawer.closeDrawer}
        patient={patient}
      />

      <DiagnosisHistoryDrawer
        isOpen={historyDrawer.isOpen}
        onClose={historyDrawer.closeDrawer}
        patientUuid={patient.uuid ?? ''}
      />
    </div>
  );
};

export default DiagnosisPageComponent;
