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
import ContentCard from './compensation/ContentCard';


type TabType = 'journey' | 'anamnesa' | 'diagnosis' | 'procedure';

function VisitFolderTab({
    name,
    isActive,
    onClick,
}: {
    name: string;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className={`group relative shrink-0 whitespace-nowrap px-4 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#0B57D0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F8FF] ${isActive ? 'z-10 -mb-px h-11 text-[#0D1B2A]' : 'h-9 text-[#3D4F6F] hover:text-[#0D1B2A]'
                }`}
        >
            <span
                aria-hidden
                className={`absolute inset-0 rounded-t-xl ${isActive ? 'bg-white' : 'bg-[#E8F1FF] group-hover:bg-[#DCE8FA]'
                    }`}
            />
            {isActive ? (
                <>
                    <span
                        aria-hidden
                        className="pointer-events-none absolute bottom-0 -left-3 h-3 w-3"
                        style={{ background: 'radial-gradient(circle at 0 0, transparent 12px, #fff 12px)' }}
                    />
                    <span
                        aria-hidden
                        className="pointer-events-none absolute bottom-0 -right-3 h-3 w-3"
                        style={{ background: 'radial-gradient(circle at 100% 0, transparent 12px, #fff 12px)' }}
                    />
                </>
            ) : null}
            <span className="relative">{name}</span>
        </button>
    );
}

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

export const PatientVisitComponent = ({ patientVisitId, isModal = false }: PatientVisitDetailComponentProps) => {
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

    const orderedTabs = [...journeyPointTab].sort((a, b) => a.position - b.position).concat(medicalTabs);
    const isFirstTabActive = orderedTabs[0] != null && orderedTabs[0].id === activeTab.id;
    const isJourneyNotesTab = activeTab.type !== 'anamnesa' && activeTab.type !== 'diagnosis' && activeTab.type !== 'procedure';
    const panelClassName = isModal
        ? `relative z-0 -mt-px bg-white pt-5 px-5 ${isJourneyNotesTab ? 'pb-6' : 'pb-1'}`
        : `relative z-0 -mt-px bg-white px-5 pt-5 shadow-[0_12px_40px_rgba(13,27,42,0.08)] sm:px-6 sm:pt-6 ${isJourneyNotesTab ? 'pb-6' : 'pb-5 sm:pb-6'
        } ${isFirstTabActive ? 'rounded-b-[28px] rounded-tr-[28px]' : 'rounded-[28px]'}`;

    const tabList = (
        <div className="relative z-10 overflow-x-auto px-3 pb-px">
            <div className="inline-flex w-max min-w-full items-end gap-4" role="tablist">
                {orderedTabs.map((item) => (
                    <VisitFolderTab
                        key={String(item.id)}
                        name={item.name}
                        isActive={activeTab.id === item.id}
                        onClick={() => handleTabClick(item)}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className={isModal ? 'bg-white' : 'flex-1 overflow-y-auto bg-[#F4F8FF] p-4 sm:p-5 lg:px-8 lg:py-5'}>
            {isModal ? (
                <div className='p-5'>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                            <h2 className="truncate text-2xl font-semibold leading-none tracking-[-0.03em] text-[#0D1B2A]">
                                {patient.name}
                            </h2>
                            <p className="mt-1.5 text-[13px] capitalize text-[#5C6B80]">
                                {t('common.' + String(patient.sex)).toLowerCase()}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-start gap-2 pr-6">
                            <button
                                type="button"
                                onClick={() => setIsPatientInfoOpen(true)}
                                aria-label={t('patient.detail', 'Patient Detail')}
                                title={t('patient.detail', 'Patient Detail')}
                                className="flex h-9 items-center gap-2 rounded-full bg-[#0B57D0] px-3 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#0847B0] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/25 lg:px-4"
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
                                className="flex h-9 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-[#3D4F6F] outline-none ring-1 ring-[#D7E3F4] transition-colors hover:bg-[#E8F1FF] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/20 lg:px-4"
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
                                className="flex h-9 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-[#3D4F6F] outline-none ring-1 ring-[#D7E3F4] transition-colors hover:bg-[#E8F1FF] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/20 disabled:cursor-not-allowed disabled:opacity-50 lg:px-4"
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
                </div>
            ) : (
                <ContentCard>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                            <h2 className="truncate text-2xl font-semibold leading-none tracking-[-0.03em] text-[#0D1B2A]">
                                {patient.name}
                            </h2>
                            <p className="mt-1.5 text-[13px] capitalize text-[#5C6B80]">
                                {t('common.' + String(patient.sex)).toLowerCase()}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-start gap-2">
                            <button
                                type="button"
                                onClick={() => setIsPatientInfoOpen(true)}
                                aria-label={t('patient.detail', 'Patient Detail')}
                                title={t('patient.detail', 'Patient Detail')}
                                className="flex h-9 items-center gap-2 rounded-full bg-[#0B57D0] px-3 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#0847B0] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/25 lg:px-4"
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
                                className="flex h-9 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-[#3D4F6F] outline-none ring-1 ring-[#D7E3F4] transition-colors hover:bg-[#E8F1FF] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/20 lg:px-4"
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
                                className="flex h-9 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-[#3D4F6F] outline-none ring-1 ring-[#D7E3F4] transition-colors hover:bg-[#E8F1FF] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/20 disabled:cursor-not-allowed disabled:opacity-50 lg:px-4"
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
                </ContentCard>
            )}
            {isModal ? (
                <div className="relative mt-1 sm:mx-1">
                    <div className="rounded-[18px] bg-[#F4F8FF] px-2 pt-5 shadow-[inset_0_12px_40px_rgba(13,27,42,0.08)]">
                        {tabList}
                    </div>
                </div>
            ) : (
                <div className="mt-6">
                    {tabList}
                </div>
            )}
            <div className={panelClassName}>
                {activeTab.type === 'anamnesa' && (
                    <AnamnesaTabContent visitId={patientVisitId} patient={patient} />
                )}
                {activeTab.type === 'diagnosis' && (
                    <DiagnosisTabContent visitId={patientVisitId} patient={patient} />
                )}
                {activeTab.type === 'procedure' && (
                    <ProcedureTabContent visitId={patientVisitId} patient={patient} />
                )}
                {isJourneyNotesTab ? (
                    <div className="flex flex-col lg:flex-row">
                        <div className="order-1 mb-4 flex w-full min-w-0 gap-3 overflow-x-auto lg:order-2 lg:mb-0 lg:w-3/12 lg:flex-col lg:items-stretch lg:overflow-visible">
                            <div className="w-80 shrink-0 lg:w-full lg:shrink">
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
                            {patientVisitId ? (
                                <div className="w-80 shrink-0 lg:w-full lg:shrink">
                                    <VisitContributorPanel visitId={patientVisitId} />
                                </div>
                            ) : null}
                        </div>
                        <div className="order-2 w-full pb-24 lg:order-1 lg:w-9/12 lg:pr-4">
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
            </div>
            {isJourneyNotesTab && activeTab.is_owned ? createPortal(
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