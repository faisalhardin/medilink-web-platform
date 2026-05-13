import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import FolderTab from './FolderTab';
import { DiagnosisTabContent } from './DiagnosisTabContent';
import { AnamnesaTabContent } from './AnamnesaTabContent';
import { PatientInfoDrawer } from './PatientInfoDrawer';
import { DiagnosisHistoryDrawer } from './DiagnosisHistoryDrawer';
import { useDrawer } from 'hooks/useDrawer';
import { Patient } from '@models/patient';
import { GetPatientVisitDetailedByID } from '@requests/patient';

interface EncounterPageProps {
  visitId: number;
  isModal?: boolean;
}

type TabId = 'diagnosa' | 'anamnesa' | 'resep' | 'tindakan' | 'laboratorium' | 'odontogram';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'anamnesa', label: 'Anamnesa' },
  { id: 'diagnosa', label: 'Diagnosa' },
  // { id: 'resep', label: 'Resep' }, for later development
  // { id: 'tindakan', label: 'Tindakan' },
  // { id: 'laboratorium', label: 'Laboratorium' },
  // { id: 'odontogram', label: 'Odontogram' },
];

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const translateSex = (sex: string | undefined) => {
  if (!sex) return '';
  const map: Record<string, string> = { male: 'Laki-laki', female: 'Perempuan', other: 'Lainnya' };
  return map[sex.toLowerCase()] ?? sex;
};

const PlaceholderTab = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400">
    <svg
      className="mb-4 h-12 w-12 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
    <p className="text-base font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-sm">Fitur ini segera hadir.</p>
  </div>
);

export const EncounterPageComponent = ({ visitId, isModal = false }: EncounterPageProps) => {
  const [patient, setPatient] = useState<Patient>({} as Patient);
  const [visitDate, setVisitDate] = useState<string>('');
  const [isLoadingVisit, setIsLoadingVisit] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('anamnesa');

  const patientInfoDrawer = useDrawer();
  const historyDrawer = useDrawer();

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const data = await GetPatientVisitDetailedByID(visitId);
        setPatient(data.patient);
        setVisitDate(data.create_time ?? '');
      } catch (err) {
        console.error('Error fetching visit:', err);
        toast.error('Gagal memuat data kunjungan');
      } finally {
        setIsLoadingVisit(false);
      }
    };
    fetchVisit();
  }, [visitId]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'diagnosa':
        return <DiagnosisTabContent visitId={visitId} patient={patient} />;
      case 'anamnesa':
        return <AnamnesaTabContent visitId={visitId} patient={patient} />;
      case 'resep':
        return <PlaceholderTab label="Resep" />;
      case 'tindakan':
        return <PlaceholderTab label="Tindakan" />;
      case 'laboratorium':
        return <PlaceholderTab label="Laboratorium" />;
      case 'odontogram':
        return <PlaceholderTab label="Odontogram" />;
    }
  };

  // ── Shared sub-sections ────────────────────────────────────────────────────

  const patientHeader = (
    <div className={isModal ? '' : 'mb-0 rounded-t-lg bg-white px-6 py-4 shadow-sm border border-b-0 border-gray-200'}>
      {isLoadingVisit ? (
        <div className="flex h-12 items-center gap-3">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
        </div>
      ) : (
        <div className="flex items-center justify-between">
          {/* Patient identity */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
              {patient.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h1 className={`font-semibold text-gray-900 leading-tight ${isModal ? 'text-base' : 'text-lg'}`}>
                {patient.name || '—'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {patient.sex && (
                  <span className="text-xs text-gray-500">{translateSex(patient.sex)}</span>
                )}
                {visitDate && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">{formatDate(visitDate)}</span>
                  </>
                )}
                {patient.nik && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400 font-mono">{patient.nik}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {/* <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={historyDrawer.openDrawer}
              disabled={isLoadingVisit}
              className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Riwayat
            </button>
            <button
              type="button"
              onClick={patientInfoDrawer.openDrawer}
              disabled={isLoadingVisit}
              className="flex items-center gap-1.5 rounded-md border border-blue-600 bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Info Pasien
            </button>
          </div> */}
        </div>
      )}
    </div>
  );

  const tabBar = (
    <div className={`flex items-end gap-1 ${isModal ? 'mt-4 border-b border-gray-200 bg-transparent px-0 pt-0' : 'bg-gray-100 px-6 pt-3 border-x border-gray-200'}`}>
      {TABS.map((tab) => (
        <FolderTab
          key={tab.id}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
        />
      ))}
    </div>
  );

  const tabContent = (
    <div className={isModal ? 'pt-5' : 'rounded-b-lg border border-t-0 border-gray-200 bg-white px-6 py-6 shadow-sm'}>
      {isLoadingVisit ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm">Memuat data kunjungan...</span>
          </div>
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );

  const drawers = (
    <>
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
    </>
  );

  // ── Modal layout ────────────────────────────────────────────────────────────
  if (isModal) {
    return (
      <div className="w-full pt-4 pr-8">
        {patientHeader}
        {tabBar}
        {tabContent}
        {drawers}
      </div>
    );
  }

  // ── Full-page layout ────────────────────────────────────────────────────────
  return (
    <div className="flex-1 lg:p-6 min-h-screen bg-gray-100">
      {patientHeader}
      {tabBar}
      {tabContent}
      {drawers}
    </div>
  );
};

export default EncounterPageComponent;
