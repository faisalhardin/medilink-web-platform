import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { EditorComponent } from './EditorComponent';
import { PatientVisit, PatientVisitDetail, UpdatePatientVisitRequest, PatientVisitDetail as VisitDetail } from "@models/patient";
import { Id } from 'types';
import { getStorageUserServicePointsIDAsSet } from '@utils/storage';
import { journeyTab } from './PatientVisitDetail';
import { JourneyPoint } from '@models/journey';

interface patientVisitProps {
    patientVisit: PatientVisit,
    visitDetails?: VisitDetail[],
    activeTab: journeyTab,
    journeyPoints: JourneyPoint[],
    upsertVisitDetailFunc: (param: PatientVisitDetail) => void;
    updateVisitFunc: (params: UpdatePatientVisitRequest) => void;
}

export const PatientVisitlDetailNotes = ({ patientVisit, visitDetails, activeTab, journeyPoints, upsertVisitDetailFunc }: patientVisitProps) => {
    const [myVisitDetails, setMyVisitDetails] = useState<VisitDetail[]>([]);
    const [isChanged, setIsChanged] = useState(false);
    const newNoteRef = useRef<VisitDetail | null>(null);

    // Memoize user permissions to avoid recalculation
    const userPermissions = useMemo(() => {
        const userServicePoints = getStorageUserServicePointsIDAsSet() || new Set<Id>();
        const userJourneyPoints = new Set(journeyPoints.filter(jp => jp.is_owned).map(jp => jp.id));

        return { userServicePoints, userJourneyPoints };
    }, [journeyPoints]);

    // Memoize current note to avoid repeated filtering
    const currentNote = useMemo(() =>
        myVisitDetails.find(detail => {
            // console.log(detail.journey_point_id, activeTab.id);
            return detail.journey_point_id === activeTab.id
        }),
        [myVisitDetails, activeTab.id]
    );

    const isEditingExisting = Boolean(currentNote);

    // Simplified permission check
    const hasPermission = useMemo(() =>
        userPermissions.userJourneyPoints.has(activeTab.id),
        [userPermissions.userJourneyPoints, activeTab.id]
    );

    // Simplified editor visibility logic
    const shouldShowEditor = useMemo(() =>
        hasPermission && !isEditingExisting,
        [hasPermission, isEditingExisting]
    );

    // Optimized filtering logic
    const filterVisitDetails = useCallback((details: VisitDetail[]) => {
        if (details.length === 0) return [];

        return details.filter(detail => {
            const detailHaveJourneyPoint = Boolean(detail.journey_point_id);
            const hasSameJourneyPoint = detailHaveJourneyPoint && userPermissions.userJourneyPoints.has(detail.journey_point_id);
            const detailHasServicePoint = detail.service_point_id && detail.service_point_id > 0;
            const userHasSameServicePoint = detailHasServicePoint && userPermissions.userServicePoints.has(detail.service_point_id as number);

            return detailHaveJourneyPoint && hasSameJourneyPoint && (userHasSameServicePoint || !detailHasServicePoint);
        });
    }, [userPermissions]);

    useEffect(() => {
        const details = visitDetails || [];
        const filteredDetails = filterVisitDetails(details);
        setMyVisitDetails(filteredDetails);
    }, [visitDetails, filterVisitDetails]);

    // Simplified note change handler
    const handleNoteChange = useCallback((notes: Record<string, any>) => {
        if (currentNote) {
            // Update existing note
            currentNote.notes = notes;
        } else {
            // Handle new note
            if (!newNoteRef.current) {
                newNoteRef.current = {
                    notes: notes,
                    journey_point_id: activeTab.id as string,
                    id_patient_visit: patientVisit.id,
                    service_point_id: patientVisit.service_point_id,
                };
            } else {
                newNoteRef.current.notes = notes;
            }
        }
        setIsChanged(true);
    }, [currentNote, activeTab.id, patientVisit.id, patientVisit.service_point_id]);

    // Simplified save function
    const saveNote = useCallback(() => {
        const noteToSave = currentNote || newNoteRef.current;
        if (noteToSave) {
            upsertVisitDetailFunc(noteToSave);
            setIsChanged(false);
        }
    }, [currentNote, upsertVisitDetailFunc]);

    const editorId = `editor-${activeTab.id}`;

    return (
        <div className='w-full max-w-4xl mx-auto'>
            <div className='space-y-4'>
                {/* Editor Section */}
                {(isEditingExisting || shouldShowEditor) && (
                    <div className='relative group'>
                        <EditorComponent key={editorId}
                            id={editorId}
                            readOnly={false}
                            data={isEditingExisting ? currentNote : undefined}
                            placeHolder="Write your notes here..."
                            className="min-h-[300px]"
                            onChange={handleNoteChange} />

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