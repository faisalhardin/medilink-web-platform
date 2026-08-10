import { getApiErrorMessage, getApiErrorStatus, isClientErrorStatus } from './apiErrors';

export interface ApiErrorReportPayload {
  message: string;
}

type Listener = (payload: ApiErrorReportPayload | null) => void;

let listener: Listener | null = null;

export function setApiErrorReportListener(next: Listener | null): void {
  listener = next;
}

export function showApiErrorReport(error: unknown): void {
  const status = getApiErrorStatus(error);
  if (!isClientErrorStatus(status) || status === 401) return;

  listener?.({
    message: getApiErrorMessage(error),
  });
}

export function clearApiErrorReport(): void {
  listener?.(null);
}
