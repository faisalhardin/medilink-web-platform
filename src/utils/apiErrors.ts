export interface ApiErrorItem {
  error_name: string;
  error_description: string;
}

interface AxiosErrorLike {
  response?: {
    status?: number;
    data?: {
      error_messages?: ApiErrorItem[] | { error_list?: ApiErrorItem[] };
    };
  };
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

function resolveItemMessage(item: ApiErrorItem): string {
  const friendly = STAFF_ERROR_MESSAGES[item.error_name];
  if (friendly) return friendly;
  return item.error_description || item.error_name || 'Something went wrong.';
}

export function getApiErrorItems(error: unknown): ApiErrorItem[] {
  if (!error || typeof error !== 'object') return [];

  const data = (error as AxiosErrorLike).response?.data?.error_messages;
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.filter(
      (item): item is ApiErrorItem =>
        !!item && typeof item === 'object' && typeof item.error_name === 'string'
    );
  }

  // Legacy nested shape fallback
  if (Array.isArray(data.error_list)) {
    return data.error_list;
  }

  return [];
}

export function getApiErrorMessage(error: unknown): string {
  const items = getApiErrorItems(error);
  if (items.length === 0) return 'Something went wrong.';

  return items.map(resolveItemMessage).join('\n');
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  return (error as AxiosErrorLike).response?.status;
}

export function isClientErrorStatus(status: number | undefined): boolean {
  return typeof status === 'number' && status >= 400 && status < 500;
}
