import Drawer from './Drawer';
import { Patient } from '@models/patient';

interface PatientInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="flex flex-col gap-0.5 py-3 border-b border-gray-100 last:border-0">
    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
    <span className="text-sm text-gray-800">{value || '—'}</span>
  </div>
);

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return undefined;
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
  if (!sex) return undefined;
  const map: Record<string, string> = {
    male: 'Laki-laki',
    female: 'Perempuan',
    other: 'Lainnya',
  };
  return map[sex.toLowerCase()] ?? sex;
};

export const PatientInfoDrawer = ({ isOpen, onClose, patient }: PatientInfoDrawerProps) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Info Pasien"
      position="right"
      maxWidth="sm"
    >
      <div className="px-4 py-2 sm:px-6">
        {/* Avatar + name hero */}
        <div className="flex items-center gap-3 py-4 border-b border-gray-200 mb-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-lg">
            {patient.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-base leading-tight">{patient.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{translateSex(patient.sex)}</p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          <InfoRow label="NIK" value={patient.nik} />
          <InfoRow label="Tanggal Lahir" value={formatDate(patient.date_of_birth)} />
          <InfoRow label="Tempat Lahir" value={patient.place_of_birth} />
          <InfoRow label="Golongan Darah" value={patient.blood_type} />
          <InfoRow label="Agama" value={patient.religion} />
          <InfoRow label="Pekerjaan" value={patient.occupation} />
          <InfoRow label="Nomor Telepon" value={patient.phone_number} />
          <InfoRow label="Email" value={patient.email} />
          <InfoRow label="Alamat" value={patient.address} />
        </div>

        {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
          <div className="mt-4 rounded-lg bg-amber-50 p-4 border border-amber-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
              Kontak Darurat
            </p>
            {patient.emergency_contact_name && (
              <p className="text-sm text-gray-800">{patient.emergency_contact_name}</p>
            )}
            {patient.emergency_contact_relationship && (
              <p className="text-xs text-gray-500">{patient.emergency_contact_relationship}</p>
            )}
            {patient.emergency_contact_phone && (
              <p className="text-sm text-gray-800 mt-1">{patient.emergency_contact_phone}</p>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default PatientInfoDrawer;
