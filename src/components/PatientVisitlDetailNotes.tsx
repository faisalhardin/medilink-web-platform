import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { EditorComponent } from './EditorComponent';
import { PatientVisit, PatientVisitDetail, UpdatePatientVisitRequest, PatientVisitDetail as VisitDetail } from "@models/patient";
import { Id } from 'types';
import { getStorageUserJourneyPointsIDAsSet, getStorageUserServicePointsIDAsSet } from '@utils/storage';
import { journeyTab } from './PatientVisitDetail';

interface patientVisitProps {
    patientVisit: PatientVisit,
    visitDetails?: VisitDetail[],
    activeTab: journeyTab,
    upsertVisitDetailFunc: (param: PatientVisitDetail) => void;
    updateVisitFunc: (params: UpdatePatientVisitRequest) => void;
}

export const PatientVisitlDetailNotes = ({ patientVisit, visitDetails, activeTab, upsertVisitDetailFunc }: patientVisitProps) => {
    const [myVisitDetails, setMyVisitDetails] = useState<VisitDetail[]>([]);
    const [_, setOtherVisitDetails] = useState<VisitDetail[]>([]);
    const [userServicePoints, setUserServicePoints] = useState<Set<Id>>(new Set());
    const [userJourneyPoints, setUserJourneyPoints] = useState<Set<Id>>(new Set());
    const [isChanged, setIsChanged] = useState(false);
    const newNoteRef = useRef<VisitDetail | null>(null);

    useEffect(() => {
        const _userServicePoints = getStorageUserServicePointsIDAsSet() || new Set();
        setUserServicePoints(_userServicePoints);

        const _userJourneyPoints = getStorageUserJourneyPointsIDAsSet() || new Set();
        setUserJourneyPoints(_userJourneyPoints);
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

    }, [visitDetails, activeTab]);

    const shouldShowEditor = useMemo(() => {
        return userJourneyPoints.has(activeTab.id) &&                                       // does user has journey point that is the same with active tab
            !myVisitDetails.some(detail => detail.journey_point_id === activeTab.id);       //  but does not have any notes currently
    }, [activeTab, myVisitDetails]);

    // Handle note changes (both new and existing)
    const handleNoteChange = useCallback((notes: Record<string, any>, detail?: VisitDetail) => {
        if (detail) {
            // Update existing note
            detail.notes = notes;
        } else {
            // Handle new note
            if (!newNoteRef.current) {
                newNoteRef.current = {
                    notes: notes,
                    journey_point_id: activeTab.id,
                    id_patient_visit: patientVisit.id,
                    service_point_id: patientVisit.service_point_id,
                };
            } else {
                newNoteRef.current.notes = notes;
            }
        }
        setIsChanged(true);
    }, [activeTab.id, patientVisit.id, patientVisit.service_point_id]);

    // Unified save function for both new and existing notes
    const saveNote = useCallback(() => {
        const currentNote = myVisitDetails.find(detail => detail.journey_point_id === activeTab.id);
        
        if (currentNote) {
            // Save existing note
            upsertVisitDetailFunc(currentNote);
        } else if (newNoteRef.current) {
            // Save new note
            upsertVisitDetailFunc(newNoteRef.current);
        }
        
        setIsChanged(false);
    }, [myVisitDetails, activeTab.id, upsertVisitDetailFunc]);

    // Get the current note for this journey point
    const currentNote = useMemo(() => myVisitDetails.find(detail => detail.journey_point_id === activeTab.id), [myVisitDetails, activeTab.id]);
    const isEditingExisting = Boolean(currentNote);

    return (
        <div className='w-full max-w-4xl mx-auto'>
            <div className='space-y-4'>
                {/* Editor Section */}
                {(isEditingExisting || shouldShowEditor) && (
                    <div className='relative group'>
                        <EditorComponent
                            key={isEditingExisting ? `editor-${currentNote?.id}` : 'editorjs'}
                            id={isEditingExisting ? `editor-${currentNote?.id}` : 'editorjs'}
                            readOnly={false}
                            data={isEditingExisting ? currentNote : undefined}
                            placeHolder="Write your notes here..."
                            className="min-h-[300px]"
                            onChange={(notes: Record<string, any>) => {
                                handleNoteChange(notes, currentNote || undefined);
                            }}
                        />
                        
                        {/* Save button - appears below editor */}
                        {isChanged && (
                            <div className='flex justify-end mt-4'>
                                <button 
                                    onClick={saveNote}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Save Notes
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* No access message */}
                {!isEditingExisting && !shouldShowEditor && (
                    <div className='text-center py-8 text-gray-500'>
                        <p>You don't have permission to add notes for this section.</p>
                    </div>
                )}
            </div>
        </div>
    )
}