import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Patient } from '@models/patient';
import { formatDate, formatDateForAPI, formatDateTimeForAPI, normalizeIndonesianPhone } from '@utils/common';
import { GetPatientByUUID, UpdatePatient } from '@requests/patient';

export interface PatientDetailInfoProps {
    patient: Patient | null;
    onUpdate?: (updatedPatient: Patient) => void;
    isModal?: boolean;
}

const ShimmerBar = ({ className }: { className: string }) => (
    <div
        className={`relative overflow-hidden rounded bg-gray-200 ${className}`}
        aria-hidden
    >
        <div className="shimmer-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
    </div>
);

const PatientDetailInfoSkeleton = () => (
    <>
        <div className="border-b border-gray-200 bg-gray-10 pb-6">
            <ShimmerBar className="h-7 w-48" />
        </div>
        <div className="py-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <ShimmerBar className="mb-4 h-4 w-40" />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={`personal-${i}`} className="space-y-1">
                            <ShimmerBar className="h-3 w-24" />
                            <ShimmerBar className="h-5 w-full max-w-[12rem]" />
                        </div>
                    ))}
                </div>
                <div className="space-y-4">
                    <ShimmerBar className="mb-4 h-4 w-44" />
                    <div className="space-y-1">
                        <ShimmerBar className="h-3 w-20" />
                        <ShimmerBar className="h-16 w-full" />
                    </div>
                    <div className="space-y-1">
                        <ShimmerBar className="h-3 w-28" />
                        <ShimmerBar className="h-5 w-40" />
                    </div>
                </div>
            </div>
        </div>
    </>
);

