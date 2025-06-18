import { useEffect, useMemo, useState } from 'react'
import { EditorComponent } from './EditorComponent';
import { PatientVisit, PatientVisitDetail, PatientVisitDetail as VisitDetail } from "@models/patient";
import { Id } from 'types';
import { getStorageUserJourneyPointsIDAsSet, getStorageUserServicePointsIDAsSet } from '@utils/storage';
import { journeyTab } from './PatientVisitDetail';
import { ProductAssignmentPanel } from './ProductAssignmentPanel';
import { Product, AssignedProductRequest, CheckoutProduct } from '@models/product';

// Add these new imports for product assignment
import { AssignProductToVisit, RemoveAssignedProduct, GetAssignedProducts } from '@requests/products';
import SearchPanel from './SearchPanel';

interface patientVisitProps {
    patientVisit: PatientVisit,
    visitDetails?: VisitDetail[],
    activeTab: journeyTab,
    upsertVisitDetailFunc: (param: PatientVisitDetail) => void;
}

export const PatientVisitlDetailNotes = ({ patientVisit, visitDetails, activeTab, upsertVisitDetailFunc }: patientVisitProps) => {
    const [myVisitDetails, setMyVisitDetails] = useState<VisitDetail[]>([]);
    const [otherVisitDetails, setOtherVisitDetails] = useState<VisitDetail[]>([]);
    const [userServicePoints, setUserServicePoints] = useState<Set<Id>>(new Set()); // [1
    const [userJourneyPoints, setUserJourneyPoints] = useState<Set<Id>>(new Set());

    const [assignedProducts, setAssignedProducts] = useState<CheckoutProduct[]>([]);

    async function assignProduct(product: AssignedProductRequest, id_trx_patient_visit: number): Promise<void> {
        try {
            const result = await AssignProductToVisit(product, id_trx_patient_visit);
            // setAssignedProducts(prev => [...prev, result]);
            return result;
        } catch (error) {
            console.error("Failed to assign product:", error);
            throw error;
        }
    }
    
    // // Add function to remove assigned product
    // async function removeAssignedProduct(productAssignmentId: number) {
    //     try {
    //         await RemoveAssignedProduct(productAssignmentId);
    //         setAssignedProducts(prev => 
    //             prev.filter(p => p.id !== productAssignmentId)
    //         );
    //     } catch (error) {
    //         console.error("Failed to remove product assignment:", error);
    //         throw error;
    //     }
    // }

    useEffect(() => {
        const _userServicePoints = getStorageUserServicePointsIDAsSet() || new Set();
        setUserServicePoints(_userServicePoints);

        const _userJourneyPoints = getStorageUserJourneyPointsIDAsSet() || new Set();
        setUserJourneyPoints(_userJourneyPoints);
        console.log("crs ", visitDetails);
        const details = visitDetails == undefined? [] as VisitDetail[] : visitDetails;
        if (details.length === 0) {
            setMyVisitDetails([]);
            setOtherVisitDetails([]);
            return;
        }

        // Filter details that belong to the user's service points
        const userDetails = details.filter(detail => {
            const detailHaveJourneyPoint = Boolean(detail.journey_point_id);
            const hasSameJourneyPoint = detailHaveJourneyPoint && userJourneyPoints.has(detail.journey_point_id);
            const detailHasServicePoint = detail.service_point_id && detail.service_point_id > 0;
            const userHasSameServicePoint = detailHasServicePoint && userServicePoints.has(detail.service_point_id as number);

            return detailHaveJourneyPoint && hasSameJourneyPoint && (userHasSameServicePoint || !detailHasServicePoint);
        }
        );

        // Filter details that don't belong to the user's service points
        const otherDetails = details.filter(detail =>
            !userDetails.includes(detail)
        );

        setMyVisitDetails(userDetails);
        setOtherVisitDetails(otherDetails);
        console.log("kol ",patientVisit, myVisitDetails, )

    }, [visitDetails, activeTab]);

    const shouldShowEditor = useMemo(() => {
        return userJourneyPoints.has(activeTab.id) &&                                       // does user has journey point that is the same with active tab
            !myVisitDetails.some(detail => detail.journey_point_id === activeTab.id);       //  but does not have any notes currently
    }, [activeTab, myVisitDetails]);



    return (
        <div className='flex w-full'>
            <div className='w-9/12 pl-8 pr-3'>
                {myVisitDetails.length > 0 && myVisitDetails.filter((detail: VisitDetail) => {
                    return detail.journey_point_id === activeTab.id
                }).map((detail: VisitDetail) => (
                    <EditorComponent
                        key={detail.id}
                        id={`editor-${detail.id}`}
                        readOnly={false}
                        data={detail || null}
                        placeHolder="Jot here..."
                        onSave={(notes:Record<string, any>) =>{
                            detail.notes = notes;
                            upsertVisitDetailFunc(detail);
                        }} />
                ))
                }
                { shouldShowEditor && <EditorComponent
                        id='editorjs'
                        readOnly={false}
                        placeHolder="Jot here..."
                        onSave={(notes:Record<string, any>) =>{
                            var journeyPointID:number = activeTab.id;

                            var detail:VisitDetail = {
                                notes: notes,
                                journey_point_id: journeyPointID,
                                id_patient_visit: patientVisit.id,
                                service_point_id: patientVisit.service_point_id,
                            }
                            upsertVisitDetailFunc(detail);
                            
                        }}  />
                        }
            </div>
            <div className="w-3/12">
            <ProductAssignmentPanel
                    patientVisit={patientVisit}
                    journeyPointId={activeTab.id}
                    assignedProducts={[]}
                    orderedProducts={[]}
                    onAssignProduct={(productRequest: AssignedProductRequest) =>(assignProduct(productRequest, activeTab.id))}
                />
                
            </div>
        </div>
    )
}
