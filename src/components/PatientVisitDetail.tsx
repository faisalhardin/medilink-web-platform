// Modified PatientVisitDetail.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom';
import { GetPatientVisitDetailedByID, UpsertPatientVisitDetailRequest } from '@requests/patient';
import { GetPatientVisitDetailedResponse, Patient, PatientVisit, PatientVisitDetail, PatientVisitDetailComponentProps, UpdatePatientVisitRequest, PatientVisitDetail as VisitDetail } from "@models/patient";
import { PatientVisitlDetailNotes, VisitNotesHandle } from './PatientVisitlDetailNotes';
import { VisitNotesSaveBar } from './VisitNotesSaveBar';
import { UnsavedNotesModal } from './UnsavedNotesModal';
import { ProductAssignmentPanel } from './ProductAssignmentPanel';
import { CheckoutProduct, TrxVisitProduct, } from '@models/product';
import { ListOrderedProduct, OrderProduct } from '@requests/products';
import { convertProductsToCheckoutProducts } from '@utils/common'
import { GetJourneyPoints } from '@requests/journey';
import { JourneyPoint } from '@models/journey';
import { Id } from 'types';
import { t } from 'i18next';
import { useDrawer } from 'hooks/useDrawer';
import { useJourneyBoards } from 'hooks/useJourneyBoards';
import Drawer from "./Drawer";
import { PatientVisitsComponent } from './PatientComponent';
import { PatientDetailInfoContent } from './PatientDetailInfo';
import { AnamnesaTabContent } from './AnamnesaTabContent';
import { DiagnosisTabContent } from './DiagnosisTabContent';
import { ProcedureTabContent } from './ProcedureTabContent';
import { useModal } from 'context/ModalContext';
import { CreateRecallModal } from './CreateRecallModal';
import { CurrentJourneyPointBadge } from './CurrentJourneyPointBadge';
import { MoveVisitJourneyPointModal } from './MoveVisitJourneyPointModal';
import { VisitRecallList } from './VisitRecallList';
import VisitContributorPanel from './compensation/VisitContributorPanel';


type TabType = 'journey' | 'anamnesa' | 'diagnosis' | 'procedure';

export interface journeyTab {
    id: Id,
    name: string,
    position: number,
    servicePointID?: number
    is_owned: boolean,
    type: TabType,
}

