import { useEffect, useState } from 'react'
import { EditorComponent } from './EditorComponent';
import { UpsertPatientVisitDetailRequest } from '@requests/patient';
import { PatientVisit, UpsertPatientVisitDetailParam, PatientVisitDetail as VisitDetail } from "@models/patient";
import { OutputData } from '@editorjs/editorjs';
import { Id } from 'types';
import { getStorageUserJourneyPointsIDAsSet, getStorageUserServicePointsIDAsSet } from '@utils/storage';

interface patientVisitProps {
    patientVisit: PatientVisit,
    visitDetails: VisitDetail[],
    activeTab: Id,
}

export const PatientVisitlDetailNotes = ({ patientVisit, visitDetails, activeTab }: patientVisitProps) => {
    const [myVisitDetails, setMyVisitDetails] = useState<VisitDetail[]>([]);
    const [otherVisitDetails, setOtherVisitDetails] = useState<VisitDetail[]>([]);
    const [userServicePoints, setUserServicePoints] = useState<Set<Id>>(new Set()); // [1
    const [userJourneyPoints, setUserJourneyPoints] = useState<Set<Id>>(new Set());

    useEffect(() => {
        const _userServicePoints = getStorageUserServicePointsIDAsSet() || new Set();
        setUserServicePoints(_userServicePoints);

        const _userJourneyPoints = getStorageUserJourneyPointsIDAsSet() || new Set();
        setUserJourneyPoints(_userJourneyPoints);

        // Filter details that belong to the user's service points
        const userDetails = visitDetails.filter(detail => {

            const detailHaveJourneyPoint = detail.journey_point_id;
            const hasSameJourneyPoint = detailHaveJourneyPoint && userJourneyPoints.has(detail.journey_point_id);
            const detailHasServicePoint = detail.service_point_id && detail.service_point_id > 0;
            const userHasSameServicePoint = detailHasServicePoint && userServicePoints.has(detail.service_point_id as number);

            return detailHaveJourneyPoint && hasSameJourneyPoint && (userHasSameServicePoint || !detailHasServicePoint)
        }
        );

        // Filter details that don't belong to the user's service points
        const otherDetails = visitDetails.filter(detail =>
            !userDetails.includes(detail)
        );

        setMyVisitDetails(userDetails);
        setOtherVisitDetails(otherDetails);

    }, [visitDetails, activeTab]);

    const UpsertPatientVisitDetail = (visitDetail: VisitDetail) => {
        var payload: UpsertPatientVisitDetailParam = {
            id: visitDetail.id,
            id_mst_journey_point: visitDetail.journey_point_id,
            name_mst_journey_point: visitDetail.name_mst_journey_point || "",
            notes: visitDetail.notes,
            id_trx_patient_visit: visitDetail.id_patient_visit,
          }
        
          if(visitDetail.id) {
            payload.id = visitDetail.id;
          }
          
        return UpsertPatientVisitDetailRequest(payload)
    }

    return (
        <div className='flex w-full'>
            <div className='w-7/12 pl-8 pr-3'>
                {myVisitDetails.length > 0 && myVisitDetails.filter((detail: VisitDetail) => {
                    return detail.journey_point_id === activeTab
                }).map((detail: VisitDetail) => (
                    <EditorComponent
                        key={detail.id}
                        id='editorjs'
                        readOnly={false}
                        data={detail || null}
                        placeHolder="Jot here..."
                        onSave={(notes:Record<string, any>) =>{
                            detail.notes = notes;
                            UpsertPatientVisitDetail(detail);
                        }} />
                ))
                }
                { ( myVisitDetails.length === 0 || !myVisitDetails.some(detail => detail.journey_point_id === activeTab) && userJourneyPoints.has(activeTab))
                && <EditorComponent
                        id='editorjs'
                        readOnly={false}
                        placeHolder="Jot here..."
                        onSave={(notes:Record<string, any>) =>{
                            var journeyPointID:number = Number(activeTab);

                            var detail:VisitDetail = {
                                notes: notes,
                                journey_point_id: journeyPointID,
                                id_patient_visit: patientVisit.id,
                            }
                            UpsertPatientVisitDetail(detail);
                            
                        }}  />
                        }
            </div>
            <div className='w-5/12 border-l-2 p-6'>
                {otherVisitDetails
                    .filter((detail) => {
                        return detail.journey_point_id === activeTab;
                    })
                    .map((detail: VisitDetail) => (
                        <EditorComponent
                            id={`content-${detail.id}`}
                            readOnly={true}
                            data={detail} key={detail.id} />
                    ))}
            </div>
        </div>
    )
}
