export function monthsUntil(date: Date, from: Date = new Date()): number {
  const months =
    (date.getFullYear() - from.getFullYear()) * 12 + (date.getMonth() - from.getMonth());
  return Math.max(months, 1);
}

/** Cuota mensual fija necesaria para llegar a la meta en el plazo elegido. */
export function computeFixedQuota(
  targetAmount: number,
  currentAmount: number,
  months: number
): number {
  const remaining = Math.max(targetAmount - currentAmount, 0);
  if (months <= 0) return remaining;
  return remaining / months;
}
