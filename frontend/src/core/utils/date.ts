/** Fixed start year for dashboard year range (2020 to current year). */
export const YEAR_RANGE_START = 2020;

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/** Year options from YEAR_RANGE_START to current year (inclusive). */
export function getYearOptions(): { value: number; label: string }[] {
  const endYear = getCurrentYear();
  return Array.from(
    { length: endYear - YEAR_RANGE_START + 1 },
    (_, i) => YEAR_RANGE_START + i,
  ).map((value) => ({ value, label: String(value) }));
}

/** Build month-year options (YYYY-MM) from startYear to endYear inclusive. */
export function getMonthYearOptions(
  startYear: number,
  endYear: number,
  monthAbbrev: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const value = `${y}-${String(m).padStart(2, '0')}`;
      const label = `${monthAbbrev[m - 1]} ${y}`;
      options.push({ value, label });
    }
  }
  return options;
}

// Format a Date object to a readable string (e.g. "January 1, 2021")
export function formatDate(date: Date | string | undefined | null): string {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d);
}

// Format a Date object to a readable string with time (e.g. "January 1, 2021, 12:00 PM")
export function formatDateTime(date: Date | string | undefined | null): string {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    }).format(d);
}
