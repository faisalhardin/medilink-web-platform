import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { RegisterPatientRequest, ListPatients, InsertPatientVisit } from "@requests/patient";
import { GetPatientParam, Patient as PatientModel, RegisterPatient as RegisterPatientModel, InsertPatientVisitPayload } from "@models/patient";
import { useModal } from "context/ModalContext";
import Drawer from "./Drawer";
import { useDrawer } from "hooks/useDrawer";
import { PatientListComponent } from "./PatientComponent";

// Extended interface for EHR visit registration
interface EHRPatientRegistration extends RegisterPatientModel {
  // phone_number: string;
  // email: string;
  // emergency_contact_name: string;
  // emergency_contact_phone: string;
  // emergency_contact_relationship: string;
  // blood_type: string;
  // allergies: string;
  // current_medications: string;
  // medical_history: string;
  // insurance_provider: string;
  // insurance_number: string;
  // preferred_language: string;
  // marital_status: string;
  // occupation: string;
  patient: PatientModel;
  visit_reason: string;
  visit_type: string;
  referring_physician: string;
  appointment_date: string;
  appointment_time: string;
  // height: string;
  // weight: string;
}

interface PatientVisitRegistrationProps {
  journey_board_id?: number;
  onPatientRegistered?: (patient: PatientModel) => void;
}

