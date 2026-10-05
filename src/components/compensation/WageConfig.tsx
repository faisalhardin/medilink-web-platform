import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@utils/common';
import { getApiErrorItems, getApiErrorMessage } from '@utils/apiErrors';
import { showSuccessToast } from '@utils/toast';
import { ListStaff } from '@requests/staff';
import { DeleteWage, ListWages, UpsertWage } from '@requests/compensationWage';
import { WAGE_CADENCES, type StaffWage, type WageCadence } from '@models/compensation';

const PAGE_SIZE = 10;

const WAGE_ERROR_KEYS: Record<string, string> = {
  INVALID_WAGE_CADENCE: 'compensation.wageErrors.invalidCadence',
  WAGE_EFFECTIVE_RANGE_INVALID: 'compensation.wageErrors.rangeInvalid',
  WAGE_EFFECTIVE_RANGE_OVERLAP: 'compensation.wageErrors.overlap',
  WAGE_MULTIPLE_ACTIVE: 'compensation.wageErrors.multipleActive',
  WAGE_NOT_FOUND: 'compensation.wageErrors.notFound',
};

const fieldClass =
  'h-9 w-full rounded-full border border-[#D7E3F4] bg-white px-4 text-sm text-[#0D1B2A] outline-none transition-shadow placeholder:text-[#8A97AB] focus:border-[#0B57D0] focus:ring-4 focus:ring-[#0B57D0]/15 disabled:bg-[#F4F8FF] disabled:text-[#8A97AB]';

const primaryButton =
  'h-9 shrink-0 rounded-full bg-[#0B57D0] px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#0847B0] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/25 disabled:opacity-50';

const ghostButton =
  'h-9 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-[#0B57D0] outline-none ring-1 ring-[#D7E3F4] transition-colors hover:bg-[#E8F1FF] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/20';

type StaffOption = { uuid: string; name: string };
type WageView = 'list' | 'create' | 'update';

