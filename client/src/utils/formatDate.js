/**
 * Format a date string to YYYY-MM-DD.
 * Handles ISO strings (2026-05-20T00:00:00.000Z), Date objects, dayjs objects, and plain YYYY-MM-DD strings.
 */
export function formatDate(v) {
  if (!v) return '-';
  if (typeof v === 'string') {
    // Already YYYY-MM-DD or ISO string
    return v.split('T')[0];
  }
  if (v instanceof Date) {
    return v.toISOString().split('T')[0];
  }
  // dayjs object
  if (v.format) {
    return v.format('YYYY-MM-DD');
  }
  return String(v);
}
