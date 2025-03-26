import React, { useState } from 'react'
import ProseMirrorEditor from './ProseMirrorEditor';
import { EditorComponent } from './EditorComponent';

export const PatientVisitDetail = () => {

    const [activeTab, setActiveTab] = useState<number>(0);

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

    return (
        <div className='flex-1 p-6 h-screen'>
            <div className='bg-white p-6 rounded-lg shadow-md'>
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
                    <div className='w-7/12'>
                        <EditorComponent/>
                    </div>
                    <div className='w-5/12'>

                    </div>
                </div>
            </div>
        </div>
    )
}
