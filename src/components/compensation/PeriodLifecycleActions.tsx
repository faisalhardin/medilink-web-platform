import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getStorageUser } from '@utils/storage';
import { hasPermission } from '@utils/permissions';
import { PERMISSIONS } from 'constants/permissions';
import { getApiErrorMessage } from '@utils/apiErrors';
import { showSuccessToast } from '@utils/toast';
import {
  DeleteCompensationPeriod,
  DraftCompensationPeriod,
  FinalizeCompensationPeriod,
  ReopenCompensationPeriod,
} from '@requests/compensationPeriod';
import type { CompensationPeriod } from '@models/compensation';

const ghostButton =
  'h-9 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-[#0B57D0] outline-none ring-1 ring-[#D7E3F4] transition-colors hover:bg-[#E8F1FF] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/20 disabled:opacity-50';

const primaryButton =
  'h-9 shrink-0 rounded-full bg-[#0B57D0] px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#0847B0] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/25 disabled:opacity-50';

const dangerButton =
  'h-9 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-[#9B2C2C] outline-none ring-1 ring-[#F3C7C7] transition-colors hover:bg-[#FDECEC] focus-visible:ring-4 focus-visible:ring-[#9B2C2C]/15 disabled:opacity-50';

type PeriodLifecycleActionsProps = {
  period: CompensationPeriod;
  onPeriodChange: (period: CompensationPeriod) => void;
};

type DialogKind = 'finalize' | 'delete';

const PeriodLifecycleActions = ({ period, onPeriodChange }: PeriodLifecycleActionsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = getStorageUser();
  const canAssign = hasPermission(user, PERMISSIONS.compensation.assign);
  const canFinalize = hasPermission(user, PERMISSIONS.compensation.finalize);

  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showDraft = canAssign && (period.status === 'open' || period.status === 'draft');
  const showFinalize = canFinalize && period.status !== 'finalized';
  const finalizeEnabled = period.status === 'draft';
  const showReopen = canFinalize && period.status === 'finalized';
  const showDelete = canFinalize && period.status === 'open';

  if (!showDraft && !showFinalize && !showReopen && !showDelete) {
    return null;
  }

  const closeDialog = () => {
    if (busy) return;
    setDialog(null);
    setError(null);
  };

  const openDialog = (kind: DialogKind) => {
    setError(null);
    setDialog(kind);
  };

  const handleDraft = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await DraftCompensationPeriod(period.uuid);
      onPeriodChange(updated);
      showSuccessToast(t('compensation.draftSaved'));
      navigate(`/payroll/summary?period=${updated.uuid}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleFinalize = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await FinalizeCompensationPeriod(period.uuid);
      onPeriodChange(updated.period);
      showSuccessToast(t('compensation.finalizedMsg'));
      setDialog(null);
      navigate(`/payroll/summary?period=${updated.period.uuid}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReopen = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await ReopenCompensationPeriod(period.uuid);
      onPeriodChange(updated);
      showSuccessToast(t('compensation.reopenedMsg'));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await DeleteCompensationPeriod(period.uuid);
      showSuccessToast(t('compensation.periodDeleted'));
      setDialog(null);
      navigate('/payroll');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {showDelete ? (
          <button
            type="button"
            className={dangerButton}
            disabled={busy}
            onClick={() => openDialog('delete')}
          >
            {t('compensation.deletePeriod')}
          </button>
        ) : null}
        {showDraft ? (
          <button
            type="button"
            className={period.status === 'open' ? primaryButton : ghostButton}
            disabled={busy}
            onClick={handleDraft}
          >
            {t('compensation.storeDraft')}
          </button>
        ) : null}
        {showFinalize ? (
          <button
            type="button"
            className={finalizeEnabled ? primaryButton : ghostButton}
            disabled={busy || !finalizeEnabled}
            aria-describedby={finalizeEnabled ? undefined : 'payday-finalize-hint'}
            onClick={() => openDialog('finalize')}
          >
            {t('compensation.finalize')}
          </button>
        ) : null}
        {showReopen ? (
          <button type="button" className={primaryButton} disabled={busy} onClick={handleReopen}>
            {t('compensation.reopen')}
          </button>
        ) : null}
      </div>
      {showFinalize && !finalizeEnabled ? (
        <p id="payday-finalize-hint" className="max-w-xs text-[13px] leading-snug text-[#5C6B80] sm:text-right">
          {t('compensation.finalizeNeedsDraft')}
        </p>
      ) : null}
      {error && !dialog ? <p className="max-w-xs text-sm text-[#9B2C2C] sm:text-right">{error}</p> : null}

      {dialog ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0D1B2A]/40 p-4 sm:items-center"
          role="presentation"
          onClick={closeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialog === 'finalize' ? 'payday-finalize-title' : 'payday-delete-title'}
            className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(13,27,42,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id={dialog === 'finalize' ? 'payday-finalize-title' : 'payday-delete-title'}
              className="text-xl font-semibold tracking-[-0.02em] text-[#0D1B2A]"
            >
              {dialog === 'finalize' ? t('compensation.finalizeTitle') : t('compensation.deletePeriodTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#3D4F6F]">
              {dialog === 'finalize' ? t('compensation.finalizeBody') : t('compensation.deletePeriodBody')}
            </p>
            {dialog === 'finalize' ? (
              <p className="mt-2 text-sm leading-relaxed text-[#5C6B80]">{t('compensation.finalizeWarning')}</p>
            ) : null}
            {error ? <p className="mt-3 text-sm text-[#9B2C2C]">{error}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDialog}
                disabled={busy}
                className="h-11 rounded-full px-4 text-sm font-semibold text-[#3D4F6F] hover:bg-[#F4F8FF] disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={dialog === 'finalize' ? handleFinalize : handleDelete}
                className={
                  dialog === 'delete'
                    ? 'h-11 rounded-full bg-[#9B2C2C] px-5 text-sm font-semibold text-white hover:bg-[#7F2424] disabled:opacity-50'
                    : 'h-11 rounded-full bg-[#0B57D0] px-5 text-sm font-semibold text-white hover:bg-[#0847B0] disabled:opacity-50'
                }
              >
                {dialog === 'finalize' ? t('compensation.finalizeConfirm') : t('compensation.deletePeriod')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PeriodLifecycleActions;
