import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Button,
  FormHelperText,
  Typography,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import { useModal } from '../context/ModalContext';
import { showSuccessToast } from '@utils/toast';
import { STAFF_ROLES, StaffRoleCatalogItem } from '../constants/staffRoles';
import { CreateStaff } from '@requests/staff';

interface CreateStaffFormProps {
  onSuccess: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  roles?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CreateStaffForm = ({ onSuccess }: CreateStaffFormProps) => {
  const { t } = useTranslation();
  const { closeModal } = useModal();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [roleSearch, setRoleSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const tagInputRef = useRef<HTMLDivElement>(null);
  const roleInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateDropdownPosition = useCallback(() => {
    const el = tagInputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 1400,
    });
  }, []);

  const filteredRoles: StaffRoleCatalogItem[] = STAFF_ROLES.filter(
    r =>
      !selectedRoleIds.includes(r.role_id) &&
      r.label.toLowerCase().includes(roleSearch.toLowerCase()),
  );

  useEffect(() => {
    if (!dropdownOpen) return;
    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [dropdownOpen, selectedRoleIds, updateDropdownPosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        tagInputRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setDropdownOpen(false);
      setRoleSearch('');
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectRole = (role: StaffRoleCatalogItem) => {
    setSelectedRoleIds(prev => [...prev, role.role_id]);
    setRoleSearch('');
    if (errors.roles) setErrors(prev => ({ ...prev, roles: undefined }));
    roleInputRef.current?.focus();
  };

  const removeRole = (roleId: number) => {
    setSelectedRoleIds(prev => prev.filter(id => id !== roleId));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = t('staff.form.nameRequired', 'Name is required.');
    if (!email.trim()) {
      newErrors.email = t('staff.form.emailRequired', 'Email is required.');
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = t('staff.form.emailInvalid', 'Enter a valid email address.');
    }
    if (selectedRoleIds.length === 0) {
      newErrors.roles = t('staff.form.rolesRequired', 'Select at least one role.');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await CreateStaff({ name: name.trim(), email: email.trim().toLowerCase(), role_ids: selectedRoleIds });
      showSuccessToast(t('staff.form.createSuccess', 'Staff member created successfully.'));
      closeModal();
      onSuccess();
    } catch {
      // 4xx messages are shown by the global API error modal
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 480 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {t('staff.form.title', 'Add New Staff Member')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('staff.form.subtitle', 'The staff member will log in with Google using the email address provided.')}
      </Typography>

      <TextField
        label={t('staff.form.name', 'Full Name')}
        value={name}
        onChange={e => {
          setName(e.target.value);
          if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
        }}
        error={!!errors.name}
        helperText={errors.name}
        fullWidth
        required
        size="small"
        sx={{ mb: 2 }}
        placeholder={t('staff.form.namePlaceholder', 'e.g. Dr. Jane Smith')}
      />

      <TextField
        label={t('staff.form.email', 'Email Address')}
        type="email"
        value={email}
        onChange={e => {
          setEmail(e.target.value);
          if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
        }}
        error={!!errors.email}
        helperText={
          errors.email ||
          t('staff.form.emailHelper', 'Staff sign in with Google using this email address. Email must be unique among active staff across all institutions.')
        }
        fullWidth
        required
        size="small"
        sx={{ mb: 2 }}
        placeholder="name@clinic.com"
      />

      <Divider sx={{ my: 2 }} />

      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        {t('staff.form.rolesLabel', 'Roles')} *
      </Typography>

      {/* Tag input */}
      <Box>
        <Box
          ref={tagInputRef}
          onClick={() => {
            setDropdownOpen(true);
            requestAnimationFrame(updateDropdownPosition);
            roleInputRef.current?.focus();
          }}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 0.5,
            minHeight: 40,
            px: 1.5,
            py: 0.75,
            border: errors.roles ? '1px solid #d32f2f' : '1px solid rgba(0,0,0,0.23)',
            borderRadius: 1,
            cursor: 'text',
            '&:hover': { borderColor: errors.roles ? '#d32f2f' : 'rgba(0,0,0,0.87)' },
            ...(dropdownOpen && {
              borderColor: errors.roles ? '#d32f2f' : '#1976d2',
              borderWidth: '2px',
              outline: 'none',
            }),
          }}
        >
          {selectedRoleIds.map(id => {
            const role = STAFF_ROLES.find(r => r.role_id === id);
            if (!role) return null;
            return (
              <Chip
                key={id}
                label={role.label}
                size="small"
                onDelete={() => removeRole(id)}
                color={role.name === 'administrator' ? 'primary' : 'default'}
                variant="outlined"
              />
            );
          })}
          <input
            ref={roleInputRef}
            value={roleSearch}
            onChange={e => {
              setRoleSearch(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => {
              setDropdownOpen(true);
              requestAnimationFrame(updateDropdownPosition);
            }}
            onKeyDown={e => {
              if (e.key === 'Backspace' && roleSearch === '' && selectedRoleIds.length > 0) {
                removeRole(selectedRoleIds[selectedRoleIds.length - 1]);
              }
              if (e.key === 'Escape') {
                setDropdownOpen(false);
                setRoleSearch('');
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredRoles.length > 0) selectRole(filteredRoles[0]);
              }
            }}
            placeholder={selectedRoleIds.length === 0 ? 'Search roles...' : ''}
            style={{
              border: 'none',
              outline: 'none',
              flex: 1,
              minWidth: 80,
              fontSize: 14,
              background: 'transparent',
              padding: '2px 0',
            }}
          />
        </Box>

        {/* Dropdown — portaled to escape modal overflow clipping */}
        {dropdownOpen && createPortal(
          <Box
            ref={dropdownRef}
            style={dropdownStyle}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 1,
              boxShadow: 3,
              overflow: 'hidden',
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            {filteredRoles.length === 0 ? (
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedRoleIds.length === STAFF_ROLES.length
                    ? 'All roles assigned'
                    : 'No matching roles'}
                </Typography>
              </Box>
            ) : (
              filteredRoles.map(role => (
                <Box
                  key={role.role_id}
                  onMouseDown={e => {
                    e.preventDefault();
                    selectRole(role);
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                    cursor: 'pointer',
                    fontSize: 14,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  {role.label}
                </Box>
              ))
            )}
          </Box>,
          document.body,
        )}
      </Box>

      {errors.roles && (
        <FormHelperText error sx={{ mx: '14px' }}>{errors.roles}</FormHelperText>
      )}

      <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={closeModal} disabled={submitting}>
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? t('staff.form.creating', 'Creating...') : t('staff.form.create', 'Create Staff')}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateStaffForm;
