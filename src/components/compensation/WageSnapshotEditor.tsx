import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@utils/common';
import { parseOptionalInt, previewSnapshotWage, snapshotWageErrorMessage } from '@utils/snapshotWage';
import { showSuccessToast } from '@utils/toast';
import { UpdateStaffWageSnapshot } from '@requests/compensationWage';
import type { StaffWageSnapshot, UpdateStaffWageSnapshotRequest } from '@models/compensation';

const fieldClass =
  'h-9 w-full rounded-full border border-[#D7E3F4] bg-white px-4 text-sm text-[#0D1B2A] outline-none transition-shadow placeholder:text-[#8A97AB] focus:border-[#0B57D0] focus:ring-4 focus:ring-[#0B57D0]/15';

const primaryButton =
  'h-9 shrink-0 rounded-full bg-[#0B57D0] px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#0847B0] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/25 disabled:opacity-50';

const fieldText = (value: number | null) => (value == null ? '' : String(value));

const initialFinal = (snapshot: StaffWageSnapshot) => {
  if (snapshot.final_wage != null) return String(snapshot.final_wage);
  if (snapshot.mandatory_working_days != null && snapshot.staff_working_days != null) {
    const next = previewSnapshotWage({
      wageAmount: snapshot.wage_amount,
      wageCadence: snapshot.wage_cadence,
      mandatoryWorkingDays: snapshot.mandatory_working_days,
      staffWorkingDays: snapshot.staff_working_days,
      finalWage: null,
    });
    if (next.ok && next.total != null) return String(next.total);
  }
  return String(snapshot.wage_amount);
};

type WageSnapshotEditorProps = {
  snapshot: StaffWageSnapshot;
  onSaved: (next: StaffWageSnapshot) => void;
  onCancel?: () => void;
  commit?: (body: UpdateStaffWageSnapshotRequest) => Promise<StaffWageSnapshot>;
};

