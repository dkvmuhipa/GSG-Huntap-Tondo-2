/**
 * Sanitizes CSV cell values against OWASP CSV Formula Injection (=, +, -, @, tab, CR)
 * and escapes quotes properly for RFC 4180 compliance.
 */
export function sanitizeCsvCell(cell: unknown): string {
  let val = cell === null || cell === undefined ? '' : String(cell);
  if (/^[=+\-@\t\r]/.test(val)) {
    val = `'${val}`;
  }
  return `"${val.replace(/"/g, '""')}"`;
}
