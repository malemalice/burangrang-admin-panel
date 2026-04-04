import * as dayjs from 'dayjs';

export const handlebarsHelpers = {
  uppercase: (value: string) => (value ?? '').toUpperCase(),
  lowercase: (value: string) => (value ?? '').toLowerCase(),
  formatDate: (value?: string | Date, format: string = 'YYYY-MM-DD HH:mm') => {
    if (!value) return '';
    return dayjs(value).format(format);
  },
  // Safe fallback for missing values
  default: (value: unknown, fallback: unknown) => (value == null ? fallback : value),
  // Increment a number (useful for 1-based {{@index}} in {{#each}})
  inc: (value: number) => value + 1,
};