function buildJourneyTabs(
    detailedVisit: GetPatientVisitDetailedResponse,
    journeyPoints: JourneyPoint[],
): { activeTab: journeyTab; journeyPointTabs: journeyTab[] } {
    const setOfJourneyPointID = new Set([detailedVisit.journey_point_id]);
    const journeyPointMap = new Map<Id, JourneyPoint>();
    for (const jp of journeyPoints) {
        journeyPointMap.set(jp.id, jp);
    }
    const activeTab: journeyTab = {
        id: detailedVisit.journey_point_id,
        name: detailedVisit.journey_point.name,
        position: journeyPointMap.get(detailedVisit.journey_point.id)?.position || 0,
        servicePointID: detailedVisit.service_point_id,
        is_owned: journeyPointMap.get(detailedVisit.journey_point.id)?.is_owned || false,
        type: 'journey',
    };
    const journeyPointTabs: journeyTab[] = [activeTab];
    for (const patientVisitJourneyPoint of detailedVisit.patient_journeypoints) {
        if (!setOfJourneyPointID.has(patientVisitJourneyPoint.journey_point_id)) {
            setOfJourneyPointID.add(patientVisitJourneyPoint.journey_point_id);
            journeyPointTabs.push({
                id: patientVisitJourneyPoint.journey_point_id,
                name: patientVisitJourneyPoint.name_mst_journey_point,
                position: journeyPointMap.get(patientVisitJourneyPoint.journey_point_id)?.position || 0,
                is_owned: journeyPointMap.get(patientVisitJourneyPoint.journey_point_id)?.is_owned || false,
                type: 'journey',
            } as journeyTab);
        }
    }
    return { activeTab, journeyPointTabs };
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
    const [isPatientInfoOpen, setIsPatientInfoOpen] = useState(false);
    const [recallRefreshKey, setRecallRefreshKey] = useState(0);
    const [notesDirty, setNotesDirty] = useState(false);
    const [notesSaving, setNotesSaving] = useState(false);
    const [notesJustSaved, setNotesJustSaved] = useState(false);
    const notesHandleRef = useRef<VisitNotesHandle | null>(null);
    const viewPatientRecordDrawer = useDrawer();
    const { openModal, closeModal } = useModal();
    const { boards } = useJourneyBoards();
    const medicalTabs: journeyTab[] = [
        { id: 'anamnesa', name: 'Anamnesa', position: 999, is_owned: true, type: 'anamnesa' },
        { id: 'diagnosis', name: 'Diagnosis', position: 1000, is_owned: true, type: 'diagnosis' },
        { id: 'procedure', name: 'Tindakan', position: 1001, is_owned: true, type: 'procedure' },
    ];

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


    const handleNotesDirtyChange = useCallback((dirty: boolean) => {
        setNotesDirty(dirty);
        if (dirty) {
            setNotesJustSaved(false);
        }
    }, []);

    const handleSaveNotes = async () => {
        setNotesSaving(true);
        try {
            const saved = await notesHandleRef.current?.save();
            if (saved) {
                setNotesJustSaved(true);
            }
        } finally {
            setNotesSaving(false);
        }
    };

    const handleTabClick = (tab: journeyTab) => {
        if (tab.id === activeTab.id) {
            return;
        }
        if (!notesHandleRef.current?.isDirty()) {
            setNotesDirty(false);
            setNotesJustSaved(false);
            setActiveTab(tab);
            return;
        }
        openModal(
            <UnsavedNotesModal
                onDiscard={() => {
                    closeModal();
                    setNotesDirty(false);
                    setNotesJustSaved(false);
                    setActiveTab(tab);
                }}
                onSaveAndContinue={async () => {
                    const saved = await notesHandleRef.current?.save();
                    if (!saved) {
                        return;
                    }
                    closeModal();
                    setNotesDirty(false);
                    setNotesJustSaved(false);
                    setActiveTab(tab);
                }}
            />,
            { maxWidth: 'sm' },
        );
    };

    const openAddRecall = () => {
        if (!patient?.uuid) return;
        const initialDate = new Date();
        initialDate.setDate(initialDate.getDate() + 1);
        initialDate.setHours(9, 0, 0, 0);
        openModal(
            <CreateRecallModal
                initialDate={initialDate}
                initialPatient={patient}
                visitId={patientVisitId}
            />,
            {
                onClose: () => setRecallRefreshKey((k) => k + 1),
                maxWidth: 'lg',
            }
        );
    };

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

    const loadVisit = useCallback(async () => {
        try {
            const detailedVisit = await GetPatientVisitDetailedByID(patientVisitId);
            if (detailedVisit !== undefined) {
                setPatientVisit(detailedVisit);
                const journeyPoints = await fetchBoardJourneyPoints(detailedVisit.board_id);
                setBoardJourneyPoints(journeyPoints);
                const tabs = buildJourneyTabs(detailedVisit, journeyPoints);
                setActiveTab(tabs.activeTab);
                setJourneyPointTab(tabs.journeyPointTabs);
                setVisitDetails(detailedVisit.patient_journeypoints);
                setPatient(detailedVisit.patient);
                setSelectedProducts(convertProductsToCheckoutProducts(detailedVisit.product_cart || []));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setVisitDetails([]);
        }
    }, [patientVisitId]);

    const openMoveJourneyPointModal = () => {
        if (!patientVisit.id) return;
        openModal(
            <MoveVisitJourneyPointModal
                visitId={patientVisit.id}
                currentBoardId={patientVisit.board_id}
                currentJourneyPointId={patientVisit.journey_point_id}
                boards={boards}
                journeyPoints={boardJourneyPoints}
                onMoved={() => {
                    void loadVisit();
                }}
            />,
            { maxWidth: 'sm' },
        );
    };

    useEffect(() => {
        void fetchProducts();
    }, [patientVisitId])

    useEffect(() => {
        void loadVisit();
    }, [loadVisit])

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
            // Payload: pending deltas + unchanged purchased lines (visitProductOrderPostPayload).
            await OrderProduct({
                visit_id: visit.id,
                products: visit.product_cart ?? [],
            });
            await fetchProducts();
            const fresh = await GetPatientVisitDetailedByID(patientVisitId);
            if (fresh !== undefined) {
                setPatientVisit(fresh);
                setSelectedProducts(convertProductsToCheckoutProducts(fresh.product_cart || []));
            }
        } catch (error) {
            console.error("Failed to create visit:", error);
            // Handle error (show notification, etc.)
            throw error; // Re-throw if you want calling code to handle it
        }
    }

    return (
        <div className='flex-1 lg:p-6 h-screen'>
            <div className='bg-white p-6'>
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <CurrentJourneyPointBadge
                            journeyPointName={
                                boardJourneyPoints.find(
                                    (point) => String(point.id) === String(patientVisit.journey_point_id)
                                )?.name
                            }
                            disabled={!patientVisit.id}
                            onClick={openMoveJourneyPointModal}
                        />
                        <h2 className="truncate text-xl font-semibold sm:text-2xl lg:text-3xl">
                            {patient.name}
                        </h2>
                        <p className="text-sm text-gray-600 capitalize">
                            {t('common.' + String(patient.sex)).toLowerCase()}
                        </p>
                    </div>
                    <div className="flex items-start md:justify-between gap-2 shrink-0 ">
                        <button
                            type="button"
                            onClick={() => setIsPatientInfoOpen(true)}
                            aria-label={t('patient.detail', 'Patient Detail')}
                            title={t('patient.detail', 'Patient Detail')}
                            className="flex items-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-2.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:px-3"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            <span className="hidden lg:inline">{t('patient.detail', 'Patient Detail')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={viewPatientRecordDrawer.openDrawer}
                            aria-label={t('patient.visits', 'Visits')}
                            title={t('patient.visits', 'Visits')}
                            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:px-3"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                            <span className="hidden lg:inline">{t('patient.visits', 'Visits')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={openAddRecall}
                            disabled={!patient?.uuid}
                            aria-label={t('recall.addAppointment', 'Add Recall')}
                            title={t('recall.addAppointment', 'Add Recall')}
                            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed lg:px-3"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <span className="hidden lg:inline">{t('recall.addAppointment', 'Add Recall')}</span>
                        </button>
                    </div>
                </div>
                <VisitRecallList visitId={patientVisitId} refreshKey={recallRefreshKey} />
                <div className="mb-6 overflow-x-auto overflow-y-hidden border-b border-gray-200">
                    <ul className="flex flex-nowrap">
                        {[...journeyPointTab].sort((a, b) => a.position - b.position).concat(medicalTabs).map((item) => {
                            return (
                                <li
                                    onClick={() => {
                                        handleTabClick(item)
                                    }}
                                    className="mr-6 shrink-0"
                                    key={String(item.id)}
                                >
                                    <a className={`-mb-px cursor-pointer whitespace-nowrap border-b-2 pb-2 text-sm ${activeTab.id === item.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:border-grey-8'}`}>
                                        {item.name}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </div>
                {activeTab.type === 'anamnesa' && (
                    <div className="w-full">
                        <AnamnesaTabContent visitId={patientVisitId} patient={patient} />
                    </div>
                )}
                {activeTab.type === 'diagnosis' && (
                    <div className="w-full">
                        <DiagnosisTabContent visitId={patientVisitId} patient={patient} />
                    </div>
                )}
                {activeTab.type === 'procedure' && (
                    <div className="w-full">
                        <ProcedureTabContent visitId={patientVisitId} patient={patient} />
                    </div>
                )}
                {activeTab.type !== 'anamnesa' && activeTab.type !== 'diagnosis' && activeTab.type !== 'procedure' ? (
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
                            {patientVisitId ? (
                                <div className="mt-3">
                                    <VisitContributorPanel visitId={patientVisitId} />
                                </div>
                            ) : null}
                        </div>
                        {/* Notes panel - appears second on small screens */}
                        <div className="w-full lg:w-9/12 lg:pr-4 order-2 lg:order-1 pb-24">
                            <PatientVisitlDetailNotes
                                ref={notesHandleRef}
                                visitDetail={visitDetails.filter(p => p.journey_point_id === activeTab.id)[0]}
                                activeTab={activeTab}
                                patientVisit={patientVisit}
                                journeyPoints={boardJourneyPoints}
                                upsertVisitDetailFunc={upsertVisitDetail}
                                updateVisitFunc={updateProductOrder}
                                onDirtyChange={handleNotesDirtyChange}
                            />
                        </div>
                    </div>
                ) : null}
                {activeTab.type !== 'anamnesa' && activeTab.type !== 'diagnosis' && activeTab.type !== 'procedure' && activeTab.is_owned ? createPortal(
                    <VisitNotesSaveBar
                        isChanged={notesDirty}
                        isSaving={notesSaving}
                        showSaved={notesJustSaved}
                        onSave={() => {
                            void handleSaveNotes();
                        }}
                    />,
                    document.body
                ) : null}
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
            {isPatientInfoOpen && createPortal(
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsPatientInfoOpen(false);
                    }}
                >
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsPatientInfoOpen(false)}
                                className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
                                aria-label="Close"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="p-6">
                                <PatientDetailInfoContent
                                    patient={patient}
                                    isModal
                                    onUpdate={(updated) => setPatient((prev) => ({ ...prev, ...updated }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>


    )



}