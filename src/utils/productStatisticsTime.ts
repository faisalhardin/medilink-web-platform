import { endOfDay, startOfDay, subDays } from 'date-fns';

export function getTimezoneOffsetString(date: Date = new Date()): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
}

export function toRFC3339WithOffset(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const offset = getTimezoneOffsetString(date);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
}

export function getDefault7DayRange(referenceDate: Date = new Date()): {
  start: Date;
  end: Date;
} {
  const end = endOfDay(referenceDate);
  const start = startOfDay(subDays(referenceDate, 6));
  return { start, end };
}

export function dateToInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function timeToInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const DEFAULT_START_TIME = '00:00';
export const DEFAULT_END_TIME = '23:59';

export function mergeDateInput(existing: Date, dateValue: string): Date {
  const [year, month, day] = dateValue.split('-').map(Number);
  const next = new Date(existing);
  next.setFullYear(year, month - 1, day);
  return next;
}

export function mergeStartDateInput(existing: Date, dateValue: string): Date {
  return mergeTimeInput(mergeDateInput(existing, dateValue), DEFAULT_START_TIME);
}

export function mergeEndDateInput(existing: Date, dateValue: string): Date {
  const next = mergeTimeInput(mergeDateInput(existing, dateValue), DEFAULT_END_TIME);
  next.setSeconds(59, 0);
  return next;
}

export function mergeTimeInput(existing: Date, timeValue: string): Date {
  const [hours, minutes] = timeValue.split(':').map(Number);
  const next = new Date(existing);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function rangeSpanDays(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
}

export function daysBetweenInclusive(start: Date, end: Date): number {
  return Math.max(1, Math.ceil(rangeSpanDays(start, end)));
}

export function isEndBeforeOrEqualStart(start: Date, end: Date): boolean {
  return end.getTime() <= start.getTime();
}

export function exceedsMaxRangeDays(start: Date, end: Date, maxDays: number): boolean {
  return rangeSpanDays(start, end) > maxDays;
}

export function buildStatisticsTimeRange(start: Date, end: Date): {
  startTime: string;
  endTime: string;
} {
  return {
    startTime: toRFC3339WithOffset(start),
    endTime: toRFC3339WithOffset(end),
  };
}
