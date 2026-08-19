export interface GoalProjection {
  monthlyRate: number | null;
  estimatedCompletionDate: Date | null;
  hasEnoughData: boolean;
}

/**
 * Estima el ritmo mensual de ahorro de una meta a partir del historial real
 * de abonos (no de la cuota fija sugerida). Requiere al menos 2 abonos
 * separados en el tiempo; si no, no hay ritmo observable y se retorna
 * hasEnoughData=false en vez de una fecha engañosa.
 */
export function estimateGoalCompletion(
  targetAmount: number,
  currentAmount: number,
  contributions: { date: Date; amount: number }[]
): GoalProjection {
  if (contributions.length < 2) {
    return { monthlyRate: null, estimatedCompletionDate: null, hasEnoughData: false };
  }

  const sorted = [...contributions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const monthsSpan =
    (last.date.getFullYear() - first.date.getFullYear()) * 12 +
    (last.date.getMonth() - first.date.getMonth());

  if (monthsSpan <= 0) {
    return { monthlyRate: null, estimatedCompletionDate: null, hasEnoughData: false };
  }

  const totalContributed = sorted.reduce((s, c) => s + c.amount, 0);
  const monthlyRate = totalContributed / monthsSpan;

  const remaining = Math.max(targetAmount - currentAmount, 0);
  if (monthlyRate <= 0) {
    return { monthlyRate, estimatedCompletionDate: null, hasEnoughData: true };
  }

  const monthsToComplete = Math.ceil(remaining / monthlyRate);
  const estimatedCompletionDate = new Date();
  estimatedCompletionDate.setMonth(estimatedCompletionDate.getMonth() + monthsToComplete);

  return { monthlyRate, estimatedCompletionDate, hasEnoughData: true };
}
