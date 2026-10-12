import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '@components/Drawer';
import { useDrawer } from 'hooks/useDrawer';
import { getStorageUser } from '@utils/storage';
import { hasPermission } from '@utils/permissions';
import { PERMISSIONS } from 'constants/permissions';
import { getApiErrorMessage, getApiErrorStatus, isClientErrorStatus } from '@utils/apiErrors';
import { showSuccessToast } from '@utils/toast';
import { ListStaff } from '@requests/staff';
import { GenerateStaffWageSnapshots, ListWages } from '@requests/compensationWage';

const fieldClass =
  'h-9 w-full rounded-full border border-[#D7E3F4] bg-white px-4 text-sm text-[#0D1B2A] outline-none transition-shadow placeholder:text-[#8A97AB] focus:border-[#0B57D0] focus:ring-4 focus:ring-[#0B57D0]/15';

const primaryButton =
  'h-9 shrink-0 rounded-full bg-[#0B57D0] px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#0847B0] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/25 disabled:opacity-50';

type StaffOption = { uuid: string; name: string };

type WageSnapshotGenerateProps = {
  periodUuid: string;
  onGenerated?: () => void;
};

const WageSnapshotGenerate = ({ periodUuid, onGenerated }: WageSnapshotGenerateProps) => {
  const { t, i18n } = useTranslation();
  const canManage = hasPermission(getStorageUser(), PERMISSIONS.compensation.manage);
  const drawer = useDrawer();
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [withContract, setWithContract] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!drawer.isOpen) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
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
      .sort((a, b) => a.name.localeCompare(b.name, i18n.language))
      .filter((row) => !q || row.name.toLowerCase().includes(q));
  }, [staff, query, i18n.language]);

  if (!canManage) return null;

  const toggle = (uuid: string) => {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    const staffIds = [...picked].filter((id) => withContract.has(id));
    try {
      await GenerateStaffWageSnapshots({
        compensation_period_uuid: periodUuid,
        ...(staffIds.length > 0 ? { staff_ids: staffIds } : {}),
      });
      showSuccessToast(t('compensation.generateWagesDone'));
      setPicked(new Set());
      setQuery('');
      drawer.closeDrawer();
      onGenerated?.();
    } catch (err) {
      const status = getApiErrorStatus(err);
      if (!isClientErrorStatus(status) || status === 401) {
        setError(getApiErrorMessage(err) || t('compensation.loadError'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4">
      <button type="button" className={primaryButton} onClick={drawer.openDrawer}>
        {t('compensation.generateWages')}
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
          <p className="mt-3 text-[13px] text-[#5C6B80]">{t('compensation.generateWagesHint')}</p>
          {error ? (
            <p className="mt-3 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#9B2C2C]">{error}</p>
          ) : null}
          <ul className="mt-3 flex-1 overflow-auto rounded-2xl bg-white">
            {loading ? (
              <li className="px-4 py-3 text-sm text-[#5C6B80]">{t('common.loading')}</li>
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
                const selected = picked.has(row.uuid);
                return (
                  <li key={row.uuid} className="border-b border-[#E6EEF8] last:border-b-0">
                    <button
                      type="button"
                      aria-pressed={selected}
                      className={`w-full px-4 py-3 text-left text-sm text-[#0D1B2A] hover:bg-[#F4F8FF] ${
                        selected ? 'bg-[#E8F1FF]' : ''
                      }`}
                      onClick={() => toggle(row.uuid)}
                    >
                      {row.name}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <button type="button" className={`${primaryButton} mt-3`} disabled={busy || loading} onClick={generate}>
            {t('compensation.generateWages')}
          </button>
        </div>
      </Drawer>
    </div>
  );
};

export default WageSnapshotGenerate;
