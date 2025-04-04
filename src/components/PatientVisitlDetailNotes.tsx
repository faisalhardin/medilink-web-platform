import React, { useState } from 'react'
import { EditorComponent } from './EditorComponent';
import { GetPatientVisitDetailRequest, UpsertPatientVisitDetailRequest } from '@requests/patient';
import { PatientVisitDetail as VisitDetail } from "@models/patient";
import { OutputData } from '@editorjs/editorjs';
import { Id } from 'types';

interface patientVisitProps {
    myVisitDetails: VisitDetail[],
    activeTab: Id,
}

export const PatientVisitlDetailNotes = ({ myVisitDetails, activeTab }: patientVisitProps) => {

    const UpsertPatientVisitDetail = (outputData: OutputData) => {
        return UpsertPatientVisitDetailRequest({
            id_mst_journey_point: 66,
            name_mst_journey_point: "Doctor's Room",
            notes: outputData,
            id_trx_patient_visit: 1,
            touchpoint_name: "",
        })
    }
    return (
        <div className='flex w-full'>
            <div className='w-7/12 pl-8 pr-3'>
            <EditorComponent
                        id='editorjs'
                        readOnly={false}
                        // data={content.notes}
                        placeHolder="Jot here..."
                        onSave={UpsertPatientVisitDetail} />
            </div>
            <div className='w-5/12 border-l-2 p-6'>
                {myVisitDetails
                    .filter((detail) => {
                        return detail.journey_point_id === activeTab;
                    })
                    .map((content: VisitDetail) => (
                        <EditorComponent
                            id={`content-${content.id}`}
                            readOnly={true}
                            data={content.notes} key={content.id} />
                    ))}
            </div>
        </div>
    )
}
