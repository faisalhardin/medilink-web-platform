
import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { InsertPatientVisit, ListPatients, ListVisitsDetailed, RegisterPatientRequest } from "@requests/patient";
import { GetPatientParam, InsertPatientVisitPayload, Patient as PatientModel, PatientPageProps, PatientVisit, PatientVisitDetail, PatientVisitDetailed, PatientVisitsComponentProps, RegisterPatient as RegisterPatientModel } from "@models/patient";
import { ListVisitsByPatient } from "@requests/patient"
import AdmitIcon from "assets/icons/AdmitIcon";
import { useModal } from "context/ModalContext";

interface PatientListComponentProps {
    journey_board_id?: number;
    onPatientSelect?: (patient: PatientModel) => void;
    isInDrawer?: boolean;
}

export function PatientListComponent({ journey_board_id, onPatientSelect, isInDrawer = false }: PatientListComponentProps): JSX.Element {
    const [patients, setPatients] = useState<PatientModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { closeModal } = useModal();
    const { register, handleSubmit, formState: { errors } } = useForm<GetPatientParam>();

    const onSubmit = async (params: GetPatientParam) => {
        try {
            setIsLoading(true);
            const filteredParams: Partial<GetPatientParam> = {};
            if (params.name) filteredParams.name = params.name;
            if (params.nik) filteredParams.nik = params.nik;
            if (params.date_of_birth) filteredParams.date_of_birth = params.date_of_birth;
            if (params.institution_id) filteredParams.institution_id = params.institution_id;

            const data = await ListPatients(Object.keys(filteredParams).length ? filteredParams : null);
            setPatients(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };   

    // Helper function to calculate age from date of birth
    const calculateAge = (dateOfBirth: string): number => {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Helper function to format date
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    return (
        <div className={`w-full h-full overflow-auto bg-gray-50 ${isInDrawer ? 'p-3' : 'p-3 sm:p-6'}`}>
            {/* Search Form */}
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isInDrawer ? 'p-3 mb-4' : 'p-3 sm:p-6 mb-4 sm:mb-6'}`}>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Search Patients</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                {...register('name')}
                                type="text"
                                placeholder="Enter patient name"
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">NIK</label>
                            <input
                                {...register('nik')}
                                type="text"
                                placeholder="Enter NIK"
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input
                                {...register('date_of_birth')}
                                type="date"
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 text-white px-3 py-1.5 sm:py-2 text-sm rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="hidden sm:inline">Searching...</span>
                                        <span className="sm:hidden">...</span>
                                    </div>
                                ) : (
                                    'Search'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Patient List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className={`border-b border-gray-200 ${isInDrawer ? 'px-3 py-3' : 'px-3 sm:px-6 py-3 sm:py-4'}`}>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Patient Results</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {patients.length} patient{patients.length !== 1 ? 's' : ''} found
                    </p>
                </div>
                
                {patients.length === 0 ? (
                    <div className="p-6 sm:p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">No patients found</h3>
                        <p className="text-xs sm:text-sm text-gray-500">Try adjusting your search criteria</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {patients.map((patient, index) => (
                            <div 
                                key={patient.uuid} 
                                className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                                    isInDrawer ? 'p-3' : 'p-3 sm:p-6'
                                } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                onClick={() => onPatientSelect?.(patient)}
                            >
                                {/* Drawer Layout: Vertical Stack */}
                                {isInDrawer && (
                                <div>
                                    <div className="flex items-start space-x-3 mb-3">
                                        {/* Patient Avatar */}
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-base">
                                                {patient.name.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        
                                        {/* Patient Name and Badges */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base font-semibold text-gray-900 mb-2">
                                                {patient.name}
                                            </h4>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    patient.sex === 'male' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-pink-100 text-pink-800'
                                                }`}>
                                                    {patient.sex === 'male' ? '♂' : '♀'} {patient.sex}
                                                </span>
                                                {patient.blood_type && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        {patient.blood_type}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Patient Details - Vertical Stack */}
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center space-x-3">
                                            <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="font-medium text-gray-700">NIK:</span>
                                            <span>{patient.nik}</span>
                                        </div>
                                        
                                        <div className="flex items-center space-x-3">
                                            <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
                                            </svg>
                                            <span className="font-medium text-gray-700">Age:</span>
                                            <span>
                                                {patient.date_of_birth ? (
                                                    <>
                                                        {formatDate(patient.date_of_birth)} 
                                                        <span className="text-gray-500 ml-1">
                                                            ({calculateAge(patient.date_of_birth)} years)
                                                        </span>
                                                    </>
                                                ) : 'N/A'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center space-x-3">
                                            <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="font-medium text-gray-700">Born:</span>
                                            <span>{patient.place_of_birth || 'N/A'}</span>
                                        </div>
                                        
                                        {patient.phone_number && (
                                            <div className="flex items-center space-x-3">
                                                <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span className="font-medium text-gray-700">Phone:</span>
                                                <span>{patient.phone_number}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Action Button - Full Width on Mobile */}
                                    <div className="mt-4">
                                        {onPatientSelect ? (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPatientSelect(patient);
                                                }}
                                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                            >
                                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Select Patient
                                            </button>
                                        ) : (
                                            <a 
                                                href={`/patient-detail/${patient.uuid}`}
                                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                            >
                                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View Details
                                            </a>
                                        )}
                                    </div>
                                </div>
                                )}

                                {/* Desktop Layout: Horizontal */}
                                {!isInDrawer && (
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-4">
                                            {/* Patient Avatar */}
                                            <div className="flex-shrink-0">
                                                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                    {patient.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            
                                            {/* Patient Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h4 className="text-lg font-semibold text-gray-900 truncate">
                                                        {patient.name}
                                                    </h4>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        patient.sex === 'male' 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-pink-100 text-pink-800'
                                                    }`}>
                                                        {patient.sex === 'male' ? '♂' : '♀'} {patient.sex}
                                                    </span>
                                                    {patient.blood_type && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            {patient.blood_type}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center space-x-2">
                                                        <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        <span className="truncate">NIK: {patient.nik}</span>
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-2">
                                                        <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="truncate">
                                                            {patient.date_of_birth ? (
                                                                <>
                                                                    {formatDate(patient.date_of_birth)} 
                                                                    <span className="text-gray-400 ml-1">
                                                                        ({calculateAge(patient.date_of_birth)} years)
                                                                    </span>
                                                                </>
                                                            ) : 'N/A'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-2">
                                                        <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span className="truncate">
                                                            {patient.place_of_birth || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {patient.phone_number && (
                                                    <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                                                        <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        <span className="truncate">{patient.phone_number}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Action Button */}
                                    <div className="flex-shrink-0 ml-4">
                                        {onPatientSelect ? (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPatientSelect(patient);
                                                }}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                            >
                                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Select
                                            </button>
                                        ) : (
                                            <a 
                                                href={`/patient-detail/${patient.uuid}`}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                            >
                                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View Details
                                            </a>
                                        )}
                                    </div>
                                </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export const PatientVisitsComponent = ({ patient_uuid, limit, offset }: PatientVisitsComponentProps) => {
    const [patientVisits, setPatientVisits] = useState<PatientVisitDetailed[]>([]);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchVisits = async () => {
            try {
                setIsLoading(true);
                const response = await ListVisitsDetailed({
                    patient_uuid: patient_uuid,
                    limit: limit,
                    offset: offset,
                });
                // Handle the new API response structure
                setPatientVisits(response);
                // Set first visit as active by default
                if (response.length > 0) {
                    setActiveTab(response[0].id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (patient_uuid) {
            fetchVisits();
        }
    }, [patient_uuid]);

    // Helper function to format date
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper function to format relative time
    const formatRelativeTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return formatDate(dateString);
    };

    // Helper function to get status color
    const getStatusColor = (journeyPoint: PatientVisitDetail): string => {
        const isCompleted = true;// createTime.getTime() !== updateTime.getTime();
        
        return isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
    };

    // Helper function to get status text
    const getStatusText = (journeyPoint: PatientVisitDetail): string => {

        const isCompleted = true;
        
        return isCompleted ? 'Completed' : 'In Progress';
    };

    if (isLoading) {
        return (
            <div className="p-6 w-full">
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-600">Loading visits...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (patientVisits.length === 0) {
        return (
            <div className="p-6 w-full">
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No visits found</h3>
                    <p className="text-sm text-gray-500">This patient hasn't had any visits yet.</p>
                </div>
            </div>
        );
    }

    const activeVisit = patientVisits.find(visit => visit.id === activeTab);

    return (
        <div className="p-6 w-full">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Visits</h2>
                
                {/* Horizontal Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {patientVisits.map((visit) => (
                            <button
                                key={visit.id}
                                onClick={() => setActiveTab(visit.id)}
                                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === visit.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">
                                        Visit #{visit.id}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        {formatDate(visit.create_time)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Active Visit Content */}
            {activeVisit && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Visit Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Visit #{activeVisit.id}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Started {formatDate(activeVisit.create_time)}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">
                                    {activeVisit.patient_journeypoints?.length} journey point{activeVisit.patient_journeypoints?.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Journey Points */}
                    <div className="divide-y divide-gray-200">
                        {activeVisit.patient_journeypoints?.length === 0 ? (
                            <div className="p-6 text-center">
                                <div className="text-gray-400 mb-2">
                                    <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-500">No journey points recorded for this visit.</p>
                            </div>
                        ) : (
                            activeVisit.patient_journeypoints?.map((journeyPoint, index) => (
                                <div key={journeyPoint.id} className="p-6">
                                    <div className="flex items-start space-x-4">
                                        {/* Journey Point Icon */}
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                {index + 1}
                                            </div>
                                        </div>
                                        
                                        {/* Journey Point Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-base font-semibold text-gray-900">
                                                    {journeyPoint.name_mst_journey_point}
                                                </h4>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(journeyPoint)}`}>
                                                    {getStatusText(journeyPoint)}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                                <div className="flex items-center space-x-2">
                                                    <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-medium text-gray-700">Started:</span>
                                                    <span>{formatDate(journeyPoint.create_time)}</span>
                                                </div>
                                                
                                                <div className="flex items-center space-x-2">
                                                    <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-medium text-gray-700">Updated:</span>
                                                    <span>{formatRelativeTime(journeyPoint.create_time)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                                                <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                <span className="font-medium text-gray-700">Journey Point ID:</span>
                                                <span>{journeyPoint.journey_point_id}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function PatientRegistrationComponent() {
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterPatientModel>();

    const onSubmit = async (data: RegisterPatientModel) => {
        try {
            const resp = await RegisterPatientRequest(data);
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="p-6 w-full min-h-screen">
            <h3 className="font-semibold mb-6">Register New Patient</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 rounded-lg text-sm shadow w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block mb-2 font-medium">Name</label>
                        <input
                            {...register('name', { required: 'Name is required' })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>
                    <div className="w-full">
                        <label className="block mb-2 font-medium">Nomor Induk Kependudukan</label>
                        <input
                            type="number"
                            {...register('nik')}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="w-full">
                        <label className="block mb-2 font-medium">Sex</label>
                        <select {...register('sex')} className="w-full p-2 border rounded">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="w-full">
                        <label className="block mb-2 font-medium">Religion</label>
                        <select {...register('religion')} className="w-full p-2 border rounded">
                            <option value="" disabled selected hidden>select</option>
                            <option value="islam">Islam</option>
                            <option value="katolik">Katolik</option>
                            <option value="protestan">Protestan</option>
                            <option value="budha">Budha</option>
                            <option value="hindu">Hindu</option>
                            <option value="other">Lainnya</option>
                        </select>
                    </div>
                    <div className="w-full">
                        <label className="block mb-2 font-medium">Date of Birth</label>
                        <input
                            type="date"
                            {...register('date_of_birth', { required: true })}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block mb-2 font-medium">Place of Birth</label>
                        <textarea
                            {...register('place_of_birth')}
                            className="w-full p-2 border rounded"
                            rows={3}
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block mb-2 font-medium">Address</label>
                        <textarea
                            {...register('address')}
                            className="w-full p-2 border rounded"
                            rows={3}
                        />
                    </div>
                </div>
                <div className="mt-6">
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Register Patient
                    </button>
                </div>
                {errors.name && <span className="text-red-500">{errors.name.message}</span>}
            </form>
        </div>
    );
}
