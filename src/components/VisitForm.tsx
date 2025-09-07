import { useEffect, useState } from "react";
import { useForm, Controller } from 'react-hook-form';
import { InsertPatientVisit } from "@requests/patient";
import { Patient as PatientModel, InsertPatientVisitPayload } from "@models/patient";
import { useModal } from "context/ModalContext";
import Drawer from "./Drawer";
import { useDrawer } from "hooks/useDrawer";
import { PatientListComponent, PatientRegistrationComponent } from "./PatientComponent";
import { EditorComponent } from "./EditorComponent";

interface PatientVisitRegistrationProps {
  journeyPointID: number;
}

export function VisitFormComponent({ journeyPointID }: PatientVisitRegistrationProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset, control } = useForm<InsertPatientVisitPayload>({
    defaultValues: {
      journey_point_id: journeyPointID,
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientModel | null>(null);
  const [activeSection, setActiveSection] = useState<string>('patient');
  
  const { closeModal } = useModal();
  const patientDrawer = useDrawer();
  const registerPatientDrawer = useDrawer();

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
      // Transform the extended data back to the API format
      const visitPayload: InsertPatientVisitPayload = {
        patient_uuid: data.patient_uuid,
        journey_point_id: data.journey_point_id,
        notes: data.notes,
      };
      
      await InsertPatientVisit(visitPayload);
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
      <div className="bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r px-8 py-6">
          <h2 className="text-2xl font-bold ">Patient Visit Registration</h2>
          <p className=" mt-1">Complete patient admission and clinical assessment</p>
        </div>        

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Patient Selection Section */}
          {activeSection === 'patient' && (
            <div className="space-y-6">
              <div className="">                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Patient *
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <select
                          {...register('patient_uuid', { required: 'Patient selection is required' })}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                          onClick={patientDrawer.openDrawer}
                        >
                          <option value="" disabled hidden>Choose patient from database</option>
                          {selectedPatient && (
                            <option value={selectedPatient.uuid}>{selectedPatient.name}</option>
                          )}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                        title="Add new patient"
                        onClick={registerPatientDrawer.openDrawer}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                        </svg>
                      </button>
                    </div>
                    {errors.patient_uuid && (
                      <p className="mt-1 text-sm text-red-600">{errors.patient_uuid.message}</p>
                    )}
                  </div>

                  {selectedPatient && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Selected Patient</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Name:</span> {selectedPatient.name}</p>
                        <p><span className="font-medium">NIK:</span> {selectedPatient.nik}</p>
                        <p><span className="font-medium">DOB:</span> {selectedPatient.date_of_birth}</p>
                        <p><span className="font-medium">Sex:</span> {selectedPatient.sex}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="col-span-full border-t">
                    <EditorComponent
                    id='notes'
                    readOnly={false}
                    placeHolder="Describe the reason for this visit, symptoms, concerns, etc."
                      onChange={(notes: Record<string, any>) => {
                        setValue('notes', notes);
                      }}
                    className="w-full h-32 col-span-full overflow-hidden
                               border-gray-200 
                              rounded-md 
                              bg-white 
                              px-3 py-2 
                              text-sm text-gray-900 
                              placeholder:text-gray-400 
                              transition-all duration-200 ease-in-out
                              hover:border-gray-300 
                              hover:shadow-sm
                              focus:outline-none 
                              focus:ring-1 
                              focus:ring-purple-500 
                              focus:border-purple-500 
                              focus:shadow-sm
                              disabled:bg-gray-50 
                              disabled:text-gray-500 
                              disabled:cursor-not-allowed"
                  />
                  </div>
                  

                </div>
              </div>
            </div>
          )}        

          {/* Navigation and Submit Buttons */}
          <div className="flex justify-between items-center pt-8 px-3">
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Admitting Patient...
                  </div>
                ) : (
                  'Admit Patient'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Patient Selection Drawer */}
      <Drawer
        isOpen={patientDrawer.isOpen}
        onClose={patientDrawer.closeDrawer}
        title="Select Patient"
        maxWidth="lg"
        position="right"
      >
        <PatientListComponent 
          journey_board_id={journeyPointID}
          isInDrawer={true}
          onPatientSelect={(patient: PatientModel) => {
            setSelectedPatient(patient);
            patientDrawer.closeDrawer();
          }}
        />
      </Drawer>
      <Drawer
        isOpen={registerPatientDrawer.isOpen}
        onClose={registerPatientDrawer.closeDrawer}
        title="Register Patient"
        maxWidth="lg"
        position="right"
      >
        <PatientRegistrationComponent />
      </Drawer>
    </>
  );
}

export default VisitFormComponent;
