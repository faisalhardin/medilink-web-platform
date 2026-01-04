import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Patient } from '@models/patient';
import { formatDate, formatDateForAPI, formatDateTimeForAPI, normalizeIndonesianPhone } from '@utils/common';
import { UpdatePatient } from '@requests/patient';

interface PatientDetailInfoProps {
    patient: Patient | null;
    onUpdate?: (updatedPatient: Patient) => void;
}

const PatientDetailInfo = ({ patient, onUpdate }: PatientDetailInfoProps) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, reset } = useForm<Partial<Patient>>({
        defaultValues: patient ? {
            ...patient,
            date_of_birth: patient.date_of_birth ? formatDateForAPI(patient.date_of_birth) : undefined,
        } : {}
    });

    useEffect(() => {
        if (patient) {
            reset({
                ...patient,
                date_of_birth: patient.date_of_birth ? formatDateForAPI(patient.date_of_birth) : undefined
            });
        }
    }, [patient, reset]);

    const handleEdit = () => {
        setIsEditing(true);
        if (patient) {
            reset({
                ...patient,
                date_of_birth: patient.date_of_birth ? formatDateForAPI(patient.date_of_birth) : undefined
            });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        reset(patient || {});
    };

    const onSubmit = async (data: Partial<Patient>) => {
        if (!patient?.uuid) return;

        data.uuid = patient.uuid;
        
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
            onUpdate?.(updateData as Patient);
        } catch (error) {
            console.error('Error updating patient:', error);
            alert(t('patient.updateError', 'Failed to update patient information. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!patient) {
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
        <div className="bg-white overflow-hidden p-6 border border-t-0 shadow-md rounded-b-lg rounded-tr-lg">
            {/* Header */}
            <div className="border-b pb-6 border-gray-200 bg-gray-10 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
                {!isEditing && (
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
                                            defaultValue={patient.date_of_birth ? formatDateTimeForAPI(patient.date_of_birth) : ''}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-900">{formatDate(patient.date_of_birth || '')}</p>
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
                                    ) : (
                                        patient.place_of_birth ? (
                                            <p className="text-sm text-gray-900">{patient.place_of_birth}</p>
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
                                    ) : (
                                        patient.sex ? (
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                patient.sex === 'male' 
                                                    ? 'bg-blue-100 text-blue-800' 
                                                    : 'bg-pink-100 text-pink-800'
                                            }`}>
                                                {patient.sex === 'male' ? '♂ Male' : '♀ Female'}
                                            </span>
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
                                    ) : (
                                        patient.address ? (
                                            <p className="text-sm text-gray-900">{patient.address}</p>
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
                                    ) : (
                                        patient.phone_number ? (
                                            <p className="text-sm text-gray-900">
                                                {patient.phone_number}
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
        </div>
    );
};

export default PatientDetailInfo;