const WageSnapshotEditor = ({ snapshot, onSaved, onCancel, commit }: WageSnapshotEditorProps) => {
  const { t } = useTranslation();
  const baseId = useId();
  const [mandatory, setMandatory] = useState(() => fieldText(snapshot.mandatory_working_days));
  const [staffDays, setStaffDays] = useState(() => fieldText(snapshot.staff_working_days));
  const [finalWage, setFinalWage] = useState(() => initialFinal(snapshot));
  const [finalFocused, setFinalFocused] = useState(false);
  const [locked, setLocked] = useState(() => snapshot.id !== 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mandatoryValue = parseOptionalInt(mandatory);
  const staffDaysValue = parseOptionalInt(staffDays);
  const finalValue = parseOptionalInt(finalWage);
  const parsed = mandatoryValue !== undefined && staffDaysValue !== undefined && finalValue !== undefined;
  const preview = parsed
    ? previewSnapshotWage({
      wageAmount: snapshot.wage_amount,
      wageCadence: snapshot.wage_cadence,
      mandatoryWorkingDays: mandatoryValue,
      staffWorkingDays: staffDaysValue,
      finalWage: finalValue,
    })
    : null;
  const liveError = !parsed
    ? t('compensation.wageInputInvalid')
    : preview && !preview.ok
      ? t(preview.reason === 'days' ? 'compensation.wageErrors.daysInvalid' : 'compensation.wageErrors.finalInvalid')
      : null;
  const daysPreview =
    typeof mandatoryValue === 'number' && typeof staffDaysValue === 'number'
      ? previewSnapshotWage({
        wageAmount: snapshot.wage_amount,
        wageCadence: snapshot.wage_cadence,
        mandatoryWorkingDays: mandatoryValue,
        staffWorkingDays: staffDaysValue,
        finalWage: null,
      })
      : null;
  const totalWage = daysPreview?.ok ? daysPreview.total : null;

  const writeFinalFromDays = (nextMandatory: string, nextStaff: string) => {
    const mandatoryDays = parseOptionalInt(nextMandatory);
    const staffWorked = parseOptionalInt(nextStaff);
    if (typeof mandatoryDays !== 'number' || typeof staffWorked !== 'number') return;
    const next = previewSnapshotWage({
      wageAmount: snapshot.wage_amount,
      wageCadence: snapshot.wage_cadence,
      mandatoryWorkingDays: mandatoryDays,
      staffWorkingDays: staffWorked,
      finalWage: null,
    });
    if (next.ok && next.total != null) setFinalWage(String(next.total));
  };

  const save = async () => {
    if (!parsed || !preview?.ok || finalValue === undefined) return;
    setBusy(true);
    setError(null);
    const finalToSave = finalValue === snapshot.wage_amount && snapshot.final_wage == null ? null : finalValue;
    try {
      const body = {
        mandatory_working_days: mandatoryValue,
        staff_working_days: staffDaysValue,
        final_wage: finalToSave,
      };
      const next = commit ? await commit(body) : await UpdateStaffWageSnapshot(snapshot.id, body);
      setLocked(true);
      onSaved(next);
      showSuccessToast(t('compensation.wageSnapshotSaved'));
    } catch (err) {
      setError(snapshotWageErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const shownFinal = typeof finalValue === 'number' ? finalValue : snapshot.wage_amount;

  const cancelEdit = () => {
    if (snapshot.id === 0 && onCancel) {
      onCancel();
      return;
    }
    setMandatory(fieldText(snapshot.mandatory_working_days));
    setStaffDays(fieldText(snapshot.staff_working_days));
    setFinalWage(initialFinal(snapshot));
    setFinalFocused(false);
    setError(null);
    setLocked(true);
  };

  return (
    <div className="mt-4">
      <p className="text-[13px] text-[#5C6B80]">
        {t(`compensation.wageCadenceValue.${snapshot.wage_cadence}`)}
        <span className="mx-2 text-[#C5D0E0]">/</span>
        {t('compensation.flatWage')} {formatPrice(shownFinal)}
        {totalWage != null && typeof finalValue === 'number' && finalValue !== totalWage ? (
          <>
            <span className="mx-2 text-[#C5D0E0]">/</span>
            {t('compensation.wageFromDays')} {formatPrice(totalWage)}
          </>
        ) : null}
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="w-36 text-[13px] font-medium text-[#3D4F6F]" htmlFor={`${baseId}-mandatory`}>
          {t('compensation.mandatoryWorkingDays')}
          <input
            id={`${baseId}-mandatory`}
            inputMode="numeric"
            className={`${fieldClass} mt-1 disabled:bg-[#F4F8FF] disabled:text-[#8A97AB]`}
            value={mandatory}
            disabled={locked}
            onChange={(event) => {
              const next = event.target.value;
              setMandatory(next);
              writeFinalFromDays(next, staffDays);
            }}
          />
        </label>
        <label className="w-36 text-[13px] font-medium text-[#3D4F6F]" htmlFor={`${baseId}-staff-days`}>
          {t('compensation.staffWorkingDays')}
          <input
            id={`${baseId}-staff-days`}
            inputMode="numeric"
            className={`${fieldClass} mt-1 disabled:bg-[#F4F8FF] disabled:text-[#8A97AB]`}
            value={staffDays}
            disabled={locked}
            onChange={(event) => {
              const next = event.target.value;
              setStaffDays(next);
              writeFinalFromDays(mandatory, next);
            }}
          />
        </label>
        <label className="w-44 text-[13px] font-medium text-[#3D4F6F]" htmlFor={`${baseId}-final`}>
          {t('compensation.flatWage')}
          <input
            id={`${baseId}-final`}
            inputMode="numeric"
            className={`${fieldClass} mt-1 disabled:bg-[#F4F8FF] disabled:text-[#8A97AB]`}
            value={!finalFocused && typeof finalValue === 'number' ? formatPrice(finalValue) : finalWage}
            disabled={locked}
            onFocus={() => setFinalFocused(true)}
            onChange={(event) => setFinalWage(event.target.value)}
            onBlur={() => {
              setFinalFocused(false);
              if (finalWage.trim() === '') setFinalWage(String(snapshot.wage_amount));
            }}
          />
        </label>
        {locked ? (
          <button
            type="button"
            className="h-9 text-[13px] font-semibold text-[#0B57D0] hover:underline"
            onClick={() => setLocked(false)}
          >
            {t('common.edit')}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="h-9 text-[13px] font-semibold text-[#5C6B80] hover:underline disabled:opacity-40"
              disabled={busy}
              onClick={cancelEdit}
            >
              {t('common.cancel')}
            </button>
            <button type="button" className={primaryButton} disabled={busy || Boolean(liveError)} onClick={save}>
              {t('compensation.saveWage')}
            </button>
          </>
        )}
      </div>
      {!locked && (liveError || error) ? <p className="mt-2 text-sm text-[#9B2C2C]">{error ?? liveError}</p> : null}
    </div>
  );
};

export default WageSnapshotEditor;
