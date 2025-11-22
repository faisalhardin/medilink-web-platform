import { useTranslation } from 'react-i18next';
import { PatientRegistrationComponent } from "@components/PatientComponent";

const PatientRegistrationPage = () => {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8">
            {/* Header Section */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('patient.registerPatient')}</h1>
                <p className="text-gray-600">{t('patient.fillPatientInformation')}</p>
            </div>
            <PatientRegistrationComponent />
        </div>
    );
}

export default PatientRegistrationPage;