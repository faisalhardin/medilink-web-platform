import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
} from '@mui/material';
import { Add, AddCircleOutline } from '@mui/icons-material';
import { useModal } from '../context/ModalContext';
import { getStorageUser } from '@utils/storage';
import { hasStaffPermission } from '@utils/permissions';
import { showSuccessToast } from '@utils/toast';
import { STAFF_ROLES, getRoleLabel } from '../constants/staffRoles';
import { ListStaff, AssignRole, UnassignRole, DeactivateStaff, ActivateStaff } from '@requests/staff';
import { StaffMember } from '@models/staff';
import CreateStaffForm from './CreateStaffForm';
import StaffConfirmDialog from './StaffConfirmDialog';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: 'error' | 'warning' | 'primary';
  onConfirm: () => void;
}

const DEFAULT_CONFIRM: ConfirmState = {
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  confirmColor: 'error',
  onConfirm: () => {},
};

const StaffManagementComponent = () => {
  const { t } = useTranslation();
  const { openModal } = useModal();

  const currentUser = getStorageUser();
  const canRead = hasStaffPermission(currentUser, 'read');
  const canCreate = hasStaffPermission(currentUser, 'create');
  const canDelete = hasStaffPermission(currentUser, 'delete');
  const canRoleAssign = hasStaffPermission(currentUser, 'roleAssign');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [mutatingUuid, setMutatingUuid] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(DEFAULT_CONFIRM);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ListStaff(includeInactive);
      setStaff(result.staff ?? []);
    } catch {
      // 4xx messages are shown by the global API error modal
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    if (canRead) {
      fetchStaff();
    }
  }, [canRead, fetchStaff]);

  const closeConfirm = () => setConfirm(DEFAULT_CONFIRM);

  const handleAddStaff = () => {
    openModal(<CreateStaffForm onSuccess={fetchStaff} />, { maxWidth: 'sm' });
  };

  const handleAssignRole = async (member: StaffMember, roleId: number) => {
    setMutatingUuid(member.uuid);
    try {
      await AssignRole({ staff_uuid: member.uuid, role_id: roleId });
      showSuccessToast('Role assigned successfully.');
      await fetchStaff();
    } catch {
      // 4xx messages are shown by the global API error modal
    } finally {
      setMutatingUuid(null);
    }
  };

  const handleUnassignRole = (member: StaffMember, roleId: number, roleName: string) => {
    const isAdmin = roleName === 'administrator';
    setConfirm({
      open: true,
      title: isAdmin ? 'Remove Administrator Role' : 'Remove Role',
      message: isAdmin
        ? `Are you sure you want to remove the Administrator role from ${member.name}? This cannot be done if they are the last administrator.`
        : `Remove the "${getRoleLabel(roleId)}" role from ${member.name}?`,
      confirmLabel: 'Remove',
      confirmColor: isAdmin ? 'warning' : 'error',
      onConfirm: async () => {
        closeConfirm();
        setMutatingUuid(member.uuid);
        try {
          await UnassignRole({ staff_uuid: member.uuid, role_id: roleId });
          showSuccessToast('Role removed successfully.');
          await fetchStaff();
        } catch {
          // 4xx messages are shown by the global API error modal
        } finally {
          setMutatingUuid(null);
        }
      },
    });
  };

  const handleDeactivate = (member: StaffMember) => {
    setConfirm({
      open: true,
      title: 'Deactivate Staff',
      message: `Are you sure you want to deactivate ${member.name}? They will no longer be able to log in.`,
      confirmLabel: 'Deactivate',
      confirmColor: 'error',
      onConfirm: async () => {
        closeConfirm();
        setMutatingUuid(member.uuid);
        try {
          await DeactivateStaff(member.uuid);
          showSuccessToast('Staff deactivated successfully.');
          await fetchStaff();
        } catch {
          // 4xx messages are shown by the global API error modal
        } finally {
          setMutatingUuid(null);
        }
      },
    });
  };

  const handleActivate = (member: StaffMember) => {
    setConfirm({
      open: true,
      title: 'Activate Staff',
      message: `Activate ${member.name}? They will be able to log in again using their Google account.`,
      confirmLabel: 'Activate',
      confirmColor: 'primary',
      onConfirm: async () => {
        closeConfirm();
        setMutatingUuid(member.uuid);
        try {
          await ActivateStaff(member.uuid);
          showSuccessToast('Staff activated successfully.');
          await fetchStaff();
        } catch {
          // 4xx messages are shown by the global API error modal
        } finally {
          setMutatingUuid(null);
        }
      },
    });
  };

  if (!canRead) {
    return <Navigate to="/forbidden" replace />;
  }

  const availableRolesForMember = (member: StaffMember) => {
    const assignedIds = new Set(member.roles.map(r => r.role_id));
    return STAFF_ROLES.filter(r => !assignedIds.has(r.role_id));
  };

  return (
    <div className="flex-1 p-6 w-full space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {t('staff.title', 'Staff Management')}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t('staff.subtitle', 'Manage staff members, roles, and access for your institution.')}
              </p>
            </div>
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddStaff}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {t('staff.addStaff', 'Add Staff')}
              </Button>
            )}
          </div>

          {/* Show inactive toggle */}
          <div className="mt-4">
            <FormControlLabel
              control={
                <Switch
                  checked={includeInactive}
                  onChange={e => setIncludeInactive(e.target.checked)}
                  size="small"
                />
              }
              label={
                <span className="text-sm text-gray-600">
                  {t('staff.showInactive', 'Show inactive staff')}
                </span>
              }
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : staff.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1 }}>
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <Typography variant="body1" color="text.secondary">
              {t('staff.noStaff', 'No staff members yet.')}
            </Typography>
            {canCreate && (
              <Button variant="outlined" size="small" startIcon={<Add />} onClick={handleAddStaff}>
                {t('staff.addStaff', 'Add Staff')}
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                    {t('staff.columns.name', 'Name')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                    {t('staff.columns.email', 'Email')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                    {t('staff.columns.roles', 'Roles')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                    {t('staff.columns.status', 'Status')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                    {t('staff.columns.actions', 'Actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map(member => {
                  const isMutating = mutatingUuid === member.uuid;
                  const isCurrentUser = currentUser?.uuid === member.uuid;
                  const textColor = member.is_active ? 'inherit' : 'text.disabled';
                  const availableRoles = availableRolesForMember(member);

                  return (
                    <TableRow key={member.uuid} hover>
                      <TableCell>
                        <Typography variant="body2" color={textColor} fontWeight={500}>
                          {member.name}
                          {isCurrentUser && (
                            <Chip label="You" size="small" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                          )}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color={textColor}>
                          {member.email}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                          {member.roles.map(role => (
                            <Chip
                              key={role.role_id}
                              label={getRoleLabel(role.role_id)}
                              size="small"
                              variant="outlined"
                              color={role.name === 'administrator' ? 'primary' : 'default'}
                              onDelete={
                                canRoleAssign && !isMutating
                                  ? () => handleUnassignRole(member, role.role_id, role.name)
                                  : undefined
                              }
                            />
                          ))}

                          {canRoleAssign && availableRoles.length > 0 && (
                            <FormControl size="small" variant="outlined" sx={{ minWidth: 'auto' }}>
                              <Select
                                displayEmpty
                                value=""
                                disabled={isMutating}
                                IconComponent={() => null}
                                onChange={e => {
                                  const roleId = Number(e.target.value);
                                  if (roleId) handleAssignRole(member, roleId);
                                }}
                                renderValue={() => (
                                  <AddCircleOutline 
                                    sx={{ 
                                      fontSize: 20, 
                                      color: '#6b7280',
                                      transition: 'color 0.2s ease',
                                    }} 
                                  />
                                )}
                                sx={{ 
                                  fontSize: 12, 
                                  height: 28,
                                  width: 28,
                                  cursor: 'pointer',
                                  '& .MuiSelect-select': { 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    padding: '0 !important',
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                  '&:hover svg': {
                                    color: '#1976d2',
                                  },
                                }}
                              >
                                {availableRoles.map(role => (
                                  <MenuItem key={role.role_id} value={role.role_id}>
                                    {role.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={member.is_active ? t('staff.status.active', 'Active') : t('staff.status.inactive', 'Inactive')}
                          size="small"
                          sx={{
                            backgroundColor: member.is_active ? '#dcfce7' : '#f3f4f6',
                            color: member.is_active ? '#166534' : '#6b7280',
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        {canDelete && member.is_active && !isCurrentUser && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            disabled={isMutating}
                            onClick={() => handleDeactivate(member)}
                          >
                            {t('staff.actions.deactivate', 'Deactivate')}
                          </Button>
                        )}
                        {canDelete && !member.is_active && (
                          <Button
                            size="small"
                            color="primary"
                            variant="outlined"
                            disabled={isMutating}
                            onClick={() => handleActivate(member)}
                          >
                            {t('staff.actions.activate', 'Activate')}
                          </Button>
                        )}
                        {isMutating && <CircularProgress size={16} sx={{ ml: 1 }} />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      <StaffConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        confirmColor={confirm.confirmColor}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default StaffManagementComponent;
