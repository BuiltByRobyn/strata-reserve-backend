/** Convert a date string (YYYY-MM-DD or ISO) to a UTC midnight Date, or null/undefined.
 *  Strips any time/timezone info and always produces UTC midnight for the calendar date. */
export function toUTCDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (!value) return null;
  const datePart = value.split('T')[0];
  return new Date(datePart + 'T00:00:00Z');
}

export function isWithin48Hours(appointmentDate: string, slotTime: string): boolean {
  const dateStr = appointmentDate.split('T')[0];
  const appointmentStart = new Date(`${dateStr}T${slotTime}:00Z`);
  const now = new Date();
  const diffMs = appointmentStart.getTime() - now.getTime();
  return diffMs < 48 * 60 * 60 * 1000;
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function formatDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Format an ISO date string as "DD Month YYYY" (e.g. "01 January 2024").
 * Uses en-GB locale. Returns the raw input if the date is invalid.
 */
export function formatDateLong(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}
