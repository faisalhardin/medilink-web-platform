import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '@components/Drawer';
import { useDrawer } from 'hooks/useDrawer';
import { getApiErrorMessage } from '@utils/apiErrors';
import { ListStaff } from '@requests/staff';
import { ListWages } from '@requests/compensationWage';
import { CreateWorksheet } from '@requests/worksheet';
import type { CompensationPeriod } from '@models/compensation';

const fieldClass =
  'h-9 w-full rounded-full border border-[#D7E3F4] bg-white px-4 text-sm text-[#0D1B2A] outline-none transition-shadow placeholder:text-[#8A97AB] focus:border-[#0B57D0] focus:ring-4 focus:ring-[#0B57D0]/15';

const linkButton =
  'inline-flex text-[13px] font-semibold text-[#0B57D0] hover:underline disabled:opacity-50';

type StaffOption = { uuid: string; name: string };

type AddWageWorksheetProps = {
  period: CompensationPeriod;
  linkedStaffIds: string[];
  onCreated: (worksheetUuid: string) => void;
};

const AddWageWorksheet = ({ period, linkedStaffIds, onCreated }: AddWageWorksheetProps) => {
  const { t, i18n } = useTranslation();
  const drawer = useDrawer();
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [withContract, setWithContract] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linked = useMemo(() => new Set(linkedStaffIds), [linkedStaffIds]);

  useEffect(() => {
    if (!drawer.isOpen) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPicked('');
    (async () => {
      try {
        const [staffResp, wageResp] = await Promise.all([ListStaff(false), ListWages()]);
        if (cancelled) return;
        setStaff((staffResp.staff ?? []).map((row) => ({ uuid: row.uuid, name: row.name })));
        setWithContract(new Set((wageResp.wages ?? []).map((row) => row.staff_id)));
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err) || t('compensation.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [drawer.isOpen, t]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...staff]
      .filter((row) => !linked.has(row.uuid))
      .sort((a, b) => a.name.localeCompare(b.name, i18n.language))
      .filter((row) => !q || row.name.toLowerCase().includes(q));
  }, [staff, linked, query, i18n.language]);

  const create = async () => {
    const chosen = staff.find((row) => row.uuid === picked);
    if (!chosen || !withContract.has(chosen.uuid)) return;
    setBusy(true);
    setError(null);
    try {
      const created = await CreateWorksheet({
        staff_id: chosen.uuid,
        label: (chosen.name.trim() || chosen.uuid).slice(0, 100),
        compensation_period_uuid: period.uuid,
      });
      setQuery('');
      drawer.closeDrawer();
      onCreated(created.uuid);
    } catch (err) {
      setError(getApiErrorMessage(err) || t('compensation.loadError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={linkButton} onClick={drawer.openDrawer}>
        {t('compensation.addWage')}
      </button>
      <Drawer
        isOpen={drawer.isOpen}
        onClose={drawer.closeDrawer}
        title={t('compensation.staff')}
        maxWidth="md"
        position="right"
      >
        <div className="flex h-full flex-col bg-[#F4F8FF] p-4">
          <input
            className={fieldClass}
            value={query}
            placeholder={t('common.search')}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p className="mt-3 text-[13px] text-[#5C6B80]">{t('compensation.addWageHint')}</p>
          {error ? (
            <p className="mt-3 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#9B2C2C]">{error}</p>
          ) : null}
          <ul className="mt-3 flex-1 overflow-auto rounded-2xl bg-white">
            {loading ? (
              <li className="px-4 py-3 text-sm text-[#5C6B80]">{t('common.loading')}</li>
            ) : rows.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[#5C6B80]">{t('compensation.addWageEmpty')}</li>
            ) : (
              rows.map((row) => {
                const selectable = withContract.has(row.uuid);
                if (!selectable) {
                  return (
                    <li key={row.uuid} className="border-b border-[#E6EEF8] last:border-b-0">
                      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                        <span className="text-sm text-[#8A97AB]">{row.name}</span>
                        <span className="shrink-0 text-[12px] text-[#5C6B80]">
                          {t('compensation.noWageContract')}
                        </span>
                      </div>
                    </li>
                  );
                }
                const selected = picked === row.uuid;
                return (
                  <li key={row.uuid} className="border-b border-[#E6EEF8] last:border-b-0">
                    <button
                      type="button"
                      aria-pressed={selected}
                      className={`w-full px-4 py-3 text-left text-sm text-[#0D1B2A] hover:bg-[#F4F8FF] ${
                        selected ? 'bg-[#E8F1FF]' : ''
                      }`}
                      onClick={() => setPicked(row.uuid)}
                    >
                      {row.name}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <button
            type="button"
            className="mt-3 h-9 shrink-0 rounded-full bg-[#0B57D0] px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#0847B0] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/25 disabled:opacity-50"
            disabled={busy || loading || !picked}
            onClick={create}
          >
            {t('compensation.addWage')}
          </button>
        </div>
      </Drawer>
    </>
  );
};

export default AddWageWorksheet;