export function VisitFormComponent({ journey_board_id, onPatientRegistered }: PatientVisitRegistrationProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<EHRPatientRegistration>({
  defaultValues: {
    appointment_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    appointment_time: new Date().toTimeString().split(' ')[0].substring(0, 5) // Current time in HH:MM 
  }
});
  const [isLoading, setIsLoading] = useState(false);
  const [existingPatients, setExistingPatients] = useState<PatientModel|null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientModel | null>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const { closeModal } = useModal();
  const patientDrawer = useDrawer();

  // Watch NIK field to search for existing patients
  const nikValue = watch('nik');

  useEffect(() => {
    if (nikValue && nikValue.length >= 10) {
      searchExistingPatients(nikValue);
    }
  }, [nikValue]);

  const searchExistingPatients = async (nik: string) => {
    try {
      // const patients = await ListPatients({ nik });
      // setExistingPatients(patients);
      // if (patients.length > 0) {
      //   setSelectedPatient(patients[0]);
      //   // Pre-fill form with existing patient data
      //   const patient = patients[0];
      //   setValue('name', patient.name);
      //   setValue('date_of_birth', patient.date_of_birth);
      //   setValue('place_of_birth', patient.place_of_birth);
      //   setValue('sex', patient.sex);
      //   setValue('religion', patient.religion);
      //   setValue('address', patient.address);
      // } else {
        setSelectedPatient(null);
        setShowNewPatientForm(true);
      // }
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const onSubmit = async (data: EHRPatientRegistration) => {
    setIsLoading(true);
    try {
      let patientUuid: string;

      if (selectedPatient) {
        // Use existing patient
        patientUuid = selectedPatient.uuid;
      } else {
        // Register new patient
        const newPatientData: RegisterPatientModel = {
          name: data.name,
          nik: data.nik,
          sex: data.sex,
          date_of_birth: data.date_of_birth,
          place_of_birth: data.place_of_birth,
          religion: data.religion,
          address: data.address,
        };

        const response = await RegisterPatientRequest(newPatientData);
        // Assuming the response contains the patient UUID or we need to search again
        const newPatients = await ListPatients({ nik: data.nik });
        patientUuid = newPatients[0]?.uuid || '';
      }

      // Create visit if journey_board_id is provided
      if (journey_board_id && patientUuid) {
        const visitPayload: InsertPatientVisitPayload = {
          patient_uuid: patientUuid,
          board_id: journey_board_id,
        };
        await InsertPatientVisit(visitPayload);
      }

      // Call callback if provided
      if (onPatientRegistered && selectedPatient) {
        onPatientRegistered(selectedPatient);
      }

      alert('Patient visit registered successfully!');
      reset();
      if (closeModal) closeModal();
    } catch (error) {
      console.error('Error registering patient visit:', error);
      alert('Failed to register patient visit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
  const visitTypes = ['Routine Check-up', 'Emergency', 'Follow-up', 'Consultation', 'Procedure', 'Surgery', 'Diagnostic'];
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed', 'Other'];
  const languages = ['Indonesian', 'English', 'Javanese', 'Sundanese', 'Other'];

  return (
    <>
      <div className="p-6 w-full min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">Patient Visit Registration</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-8">
            {/* Patient Search Section */}
            {/* <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-blue-800">Patient Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">NIK (National ID) *</label>
                <input
                  {...register('nik', { 
                    required: 'NIK is required',
                    minLength: { value: 16, message: 'NIK must be 16 digits' },
                    maxLength: { value: 16, message: 'NIK must be 16 digits' }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter 16-digit NIK"
                />
                {errors.nik && <span className="text-red-500 text-sm">{errors.nik.message}</span>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-gray-700">Full Name *</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
                {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
              </div>
            </div>

            {existingPatients.length > 0 && (
              <div className="mt-4 p-4 bg-green-100 rounded-lg">
                <p className="text-green-800 font-medium">Existing patient found!</p>
                <p className="text-sm text-green-700">Using data from: {selectedPatient?.name}</p>
              </div>
            )}
          </div> */}

            {/* Basic Demographics */}
            {/* <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Date of Birth *</label>
                <input
                  type="date"
                  {...register('date_of_birth', { required: 'Date of birth is required' })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.date_of_birth && <span className="text-red-500 text-sm">{errors.date_of_birth.message}</span>}
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Sex *</label>
                <select 
                  {...register('sex', { required: 'Sex is required' })} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.sex && <span className="text-red-500 text-sm">{errors.sex.message}</span>}
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Blood Type</label>
                <select {...register('blood_type')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select blood type</option>
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Place of Birth</label>
                <input
                  {...register('place_of_birth')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter place of birth"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Religion</label>
                <select {...register('religion')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select religion</option>
                  <option value="islam">Islam</option>
                  <option value="katolik">Katolik</option>
                  <option value="protestan">Protestan</option>
                  <option value="budha">Budha</option>
                  <option value="hindu">Hindu</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Marital Status</label>
                <select {...register('marital_status')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select status</option>
                  {maritalStatuses.map(status => (
                    <option key={status} value={status.toLowerCase()}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>   */}

            {/* Contact Information */}
            {/* <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Phone Number</label>
                <input
                  {...register('phone_number')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-gray-700">Address</label>
                <textarea
                  {...register('address')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter full address"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Preferred Language</label>
                <select {...register('preferred_language')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select language</option>
                  {languages.map(lang => (
                    <option key={lang} value={lang.toLowerCase()}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Occupation</label>
                <input
                  {...register('occupation')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter occupation"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
            {/* <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Emergency Contact Name</label>
                <input
                  {...register('emergency_contact_name')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter contact name"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Emergency Contact Phone</label>
                <input
                  {...register('emergency_contact_phone')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter contact phone"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Relationship</label>
                <input
                  {...register('emergency_contact_relationship')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
              </div>
            </div>
          </div>  */}

            {/* Medical Information */}
            {/* <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Medical Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Height (cm)</label>
                <input
                  type="number"
                  {...register('height')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter height in cm"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Weight (kg)</label>
                <input
                  type="number"
                  {...register('weight')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter weight in kg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-gray-700">Known Allergies</label>
                <textarea
                  {...register('allergies')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="List any known allergies (medications, food, environmental, etc.)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-gray-700">Current Medications</label>
                <textarea
                  {...register('current_medications')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="List current medications, dosages, and frequency"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-gray-700">Medical History</label>
                <textarea
                  {...register('medical_history')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Previous surgeries, chronic conditions, family history, etc."
                />
              </div>
            </div>
          </div> */}

            {/* Insurance Information */}
            {/* <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Insurance Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Insurance Provider</label>
                <input
                  {...register('insurance_provider')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter insurance provider name"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Insurance Number</label>
                <input
                  {...register('insurance_number')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter insurance policy number"
                />
              </div>
            </div>
          </div> */}

            {/* Visit Information */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Visit Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* <div>
                <label className="block mb-2 font-medium text-gray-700">Visit Type *</label>
                <select 
                  {...register('visit_type', { required: 'Visit type is required' })} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select visit type</option>
                  {visitTypes.map(type => (
                    <option key={type} value={type.toLowerCase()}>{type}</option>
                  ))}
                </select>
                {errors.visit_type && <span className="text-red-500 text-sm">{errors.visit_type.message}</span>}
              </div> */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Patient</label>
                  <select
                    {...register('visit_type', { required: 'Patient is required' })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onClick={patientDrawer.openDrawer}
                  >
                    <option value="" disabled hidden selected={existingPatients==null}>Select patient</option>
                    {existingPatients !== null ? <option value={existingPatients.uuid} selected> {existingPatients.name} </option> : null}
                  </select>
                  {errors.visit_type && <span className="text-red-500 text-sm">{errors.visit_type.message}</span>}
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">Referring Physician</label>
                  <input
                    {...register('referring_physician')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter referring physician name"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">Appointment Date</label>
                  <input
                    type="date"
                    disabled={true}
                    {...register('appointment_date')}
                    // value={}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">Appointment Time</label>
                  <input
                    type="time"
                    {...register('appointment_time')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium text-gray-700">Reason for Visit *</label>
                  <textarea
                    {...register('visit_reason', { required: 'Reason for visit is required' })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the reason for this visit, symptoms, concerns, etc."
                  />
                  {errors.visit_reason && <span className="text-red-500 text-sm">{errors.visit_reason.message}</span>}
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
                {isLoading ? 'Registering...' : 'Register Patient Visit'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Drawer
        isOpen={patientDrawer.isOpen}
        onClose={patientDrawer.closeDrawer}
        title="Product Order Confirmation"
        maxWidth="md"
        position="right"
      >
        {/* <div>
          <h1>Patient Details</h1>
        </div> */}
        <PatientListComponent 
        journey_board_id={journey_board_id}
          onPatientSelect={(patient: PatientModel) => {
            setExistingPatients(patient)
            patientDrawer.closeDrawer()
          }}
        />

      </Drawer>
    </>
    
  );
}

// Export default component for easy importing
export default VisitFormComponent;
