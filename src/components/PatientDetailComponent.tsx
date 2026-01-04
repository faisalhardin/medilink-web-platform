import React, { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Patient, PatientDetailComponentProps } from '@models/patient';
import { GetPatientByUUID } from '@requests/patient';
import { PatientVisitsComponent } from './PatientComponent';
import PatientDetailInfo from './PatientDetailInfo';
import FolderTab from './FolderTab';

const PatientDetailComponent = ({ patient_uuid }: PatientDetailComponentProps) => {
    const { t } = useTranslation();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [activeTab, setActiveTab] = useState<'detail' | 'visits'>('detail');

    React.useEffect(() => {
        if (!patient_uuid) return;

        const fetchPatient = async () => {
            const _patient = await GetPatientByUUID(patient_uuid as string);
            setPatient(_patient);
        }
        fetchPatient();
    }, [patient_uuid]);

    return (
        <div className="p-6 w-full">
            <div className="w-full">
                {/* Tabs - Folder Style */}
                <div className="inline-flex w-full">
                    <nav className="flex">
                        <FolderTab
                            label={t('patient.detail', 'Patient Detail')}
                            isActive={activeTab === 'detail'}
                            onClick={() => setActiveTab('detail')}
                        />
                        <FolderTab
                            label={t('patient.visits', 'Patient Visits')}
                            isActive={activeTab === 'visits'}
                            onClick={() => setActiveTab('visits')}
                        />
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'detail' && (
                    <PatientDetailInfo 
                        patient={patient} 
                        onUpdate={(updatedPatient) => {
                            setPatient(updatedPatient);
                        }}
                    />
                )}

                {activeTab === 'visits' && patient_uuid && (
                    <PatientVisitsComponent
                        patient_uuid={patient_uuid}
                        patient={patient || undefined}
                        limit={10}
                        offset={0}
                    />
                )}
            </div>

        </div>
    )
}

export default PatientDetailComponent