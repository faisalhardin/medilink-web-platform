import { useEffect, useMemo, useState } from 'react';
import { Drawer } from '@components/Drawer';
import { useDrawer } from 'hooks/useDrawer';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getStorageUser } from '@utils/storage';
import { hasPermission } from '@utils/permissions';
import { PERMISSIONS } from 'constants/permissions';
import { ListStaff } from '@requests/staff';
import { CreateWorksheet, ListWorksheets, PatchWorksheet } from '@requests/worksheet';
import type { CompensationNavState } from '@components/compensation/CompensationBreadcrumb';
import type { Worksheet, WorksheetGenerateStatus, WorksheetStatus } from '@models/compensation';
import WorksheetDateRange from '@components/compensation/WorksheetDateRange';
import { getApiErrorMessage } from '@utils/apiErrors';

const formatShortDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusTone: Record<WorksheetStatus, string> = {
  pending: 'bg-[#F3F6FB] text-[#3D4F6F]',
  open: 'bg-[#E8F1FF] text-[#0B57D0]',
  finalized: 'bg-[#0B57D0] text-white',
};

const generateTone: Record<WorksheetGenerateStatus, string> = {
  idle: 'text-[#6B7C93]',
  running: 'text-[#0B57D0]',
  succeeded: 'text-[#0B57D0]',
  failed: 'text-[#9B2C2C]',
};

type StaffOption = { uuid: string; name: string };

type WorksheetRowProps = {
  row: Worksheet;
  staffName: string;
  canDetach: boolean;
  busy: boolean;
  onOpen: (uuid: string) => void;
  onDetach: (worksheet: Worksheet) => void;
  statusLabel: string;
  generateLabel: string;
  paydayLabel: string;
  detachLabel: string;
};

