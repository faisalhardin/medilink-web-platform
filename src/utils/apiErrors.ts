interface ErrorListItem {
  error_name: string;
  error_description: string;
}

const STAFF_ERROR_MESSAGES: Record<string, string> = {
  email_exists: 'An active staff member with this email already exists.',
  last_administrator: 'Cannot remove the last administrator in this institution.',
  cannot_deactivate_self: 'You cannot deactivate your own account.',
  email_exists_other_institution: 'An active account with this email exists in another institution. Contact support.',
  staff_not_found: 'Staff not found.',
  role_not_found: 'One or more selected roles are invalid.',
  insufficient_permissions: 'You do not have permission to perform this action.',
  'api call is unauthorized': 'Unauthorized. Please log in again.',
};

export function getApiErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Something went wrong.';

  const axiosError = error as { response?: { data?: { error_messages?: { error_list?: ErrorListItem[] } } } };
  const firstError = axiosError.response?.data?.error_messages?.error_list?.[0];

  if (!firstError) return 'Something went wrong.';

  const friendly = STAFF_ERROR_MESSAGES[firstError.error_name];
  if (friendly) return friendly;

  return firstError.error_description || firstError.error_name || 'Something went wrong.';
}
