import React, { useEffect, useState } from 'react'
import ProseMirrorEditor from './ProseMirrorEditor';
import { EditorComponent } from './EditorComponent';
import { GetPatientVisitDetailRequest, UpsertPatientVisitDetailRequest } from '@requests/patient';
import { PatientVisitDetail as VisitDetail} from "@models/patient";
import { OutputData } from '@editorjs/editorjs';
import { getStorageJourneyPoints, getStorageUserJourneyPointsIDAsSet } from '@utils/storage';

export const PatientVisitDetail = () => {

    const [activeTab, setActiveTab] = useState<number>(0);
    const [visitDetails, setVisitDetails] = useState<VisitDetail[]>([]);
    const [myVisitDetails, setMyVisitDetails] = useState<VisitDetail[]>([]);

    const UpsertPatientVisitDetail = (outputData:OutputData) => {
        return UpsertPatientVisitDetailRequest({
            id_mst_journey_point: 66,
            name_mst_journey_point: "Doctor's Room",
            notes: outputData,
            id_trx_patient_visit: 1,
            touchpoint_name: "",
          })
    }

    const handleTabClick = (index: number) => {
        setActiveTab(index);
    };

    const patientVisit = {
        id: 48,
        name: "faisal",
        sex: "male"
    }

    const patientVisitDetails = [
        {
            id: 1,
            name_mst_journey_point: "Registration",
            journey_point_id: 0,
            id_patient_visit: 1,
            notes: "keluhan sakit kepala"
        },
        {
            id: 2,
            name_mst_journey_point: "Nurse station",
            journey_point_id: 64,
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
                    setMyVisitDetails([]);
                    return
                }
                const userJourneyPoint = getStorageUserJourneyPointsIDAsSet();
                const userOwnedVisitDetails = response.data.filter((visitDetail) => (
                    userJourneyPoint.has(visitDetail.journey_point_id
                    )))
                const otherOwnedVisitDetails = response.data.filter((visitDetail) => (
                    !userJourneyPoint.has(visitDetail.journey_point_id)
                ))
                setMyVisitDetails(userOwnedVisitDetails);
                setVisitDetails(otherOwnedVisitDetails);
            } catch (error) {
                console.error("Error fetching data:", error);
                setVisitDetails([]);
                setMyVisitDetails([]);
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
                                <li className='mr-6' key={idx}>
                                    <a className="text-gray-600 pb-2 border-b-2 border-transparent hover:border-blue-600" href="#">
                                        {item.name_mst_journey_point}
                                    </a>
                                </li>

                            )
                        })}
                    </ul>
                </div>
                <div className='flex'>
                    <div className='w-7/12 pl-8 pr-3'>
                        <EditorComponent 
                        id='editorjs' 
                        readOnly={false}
                        data={myVisitDetails}
                        placeHolder="Jot here..."
                        onSave={UpsertPatientVisitDetail}/>
                    </div>
                    <div className='w-5/12 border-l-2 p-6'>
                        {visitDetails.map((content:VisitDetail) => (
                            <EditorComponent 
                            id={`content-${content.id}`} 
                            readOnly={true} 
                            data={content.notes} key={content.id}/>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}