const WorksheetRow = ({
  row,
  staffName,
  canDetach,
  busy,
  onOpen,
  onDetach,
  statusLabel,
  generateLabel,
  paydayLabel,
  detachLabel,
}: WorksheetRowProps) => (
  <li className="[content-visibility:auto]">
    <div className="group flex flex-col gap-2 border-b border-[#E6EEF8] px-1 py-2.5 transition-colors duration-150 hover:bg-[#F7FAFF] sm:flex-row sm:items-center sm:justify-between sm:px-3">
      <button
        type="button"
        onClick={() => onOpen(row.uuid)}
        className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#0B57D0] focus-visible:ring-offset-2"
      >
        <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#0D1B2A]">
          {row.label}
        </p>
        <p className="mt-1 text-[13px] text-[#5C6B80]">
          {staffName}
          <span className="mx-2 text-[#C5D0E0]">/</span>
          {formatShortDate(row.period_start)} – {formatShortDate(row.period_end)}
        </p>
      </button>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${statusTone[row.status]}`}>
          {statusLabel}
        </span>
        <span className={`px-1 text-[12px] font-medium ${generateTone[row.generate_status]}`}>
          {generateLabel}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-[#3D4F6F] ring-1 ring-[#D7E3F4]">
          {paydayLabel}
        </span>
        {canDetach ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onDetach(row)}
            className="rounded-full px-3 py-1 text-[12px] font-medium text-[#0B57D0] outline-none hover:bg-[#E8F1FF] focus-visible:ring-2 focus-visible:ring-[#0B57D0] disabled:opacity-40"
          >
            {detachLabel}
          </button>
        ) : null}
      </div>
    </div>
  </li>
);

const fieldClass =
  'h-9 w-full rounded-full border border-[#D7E3F4] bg-white px-4 text-sm text-[#0D1B2A] outline-none transition-shadow placeholder:text-[#8A97AB] focus:border-[#0B57D0] focus:ring-4 focus:ring-[#0B57D0]/15';

const WorksheetList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = getStorageUser();
  const isAdmin = currentUser?.roles?.some((role) => role.name === 'administrator') ?? false;
  const currentUserId = currentUser?.uuid ?? '';
  const canAssign = hasPermission(currentUser, PERMISSIONS.compensation.assign);

  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [staffId, setStaffId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [rows, setRows] = useState<Worksheet[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [createStaffId, setCreateStaffId] = useState(currentUserId);
  const [createStart, setCreateStart] = useState('');
  const [createEnd, setCreateEnd] = useState('');
  const [staffQuery, setStaffQuery] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const staffDrawer = useDrawer();

  useEffect(() => {
    ListStaff(false)
      .then((resp) => setStaffOptions((resp.staff ?? []).map((s) => ({ uuid: s.uuid, name: s.name }))))
      .catch(() => setError(t('compensation.loadError')));
  }, [t]);

  const names = useMemo(() => new Map(staffOptions.map((s) => [s.uuid, s.name])), [staffOptions]);
  const drawerStaff = useMemo(() => {
    const options = [...staffOptions];
    if (currentUserId && !options.some((s) => s.uuid === currentUserId)) {
      options.unshift({ uuid: currentUserId, name: currentUser?.name || currentUserId });
    }
    const query = staffQuery.trim().toLowerCase();
    return query ? options.filter((s) => s.name.toLowerCase().includes(query)) : options;
  }, [staffOptions, currentUserId, currentUser?.name, staffQuery]);

  const load = async (nextCursor?: string) => {
    if ((start && !end) || (!start && end) || (start && end && start > end)) {
      setError(t('compensation.invalidDateRange'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await ListWorksheets({
        staff_id: staffId || undefined,
        period_start: start || undefined,
        period_end: end || undefined,
        cursor: nextCursor,
        limit: 50,
      });
      const page = resp.worksheets ?? [];
      setRows((current) => (nextCursor ? [...current, ...page] : page));
      setCursor(resp.next_cursor);
      setSearched(true);
    } catch {
      setError(t('compensation.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    setBusy(true);
    setCreateError(null);
    try {
      const chosenStaffId = isAdmin ? createStaffId : currentUserId;
      const staffName = names.get(chosenStaffId) ?? currentUser?.name ?? chosenStaffId;
      const created = await CreateWorksheet({
        staff_id: chosenStaffId,
        label: label.trim() || `${staffName} ${createStart}`.trim(),
        period_start: createStart,
        period_end: createEnd,
      });
      setCreateOpen(false);
      setLabel('');
      setCreateStaffId(currentUserId);
      setCreateStart('');
      setCreateEnd('');
      setStaffQuery('');
      navigate(`/payroll/worksheet/${created.uuid}`, {
        state: { via: 'worksheets' } satisfies CompensationNavState,
      });
    } catch (err) {
      setCreateError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const detach = async (worksheet: Worksheet) => {
    setBusy(true);
    try {
      await PatchWorksheet(worksheet.uuid, { compensation_period_uuid: '' });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const openWorksheet = (uuid: string) =>
    navigate(`/payroll/worksheet/${uuid}`, {
      state: { via: 'worksheets' } satisfies CompensationNavState,
    });

  return (
    <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold leading-none tracking-[-0.03em] text-[#0D1B2A]">
              {t('compensation.worksheets')}
            </h1>
            <p className="mt-1.5 text-[13px] leading-snug text-[#5C6B80]">
              {t('compensation.worksheetsHint')}
            </p>
          </div>
          {canAssign ? (
            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setCreateStaffId(currentUserId);
                setStaffQuery('');
                setCreateOpen(true);
              }}
              className="h-9 shrink-0 rounded-full bg-[#0B57D0] px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#0847B0] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/25"
            >
              {t('compensation.newWorksheet')}
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#9B2C2C]">
            <p>{error}</p>
            <button type="button" onClick={() => setError(null)} className="font-medium underline">
              {t('common.close')}
            </button>
          </div>
        ) : null}

        <form
          className="mt-4 flex flex-col gap-2 rounded-full bg-[#F4F8FF] p-1 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
        >
          <label className="sr-only" htmlFor="ws-staff">{t('compensation.staff')}</label>
          <select
            id="ws-staff"
            className={`${fieldClass} h-9 sm:w-44 sm:border-0 sm:bg-transparent sm:px-3 sm:focus:ring-0`}
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
          >
            <option value="">{t('compensation.allStaff')}</option>
            {staffOptions.map((s) => (
              <option key={s.uuid} value={s.uuid}>{s.name}</option>
            ))}
          </select>
          <WorksheetDateRange
            start={start}
            end={end}
            onChange={(nextStart, nextEnd) => {
              setStart(nextStart);
              setEnd(nextEnd);
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="h-9 rounded-full bg-white px-4 text-sm font-semibold text-[#0B57D0] outline-none ring-1 ring-[#D7E3F4] hover:bg-[#E8F1FF] focus-visible:ring-4 focus-visible:ring-[#0B57D0]/20 disabled:opacity-50"
          >
            {t('common.search')}
          </button>
        </form>

        <div className="mt-4">
          {rows.length === 0 && (loading || searched) ? (
            <div className="rounded-[28px] border border-dashed border-[#D7E3F4] px-6 py-16 text-center">
              <p className="text-[15px] text-[#5C6B80]">
                {loading ? t('common.loading') : t('compensation.noWorksheets')}
              </p>
            </div>
          ) : rows.length === 0 ? null : (
            <ul>
              {rows.map((row) => (
                <WorksheetRow
                  key={row.uuid}
                  row={row}
                  staffName={names.get(row.staff_id) ?? row.staff_id}
                  canDetach={canAssign && row.status === 'open' && Boolean(row.compensation_period_uuid)}
                  busy={busy}
                  onOpen={openWorksheet}
                  onDetach={detach}
                  statusLabel={t(`compensation.worksheetStatus.${row.status}`)}
                  generateLabel={t(`compensation.generateStatus.${row.generate_status}`)}
                  paydayLabel={row.compensation_period_uuid ? t('compensation.attached') : t('compensation.notAttached')}
                  detachLabel={t('compensation.detach')}
                />
              ))}
            </ul>
          )}
          {cursor ? (
            <div className="pt-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => load(cursor)}
                className="h-11 rounded-full px-5 text-sm font-semibold text-[#0B57D0] outline-none hover:bg-[#E8F1FF] focus-visible:ring-2 focus-visible:ring-[#0B57D0] disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('common.next')}
              </button>
            </div>
          ) : null}
        </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0D1B2A]/40 p-4 sm:items-center" role="presentation" onClick={() => setCreateOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ws-create-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(13,27,42,0.16)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="ws-create-title" className="text-xl font-semibold tracking-[-0.02em] text-[#0D1B2A]">
              {t('compensation.newWorksheet')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C6B80]">
              {t('compensation.createUnattachedHint')}
            </p>
            <label className="mt-5 block text-[13px] font-medium text-[#3D4F6F]" htmlFor="ws-staff-create">
              {t('compensation.staff')}
            </label>
            {isAdmin ? (
              <button
                id="ws-staff-create"
                type="button"
                onClick={staffDrawer.openDrawer}
                className={`${fieldClass} mt-2 text-left`}
              >
                {names.get(createStaffId) || currentUser?.name || t('compensation.staff')}
              </button>
            ) : (
              <input
                id="ws-staff-create"
                className={`${fieldClass} mt-2 bg-[#F4F8FF] text-[#5C6B80]`}
                value={currentUser?.name || currentUserId}
                readOnly
              />
            )}
            <p className="mb-1 mt-4 text-[13px] font-medium text-[#3D4F6F]">{t('compensation.dateRange')}</p>
            <WorksheetDateRange
              start={createStart}
              end={createEnd}
              onChange={(nextStart, nextEnd) => {
                setCreateStart(nextStart);
                setCreateEnd(nextEnd);
              }}
            />
            <label className="mt-4 block text-[13px] font-medium text-[#3D4F6F]" htmlFor="ws-label">
              {t('compensation.worksheetLabel')}
            </label>
            <input
              id="ws-label"
              className={`${fieldClass} mt-2`}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            {createError ? <p className="mt-3 text-sm text-[#9B2C2C]">{createError}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="h-11 rounded-full px-4 text-sm font-semibold text-[#3D4F6F] hover:bg-[#F4F8FF]"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={create}
                className="h-11 rounded-full bg-[#0B57D0] px-5 text-sm font-semibold text-white hover:bg-[#0847B0] disabled:opacity-50"
              >
                {t('compensation.createWorksheet')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Drawer
        isOpen={staffDrawer.isOpen}
        onClose={staffDrawer.closeDrawer}
        title={t('compensation.staff')}
        maxWidth="md"
        position="right"
      >
        <div className="flex h-full flex-col bg-[#F4F8FF] p-4">
          <input
            className={fieldClass}
            value={staffQuery}
            placeholder={t('common.search')}
            onChange={(e) => setStaffQuery(e.target.value)}
          />
          <ul className="mt-3 flex-1 overflow-auto rounded-2xl bg-white">
            {drawerStaff.map((s) => (
                <li key={s.uuid} className="border-b border-[#E6EEF8] last:border-b-0">
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm text-[#0D1B2A] hover:bg-[#F4F8FF]"
                    onClick={() => {
                      setCreateStaffId(s.uuid);
                      staffDrawer.closeDrawer();
                    }}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      </Drawer>
    </div>
  );
};

export default WorksheetList;