export const PatientDetailInfoContent = ({ patient, onUpdate, isModal = false }: PatientDetailInfoProps) => {
    const { t } = useTranslation();
    const [displayPatient, setDisplayPatient] = useState<Patient | null>(patient);
    const [isFetching, setIsFetching] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, reset } = useForm<Partial<Patient>>({
        defaultValues: patient ? {
            ...patient,
            date_of_birth: patient.date_of_birth ? formatDateForAPI(patient.date_of_birth) : undefined,
        } : {}
    });

    useEffect(() => {
        if (!isModal) {
            setDisplayPatient(patient);
        }
    }, [isModal, patient]);

    useEffect(() => {
        if (!isModal) return;

        const uuid = patient?.uuid;
        if (!uuid) {
            setDisplayPatient(patient);
            return;
        }

        // Keep existing patient visible while soft-refreshing
        if (patient) {
            setDisplayPatient(patient);
        }

        let cancelled = false;
        const fetchPatient = async () => {
            setIsFetching(true);
            if (cancelled) return;
            try {
                const fullPatient = await GetPatientByUUID(uuid);
                if (cancelled) return;
                setDisplayPatient(fullPatient);
                onUpdate?.(fullPatient);
            } catch (error) {
                console.error('Error fetching patient:', error);
                if (!cancelled) setDisplayPatient(patient);
            } finally {
                if (!cancelled) setIsFetching(false);
            }
        };

        void fetchPatient();
        return () => {
            cancelled = true;
        };
    }, [isModal, patient?.uuid]);

    useEffect(() => {
        if (displayPatient) {
            reset({
                ...displayPatient,
                date_of_birth: displayPatient.date_of_birth ? formatDateForAPI(displayPatient.date_of_birth) : undefined
            });
        }
    }, [displayPatient, reset]);

    const handleEdit = () => {
        setIsEditing(true);
        if (displayPatient) {
            reset({
                ...displayPatient,
                date_of_birth: displayPatient.date_of_birth ? formatDateForAPI(displayPatient.date_of_birth) : undefined
            });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        reset(displayPatient || {});
    };

    const onSubmit = async (data: Partial<Patient>) => {
        if (!displayPatient?.uuid) return;

        data.uuid = displayPatient.uuid;

        setIsLoading(true);
        try {
            // Normalize phone number if provided
            const updateData = {
                ...data,
                ...(data.date_of_birth && { date_of_birth: formatDateForAPI(data.date_of_birth) }),
                ...(data.phone_number && { phone_number: normalizeIndonesianPhone(data.phone_number) })
            };

            await UpdatePatient(updateData);
            setIsEditing(false);
            setDisplayPatient((prev) => ({ ...prev, ...updateData } as Patient));
            onUpdate?.(updateData as Patient);
        } catch (error) {
            console.error('Error updating patient:', error);
            alert(t('patient.updateError', 'Failed to update patient information. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    // No patient yet while fetching — keep modal size stable with skeleton
    if (isFetching && !displayPatient) {
        return <PatientDetailInfoSkeleton />;
    }

    if (!displayPatient) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-500">No patient information available</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="border-b pb-6 border-gray-200 bg-gray-10 flex items-center justify-between">
                {isEditing ? (
                    <input
                        type="text"
                        {...register('name', { required: true })}
                        defaultValue={displayPatient.name}
                        className="text-xl font-semibold text-gray-900 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('patient.name', 'Patient Name')}
                    />
                ) : isFetching ? (
                    <ShimmerBar className="h-7 w-48" />
                ) : (
                    <h2 className="text-xl font-semibold text-gray-900 truncate">{displayPatient.name}</h2>
                )}
                {!isModal && !isEditing && (
                    <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {t('common.edit', 'Edit')}
                    </button>
                )}
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Personal Information</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('patient.dateOfBirth')}</label>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            {...register('date_of_birth')}
                                            defaultValue={displayPatient.date_of_birth ? formatDateTimeForAPI(displayPatient.date_of_birth) : ''}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    ) : isFetching ? (
                                        <ShimmerBar className="h-5 w-36" />
                                    ) : (
                                        <p className="text-sm text-gray-900">{formatDate(displayPatient.date_of_birth || '')}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('patient.placeOfBirth', 'Place of Birth')}</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            {...register('place_of_birth')}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={t('patient.placeOfBirth', 'Place of Birth')}
                                        />
                                    ) : isFetching ? (
                                        <ShimmerBar className="h-5 w-40" />
                                    ) : (
                                        displayPatient.place_of_birth ? (
                                            <p className="text-sm text-gray-900">{displayPatient.place_of_birth}</p>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">-</p>
                                        )
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('patient.sex', 'Sex')}</label>
                                    {isEditing ? (
                                        <select
                                            {...register('sex')}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select...</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    ) : isFetching ? (
                                        <ShimmerBar className="h-6 w-20 rounded-full" />
                                    ) : (
                                        displayPatient.sex ? (
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${displayPatient.sex === 'male'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-pink-100 text-pink-800'
                                                }`}>
                                                {displayPatient.sex === 'male' ? '♂ Male' : '♀ Female'}
                                            </span>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">-</p>
                                        )
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('patient.occupation', 'Occupation')}</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            {...register('occupation')}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={t('patient.enterOccupation', 'Enter occupation')}
                                        />
                                    ) : isFetching ? (
                                        <ShimmerBar className="h-5 w-44" />
                                    ) : (
                                        displayPatient.occupation ? (
                                            <p className="text-sm text-gray-900">{displayPatient.occupation}</p>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">-</p>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Contact Information</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('patient.address', 'Address')}</label>
                                    {isEditing ? (
                                        <textarea
                                            {...register('address')}
                                            rows={3}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            placeholder={t('patient.address', 'Address')}
                                        />
                                    ) : isFetching ? (
                                        <div className="space-y-2">
                                            <ShimmerBar className="h-4 w-full" />
                                            <ShimmerBar className="h-4 w-4/5" />
                                            <ShimmerBar className="h-4 w-2/3" />
                                        </div>
                                    ) : (
                                        displayPatient.address ? (
                                            <p className="text-sm text-gray-900">{displayPatient.address}</p>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">-</p>
                                        )
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('patient.phoneNumber', 'Phone Number')}</label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            {...register('phone_number')}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={t('patient.phoneNumber', 'Phone Number')}
                                        />
                                    ) : isFetching ? (
                                        <ShimmerBar className="h-5 w-40" />
                                    ) : (
                                        displayPatient.phone_number ? (
                                            <p className="text-sm text-gray-900">
                                                {displayPatient.phone_number}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">-</p>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('common.saving', 'Saving...')}
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {t('common.save', 'Save')}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </form>
        </>
    );
};

const PatientDetailInfo = ({ patient, onUpdate }: PatientDetailInfoProps) => {
    return (
        <div className="bg-white overflow-hidden p-6 border border-t-0 shadow-md rounded-b-lg rounded-tr-lg">
            <PatientDetailInfoContent patient={patient} onUpdate={onUpdate} />
        </div>
    );
};

export default PatientDetailInfo;
