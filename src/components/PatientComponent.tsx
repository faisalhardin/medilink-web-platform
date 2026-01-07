
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { ListPatients, ListVisitsDetailed, RegisterPatientRequest } from "@requests/patient";
import { GetPatientParam, Patient, Patient as PatientModel, PatientVisitDetail, PatientVisitDetailed, PatientVisitsComponentProps, RegisterPatient as RegisterPatientModel } from "@models/patient";
import { EditorComponent } from "./EditorComponent";
import { isValidIndonesianNIK, isValidIndonesianPhone, normalizeIndonesianPhone } from "@utils/common";
import HorizontalScroll from "./HorizontalScroll";

interface PatientListComponentProps {
    journey_board_id?: number;
    onPatientSelect?: (patient: PatientModel) => void;
    isInDrawer?: boolean;
}

export function PatientListComponent({ onPatientSelect, isInDrawer = false }: PatientListComponentProps): JSX.Element {
    const { t } = useTranslation();
    const [patients, setPatients] = useState<PatientModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchParams, setSearchParams] = useState<Partial<GetPatientParam>>({});
    const [isSearchFormOpen, setIsSearchFormOpen] = useState(false);
    const limit = 10;
    const { register, handleSubmit } = useForm<GetPatientParam>();
    const listRef = useRef<HTMLDivElement>(null);

    // Track window size reactively
    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchPatients = useCallback(async (params: Partial<GetPatientParam>, page: number = 1, append: boolean = false) => {
        try {
            if (append) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }

            const requestParams: Partial<GetPatientParam> = {
                ...params,
                limit,
                offset: (page - 1) * limit
            };

            const data = await ListPatients(Object.keys(requestParams).length ? requestParams : null);
            
            if (append) {
                setPatients(prev => [...prev, ...data]);
            } else {
                setPatients(data);
            }

            // If returned data is less than limit, we've reached the end
            setHasMore(data.length === limit);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [limit]);

    // Infinite scroll for mobile/drawer
    useEffect(() => {
        if (isInDrawer || !isDesktop) {
            const handleScroll = () => {
                if (!listRef.current || isLoadingMore || !hasMore) return;

                const { scrollTop, scrollHeight, clientHeight } = listRef.current;
                // Load more when user scrolls to within 200px of bottom
                if (scrollHeight - scrollTop - clientHeight < 200) {
                    if (!isLoadingMore && hasMore) {
                        const nextPage = currentPage + 1;
                        setCurrentPage(nextPage);
                        fetchPatients(searchParams, nextPage, true);
                    }
                }
            };

            const listElement = listRef.current;
            if (listElement) {
                listElement.addEventListener('scroll', handleScroll);
                return () => listElement.removeEventListener('scroll', handleScroll);
            }
        }
    }, [isInDrawer, isDesktop, isLoadingMore, hasMore, currentPage, searchParams, fetchPatients]);

    const onSubmit = async (params: GetPatientParam) => {
        const filteredParams: Partial<GetPatientParam> = {};
        if (params.name) filteredParams.name = params.name;
        if (params.phone_number) filteredParams.phone_number = params.phone_number;
        if (params.date_of_birth) filteredParams.date_of_birth = params.date_of_birth;
        if (params.institution_id) filteredParams.institution_id = params.institution_id;

        setSearchParams(filteredParams);
        setCurrentPage(1);
        setHasMore(true);
        // Reset scroll position for infinite scroll
        if (listRef.current) {
            listRef.current.scrollTop = 0;
        }
        await fetchPatients(filteredParams, 1, false);
    };

    const handleNextPage = () => {
        if (hasMore && !isLoading) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchPatients(searchParams, nextPage, false);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1 && !isLoading) {
            const prevPage = currentPage - 1;
            setCurrentPage(prevPage);
            fetchPatients(searchParams, prevPage, false);
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
                {/* Header with Toggle Button (Mobile) */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('patient.searchPatients')}</h2>
                    <button
                        type="button"
                        onClick={() => setIsSearchFormOpen(!isSearchFormOpen)}
                        className="sm:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        aria-label="Toggle search form"
                    >
                        {isSearchFormOpen ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                    </button>
                </div>
                <form 
                    onSubmit={handleSubmit(onSubmit)} 
                    className={`space-y-3 sm:space-y-4 transition-all duration-300 ease-in-out ${
                        isSearchFormOpen ? 'block' : 'hidden sm:block'
                    }`}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('common.name')}</label>
                            <input
                                {...register('name')}
                                type="text"
                                placeholder={t('patient.enterPatientName')}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('patient.phoneNumber')}</label>
                            <input
                                {...register('phone_number')}
                                type="text"
                                placeholder={t('patient.enterPhoneNumber')}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('patient.dateOfBirth')}</label>
                            <input
                                {...register('date_of_birth')}
                                type="date"
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 text-white px-3 py-1.5 sm:py-2 text-sm sm:text-base rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="hidden sm:inline">{t('common.searching')}</span>
                                        <span className="sm:hidden">...</span>
                                    </div>
                                ) : (
                                    t('common.search')
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Patient List */}
            <div className="bg-white rounded-lg shadow-sm border h-auto border-gray-200 overflow-hidden">
                <div className={`border-b border-gray-200 ${isInDrawer ? 'px-3 py-3' : 'px-3 sm:px-6 py-3 sm:py-4'}`}>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('patient.patientResults')}</h3>
                </div>

                <div 
                    ref={listRef}
                    className={`${(isInDrawer || !isDesktop) ? 'max-h-[calc(100vh-300px)] overflow-y-auto' : ''}`}
                >
                    {patients.length === 0 ? (
                    <div className="p-6 sm:p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">{t('patient.noPatientsFound')}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">{t('common.tryAdjusting')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 h-full sm:h-auto">
                        {patients.map((patient, index) => (
                            <div
                                key={patient.uuid}
                                className={`hover:bg-gray-50 transition-colors cursor-pointer ${isInDrawer ? 'p-3' : 'p-3 sm:p-6'
                                    } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                onClick={() => onPatientSelect?.(patient)}
                            >
                                {/* Drawer Layout: Vertical Stack */}
                                {isInDrawer && (
                                    <div>
                                        <div className="flex items-start space-x-3 mb-3">

                                            {/* Patient Name and Badges */}
                                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                                <span className="text-sm sm:text-base font-semibold text-gray-900">
                                                    {patient.name}
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${patient.sex === 'male'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-pink-100 text-pink-800'
                                                        }`}>
                                                        {patient.sex === 'male' ? '♂' : '♀'}
                                                    </span>
                                            </div>
                                        </div>

                                        {/* Patient Details - Vertical Stack */}
                                        <div className="space-y-2 text-xs sm:text-sm text-gray-600">
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

                                            <div className="flex items-center space-x-3">
                                                <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span className="font-medium text-gray-700">Phone:</span>
                                                <span>{patient.phone_number || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* Action Button - Full Width on Mobile */}
                                        <div className="mt-4 flex flex-row gap-2">
                                            {onPatientSelect ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPatientSelect(patient);
                                                    }}
                                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                >
                                                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    {t('patient.selectPatientButton')}
                                                </button>
                                            ) : (
                                                <a
                                                    href={`/patient-detail/${patient.uuid}`}
                                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm sm:text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                >
                                                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    {t('common.view_details')}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Desktop Layout: Horizontal */}
                                {!isInDrawer && (
                                    <div 
                                        className="flex items-center justify-between"
                                    >
                                        <a 
                                            className="flex-1 lg:pointer-events-none lg:cursor-default" 
                                            href={`/patient-detail/${patient.uuid}`}
                                            onClick={(e) => {
                                                if (isDesktop) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-4">

                                                {/* Patient Info */}
                                                <div className="flex-1 min-w-0 mx-3">
                                                    <div className="flex items-center space-x-3 mb-1">
                                                        <p className="sm:text-sm text-lg font-semibold text-gray-900 truncate">
                                                            {patient.name}
                                                        </p>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.sex === 'male'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-pink-100 text-pink-800'
                                                            }`}>
                                                            {patient.sex === 'male' ? '♂' : '♀'} <span className="hidden md:inline ml-1">{patient.sex}</span>
                                                        </span>
                                                        {patient.blood_type && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                {patient.blood_type}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-1 text-xs text-gray-600">
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

                                                        <div className="flex items-center space-x-2">
                                                            <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            <span className="truncate">
                                                                {patient.phone_number || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        </a>

                                        {/* Action Button */}
                                        { isDesktop && <div className="flex-shrink-0 ml-4">
                                            {onPatientSelect ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPatientSelect(patient);
                                                    }}
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm sm:text-base leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
                                                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm sm:text-base leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                >
                                                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    {t('common.view_details')}
                                                </a>
                                            )}
                                        </div>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Infinite Scroll Loading Indicator */}
                {(isInDrawer || !isDesktop) && isLoadingMore && (
                    <div className="flex justify-center items-center py-4">
                        <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-2 text-xs sm:text-sm text-gray-600">Loading more...</span>
                    </div>
                )}

                {/* End of List Indicator */}
                {(isInDrawer || !isDesktop) && !hasMore && patients.length > 0 && (
                    <div className="text-center py-4 text-xs sm:text-sm text-gray-500">
                        No more patients to load
                    </div>
                )}
                </div>

                {/* Pagination Controls for Desktop */}
                {!isInDrawer && isDesktop && patients.length > 0 && (
                    <div className="border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                        <div className="text-xs sm:text-sm text-gray-600">
                            Page {currentPage} • Showing {patients.length} patient{patients.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1 || isLoading}
                                className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={handleNextPage}
                                disabled={!hasMore || isLoading}
                                className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>


    )
}

export const PatientVisitsComponent = ({ patient_uuid, limit, offset, patient, isInDrawer }: PatientVisitsComponentProps) => {
    const { t } = useTranslation();
    const [patientVisits, setPatientVisits] = useState<PatientVisitDetailed[]>([]);
    const [internalPatient, setPatient] = useState<Patient | null>(patient || null);
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

    useEffect(() => {
        if (!internalPatient && patient_uuid) {
            const fetchPatient = async () => {
                const _patients = await ListPatients({
                    patient_ids: patient_uuid,
                })
                if (_patients.length == 1) {
                    setPatient(_patients[0]);
                }
            }
            fetchPatient();
        }
    }, [patient_uuid, internalPatient]);

    const activeVisit = patientVisits.find(visit => visit.id === activeTab);


    // Helper function to format date
    const formatDateTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    // Helper function to format relative time
    const formatRelativeTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return formatDateTime(dateString);
    };

    // Helper function to get status color
    const getStatusColor = (_: PatientVisitDetail): string => {
        const isCompleted = true;// createTime.getTime() !== updateTime.getTime();

        return isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
    };

    // Helper function to get status text
    const getStatusText = (_: PatientVisitDetail): string => {

        const isCompleted = true;

        return isCompleted ? t('journey.completed') : t('journey.inProgress');
    };

    // Helper function to format currency
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
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
            <div className="p-6 w-full bg-white border border-t-0 shadow-md rounded-b-lg rounded-tr-lg">
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">No visits found</h3>
                    <p className="text-xs sm:text-sm text-gray-500">This patient hasn't had any visits yet.</p>
                </div>
            </div>
        );
    }


    return (
        <div className="p-6 w-full bg-white border border-t-0 shadow-md rounded-b-lg rounded-tr-lg">
            <div className="mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('patient.visitsOf', { name: internalPatient?.name || '' })}</h2>
                </div>
                {/* Horizontal Tabs */}
                <div className="border-b border-gray-200">
                    <HorizontalScroll 
                        className="pt-2" 
                        scrollBarPosition="top"
                        showScrollButtons={false}
                    >
                        <nav className={`-mb-px flex ${isInDrawer ? 'justify-start' : 'justify-center'} min-w-max ${isInDrawer ? 'px-0' : 'px-10'}`}>
                            {patientVisits.map((visit) => (
                                <div
                                    key={visit.id}
                                    onClick={() => setActiveTab(visit.id)}
                                    className={`w-24 min-w-24 max-w-24 py-2 px-1 border-b-4 font-medium transition-colors cursor-pointer ${activeTab === visit.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex flex-col items-center w-full">
                                        <span className="font-medium text-[clamp(0.625rem,0.5rem+0.5vw,0.875rem)] leading-tight text-center break-words">
                                            Visit #{visit.id}
                                        </span>
                                        <span className="text-[clamp(0.5rem,0.4rem+0.4vw,0.75rem)] text-gray-400 mt-1 text-center break-words">
                                            {formatDate(visit.create_time)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </HorizontalScroll>
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
                                    Started {formatDateTime(activeVisit.create_time)}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">
                                    {activeVisit.patient_journeypoints?.length} journey point{activeVisit.patient_journeypoints?.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Journey Points - Pinterest Style Wall */}
                    <div className="p-6">
                        {activeVisit.patient_journeypoints?.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-medium text-gray-900 mb-2">No journey points recorded</h3>
                                <p className="text-sm text-gray-500">This visit doesn't have any journey points yet.</p>
                            </div>
                        ) : (
                            <div
                                className={`w-full ${(activeVisit.patient_journeypoints == undefined || activeVisit.patient_journeypoints?.length === 1)
                                        ? 'max-w-2xl mx-auto'
                                        : isInDrawer ? 'columns-1 gap-6' : 'columns-1 md:columns-2 gap-6'
                                    }`}
                            >
                                {/* Products Card - Show first if products exist */}
                                {activeVisit.products && activeVisit.products.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 break-inside-avoid mb-6">
                                        {/* Card Header */}
                                        <div className="p-4 border-b border-gray-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.5 5h13a1 1 0 001-1V6H6" />
                                                            <circle cx="9" cy="20" r="1" stroke="currentColor" strokeWidth={2} fill="none"/>
                                                            <circle cx="17" cy="20" r="1" stroke="currentColor" strokeWidth={2} fill="none"/>
                                                        </svg>
                                                    </div>
                                                    <h4 className="text-base font-semibold text-gray-900">
                                                        {t('product.products_ordered')}
                                                    </h4>
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    {activeVisit.products.length} item{activeVisit.products.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Products List */}
                                        <div className="p-4">
                                            <div className="space-y-3">
                                                {activeVisit.products.map((product) => (
                                                    <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {product.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {product.quantity} {product.unit_type}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {formatCurrency(product.total_price)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Card Footer - Grand Total */}
                                        <div className="px-4 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-gray-900">Total</span>
                                                <span className="text-lg font-bold text-gray-900">
                                                    {formatCurrency(activeVisit.products.reduce((sum, product) => sum + product.total_price, 0))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeVisit.patient_journeypoints == undefined ? (
                                    <div className="text-center py-8">
                                        <div className="inline-flex items-center px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-500">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            No notes available
                                        </div>
                                    </div>
                                ) : (
                                    activeVisit.patient_journeypoints?.map((journeyPoint, index) => (
                                    <div
                                        key={index}
                                        className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 break-inside-avoid mb-6 ${activeVisit.patient_journeypoints?.length === 1 ? 'w-full' : ''
                                            }`}
                                    >
                                        {/* Card Header */}
                                        <div className="p-4 border-b border-gray-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <h4 className="text-base font-semibold text-gray-900">
                                                        {journeyPoint.name_mst_journey_point}
                                                    </h4>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(journeyPoint)}`}>
                                                    {getStatusText(journeyPoint)}
                                                </span>
                                            </div>

                                            {/* Meta Information */}
                                            <div className="space-y-2 text-xs text-gray-500">
                                                <div className="flex items-center space-x-2">
                                                    <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>Started {formatDateTime(journeyPoint?.create_time || '')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comment Box Content */}
                                        <div className="p-4">
                                            <div className="bg-gray-50 rounded-lg border border-gray-200 px-2 min-h-[100px] overflow-y-auto">
                                                <EditorComponent
                                                    id={`editor-${journeyPoint.id}`}
                                                    data={journeyPoint.notes}
                                                    onChange={(_) => {
                                                    }}
                                                    placeHolder="Jot here..."
                                                    readOnly={true}
                                                />
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="px-4 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100">
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>Last updated {formatRelativeTime(journeyPoint?.create_time || '')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface PatientRegistrationComponentProps {
    isInDrawer?: boolean;
    onPatientSelect?: (patient: PatientModel) => void;
}

export function PatientRegistrationComponent({ isInDrawer = false, onPatientSelect }: PatientRegistrationComponentProps) {
    const { t } = useTranslation();
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterPatientModel>();


    const normalizeRegisterPatientPayload = (data: RegisterPatientModel) => {
        return {
            ...data,
            phone_number: normalizeIndonesianPhone(data.phone_number),
        };
    }

    const onSubmit = async (data: RegisterPatientModel) => {
        const normalizePayload = normalizeRegisterPatientPayload(data);
        try {
            const resp = await RegisterPatientRequest(normalizePayload);
            onPatientSelect?.({
                uuid: resp.uuid,
                nik: resp.nik,
                name: resp.name,
                place_of_birth: resp.place_of_birth,
                date_of_birth: resp.date_of_birth,
                address: resp.address,
                sex: resp.sex,
                religion: resp.religion,
                phone_number: resp.phone_number,
                email: resp.email,
                emergency_contact_name: resp.emergency_contact_name,
                emergency_contact_phone: resp.emergency_contact_phone,
                emergency_contact_relationship: resp.emergency_contact_relationship,
                blood_type: resp.blood_type,
            });
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className={`w-full h-full ${isInDrawer ? 'p-3' : 'min-h-screen p-3'}`}>
            <div className={`${isInDrawer ? '' : 'mx-auto'} bg-white `}>


                {/* Form Card */}
                <div className={`${isInDrawer ? 'rounded-lg shadow-sm border border-gray-200' : 'rounded-2xl shadow-xl border border-gray-100'}`}>
                    <form onSubmit={handleSubmit(onSubmit)} className={`${isInDrawer ? 'p-3' : 'p-8'}`}>
                        <div className={`grid grid-cols-1 ${isInDrawer ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
                            {/* Name Field */}
                            <div className={`${isInDrawer ? '' : 'col-span-1 md:col-span-2'}`}>
                                <label className={`block text-sm font-semibold text-gray-700 ${isInDrawer ? 'mb-2' : 'mb-3'}`}>
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {t('patient.fullName')} *
                                    </span>
                                </label>
                                <input
                                    {...register('name', { required: t('patient.nameRequired') })}
                                    className={`w-full ${isInDrawer ? 'px-3 py-2' : 'px-4 py-3'} border border-gray-300 ${isInDrawer ? 'rounded-lg' : 'rounded-xl'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white`}
                                    placeholder={t('patient.enterPatientFullName')}
                                />
                                {errors.name && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            {/* NIK Field */}
                            <div className="w-full">
                                <label className={`block text-sm font-semibold text-gray-700 ${isInDrawer ? 'mb-2' : 'mb-3'}`}>
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                        </svg>
                                        {t('patient.nikFull')}
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    {...register('nik', {
                                        validate: (value) => {
                                            if (!value || value.trim() === '') {
                                                return true; // Allow empty NIK (optional field)
                                            }
                                            return isValidIndonesianNIK(value) || t('patient.invalidNIK', { defaultValue: 'Please enter a valid Indonesian NIK' });
                                        }
                                    })}
                                    className={`w-full ${isInDrawer ? 'px-3 py-2' : 'px-4 py-3'} border border-gray-300 ${isInDrawer ? 'rounded-lg' : 'rounded-xl'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white`}
                                    placeholder={t('patient.enterNikNumber')}
                                />
                                {errors.nik && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.nik?.message}
                                    </p>
                                )}
                            </div>

                            {/* Phone Number Field */}
                            <div className={`${isInDrawer ? '' : 'col-span-1 md:col-span-2'}`}>
                                <label className={`block text-sm font-semibold text-gray-700 ${isInDrawer ? 'mb-2' : 'mb-3'}`}>
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {t('patient.phoneNumber')}
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    {...(register('phone_number', {
                                        validate: (value) => {
                                            if (!value || value.trim() === '') {
                                                return true;
                                            }
                                            return isValidIndonesianPhone(value) || t('patient.invalidPhoneNumber', { defaultValue: 'Please enter a valid Indonesian phone number' });
                                        }
                                    }))}
                                    className={`w-full ${isInDrawer ? 'px-3 py-2' : 'px-4 py-3'} border ${errors.phone_number ? 'border-red-500' : 'border-gray-300'} ${isInDrawer ? 'rounded-lg' : 'rounded-xl'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white`}
                                    placeholder={t('patient.enterPhoneNumber')}
                                />
                                {errors.phone_number && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.phone_number.message}
                                    </p>
                                )}
                            </div>

                            {/* Sex Field */}
                            <div className="w-full">
                                <label className={`block text-sm font-semibold text-gray-700 ${isInDrawer ? 'mb-2' : 'mb-3'}`}>
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                        {t('common.gender')}
                                    </span>
                                </label>
                                <select
                                    {...register('sex')}
                                    className={`w-full ${isInDrawer ? 'px-3 py-2' : 'px-4 py-3'} border border-gray-300 ${isInDrawer ? 'rounded-lg' : 'rounded-xl'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white`}
                                >
                                    <option value="">{t('patient.selectGender')}</option>
                                    <option value="male">{t('common.male')}</option>
                                    <option value="female">{t('common.female')}</option>
                                    <option value="other">{t('common.other')}</option>
                                </select>
                            </div>

                            {/* Religion Field */}
                            <div className="w-full">
                                <label className={`block text-sm font-semibold text-gray-700 ${isInDrawer ? 'mb-2' : 'mb-3'}`}>
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {t('patient.religion')}
                                    </span>
                                </label>
                                <select
                                    {...register('religion')}
                                    className={`w-full ${isInDrawer ? 'px-3 py-2' : 'px-4 py-3'} border border-gray-300 ${isInDrawer ? 'rounded-lg' : 'rounded-xl'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white`}
                                >
                                    <option value="">{t('patient.selectReligion')}</option>
                                    <option value="islam">{t('patient.islam')}</option>
                                    <option value="katolik">{t('patient.katolik')}</option>
                                    <option value="protestan">{t('patient.protestan')}</option>
                                    <option value="budha">{t('patient.budha')}</option>
                                    <option value="hindu">{t('patient.hindu')}</option>
                                    <option value="other">{t('patient.other')}</option>
                                </select>
                            </div>

                            {/* Date of Birth Field */}
                            <div className="w-full">
                                <label className={`block text-sm font-semibold text-gray-700 ${isInDrawer ? 'mb-2' : 'mb-3'}`}>
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {t('patient.dateOfBirth')} *
                                    </span>
                                </label>
                                <input
                                    type="date"
                                    {...register('date_of_birth', { required: true })}
                                    className={`w-full ${isInDrawer ? 'px-3 py-2' : 'px-4 py-3'} border border-gray-300 ${isInDrawer ? 'rounded-lg' : 'rounded-xl'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white`}
                                />
                                {errors.date_of_birth && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {t('patient.dateOfBirthRequired')}
                                    </p>
                                )}
                            </div>

                            {/* Place of Birth Field */}
                            <div className={`${isInDrawer ? '' : 'col-span-1 md:col-span-2'}`}>
                                <label className={`block text-sm font-semibold text-gray-700 ${isInDrawer ? 'mb-2' : 'mb-3'}`}>
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {t('patient.placeOfBirth')}
                                    </span>
                                </label>
                                <textarea
                                    {...register('place_of_birth')}
                                    className={`w-full ${isInDrawer ? 'px-3 py-2' : 'px-4 py-3'} border border-gray-300 ${isInDrawer ? 'rounded-lg' : 'rounded-xl'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none`}
                                    rows={3}
                                    placeholder={t('patient.enterPlaceOfBirth')}
                                />
                            </div>

                            {/* Address Field */}
                            <div className={`${isInDrawer ? '' : 'col-span-1 md:col-span-2'}`}>
                                <label className={`block text-sm font-semibold text-gray-700 ${isInDrawer ? 'mb-2' : 'mb-3'}`}>
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        {t('common.address')}
                                    </span>
                                </label>
                                <textarea
                                    {...register('address')}
                                    className={`w-full ${isInDrawer ? 'px-3 py-2' : 'px-4 py-3'} border border-gray-300 ${isInDrawer ? 'rounded-lg' : 'rounded-xl'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none`}
                                    rows={3}
                                    placeholder={t('patient.enterCompleteAddress')}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className={`${isInDrawer ? 'mt-6' : 'mt-8'} flex justify-center`}>
                            <button
                                type="submit"
                                className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white ${isInDrawer ? 'px-6 py-3' : 'px-8 py-4'} ${isInDrawer ? 'rounded-lg' : 'rounded-xl'} font-semibold ${isInDrawer ? 'text-base' : 'text-lg'} shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-2`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>{t('patient.registerPatient')}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
