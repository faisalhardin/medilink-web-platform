import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export type CompensationCrumb = {
  label: string;
  to?: string;
};

export type CompensationNavState = {
  via?: 'worksheets' | 'period' | 'summary';
  periodId?: string;
  periodLabel?: string;
};

type StoredTrail = {
  pathname: string;
  crumbs: CompensationCrumb[];
};

type CompensationNavContextValue = {
  trail: StoredTrail | null;
  setTrail: (trail: StoredTrail | null) => void;
};

const CompensationNavContext = createContext<CompensationNavContextValue | null>(null);

export const CompensationNavProvider = ({ children }: { children: ReactNode }) => {
  const [trail, setTrail] = useState<StoredTrail | null>(null);
  const value = useMemo(() => ({ trail, setTrail }), [trail]);
  return <CompensationNavContext.Provider value={value}>{children}</CompensationNavContext.Provider>;
};

export const useCompensationTrail = (crumbs: CompensationCrumb[] | null) => {
  const { pathname } = useLocation();
  const setTrail = useContext(CompensationNavContext)?.setTrail;
  const serialized = crumbs === null ? '' : JSON.stringify(crumbs);

  useEffect(() => {
    if (!setTrail) return;
    setTrail(serialized ? { pathname, crumbs: JSON.parse(serialized) as CompensationCrumb[] } : null);
    return () => setTrail(null);
  }, [pathname, serialized, setTrail]);
};

const Chevron = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#C5D0E0]">
    <path
      fillRule="evenodd"
      d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
      clipRule="evenodd"
    />
  </svg>
);

const defaultTrail = (
  pathname: string,
  state: CompensationNavState | null,
  t: (key: string) => string,
): CompensationCrumb[] => {
  const root = { label: t('compensation.title'), to: '/payroll' };
  const normalized = pathname.replace(/\/$/, '') || '/payroll';

  if (normalized === '/payroll') {
    return [{ label: t('compensation.title') }];
  }
  if (normalized === '/payroll/worksheets') {
    return [root, { label: t('compensation.worksheets') }];
  }
  if (normalized.startsWith('/payroll/worksheet/')) {
    if (state?.via === 'period' && state.periodId) {
      return [
        root,
        { label: state.periodLabel || t('compensation.period'), to: `/payroll/period/${state.periodId}` },
      ];
    }
    if (state?.via === 'summary') {
      const periodId = state.periodId ?? '';
      const crumbs: CompensationCrumb[] = [root];
      if (periodId) {
        crumbs.push({
          label: state.periodLabel || t('compensation.period'),
          to: `/payroll/period/${periodId}`,
        });
      }
      crumbs.push({
        label: t('compensation.paymentSummary'),
        to: periodId ? `/payroll/summary?period=${periodId}` : '/payroll/summary',
      });
      return crumbs;
    }
    return [root, { label: t('compensation.worksheets'), to: '/payroll/worksheets' }];
  }
  if (normalized === '/payroll/wages') {
    return [root, { label: t('compensation.wageConfig') }];
  }
  if (normalized === '/payroll/summary') {
    return [root, { label: t('compensation.paymentSummary') }];
  }
  if (normalized.startsWith('/payroll/period/')) {
    return [root, { label: t('compensation.period') }];
  }
  return [root];
};

const CompensationBreadcrumb = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const stored = useContext(CompensationNavContext)?.trail ?? null;
  const crumbs =
    stored && stored.pathname === location.pathname
      ? stored.crumbs
      : defaultTrail(location.pathname, location.state as CompensationNavState | null, t);

  return (
    <nav aria-label={t('compensation.breadcrumb')} className="mb-3">
      <ol className="flex min-h-5 flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] leading-5">
        {crumbs.map((crumb, index) => {
          const isCurrent = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${crumb.to ?? 'current'}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? <Chevron /> : null}
              {isCurrent || !crumb.to ? (
                <span
                  className="max-w-[14rem] truncate font-medium text-[#0D1B2A] sm:max-w-xs"
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="max-w-[14rem] truncate text-[#5C6B80] outline-none hover:text-[#0B57D0] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#0B57D0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F8FF] sm:max-w-xs"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default CompensationBreadcrumb;
