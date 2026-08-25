import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { EditorComponent } from './EditorComponent';
import { PatientVisit, PatientVisitDetail, UpdatePatientVisitRequest, PatientVisitDetail as VisitDetail } from "@models/patient";
import { journeyTab } from './PatientVisitDetail';
import { JourneyPoint } from '@models/journey';
import { t } from 'i18next';
import { showErrorToast } from '@utils/toast';

interface patientVisitProps {
    patientVisit: PatientVisit,
    visitDetail?: VisitDetail,
    activeTab: journeyTab,
    journeyPoints: JourneyPoint[],
    upsertVisitDetailFunc: (param: PatientVisitDetail) => Promise<PatientVisitDetail>;
    updateVisitFunc: (params: UpdatePatientVisitRequest) => void;
    onDirtyChange?: (dirty: boolean) => void;
}

export type VisitNotesHandle = {
    save: () => Promise<boolean>;
    isDirty: () => boolean;
};

export const PatientVisitlDetailNotes = forwardRef<VisitNotesHandle, patientVisitProps>(function PatientVisitlDetailNotes(
    { patientVisit, visitDetail, activeTab, journeyPoints, upsertVisitDetailFunc, onDirtyChange },
    ref,
) {
    const isChangedRef = useRef(false);
    const activeTabIdRef = useRef(activeTab.id);
    const newNoteRef = useRef<VisitDetail | null>(null);
    const updatedNoteRef = useRef<VisitDetail | null>(null);
    activeTabIdRef.current = activeTab.id;

    const setDirty = useCallback((dirty: boolean) => {
        if (isChangedRef.current === dirty) {
            return;
        }
        isChangedRef.current = dirty;
        onDirtyChange?.(dirty);
    }, [onDirtyChange]);

    useEffect(() => {
        newNoteRef.current = null;
        updatedNoteRef.current = null;
        setDirty(false);
    }, [activeTab.id, setDirty]);

    useEffect(() => {
        return () => {
            onDirtyChange?.(false);
        };
    }, [onDirtyChange]);

    const handleNoteChange = (notes: Record<string, any>) => {
        if (String(activeTab.id) !== String(activeTabIdRef.current)) {
            return;
        }
        if (visitDetail) {
            updatedNoteRef.current = {
                ...visitDetail,
                notes: notes
            };
        } else if (!newNoteRef.current) {
            newNoteRef.current = {
                notes: notes,
                journey_point_id: activeTab.id as string,
                id_patient_visit: patientVisit.id,
                service_point_id: patientVisit.service_point_id,
            };
        } else {
            newNoteRef.current.notes = notes;
        }
        setDirty(true);
    };

    const saveNote = useCallback(async (): Promise<boolean> => {
        const noteToSave = updatedNoteRef.current || visitDetail || newNoteRef.current;

        if (!noteToSave) {
            return false;
        }

        try {
            await upsertVisitDetailFunc(noteToSave);
            updatedNoteRef.current = null;
            setDirty(false);
            return true;
        } catch {
            showErrorToast(t('patient.saveNotesFailed'));
            return false;
        }
    }, [setDirty, upsertVisitDetailFunc, visitDetail]);

    useImperativeHandle(ref, () => ({
        save: saveNote,
        isDirty: () => isChangedRef.current,
    }), [saveNote]);

    const editorId = `editor-${activeTab.id}`;
    const canEditNotes = journeyPoints.some(jp => jp.id === activeTab.id && jp.is_owned);
    const noAccess = journeyPoints.some(jp => jp.id === activeTab.id && !jp.is_owned);

    return (
        <div className='w-full max-w-4xl mx-auto'>
            <div className='space-y-4'>
                {canEditNotes ? (
                    <div className='relative group'>
                        <EditorComponent key={editorId}
                            id={editorId}
                            readOnly={activeTab.id != patientVisit.journey_point_id}
                            data={visitDetail?.notes}
                            placeHolder="Write your notes here..."
                            className="min-h-[300px]"
                            onChange={handleNoteChange}
                            patientUuid={patientVisit.patient.uuid}
                            visitId={patientVisit.id}
                            journeyPointId={activeTab.id as string} />
                    </div>
                ) : null}

                {noAccess ? (
                    <div className='text-center py-8 text-gray-500'>
                        <p>You don't have permission to add notes for this section.</p>
                    </div>
                ) : null}
            </div>
        </div>
    )
});
