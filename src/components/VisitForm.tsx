import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { InsertPatientVisit } from "@requests/patient";
import { Patient as PatientModel, InsertPatientVisitPayload, PatientVisitDetail as VisitDetail, UpdatePatientVisitRequest, PatientVisit } from "@models/patient";
import { useModal } from "context/ModalContext";
import Drawer from "./Drawer";
import { useDrawer } from "hooks/useDrawer";
import { PatientListComponent } from "./PatientComponent";
import { EditorComponent } from "./EditorComponent";

interface PatientVisitRegistrationProps {
  journeyPointID: number;
}

export function VisitFormComponent({ journeyPointID }: PatientVisitRegistrationProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<InsertPatientVisitPayload>({
  defaultValues: {
    journey_point_id: journeyPointID
  }
});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientModel | null>(null);
  
  const { closeModal } = useModal();
  const patientDrawer = useDrawer();

  // When existingPatients changes, set the form value
  useEffect(() => {
    if (selectedPatient !== null) {
      setValue('patient_uuid', selectedPatient?.uuid || '');
    } else {
      setValue('patient_uuid', '');
    }
  }, [selectedPatient, setValue]);

  const onSubmit = async (data: InsertPatientVisitPayload) => {
    setIsLoading(true);
    try {
      await InsertPatientVisit(data);
      reset();
      if (closeModal) closeModal();
    } catch (error) {
      console.error('Error registering patient visit:', error);
      alert('Failed to register patient visit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg p-6">
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Visit Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Patient</label>
                  <select
                    {...register('patient_uuid', { required: 'Patient is required' })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onClick={patientDrawer.openDrawer}
                    defaultValue={selectedPatient?.uuid || ""}
                  >
                    <option value="" disabled hidden>Select patient</option>
                    
                    {selectedPatient != null ? (
                      <option value={selectedPatient.uuid}>{selectedPatient.name}</option>
                    ) : null}
                  </select>
                  {errors.patient_uuid && <span className="text-red-500 text-sm">{errors.patient_uuid.message}</span>}
                </div>
                <div className="block mb-2">
                  <EditorComponent
                    id='notes'
                    readOnly={false}
                    placeHolder="Describe the reason for this visit, symptoms, concerns, etc."
                      onChange={(notes: Record<string, any>) => {
                        setValue('notes', notes);
                      }}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => reset()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Admitting...' : 'Admit Patient'}
              </button>
            </div>
          </form>
      <Drawer
        isOpen={patientDrawer.isOpen}
        onClose={patientDrawer.closeDrawer}
        title="Product Order Confirmation"
        maxWidth="md"
        position="right"
      >
        <PatientListComponent 
        journey_board_id={journeyPointID}
          onPatientSelect={(patient: PatientModel) => {
            setSelectedPatient(patient)
            patientDrawer.closeDrawer()
          }}
        />

      </Drawer>
    </>
    
  );
}

// Export default component for easy importing
export default VisitFormComponent;
