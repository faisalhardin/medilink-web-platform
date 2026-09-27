import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Chip, MenuItem, TextField } from '@mui/material';
import { formatSourceChip, sourceTypeColor } from '@utils/compensationSources';
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

const VisitContributorPanel = ({ visitId }: { visitId: number | string }) => {
  const { t, i18n } = useTranslation();
  const user = getStorageUser();
  const canRead = hasPermission(user, PERMISSIONS.compensation.read);
  const canAssign = hasPermission(user, PERMISSIONS.compensation.assign);
  const [contributors, setContributors] = useState<VisitContributor[]>([]);
  const [lockedAt, setLockedAt] = useState<string | null>(null);
  const [staffOptions, setStaffOptions] = useState<{ uuid: string; name: string }[]>([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  if (!canRead) return null;

  const locked = Boolean(lockedAt);

  const add = async () => {
    if (!selected) return;
    setError(null);
    try {
      await AddVisitContributor(visitId, selected);
      setSelected('');
      await load();
    } catch {
      setError(t('compensation.contributorSaveError'));
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
    <section className="mt-6 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-base font-semibold">{t('compensation.contributors')}</h3>
        {locked && <Chip size="small" color="warning" label={t('compensation.visitLocked')} />}
      </div>
      <p className="mt-1 text-sm text-gray-500">{t('compensation.contributorsHint')}</p>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <ul className="mt-3 space-y-2">
        {contributors.length === 0 && <li className="text-sm text-gray-500">{t('compensation.noContributors')}</li>}
        {contributors.map((c) => (
          <li key={c.staff_id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{c.name}</span>
              <Chip size="small" label={formatSourceChip(c.source, locale)} color={sourceTypeColor(c.source.type)} variant="outlined" />
            </div>
            {canAssign && c.added_manually && !locked && (
              <Button size="small" color="inherit" onClick={() => remove(c.staff_id)}>{t('common.delete')}</Button>
            )}
          </li>
        ))}
      </ul>
      {canAssign && !locked && (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <TextField
            select
            size="small"
            label={t('compensation.staff')}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {available.map((s) => (
              <MenuItem key={s.uuid} value={s.uuid}>{s.name}</MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" disabled={!selected} onClick={add}>{t('compensation.addContributor')}</Button>
        </div>
      )}
    </section>
  );
};

export default VisitContributorPanel;
