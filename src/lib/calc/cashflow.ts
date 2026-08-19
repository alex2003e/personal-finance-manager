export interface CashFlowMonth {
  month: number;
  income: number;
  expense: number;
  net: number;
  isDeficit: boolean;
}

export interface DeficitAlert {
  startMonth: number;
  endMonth: number;
  monthsCount: number;
}

/**
 * Proyección lineal de flujo de caja: asume que el ingreso y el gasto
 * recurrente mensual se mantienen iguales cada mes (sin estacionalidad ni
 * crecimiento). Suficiente para detectar riesgo de déficit con los datos
 * ya registrados, sin inventar supuestos de crecimiento no pedidos.
 */
export function projectCashFlow(
  monthlyIncome: number,
  monthlyExpense: number,
  months: number
): CashFlowMonth[] {
  const points: CashFlowMonth[] = [];
  for (let month = 1; month <= months; month++) {
    const net = monthlyIncome - monthlyExpense;
    points.push({
      month,
      income: Math.round(monthlyIncome),
      expense: Math.round(monthlyExpense),
      net: Math.round(net),
      isDeficit: net < 0,
    });
  }
  return points;
}

/** Solo rachas de 2+ meses consecutivos en déficit. */
export function detectDeficitStreaks(points: CashFlowMonth[]): DeficitAlert[] {
  const alerts: DeficitAlert[] = [];
  let streakStart: number | null = null;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.isDeficit) {
      if (streakStart == null) streakStart = p.month;
    } else if (streakStart != null) {
      const endMonth = points[i - 1].month;
      const monthsCount = endMonth - streakStart + 1;
      if (monthsCount >= 2) alerts.push({ startMonth: streakStart, endMonth, monthsCount });
      streakStart = null;
    }
  }

  if (streakStart != null) {
    const endMonth = points[points.length - 1].month;
    const monthsCount = endMonth - streakStart + 1;
    if (monthsCount >= 2) alerts.push({ startMonth: streakStart, endMonth, monthsCount });
  }

  return alerts;
}
