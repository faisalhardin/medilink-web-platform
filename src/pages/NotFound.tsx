import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <p className="text-6xl font-extrabold text-gray-300 mb-2">
            {t('errors.notFound.code', '404')}
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('errors.notFound.title', 'Page Not Found')}
          </h2>
          <p className="text-sm text-gray-600 mb-8">
            {t('errors.notFound.subtitle', "The page you're looking for doesn't exist or has been moved.")}
          </p>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-6">
          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/institution', { replace: true })}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              {t('errors.notFound.goToDashboard', 'Go to Dashboard')}
            </button>

            <button
              onClick={() => navigate(-1)}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              {t('errors.notFound.goBack', 'Go Back')}
            </button>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              {t('errors.notFound.quickLinks', 'Quick Links')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Institution', path: '/institution' },
                { label: 'Patients', path: '/patient' },
                { label: 'Inventory', path: '/inventory' },
                { label: 'Recall', path: '/recall' },
              ].map(link => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                >
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
