import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GetInsitution } from "@requests/institution";
import { Institution as InstitutionModel } from "@models/institution";
import {
  PencilSquareIcon,
  ShoppingBagIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const InstitutionProfileComponent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [institution, setInstitution] = useState<InstitutionModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    GetInsitution()
      .then((response) => response.data)
      .then((data) => {
        setInstitution(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleManageProducts = () => {
    navigate('/inventory');
  };

  const handleEditInstitution = () => {
    console.log("Edit institution profile");
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 w-full">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 w-full space-y-6">
      {/* Header Section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900 truncate">
                {institution?.name || 'Institution'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                ID: <span className="font-mono">{institution?.id || '—'}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleEditInstitution}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <PencilSquareIcon className="h-5 w-5" />
              {t('institution.editInstitution')}
            </button>
            <button
              onClick={handleManageProducts}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ShoppingBagIcon className="h-5 w-5" />
              {t('institution.manageProducts')}
            </button>
          </div>
        </div>
      </div>

      {/* Institution Details Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">Institution Details</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Institution Name</p>
              <p className="mt-1 text-base text-gray-900">{institution?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Institution ID</p>
              <p className="mt-1 font-mono text-base text-gray-900">{institution?.id || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Staff Count</p>
              <p className="mt-1 text-base text-gray-900">
                {institution?.staff_number ?? '—'} / {institution?.max_staff ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionProfileComponent;