const formatShortDate = (iso: string) => {
  const dateOnly = iso.slice(0, 10);
  const d = new Date(`${dateOnly}T00:00:00`);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

function createdKey(wage: StaffWage) {
  if (wage.created_at && !wage.created_at.startsWith('0001')) return wage.created_at;
  return '';
}

function messageForWageError(error: unknown, translate: (key: string) => string): string {
  const items = getApiErrorItems(error);
  if (items.length === 0) return getApiErrorMessage(error);

  return items
    .map((item) => {
      const key = WAGE_ERROR_KEYS[item.error_name];
      if (key) return translate(key);
      return item.error_description || item.error_name;
    })
    .filter(Boolean)
    .join('\n');
}

type WageRowProps = {
  wage: StaffWage;
  name: string;
  cadenceLabel: string;
  openEndedLabel: string;
  updateLabel: string;
  deleteLabel: string;
  onUpdate: (wage: StaffWage) => void;
  onDelete: (wage: StaffWage) => void;
};

const WageRow = ({
  wage,
  name,
  cadenceLabel,
  openEndedLabel,
  updateLabel,
  deleteLabel,
  onUpdate,
  onDelete,
}: WageRowProps) => (
  <li className="[content-visibility:auto]">
    <div className="flex flex-col gap-2 border-b border-[#E6EEF8] px-1 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#0D1B2A]">{name}</p>
        <p className="mt-1 text-[13px] text-[#5C6B80]">
          {formatShortDate(wage.effective_from)} –{' '}
          {wage.effective_to ? formatShortDate(wage.effective_to) : openEndedLabel}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className="rounded-full bg-[#E8F1FF] px-2.5 py-1 text-[12px] font-medium text-[#0B57D0]">
          {cadenceLabel}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold tabular-nums text-[#0D1B2A] ring-1 ring-[#D7E3F4]">
          {formatPrice(wage.wage_amount)}
        </span>
        <button type="button" className={ghostButton} onClick={() => onUpdate(wage)}>
          {updateLabel}
        </button>
        <button
          type="button"
          onClick={() => onDelete(wage)}
          className="h-9 rounded-full px-3 text-[13px] font-semibold text-[#9B2C2C] outline-none hover:bg-[#FDECEC] focus-visible:ring-2 focus-visible:ring-[#9B2C2C]"
        >
          {deleteLabel}
        </button>
      </div>
    </div>
  </li>
);

const WageConfig = () => {
  const { t, i18n } = useTranslation();
  const formId = useId();
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const focusEnd = useRef(false);
  const [formHeight, setFormHeight] = useState(0);
  const locale = i18n.language.startsWith('id') ? 'id' : 'en';

  const [view, setView] = useState<WageView>('list');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [wages, setWages] = useState<StaffWage[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffId, setStaffId] = useState('');
  const [amount, setAmount] = useState('');
  const [cadence, setCadence] = useState<WageCadence>('monthly');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [openEnded, setOpenEnded] = useState(true);
  const [currentStart, setCurrentStart] = useState('');
  const [pendingDelete, setPendingDelete] = useState<StaffWage | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const wagePromise = ListWages();
    const staffPromise = ListStaff(false).catch(() => null);
    const wageResp = await wagePromise;
    const staffResp = await staffPromise;
    setWages(wageResp.wages ?? []);
    if (staffResp) {
      setStaff((staffResp.staff ?? []).map((member) => ({ uuid: member.uuid, name: member.name })));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await load();
        if (!cancelled) setLoaded(true);
      } catch (err) {
        if (!cancelled) setError(messageForWageError(err, t));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, t]);

  useEffect(() => {
    if (view !== 'list') startRef.current?.focus();
  }, [view]);

  useLayoutEffect(() => {
    const form = formRef.current;
    if (!form) return undefined;
    const measure = () => setFormHeight(form.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (focusEnd.current && !openEnded) {
      focusEnd.current = false;
      endRef.current?.focus();
    }
  }, [openEnded]);

  const names = useMemo(() => new Map(staff.map((member) => [member.uuid, member.name])), [staff]);

  const staffOptions = useMemo(
    () => [...staff].sort((a, b) => a.name.localeCompare(b.name, locale)),
    [staff, locale]
  );

  const ordered = useMemo(
    () =>
      [...wages].sort((a, b) => {
        const aKey = createdKey(a);
        const bKey = createdKey(b);
        if (aKey && bKey && aKey !== bKey) return aKey < bKey ? -1 : 1;
        return a.id - b.id;
      }),
    [wages]
  );

  const visible = ordered.slice(0, shown);

  const resetForm = () => {
    setStaffId('');
    setAmount('');
    setCadence('monthly');
    setEffectiveFrom('');
    setEffectiveTo('');
    setOpenEnded(true);
    setCurrentStart('');
  };

  const openCreate = () => {
    resetForm();
    setError(null);
    setView('create');
  };

  const openUpdate = (wage: StaffWage) => {
    setStaffId(wage.staff_id);
    setAmount(String(wage.wage_amount));
    setCadence((WAGE_CADENCES as string[]).includes(wage.wage_cadence) ? wage.wage_cadence : 'monthly');
    setEffectiveFrom(wage.effective_from.slice(0, 10));
    setEffectiveTo(wage.effective_to ? wage.effective_to.slice(0, 10) : '');
    setOpenEnded(!wage.effective_to);
    setCurrentStart(wage.effective_from.slice(0, 10));
    setError(null);
    setView('update');
  };

  const save = async () => {
    if (!staffId) {
      setError(t('compensation.wageStaffRequired'));
      return;
    }
    if (!/^\d+$/.test(amount)) {
      setError(t('compensation.wageAmountInvalid'));
      return;
    }
    if (!effectiveFrom) {
      setError(t('compensation.wageStartRequired'));
      return;
    }
    if (!openEnded && !effectiveTo) {
      setError(t('compensation.wageEndRequired'));
      return;
    }
    if (!openEnded && effectiveTo < effectiveFrom) {
      setError(t('compensation.wageEndBeforeStart'));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await UpsertWage({
        staff_id: staffId,
        wage_amount: Number(amount),
        wage_cadence: cadence,
        effective_from: effectiveFrom,
        effective_to: openEnded ? null : effectiveTo,
      });
      showSuccessToast(t('compensation.wageSaved'));
      resetForm();
      setView('list');
      await load();
    } catch (err) {
      setError(messageForWageError(err, t));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    setDeleteError(null);
    try {
      await DeleteWage(pendingDelete.id);
      showSuccessToast(t('compensation.wageDeleted'));
      setPendingDelete(null);
      await load();
    } catch (err) {
      setDeleteError(messageForWageError(err, t));
    } finally {
      setBusy(false);
    }
  };

  const selectedName = staffId ? names.get(staffId) ?? staffId : '';
  const onForm = view !== 'list';
  const formTabLabel = view === 'update' ? t('compensation.wageUpdateContract') : t('compensation.wageNewContract');

  return (
    <div>
      <h1 className="text-2xl font-semibold leading-none tracking-[-0.03em] text-[#0D1B2A]">
        {t('compensation.wageConfig')}
      </h1>

      <div className="relative mt-6 flex rounded-full bg-[#F4F8FF] p-1" role="tablist">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 left-1 top-1 w-[calc((100%-0.5rem)/2)] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{ transform: onForm ? 'translateX(100%)' : 'translateX(0)' }}
        />
        <button
          type="button"
          role="tab"
          id={`${formId}-tab-list`}
          aria-selected={view === 'list'}
          aria-controls={`${formId}-panel`}
          onClick={() => {
            setError(null);
            setView('list');
          }}
          className={`relative z-10 h-8 flex-1 rounded-full text-[13px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#0B57D0] motion-reduce:transition-none ${
            view === 'list' ? 'text-[#0B57D0]' : 'text-[#5C6B80]'
          }`}
        >
          {t('compensation.wageContracts')}
        </button>
        <button
          type="button"
          role="tab"
          id={`${formId}-tab-form`}
          aria-selected={onForm}
          aria-controls={`${formId}-panel`}
          onClick={() => {
            if (view === 'list') openCreate();
          }}
          className={`relative z-10 h-8 flex-1 rounded-full text-[13px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#0B57D0] motion-reduce:transition-none ${
            onForm ? 'text-[#0B57D0]' : 'text-[#5C6B80]'
          }`}
        >
          {formTabLabel}
        </button>
      </div>

      {error ? (
        <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#9B2C2C]">
          <p className="whitespace-pre-line">{error}</p>
          <button type="button" onClick={() => setError(null)} className="font-medium underline">
            {t('common.close')}
          </button>
        </div>
      ) : null}

      <div id={`${formId}-panel`} role="tabpanel" aria-labelledby={onForm ? `${formId}-tab-form` : `${formId}-tab-list`} className="relative mt-6">
        <div className={view === 'list' ? 'flex flex-col' : 'hidden'} style={{ minHeight: formHeight || undefined }} aria-hidden={view !== 'list'}>
            {loading || (loaded && ordered.length === 0) ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-[28px] border border-dashed border-[#D7E3F4] px-6 py-16 text-center">
                <p className="text-[15px] text-[#5C6B80]">
                  {loading ? t('common.loading') : t('compensation.wageEmpty')}
                </p>
                {loaded && ordered.length === 0 ? (
                  <button type="button" className={`${primaryButton} mt-4`} onClick={openCreate}>
                    {t('compensation.wageNewContract')}
                  </button>
                ) : null}
              </div>
            ) : ordered.length === 0 ? null : (
              <div className="flex flex-1 flex-col">
                <ul className="flex-1">
                  {visible.map((wage) => (
                    <WageRow
                      key={wage.id}
                      wage={wage}
                      name={names.get(wage.staff_id) ?? wage.staff_id}
                      cadenceLabel={t(`compensation.wageCadenceValue.${wage.wage_cadence}`, {
                        defaultValue: wage.wage_cadence,
                      })}
                      openEndedLabel={t('compensation.wageOpenEnded')}
                      updateLabel={t('compensation.wageUpdate')}
                      deleteLabel={t('common.delete')}
                      onUpdate={openUpdate}
                      onDelete={(row) => {
                        setDeleteError(null);
                        setPendingDelete(row);
                      }}
                    />
                  ))}
                </ul>
                {shown < ordered.length ? (
                  <div className="mt-4 flex justify-center">
                    <button type="button" className={ghostButton} onClick={() => setShown((count) => count + PAGE_SIZE)}>
                      {t('compensation.wageShowMore')}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
        </div>
        <form
            ref={formRef}
            aria-hidden={view === 'list'}
            className={`grid gap-4 sm:grid-cols-2 ${view === 'list' ? 'pointer-events-none invisible absolute inset-x-0 top-0' : ''}`}
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div className="sm:col-span-2 max-w-xl">
              <p className="text-sm leading-6 text-[#5C6B80]">
                {view === 'update'
                  ? t('compensation.wageUpdateHint', { name: selectedName, date: formatShortDate(currentStart) })
                  : t('compensation.wageHint')}
              </p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={`${formId}-staff`} className="mb-1.5 block text-[13px] font-medium text-[#3D4F6F]">
                {t('compensation.staff')}
              </label>
              <select
                id={`${formId}-staff`}
                className={fieldClass}
                value={staffId}
                disabled={view === 'update'}
                onChange={(event) => setStaffId(event.target.value)}
              >
                <option value="">{t('compensation.wageChooseStaff')}</option>
                {staffOptions.map((member) => (
                  <option key={member.uuid} value={member.uuid}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={`${formId}-amount`} className="mb-1.5 block text-[13px] font-medium text-[#3D4F6F]">
                {t('compensation.wageAmount')}
              </label>
              <input
                id={`${formId}-amount`}
                className={fieldClass}
                inputMode="numeric"
                autoComplete="off"
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div>
              <p id={`${formId}-cadence`} className="mb-1.5 text-[13px] font-medium text-[#3D4F6F]">
                {t('compensation.wageCadence')}
              </p>
              <div className="flex rounded-full bg-[#F4F8FF] p-1" role="radiogroup" aria-labelledby={`${formId}-cadence`}>
                {WAGE_CADENCES.map((value) => {
                  const active = cadence === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setCadence(value)}
                      className={`h-8 flex-1 rounded-full text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#0B57D0] ${
                        active ? 'bg-white text-[#0B57D0] shadow-sm' : 'text-[#5C6B80]'
                      }`}
                    >
                      {t(`compensation.wageCadenceValue.${value}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor={`${formId}-from`} className="mb-1.5 block text-[13px] font-medium text-[#3D4F6F]">
                {t('compensation.wageEffectiveFrom')}
              </label>
              <input
                ref={startRef}
                id={`${formId}-from`}
                type="date"
                className={fieldClass}
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor={`${formId}-to`} className="mb-1.5 block text-[13px] font-medium text-[#3D4F6F]">
                {t('compensation.wageEffectiveTo')}
              </label>
              <input
                ref={endRef}
                id={`${formId}-to`}
                type="date"
                className={fieldClass}
                value={openEnded ? '' : effectiveTo}
                disabled={openEnded}
                onChange={(event) => setEffectiveTo(event.target.value)}
              />
              <label className="mt-2 flex cursor-pointer items-start gap-2 text-[13px] leading-5 text-[#3D4F6F]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#0B57D0]"
                  checked={openEnded}
                  onChange={(event) => {
                    const next = event.target.checked;
                    setOpenEnded(next);
                    if (next) setEffectiveTo('');
                    else focusEnd.current = true;
                  }}
                />
                <span>{t('compensation.wageOpenUntilChange')}</span>
              </label>
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className={primaryButton} disabled={busy}>
                {t('compensation.wageSave')}
              </button>
            </div>
          </form>
      </div>

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0D1B2A]/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => {
            if (!busy) setPendingDelete(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${formId}-delete-title`}
            className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(13,27,42,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={`${formId}-delete-title`} className="text-lg font-semibold text-[#0D1B2A]">
              {t('compensation.wageDeleteTitle')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5C6B80]">{t('compensation.wageDeleteBody')}</p>
            {deleteError ? <p className="mt-3 whitespace-pre-line text-sm text-[#9B2C2C]">{deleteError}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className={ghostButton} disabled={busy} onClick={() => setPendingDelete(null)}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="h-9 shrink-0 rounded-full bg-[#9B2C2C] px-4 text-sm font-semibold text-white outline-none hover:bg-[#7F2424] focus-visible:ring-4 focus-visible:ring-[#9B2C2C]/25 disabled:opacity-50"
                disabled={busy}
                onClick={() => void confirmDelete()}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WageConfig;
