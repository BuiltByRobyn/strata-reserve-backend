/** Convert a date string (YYYY-MM-DD or ISO) to a UTC midnight Date, or null/undefined.
 *  Strips any time/timezone info and always produces UTC midnight for the calendar date. */
export function toUTCDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (!value) return null;
  const datePart = value.split('T')[0];
  return new Date(datePart + 'T00:00:00Z');
}
