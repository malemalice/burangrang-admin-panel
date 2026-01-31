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
