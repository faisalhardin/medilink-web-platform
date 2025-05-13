import React, { useEffect, useState } from 'react'
import { GetPatientVisitDetailedByID, GetPatientVisitDetailRequest, UpsertPatientVisitDetailRequest } from '@requests/patient';
import { GetPatientVisitDetailedResponse, Patient, PatientVisit, PatientVisitDetail, PatientVisitDetailComponentProps, UpsertPatientVisitDetailParam, PatientVisitDetail as VisitDetail } from "@models/patient";
import { PatientVisitlDetailNotes } from './PatientVisitlDetailNotes';
import { Id } from 'types';
import { JourneyPoint } from '@models/journey';

export interface journeyTab {
    id: number,
    name: string,
    servicePointID?: number
}

export const PatientVisitComponent = ({ patientVisitId }: PatientVisitDetailComponentProps) => {
    const [journeyPointTab, setJourneyPointTab] = useState<journeyTab[]>([]);
    const [activeTab, setActiveTab] = useState<journeyTab>({} as journeyTab);
    const [visitDetails, setVisitDetails] = useState<VisitDetail[]>([]);
    const [patientVisit, setPatientVisit] = useState<PatientVisit>({} as PatientVisit);
    const [patient, setPatient] = useState<Patient>({} as Patient);

    const updateActiveTab = (tab: journeyTab) => {
        setActiveTab(tab);
    }

    const GenerateVisitTab = (_patientVisit: GetPatientVisitDetailedResponse) => {
        var setOfJourneyPointID = new Set([_patientVisit.journey_point_id]);
        var _activeTab: journeyTab = {
            id: _patientVisit.journey_point_id,
            name: _patientVisit.journey_point.name,
            servicePointID: _patientVisit.service_point_id
        }
        updateActiveTab(_activeTab);
        var journeyPointTabs: journeyTab[] = [
            _activeTab,
        ];
        for (const patientVisitJourneyPoint of _patientVisit.patient_checkpoints) {
            if (!setOfJourneyPointID.has(patientVisitJourneyPoint.journey_point_id)) {
                setOfJourneyPointID.add(patientVisitJourneyPoint.journey_point_id);
                journeyPointTabs.push({
                    id: patientVisitJourneyPoint.journey_point_id,
                    name: patientVisitJourneyPoint.name_mst_journey_point
                } as journeyTab);
            }
        }

        setJourneyPointTab(journeyPointTabs);
        
    }

    useEffect(() => {
        console.log("here")
        const fetchData = async () => {

            try {
                const patientVisitDetail = await GetPatientVisitDetailedByID(patientVisitId);
                if (patientVisitDetail !== undefined) {
                    setPatientVisit(patientVisitDetail);
                    GenerateVisitTab(patientVisitDetail);
                    setVisitDetails(patientVisitDetail.patient_checkpoints)
                    setPatient(patientVisitDetail.patient);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setVisitDetails([]);
            }

        }

        fetchData();
    }, [])

    return (
        <div className='flex-1 p-6 h-screen'>
            <div className='bg-white p-6 '>
                <div className='flex items-center mb-6'>
                    <div>
                        <h2 className='text-xl font-semibold'>
                            {patient.name}
                        </h2>
                        <p>
                            {patient.sex}
                        </p>
                    </div>
                </div>
                <div className='border-b border-gray-200 mb-6 pb-2'>
                    <ul className='flex'>
                        {journeyPointTab.map((item, idx) => {
                            return (
                                <li onClick={() => {
                                    updateActiveTab(item)
                                }} className='mr-6' key={idx}>
                                    <a className="text-gray-600 pb-2 border-b-2 border-transparent hover:border-blue-600 cursor-pointer">
                                        {item.name}
                                    </a>
                                </li>

                            )
                        })}
                    </ul>
                </div>

                <PatientVisitlDetailNotes
                    visitDetails={visitDetails}
                    activeTab={activeTab}
                    patientVisit={patientVisit}
                    upsertVisitDetailFunc={upsertVisitDetail}
                />

            </div>
        </div>
    )

    async function upsertVisitDetail(visitDetail: PatientVisitDetail) {
        try {
            // First add to the backend and get the response
            // (which might include an ID or other server-generated fields)
            const resp = await UpsertPatientVisitDetailRequest({
                id: visitDetail.id,
                id_trx_patient_visit: visitDetail.id_patient_visit,
                id_mst_journey_point: visitDetail.journey_point_id,
                notes: visitDetail.notes,
                service_point_id: visitDetail.service_point_id,
            });

            const createdVisitDetail = resp as PatientVisitDetail;
            // Then update the local state with the response from the server
            setVisitDetails((currentVisitDetails) => {
                // If the visit detail has an ID, it might be an update
                if (visitDetail.id) {
                    const existingIndex = currentVisitDetails.findIndex(
                        (detail) => detail.id === visitDetail.id
                    );

                    if (existingIndex >= 0) {
                        // Update existing item
                        return currentVisitDetails.map((detail) =>
                            detail.id === visitDetail.id ? { ...detail, ...createdVisitDetail } : detail
                        );
                    }
                }

                // If no ID or item not found, it's a new item
                return [...currentVisitDetails, createdVisitDetail];
            });

            // Optionally return the created detail if needed elsewhere
            return createdVisitDetail;
        } catch (error) {
            console.error("Failed to create visit detail:", error);
            // Handle error (show notification, etc.)
            throw error; // Re-throw if you want calling code to handle it
        }
    }

}