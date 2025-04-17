import { useEffect, useState } from 'react'
import { EditorComponent } from './EditorComponent';
import { UpsertPatientVisitDetailRequest } from '@requests/patient';
import { PatientVisitDetail as VisitDetail } from "@models/patient";
import { OutputData } from '@editorjs/editorjs';
import { Id } from 'types';
import { getStorageUserServicePointsIDAsSet } from '@utils/storage';

interface patientVisitProps {
    visitDetails: VisitDetail[],
    activeTab: Id,
}

export const PatientVisitlDetailNotes = ({ visitDetails, activeTab }: patientVisitProps) => {
    const [myVisitDetails, setMyVisitDetails] = useState<VisitDetail[]>([]);
    const [otherVisitDetails, setOtherVisitDetails] = useState<VisitDetail[]>([]);

    useEffect(() => {
        const userServicePoints = getStorageUserServicePointsIDAsSet() || new Set();
        
        // Filter details that belong to the user's service points
        const userDetails = visitDetails.filter(detail => 
            (!detail.service_point_id && userServicePoints.size === 0) || 
            (detail.service_point_id && userServicePoints.has(detail.service_point_id))
        );
        
        // Filter details that don't belong to the user's service points
        const otherDetails = visitDetails.filter(detail => 
            !userDetails.includes(detail)
        );
        
        setMyVisitDetails(userDetails);
        // const x = otherDetails[0].id_mst_service_point ?? 1;
        console.log("userDetails", userDetails, userServicePoints, );
        setOtherVisitDetails(otherDetails);
        console.log("otherDetails", otherDetails);
    }, [visitDetails]);

    const UpsertPatientVisitDetail = (outputData: OutputData) => {
        return UpsertPatientVisitDetailRequest({
            id_mst_journey_point: 66,
            name_mst_journey_point: "Doctor's Room",
            notes: outputData,
            id_trx_patient_visit: 1,
            touchpoint_name: "",
        })
    }

    const userServiePoints = getStorageUserServicePointsIDAsSet() || null;

    return (
        <div className='flex w-full'>
            <div className='w-7/12 pl-8 pr-3'>
                {myVisitDetails.length > 0 && visitDetails.filter((detail: VisitDetail) => {
                    return detail.journey_point_id === activeTab && ( !detail.service_point_id && userServiePoints.size === 0 || detail.service_point_id && userServiePoints.has(detail.service_point_id))
                }).map((content: VisitDetail) => (
                    <EditorComponent
                        id='editorjs'
                        readOnly={false}
                        data={content.notes}
                        placeHolder="Jot here..."
                        onSave={UpsertPatientVisitDetail} />
                ))
                }
                {(myVisitDetails.length === 0) && <EditorComponent
                        id='editorjs'
                        readOnly={false}
                        placeHolder="Jot here..."
                        onSave={UpsertPatientVisitDetail} />}
            </div>
            <div className='w-5/12 border-l-2 p-6'>
                {otherVisitDetails
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
