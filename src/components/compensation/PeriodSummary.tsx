import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { formatPrice } from '@utils/common';
import { useCompensationTrail, type CompensationNavState } from '@components/compensation/CompensationBreadcrumb';
import { GetCompensationPeriod, ListPeriodStaff } from '@requests/compensationPeriod';
import PeriodLifecycleActions from '@components/compensation/PeriodLifecycleActions';
import { ListWorksheetsForPeriod } from '@requests/worksheet';
import type { CompensationPeriod, CompensationPeriodStatus, StaffPeriodRow, Worksheet } from '@models/compensation';

const statusColor = (status: CompensationPeriodStatus): 'default' | 'warning' | 'success' | 'info' => {
  if (status === 'open') return 'info';
  if (status === 'draft') return 'warning';
  if (status === 'finalized') return 'success';
  return 'default';
};

const PeriodSummary = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const periodId = searchParams.get('period') ?? '';
  const [period, setPeriod] = useState<CompensationPeriod | null>(null);
  const [staff, setStaff] = useState<(StaffPeriodRow & { worksheet_uuid?: string })[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!periodId) return;
    let cancelled = false;
    (async () => {
      try {
        const [p, staffResp, worksheets] = await Promise.all([
          GetCompensationPeriod(periodId),
          ListPeriodStaff(periodId),
          ListWorksheetsForPeriod(periodId),
        ]);
        if (cancelled) return;
        const byStaff = new Map<string, Worksheet>();
        worksheets.forEach((w) => byStaff.set(w.staff_id, w));
        setPeriod(p);
        setStaff(
          (staffResp.staff ?? []).map((row) => ({
            ...row,
            roles: row.roles ?? [],
            worksheet_uuid: byStaff.get(row.staff_id)?.uuid,
          }))
        );
      } catch {
        if (!cancelled) setError(t('compensation.loadError'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [periodId, t]);

  const handlePeriodChange = (next: CompensationPeriod) => {
    setPeriod(next);
    void (async () => {
      try {
        const [staffResp, worksheets] = await Promise.all([
          ListPeriodStaff(next.uuid),
          ListWorksheetsForPeriod(next.uuid),
        ]);
        const byStaff = new Map<string, Worksheet>();
        worksheets.forEach((w) => byStaff.set(w.staff_id, w));
        setStaff(
          (staffResp.staff ?? []).map((row) => ({
            ...row,
            roles: row.roles ?? [],
            worksheet_uuid: byStaff.get(row.staff_id)?.uuid,
          }))
        );
      } catch {
        setError(t('compensation.loadError'));
      }
    })();
  };

  useCompensationTrail(
    period
      ? [
          { label: t('compensation.title'), to: '/payroll' },
          { label: period.label, to: `/payroll/period/${period.uuid}` },
          { label: t('compensation.paymentSummary') },
        ]
      : null,
  );

  if (!periodId) {
    return <Alert severity="warning">{t('compensation.noPeriod')}</Alert>;
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!period) {
    return <Typography>{t('common.loading')}</Typography>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900">{t('compensation.paymentSummary')}</h1>
                <Chip size="small" label={t(`compensation.status.${period.status}`)} color={statusColor(period.status)} />
              </div>
              <p className="text-sm text-gray-500">{period.label}</p>
            </div>
            <PeriodLifecycleActions period={period} onPeriodChange={handlePeriodChange} />
          </div>
          <p className="mt-4 text-3xl font-semibold">{formatPrice(period.total_payout)}</p>
          <p className="text-sm text-gray-500">
            {t('compensation.wage')} {formatPrice(period.total_wage)} · {t('compensation.commission')} {formatPrice(period.total_commission)}
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('compensation.staff')}</TableCell>
              <TableCell align="right">{t('compensation.wage')}</TableCell>
              <TableCell align="right">{t('compensation.commission')}</TableCell>
              <TableCell align="right">{t('compensation.payTotal')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.map((row) => (
              <TableRow
                key={row.staff_id}
                hover
                sx={{ cursor: row.worksheet_uuid ? 'pointer' : 'default' }}
                onClick={() => {
                  if (row.worksheet_uuid) {
                    navigate(`/payroll/worksheet/${row.worksheet_uuid}`, {
                      state: {
                        via: 'summary',
                        periodId: period.uuid,
                        periodLabel: period.label,
                      } satisfies CompensationNavState,
                    });
                  }
                }}
              >
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">{formatPrice(row.wage)}</TableCell>
                <TableCell align="right">{formatPrice(row.commission_subtotal)}</TableCell>
                <TableCell align="right">{formatPrice(row.pay_total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PeriodSummary;
