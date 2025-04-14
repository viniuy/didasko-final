import { format, parseISO, startOfDay } from 'date-fns';

/**
 * Normalizes a date by setting the time to midnight (start of day)
 * Accepts Date object or ISO string
 */
export function normalizeDate(date: Date): Date {
  return startOfDay(new Date(date));
}

/**
 * Formats a date as YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Formats a date in a readable format (e.g., "Jan 1, 2023")
 */
export function formatDateReadable(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM d, yyyy');
}
