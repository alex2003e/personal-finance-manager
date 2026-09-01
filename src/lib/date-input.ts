/**
 * `new Date("2026-08-01")` interpreta la fecha como medianoche UTC, no local
 * — en Colombia (UTC-5) eso cae en "31 de julio 19:00" hora local, corriendo
 * la fecha un día hacia atrás y haciendo que el movimiento "desaparezca" del
 * mes correcto. Los inputs `type="date"` siempre entregan "YYYY-MM-DD"; hay
 * que construir la fecha con el constructor local (year, monthIndex, day).
 */
export function parseLocalDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
