import React, { useEffect, useState } from 'react'
import { GetPatientVisitDetailRequest, UpsertPatientVisitDetailRequest } from '@requests/patient';
import { PatientVisitDetail as VisitDetail} from "@models/patient";
import { OutputData } from '@editorjs/editorjs';
import { PatientVisitlDetailNotes } from './PatientVisitlDetailNotes';
import { Id } from 'types';

export const PatientVisitDetail = () => {

    const [activeTab, setActiveTab] = useState<Id>(0);
    const [visitDetails, setVisitDetails] = useState<VisitDetail[]>([]);

    const UpsertPatientVisitDetail = (outputData:OutputData) => {
        return UpsertPatientVisitDetailRequest({
            id_mst_journey_point: 66,
            name_mst_journey_point: "Doctor's Room",
            notes: outputData,
            id_trx_patient_visit: 1,
            touchpoint_name: "",
          })
    }

    const updateActiveTab = (id:Id) => {
        console.log("update ", id);
        setActiveTab(id);
    }

    const patientVisit = {
        id: 48,
        name: "faisal",
        sex: "male"
    }

    const patientVisitDetails = [
        {
            id: 1,
            name_mst_journey_point: "Doctor's Room",
            journey_point_id: 66,
            id_patient_visit: 1,
            notes: "keluhan sakit kepala"
        },
        {
            id: 2,
            name_mst_journey_point: "Nurse station",
            journey_point_id: 65,
            id_patient_visit: 1,
            notes: "keluhan sakit kepala"
        },
    ]

    useEffect(() => {
        const fetchData = async () => {
            
            try {
                const response = await GetPatientVisitDetailRequest(1);
                if (response.data === undefined) {
                    setVisitDetails([]);
                    return
                }
                const userOwnedVisitDetails = response.data;

                setVisitDetails(userOwnedVisitDetails);
                setActiveTab(patientVisitDetails[0].journey_point_id);
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
                            {patientVisit.name}
                        </h2>
                        <p>
                            {patientVisit.sex}
                        </p>
                    </div>
                </div>
                <div className='border-b border-gray-200 mb-6 pb-2'>
                    <ul className='flex'>
                        {patientVisitDetails.map((item, idx) => {
                            return (
                                <li onClick={()=> {
                                    updateActiveTab(item.journey_point_id)  
                                }} className='mr-6' key={idx}>
                                    <a className="text-gray-600 pb-2 border-b-2 border-transparent hover:border-blue-600" href="#">
                                        {item.name_mst_journey_point}
                                    </a>
                                </li>

                            )
                        })}
                    </ul>
                </div>

                    <PatientVisitlDetailNotes 
                    myVisitDetails={visitDetails}
                    activeTab={activeTab}
                    />

            </div>
        </div>
    )
}