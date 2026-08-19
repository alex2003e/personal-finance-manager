export interface HealthScoreInput {
  totalDebtBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  liquidBalance: number; // suma de cuentas en COP
}

export interface HealthScoreResult {
  score: number;
  debtToIncomeComponent: number;
  savingsRateComponent: number;
  emergencyCoverageComponent: number;
}

const WEIGHTS = { debtToIncome: 0.4, savingsRate: 0.35, emergencyCoverage: 0.25 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Score de salud financiera 0-100. Pesos y umbrales documentados en
 * research.md (Decisión 7): el ratio deuda/ingreso pesa más porque es el
 * riesgo dominante del perfil de usuario de esta app.
 */
export function computeHealthScore(input: HealthScoreInput): HealthScoreResult | null {
  if (input.monthlyIncome <= 0) return null;

  const debtToIncomeRatio = input.totalDebtBalance / input.monthlyIncome;
  const debtToIncomeComponent = clamp(100 - debtToIncomeRatio * 200, 0, 100);

  const savingsRate = (input.monthlyIncome - input.monthlyExpense) / input.monthlyIncome;
  const savingsRateComponent = clamp((savingsRate / 0.2) * 100, 0, 100);

  const emergencyMonths =
    input.monthlyExpense > 0 ? input.liquidBalance / input.monthlyExpense : 0;
  const emergencyCoverageComponent = clamp((emergencyMonths / 6) * 100, 0, 100);

  const score = Math.round(
    debtToIncomeComponent * WEIGHTS.debtToIncome +
      savingsRateComponent * WEIGHTS.savingsRate +
      emergencyCoverageComponent * WEIGHTS.emergencyCoverage
  );

  return {
    score: clamp(score, 0, 100),
    debtToIncomeComponent: Math.round(debtToIncomeComponent),
    savingsRateComponent: Math.round(savingsRateComponent),
    emergencyCoverageComponent: Math.round(emergencyCoverageComponent),
  };
}

/** Proyecta el score a 6 meses usando el saldo de deuda esperado a ese punto. */
export function projectHealthScore6Months(
  current: HealthScoreInput,
  monthSixDebtBalance: number
): HealthScoreResult | null {
  return computeHealthScore({ ...current, totalDebtBalance: monthSixDebtBalance });
}
