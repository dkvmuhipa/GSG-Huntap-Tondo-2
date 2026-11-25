/**
 * Local timezone-safe date utilities (prevents UTC offset bugs in WITA UTC+8).
 */

export function getLocalDateISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getOffsetLocalDateISO(daysOffset: number, baseDate: Date = new Date()): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  d.setDate(d.getDate() + daysOffset);
  return getLocalDateISO(d);
}

export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    return new Date(year, month, day);
  }
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function maskPhoneNumber(phone: string | null | undefined): string {
  const raw = String(phone || '').trim();
  if (!raw) return '-';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return raw;
  const localDigits = digits.startsWith('62') ? '0' + digits.slice(2) : digits;
  const prefix = localDigits.slice(0, 4);
  const suffix = localDigits.slice(-4);
  return `${prefix}-****-${suffix}`;
}
