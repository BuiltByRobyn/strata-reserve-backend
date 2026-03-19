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
 * Given a base date, return the most recent anniversary (same month/day) that is
 * on or before today (UTC). Clamps Feb 29 to Feb 28 in non-leap years.
 */
export function mostRecentAnniversary(baseDate: Date): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const month = baseDate.getUTCMonth();
  const day = baseDate.getUTCDate();
  let year = today.getUTCFullYear();

  for (let i = 0; i < 10; i++) {
    let candidate = new Date(Date.UTC(year, month, day));
    if (candidate.getUTCMonth() !== month) {
      candidate = new Date(Date.UTC(year, month + 1, 0));
    }
    if (candidate <= today) return candidate;
    year--;
  }
  return baseDate;
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
