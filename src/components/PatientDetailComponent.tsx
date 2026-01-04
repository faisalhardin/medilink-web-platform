import React, { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Patient, PatientDetailComponentProps } from '@models/patient';
import { GetPatientByUUID } from '@requests/patient';
import { PatientVisitsComponent } from './PatientComponent';
import PatientDetailInfo from './PatientDetailInfo';

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
                <div className="inline-flex  w-full">
                    <nav className="flex">
                        <div
                            onClick={() => setActiveTab('detail')}
                            className={`px-7 py-2.5 text-sm transition-all relative rounded-t-xl rounded-b-none cursor-pointer ${activeTab === 'detail'
                                    ? 'bg-white text-gray-600 font-semibold border border-b-0'
                                    : 'bg-gray-300 text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            {t('patient.detail', 'Patient Detail')}
                        {
                            activeTab != 'detail' && (
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                            )
                        }
                        </div>
                        <div
                            onClick={() => setActiveTab('visits')}
                            className={`px-7 py-2.5 text-sm transition-all relative  rounded-t-xl rounded-b-none cursor-pointer ${activeTab === 'visits'
                                    ? 'bg-white text-gray-600 font-semibold border border-b-0'
                                    : 'bg-gray-300 text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            {t('patient.visits', 'Patient Visits')}
                            {
                            activeTab != 'visits' && (
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                            )
                        }
                        </div>
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