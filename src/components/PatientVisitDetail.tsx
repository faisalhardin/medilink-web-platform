// Modified PatientVisitDetail.tsx
import { useEffect, useState } from 'react'
import { GetPatientVisitDetailedByID, UpsertPatientVisitDetailRequest } from '@requests/patient';
import { GetPatientVisitDetailedResponse, Patient, PatientVisit, PatientVisitDetail, PatientVisitDetailComponentProps, UpdatePatientVisitRequest, PatientVisitDetail as VisitDetail } from "@models/patient";
import { PatientVisitlDetailNotes } from './PatientVisitlDetailNotes';
import { ProductAssignmentPanel } from './ProductAssignmentPanel';
import { CheckoutProduct, TrxVisitProduct, } from '@models/product';
import { ListOrderedProduct, OrderProduct } from '@requests/products';
import { convertProductsToCheckoutProducts } from '@utils/common'
import { GetJourneyPoints } from '@requests/journey';
import { JourneyPoint } from '@models/journey';
import { Id } from 'types';
import { t } from 'i18next';
import { useDrawer } from 'hooks/useDrawer';
import Drawer from "./Drawer";
import { PatientVisitsComponent } from './PatientComponent';


export interface journeyTab {
    id: Id,
    name: string,
    position: number,
    servicePointID?: number
    is_owned: boolean,
}

export const PatientVisitComponent = ({ patientVisitId }: PatientVisitDetailComponentProps) => {
    const [journeyPointTab, setJourneyPointTab] = useState<journeyTab[]>([]);
    const [boardJourneyPoints, setBoardJourneyPoints] = useState<JourneyPoint[]>([]);
    const [activeTab, setActiveTab] = useState<journeyTab>({} as journeyTab);
    const [visitDetails, setVisitDetails] = useState<VisitDetail[]>([]);
    const [patientVisit, setPatientVisit] = useState<PatientVisit>({} as PatientVisit);
    const [patient, setPatient] = useState<Patient>({} as Patient);
    const [trxProduct, setTrxProduct] = useState<TrxVisitProduct[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<CheckoutProduct[]>(convertProductsToCheckoutProducts(patientVisit.product_cart || []));
    const viewPatientRecordDrawer = useDrawer();

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

    const GenerateVisitTab = async (_patientVisit: GetPatientVisitDetailedResponse, journeyPoints: JourneyPoint[]) => {
        var setOfJourneyPointID = new Set([_patientVisit.journey_point_id]);
        const journeyPointMap = new Map<Id, JourneyPoint>();
        for (const jp of journeyPoints) {
            journeyPointMap.set(jp.id, jp);
        }
        var _activeTab: journeyTab = {
            id: _patientVisit.journey_point_id,
            name: _patientVisit.journey_point.name,
            position: journeyPointMap.get(_patientVisit.journey_point.id)?.position || 0,
            servicePointID: _patientVisit.service_point_id,
            is_owned: journeyPointMap.get(_patientVisit.journey_point.id)?.is_owned || false,
        }
        updateActiveTab(_activeTab);
        var journeyPointTabs: journeyTab[] = [
            _activeTab,
        ];
        for (const patientVisitJourneyPoint of _patientVisit.patient_journeypoints) {
            if (!setOfJourneyPointID.has(patientVisitJourneyPoint.journey_point_id)) {
                setOfJourneyPointID.add(patientVisitJourneyPoint.journey_point_id);
                journeyPointTabs.push({
                    id: patientVisitJourneyPoint.journey_point_id,
                    name: patientVisitJourneyPoint.name_mst_journey_point,
                    position: journeyPointMap.get(patientVisitJourneyPoint.journey_point_id)?.position || 0,
                    is_owned: journeyPointMap.get(patientVisitJourneyPoint.journey_point_id)?.is_owned || false
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
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    async function fetchBoardJourneyPoints(journeyBoardID: number): Promise<JourneyPoint[]> {
        try {
            const journeyPoints = await GetJourneyPoints(journeyBoardID);
            return journeyPoints;
        } catch (error) {
            console.error("Error fetching board journey points:", error);
            return [];
        }
    }

    useEffect(() => {
        fetchProducts();
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const patientVisit = await GetPatientVisitDetailedByID(patientVisitId);
                if (patientVisit !== undefined) {
                    setPatientVisit(patientVisit);
                    const journeyPoints = await fetchBoardJourneyPoints(patientVisit.board_id);
                    setBoardJourneyPoints(journeyPoints);
                    GenerateVisitTab(patientVisit, journeyPoints);
                    setVisitDetails(patientVisit.patient_journeypoints);
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

    /**
     * Upserts (creates or updates) a patient visit detail record
     * Handles both new visit detail creation and existing record updates
     * @param visitDetail - The patient visit detail object to create or update
     * @returns Promise<PatientVisitDetail> - The created/updated visit detail from server
     */
    async function upsertVisitDetail(visitDetail: PatientVisitDetail): Promise<PatientVisitDetail> {
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
        <div className='flex-1 lg:p-6 h-screen'>
            <div className='bg-white p-6'>
                <div className='flex items-center mb-6'>
                    <div className='flex flex-col w-full'>
                        <div
                            className="flex items-center justify-between mb-2  w-full"

                        >
                            <h2 className='text-xl sm:text-2xl lg:text-3xl font-semibold  relative'>
                                {patient.name}
                            </h2>
                            <span className='group text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center gap-1 cursor-pointer'
                                onClick={viewPatientRecordDrawer.openDrawer}>
                                View Visits
                                <svg
                                    className="w-4 h-4 transition-all duration-300 group-hover:translate-x-2 group-hover:scale-110"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </div>

                        <p>
                            {t('common.' + String(patient.sex)).toLowerCase()}
                        </p>
                    </div>
                </div>
                <div className='border-b border-gray-200 mb-6 pb-2'>
                    <ul className='flex'>
                        {journeyPointTab.sort((a, b) => a.position - b.position).map((item, idx) => {
                            return (
                                <li onClick={() => {
                                    updateActiveTab(item)
                                }} className='mr-6' key={idx}>
                                    <a className={`pb-2 border-b-2 cursor-pointer ${activeTab.id === item.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:border-grey-8'}`}>
                                        {item.name}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </div>
                <div className="flex flex-col lg:flex-row">
                    {/* Product assignment panel - appears first on small screens */}
                    <div className='w-full lg:w-3/12 order-1 lg:order-2 mb-4 lg:mb-0'>
                        <ProductAssignmentPanel
                            patientVisit={patientVisit}
                            journeyPointId={activeTab.id as string}
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
                    {/* Notes panel - appears second on small screens */}
                    <div className="w-full lg:w-9/12 lg:pr-4 order-2 lg:order-1">
                        <PatientVisitlDetailNotes
                            visitDetail={visitDetails.filter(p => p.journey_point_id === activeTab.id)[0]}
                            activeTab={activeTab}
                            patientVisit={patientVisit}
                            journeyPoints={boardJourneyPoints}
                            upsertVisitDetailFunc={upsertVisitDetail}
                            updateVisitFunc={updateProductOrder}
                        />
                    </div>
                </div>
            </div>
            <Drawer
                isOpen={viewPatientRecordDrawer.isOpen}
                onClose={viewPatientRecordDrawer.closeDrawer}
                title={t('patient.viewPatientRecord')}
                maxWidth="lg"
                position="right"
            >
                <PatientVisitsComponent patient_uuid={patient?.uuid || ''} limit={5}
                    offset={0}
                    patient={patient || undefined}
                    isInDrawer={true}
                />
            </Drawer>
        </div>


    )



}