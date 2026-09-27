import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { formatSourceChip } from '@utils/compensationSources';
import { getStorageUser } from '@utils/storage';
import { hasPermission } from '@utils/permissions';
import { PERMISSIONS } from 'constants/permissions';
import { ListStaff } from '@requests/staff';
import {
  AddVisitContributor,
  DeleteVisitContributor,
  ListVisitContributors,
} from '@requests/visitContributor';
import type { VisitContributor } from '@models/compensation';

type StaffOption = { uuid: string; name: string };

const VisitContributorPanel = ({ visitId }: { visitId: number | string }) => {
  const { t, i18n } = useTranslation();
  const user = getStorageUser();
  const canRead = hasPermission(user, PERMISSIONS.compensation.read);
  const canAssign = hasPermission(user, PERMISSIONS.compensation.assign);
  const [contributors, setContributors] = useState<VisitContributor[]>([]);
  const [lockedAt, setLockedAt] = useState<string | null>(null);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const locale = i18n.language.startsWith('id') ? 'id' : 'en';

  const load = async () => {
    const resp = await ListVisitContributors(visitId);
    setContributors(resp.contributors ?? []);
    setLockedAt(resp.compensation_locked_at);
  };

  useEffect(() => {
    if (!canRead || !visitId) return;
    load().catch(() => setError(t('compensation.loadError')));
    ListStaff(false)
      .then((resp) => setStaffOptions((resp.staff ?? []).map((s) => ({ uuid: s.uuid, name: s.name }))))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId, canRead]);

  const available = useMemo(
    () => staffOptions.filter((s) => !contributors.some((c) => c.staff_id === s.uuid)),
    [staffOptions, contributors]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? available.filter((s) => s.name.toLowerCase().includes(q)) : available;
    return [...list].sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [available, query, locale]);

  const closePicker = () => {
    setPickerOpen(false);
    setQuery('');
  };

  useEffect(() => {
    if (!pickerOpen) return;
    searchInputRef.current?.focus();
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        closePicker();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePicker();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pickerOpen]);

  if (!canRead) return null;

  const locked = Boolean(lockedAt);
  const canEdit = canAssign && !locked;

  const add = async (staffId: string) => {
    if (addingId) return;
    setError(null);
    setAddingId(staffId);
    try {
      await AddVisitContributor(visitId, staffId);
      setQuery('');
      await load();
    } catch {
      setError(t('compensation.contributorSaveError'));
    } finally {
      setAddingId(null);
    }
  };

  const remove = async (staffId: string) => {
    setError(null);
    try {
      await DeleteVisitContributor(visitId, staffId);
      await load();
    } catch {
      setError(t('compensation.contributorSaveError'));
    }
  };

  return (
    <section className="w-full min-w-0 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div ref={pickerRef}>
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <h3 className="min-w-0 text-sm font-semibold text-gray-800">{t('compensation.contributors')}</h3>
          {canEdit && (
            <button
              type="button"
              aria-expanded={pickerOpen}
              aria-controls="visit-contributor-picker"
              aria-label={t('compensation.addContributor')}
              onClick={() => (pickerOpen ? closePicker() : setPickerOpen(true))}
              className={`shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${pickerOpen ? 'bg-gray-100 text-gray-800' : ''}`}
            >
              <Cog6ToothIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {pickerOpen && canEdit && (
          <div id="visit-contributor-picker" className="border-t border-gray-100 px-3 py-2">
            <p className="mb-2 text-xs text-gray-500">{t('compensation.contributorsHint')}</p>
            <input
              ref={searchInputRef}
              type="text"
              role="combobox"
              aria-expanded={pickerOpen}
              aria-controls="visit-contributor-staff-list"
              aria-autocomplete="list"
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={t('compensation.searchStaff')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ul
              id="visit-contributor-staff-list"
              role="listbox"
              className="mt-1 max-h-40 list-none overflow-y-auto rounded-md border border-gray-200"
            >
              {matches.length === 0 ? (
                <li className="px-2 py-1.5 text-xs text-gray-500">{t('compensation.noStaffMatch')}</li>
              ) : (
                matches.map((s) => (
                  <li key={s.uuid} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      disabled={addingId !== null}
                      className="w-full px-2 py-1.5 text-left text-xs text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none disabled:opacity-50"
                      onClick={() => add(s.uuid)}
                    >
                      {s.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {locked && (
        <p className="border-t border-gray-100 px-3 py-2 text-xs text-amber-700">{t('compensation.visitLocked')}</p>
      )}

      {error && (
        <p className="border-t border-gray-100 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <div className="border-t border-gray-100 px-3 py-2">
        {contributors.length === 0 ? (
          <p className="py-1 text-center text-xs text-gray-500">{t('compensation.noContributors')}</p>
        ) : (
          <ul className="space-y-2">
            {contributors.map((c) => (
              <li key={c.staff_id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{formatSourceChip(c.source, locale)}</p>
                </div>
                {canEdit && c.added_manually && (
                  <button
                    type="button"
                    aria-label={t('common.delete')}
                    onClick={() => remove(c.staff_id)}
                    className="shrink-0 rounded px-1 text-sm leading-none text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default VisitContributorPanel;
