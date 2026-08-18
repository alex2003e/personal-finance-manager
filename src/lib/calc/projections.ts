export interface ProjectionPoint {
  year: number;
  contributed: number;
  balance: number;
}

/**
 * Proyección de patrimonio con aporte mensual constante y rendimiento anual
 * esperado, capitalizado mensualmente (interés compuesto).
 */
export function projectNetWorth(
  startingBalance: number,
  monthlyContribution: number,
  annualReturnPercent: number,
  years: number
): ProjectionPoint[] {
  const monthlyRate = Math.pow(1 + annualReturnPercent / 100, 1 / 12) - 1;
  let balance = startingBalance;
  let contributed = startingBalance;
  const points: ProjectionPoint[] = [
    { year: 0, contributed: Math.round(contributed), balance: Math.round(balance) },
  ];

  for (let year = 1; year <= years; year++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      contributed += monthlyContribution;
    }
    points.push({
      year,
      contributed: Math.round(contributed),
      balance: Math.round(balance),
    });
  }

  return points;
}
