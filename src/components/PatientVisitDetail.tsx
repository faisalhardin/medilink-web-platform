// Modified PatientVisitDetail.tsx
import { useEffect, useMemo, useState } from 'react'
import { GetPatientVisitDetailedByID, UpdatePatientVisit, UpsertPatientVisitDetailRequest } from '@requests/patient';
import { GetPatientVisitDetailedResponse, Patient, PatientVisit, PatientVisitDetail, PatientVisitDetailComponentProps, UpdatePatientVisitRequest, PatientVisitDetail as VisitDetail } from "@models/patient";
import { PatientVisitlDetailNotes } from './PatientVisitlDetailNotes';
import { ProductAssignmentPanel } from './ProductAssignmentPanel';
import { CheckoutProduct, Product, ProductPanelProps, TrxVisitProduct,  } from '@models/product';
import { ListOrderedProduct, OrderProduct } from '@requests/products';
import { convertProductsToCheckoutProducts} from '@utils/common'


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
    const [trxProduct, setTrxProduct] = useState<TrxVisitProduct[]>([]);    
    const [selectedProducts, setSelectedProducts] = useState<CheckoutProduct[]>(convertProductsToCheckoutProducts(patientVisit.product_cart || []));
    
    const updateSelectedProducts = (products: CheckoutProduct[]) => {
        setSelectedProducts(prev => {
            // Create maps for easier comparison
            const prevMap = new Map(prev.map(p => [p.id, p]));
            const newMap = new Map(products.map(p => [p.id, p]));

            // Check if there are any differences
            const hasDifferences = 
                prev.length !== products.length || // Length changed
                products.some(newProduct => {
                    const prevProduct = prevMap.get(newProduct.id);
                    return !prevProduct || // New product
                        prevProduct.quantity !== newProduct.quantity ||
                        prevProduct.adjusted_price !== newProduct.adjusted_price;
                }) ||
                prev.some(prevProduct => !newMap.has(prevProduct.id)); // Removed product

            return hasDifferences ? products : prev;
        });
    };


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

    async function fetchProducts() {
        try {
            const trxProducts = await ListOrderedProduct({
                visit_id: patientVisitId
            })
            if (trxProducts) {
                setTrxProduct(trxProducts);
            }
        } catch  (error) {
            console.error("Error fetching data:", error);
        }
    }

    useEffect(() => {
        fetchProducts();
    },[])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const patientVisit = await GetPatientVisitDetailedByID(patientVisitId);
                if (patientVisit !== undefined) {
                    setPatientVisit(patientVisit);
                    GenerateVisitTab(patientVisit);
                    setVisitDetails(patientVisit.patient_checkpoints)
                    setPatient(patientVisit.patient);
                    setSelectedProducts(convertProductsToCheckoutProducts(patientVisit.product_cart || []));
                }
               
            } catch (error) {
                console.error("Error fetching data:", error);
                setVisitDetails([]);
            }
        }

        fetchData();
    }, [patientVisitId])

    async function fetchVisit() {
        try {
            const patientVisit = await GetPatientVisitDetailedByID(patientVisitId);
            if (patientVisit !== undefined) {
                setPatientVisit(patientVisit);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    } 

    /**
     * Upserts (creates or updates) a patient visit detail record
     * Handles both new visit detail creation and existing record updates
     * @param visitDetail - The patient visit detail object to create or update
     * @returns Promise<PatientVisitDetail> - The created/updated visit detail from server
     */
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

    async function updateProductOrder(visit: UpdatePatientVisitRequest) {
        try {
            // First add to the backend and get the response
            // (which might include an ID or other server-generated fields)
            const cartProduct = visit.product_cart?.filter(p => p.quantity > 0) || [];
            
            await OrderProduct({
                visit_id: visit.id,
                products: cartProduct
            });
            fetchProducts();
        } catch (error) {
            console.error("Failed to create visit:", error);
            // Handle error (show notification, etc.)
            throw error; // Re-throw if you want calling code to handle it
        }
    }

    return (
        <div className='flex-1 p-6 h-screen'>
            <div className='bg-white p-6'>
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
                                    <a className={`pb-2 border-b-2 cursor-pointer ${activeTab.id === item.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:border-blue-600'}`}>
                                        {item.name}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </div>

                <div className="flex">
                    <div className="w-9/12 pr-4">
                        <PatientVisitlDetailNotes
                            visitDetails={visitDetails}
                            activeTab={activeTab}
                            patientVisit={patientVisit}
                            upsertVisitDetailFunc={upsertVisitDetail}
                            updateVisitFunc={updateProductOrder}
                        />
                    </div>
                    <div className='w-3/12'>
                        <ProductAssignmentPanel
                            patientVisit={patientVisit}
                            journeyPointId={activeTab.id}
                            cartProducts={selectedProducts}
                            orderedProducts={trxProduct}
                            updateSelectedProducts={updateSelectedProducts}
                            onAssignProduct={(productRequest: CheckoutProduct[]) => {
                                updateProductOrder({
                                    id: patientVisit.id,
                                    product_cart: productRequest,
                                })
                            }}
                            updatedOrderedProduct={setTrxProduct}
                        />
                    </div>
                </div>
            </div>
        </div>
    )



}