import React, { useEffect, useState } from 'react'
import { GetPatientVisitDetailedByID, GetPatientVisitDetailRequest, UpsertPatientVisitDetailRequest } from '@requests/patient';
import { GetPatientVisitDetailedResponse, Patient, PatientVisit, PatientVisitDetailComponentProps, UpsertPatientVisitDetailParam, PatientVisitDetail as VisitDetail} from "@models/patient";
import { PatientVisitlDetailNotes } from './PatientVisitlDetailNotes';
import { Id } from 'types';
import { JourneyPoint } from '@models/journey';

export const PatientVisitComponent = ({patientVisitId}:PatientVisitDetailComponentProps) => {
    const [journeyPointTab, setJourneyPointTab] = useState<JourneyPoint[]>([]);
    const [activeTab, setActiveTab] = useState<Id>(0);
    const [visitDetails, setVisitDetails] = useState<VisitDetail[]>([]);
    const [patientVisit, setPatientVisit] = useState<PatientVisit>({} as PatientVisit);
    const [patient, setPatient] = useState<Patient>({} as Patient);

    const updateActiveTab = (id:Id) => {
        setActiveTab(id);
    }

    const GenerateVisitTab = (_patientVisit: GetPatientVisitDetailedResponse) => {
        var setOfJourneyPointID = new Set();
        var journeyPointTab:JourneyPoint[] = []; 
        for (const patientVisitJourneyPoint of _patientVisit.patient_checkpoints) {
            if (!setOfJourneyPointID.has(patientVisitJourneyPoint.journey_point_id)) {
                setOfJourneyPointID.add(patientVisitJourneyPoint.journey_point_id);
                journeyPointTab.push({
                    id: patientVisitJourneyPoint.journey_point_id,
                    name: patientVisitJourneyPoint.name_mst_journey_point || "",
                    board_id: 0,
                    position: 0,
                });
            }
        }

        setJourneyPointTab(journeyPointTab);
    }

    useEffect(() => {
        const fetchData = async () => {
            
            try {
                const patientVisitDetail = await GetPatientVisitDetailedByID(patientVisitId);
                if (patientVisitDetail !== undefined) {
                    setPatientVisit(patientVisitDetail);
                    setVisitDetails(patientVisitDetail.patient_checkpoints)
                    setActiveTab(patientVisitDetail.journey_point_id);
                    GenerateVisitTab(patientVisitDetail);
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
                                <li onClick={()=> {
                                    updateActiveTab(item.id)  
                                }} className='mr-6' key={idx}>
                                    <a className="text-gray-600 pb-2 border-b-2 border-transparent hover:border-blue-600" href="#">
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
                    />

            </div>
        </div>
    )
}