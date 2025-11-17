import { useState, useRef } from 'react'
import { EditorComponent } from './EditorComponent';
import { PatientVisit, PatientVisitDetail, UpdatePatientVisitRequest, PatientVisitDetail as VisitDetail } from "@models/patient";
import { journeyTab } from './PatientVisitDetail';
import { JourneyPoint } from '@models/journey';

interface patientVisitProps {
    patientVisit: PatientVisit,
    visitDetail?: VisitDetail,
    activeTab: journeyTab,
    journeyPoints: JourneyPoint[],
    upsertVisitDetailFunc: (param: PatientVisitDetail) => void;
    updateVisitFunc: (params: UpdatePatientVisitRequest) => void;
}

export const PatientVisitlDetailNotes = ({ patientVisit, visitDetail, activeTab, journeyPoints, upsertVisitDetailFunc }: patientVisitProps) => {   
    const [isChanged, setIsChanged] = useState(false);
    const newNoteRef = useRef<VisitDetail | null>(null);
    const updatedNoteRef = useRef<VisitDetail | null>(null);

    // Simplified note change handler
    const handleNoteChange = (notes: Record<string, any>) => {
        
        if (visitDetail) {
            // Store updated note in ref instead of mutating prop
            updatedNoteRef.current = {
                ...visitDetail,
                notes: notes
            };
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
    };

    // Simplified save function
    const saveNote = () => {
        const noteToSave = updatedNoteRef.current || visitDetail || newNoteRef.current;

        if (noteToSave) {
            upsertVisitDetailFunc(noteToSave);
            setIsChanged(false);
            updatedNoteRef.current = null; // Reset after save
        }
    };

    const editorId = `editor-${activeTab.id}`;

    return (
        <div className='w-full max-w-4xl mx-auto'>
            <div className='space-y-4'>
                {/* Editor Section */}
                { journeyPoints.some(jp => jp.id === activeTab.id && jp.is_owned) && (
                    <div className='relative group'>
                        <EditorComponent key={editorId}
                            id={editorId}
                            readOnly={false}
                            data={visitDetail?.notes}
                            placeHolder="Write your notes here..."
                            className="min-h-[300px]"
                            onChange={handleNoteChange} />

                        {/* Save button - appears below editor */}
                        <div className='flex justify-end mt-4'>
                                <button
                                    onClick={saveNote}
                                    disabled={!isChanged}
                                    className={`px-6 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2
                                        ${isChanged 
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 cursor-pointer border border-blue-600'
                                            : 'bg-transparent border border-gray-400 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Save Notes
                                </button>
                            </div>
                    </div>
                )}

                {/* No access message */}
                {journeyPoints.some(jp => jp.id === activeTab.id && !jp.is_owned) && (
                    <div className='text-center py-8 text-gray-500'>
                        <p>You don't have permission to add notes for this section.</p>
                    </div>
                )}
            </div>
        </div>
    )
}