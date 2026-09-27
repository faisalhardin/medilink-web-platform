import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PaydayHome from '@components/compensation/PaydayHome';
import StaffPeriodDetail from '@components/compensation/StaffPeriodDetail';
import WageConfig from '@components/compensation/WageConfig';
import PeriodSummary from '@components/compensation/PeriodSummary';
import PeriodDetail from '@components/compensation/PeriodDetail';
import WorksheetList from '@components/compensation/WorksheetList';
import ContentCard from '@components/compensation/ContentCard';
import CompensationBreadcrumb, { CompensationNavProvider } from '@components/compensation/CompensationBreadcrumb';
import { getStorageUser } from '@utils/storage';
import { hasPermission } from '@utils/permissions';
import { PERMISSIONS } from 'constants/permissions';

const CompensationLayout = () => (
  <CompensationNavProvider>
    <div className="min-h-screen w-full flex-1 bg-[#F4F8FF] px-5 py-5 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="px-5 sm:px-6">
          <CompensationBreadcrumb />
        </div>
        <Outlet />
      </div>
    </div>
  </CompensationNavProvider>
);

const CompensationPage = () => {
  const { t } = useTranslation();
  if (!hasPermission(getStorageUser(), PERMISSIONS.compensation.read)) {
    return <Navigate to="/forbidden" replace state={{ message: t('compensation.forbidden') }} />;
  }
  return (
    <Routes>
      <Route element={<CompensationLayout />}>
        <Route index element={<ContentCard><PaydayHome /></ContentCard>} />
        <Route path="worksheets" element={<ContentCard><WorksheetList /></ContentCard>} />
        <Route path="worksheet/:worksheetId" element={<ContentCard><StaffPeriodDetail /></ContentCard>} />
        <Route path="wages" element={<ContentCard><WageConfig /></ContentCard>} />
        <Route path="summary" element={<PeriodSummary />} />
        <Route path="period/:periodId" element={<PeriodDetail />} />
        <Route path="*" element={<Navigate to="/payroll" replace />} />
      </Route>
    </Routes>
  );
};

export default CompensationPage;
