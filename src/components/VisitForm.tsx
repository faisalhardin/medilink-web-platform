import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { InsertPatientVisit } from "@requests/patient";
import { Patient as PatientModel, InsertPatientVisitPayload } from "@models/patient";
import { useModal } from "context/ModalContext";
import Drawer from "./Drawer";
import { useDrawer } from "hooks/useDrawer";
import { PatientListComponent, PatientRegistrationComponent, PatientVisitsComponent } from "./PatientComponent";
import { EditorComponent } from "./EditorComponent";
import { formatDate } from "@utils/common";

interface PatientVisitRegistrationProps {
  journeyPointID: number;
}

export function VisitFormComponent({ journeyPointID }: PatientVisitRegistrationProps) {
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<InsertPatientVisitPayload>({
    defaultValues: {
      journey_point_id: journeyPointID,
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientModel | null>(null);
  const [activeSection, _] = useState<string>('patient');
  
  const { closeModal } = useModal();
  const patientDrawer = useDrawer();
  const registerPatientDrawer = useDrawer();
  const viewPatientRecordDrawer = useDrawer();

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
    <div className="min-h-[90vh] flex flex-col">
      <div className="bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r px-8 py-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold ">Patient Visit Registration</h2>
          <p className=" mt-1">Complete patient admission and clinical assessment</p>
        </div>        

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Patient Selection Section */}
          {activeSection === 'patient' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-[2fr_3fr] gap-6">                
                {/* Left Column - Patient Selection */}
                <div className="flex flex-col gap-2">
                  <div className="p-6">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
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
                      {!selectedPatient &&
                        <div className="relative group">
                          <button
                            type="button"
                            className="flex items-center justify-center w-full h-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                            title="Add new patient"
                            onClick={registerPatientDrawer.openDrawer}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                            </svg>
                          </button>
                          {/* Custom Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs sm:text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Register new patient
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>

                      }
                      {selectedPatient && 
                      <div className="relative group">
                        <button
                          type="button"
                          className="flex items-center justify-center h-full w-full bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                          onClick={viewPatientRecordDrawer.openDrawer}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                        {/* Custom Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          View patient's medical records
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                      }

                      
                      
                    </div>
                    {errors.patient_uuid && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.patient_uuid.message}</p>
                    )}
                  </div>

                  {selectedPatient && (
                    <div className="bg-white border border-gray-200 rounded-lg m-6 p-6">
                      <h4 className="font-medium text-gray-900 mb-2">Selected Patient</h4>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Name:</span> {selectedPatient.name}</p>
                        <p><span className="font-medium">NIK:</span> {selectedPatient.nik}</p>
                        <p>
                          <span className="font-medium">DOB:</span>{" "}
                          {selectedPatient.date_of_birth
                            ? formatDate(selectedPatient.date_of_birth)
                            : ""}
                        </p>
                        <p><span className="font-medium">Sex:</span> {selectedPatient.sex}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right Column - Editor Component */}
                <div className="group border border-gray-200 rounded-lg p-4 focus-within:border-blue-400 transition-colors">
                  <div className="mb-2">
                    <svg 
                      className="w-5 h-5 text-gray-500 animate-pulse group-hover:animate-none group-hover:scale-110 group-hover:text-blue-500 transition-all duration-200" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <EditorComponent
                    id='notes'
                    readOnly={false}
                    placeHolder="Describe the reason for this visit, symptoms, concerns, etc."
                    onChange={(notes: Record<string, any>) => {
                      setValue('notes', notes);
                    }}
                    className="min-h-[300px]"
                  />
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
        <PatientRegistrationComponent isInDrawer={true} onPatientSelect={(patient: PatientModel) => {
          setSelectedPatient(patient);
          registerPatientDrawer.closeDrawer();
        }} />
      </Drawer>
      <Drawer
        isOpen={viewPatientRecordDrawer.isOpen}
        onClose={viewPatientRecordDrawer.closeDrawer}
        title="View Patient Record"
        maxWidth="lg"
        position="right"
      >
        <PatientVisitsComponent patient_uuid={selectedPatient?.uuid || ''} limit={5}
          offset={0}
          patient={selectedPatient || undefined}
          isInDrawer={true}
        />
      </Drawer>
    </div>
  );
}

export default VisitFormComponent;
