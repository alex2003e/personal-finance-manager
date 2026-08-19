export interface DebtInput {
  id: string;
  name: string;
  balance: number;
  interestRateEA: number; // porcentaje efectivo anual, ej. 29.6152
  minPayment: number;
}

export interface AvalancheMonth {
  month: number;
  payments: { debtId: string; name: string; amount: number; remaining: number }[];
  totalPaid: number;
  totalRemaining: number;
}

export type PayoffStrategy = "avalanche" | "snowball" | "optimal";

export interface ExtraPayment {
  debtId: string;
  month: number; // 1-based
  amount: number;
}

export interface StrategyComparison {
  strategy: PayoffStrategy;
  months: AvalancheMonth[];
  closedAtMonth: Record<string, number>;
  totalInterestPaid: number;
  totalMonths: number;
}

/** Tasa mensual equivalente a partir de una tasa efectiva anual. */
export function monthlyRateFromEA(eaPercent: number): number {
  return Math.pow(1 + eaPercent / 100, 1 / 12) - 1;
}

const byAvalanche = (a: DebtInput, b: DebtInput) => {
  if (b.interestRateEA !== a.interestRateEA) return b.interestRateEA - a.interestRateEA;
  return a.balance - b.balance;
};

/**
 * Determina el orden de pago de las deudas según la estrategia elegida.
 * - avalanche: mayor tasa primero, desempata por saldo menor.
 * - snowball: menor saldo primero (barrido de "quick wins" psicológicos).
 * - optimal: heurística simple — las 1-2 deudas más pequeñas que se puedan
 *   saldar en ≤2 meses con el presupuesto disponible van primero (snowball),
 *   el resto se ordena por avalancha. No es un optimizador combinatorio.
 */
export function orderDebtsByStrategy(
  debts: DebtInput[],
  strategy: PayoffStrategy,
  monthlyBudget: number
): DebtInput[] {
  if (strategy === "snowball") {
    return [...debts].sort((a, b) => a.balance - b.balance);
  }

  if (strategy === "optimal") {
    const byBalanceAsc = [...debts].sort((a, b) => a.balance - b.balance);
    const quickWins = monthlyBudget > 0
      ? byBalanceAsc.filter((d) => d.balance <= monthlyBudget * 2).slice(0, 2)
      : [];
    const quickWinIds = new Set(quickWins.map((d) => d.id));
    const rest = debts.filter((d) => !quickWinIds.has(d.id)).sort(byAvalanche);
    return [...quickWins, ...rest];
  }

  return [...debts].sort(byAvalanche);
}

/**
 * Simulación mes a mes genérica: recibe las deudas YA ordenadas según la
 * estrategia elegida y aplica el presupuesto mensual disponible en ese
 * orden, mes a mes, hasta saldarlas o llegar a maxMonths. Acepta pagos
 * extra puntuales (dinero adicional que no sale del presupuesto mensual
 * recurrente, para el simulador what-if).
 */
export function simulatePayoff(
  orderedDebts: DebtInput[],
  monthlyBudget: number,
  options?: { maxMonths?: number; extraPayments?: ExtraPayment[] }
): AvalancheMonth[] {
  const maxMonths = options?.maxMonths ?? 60;
  const extraPayments = options?.extraPayments ?? [];

  const hasActiveDebt = orderedDebts.some((d) => d.balance > 0);
  if (monthlyBudget <= 0 && hasActiveDebt) return [];

  const balances = new Map(orderedDebts.map((d) => [d.id, d.balance]));
  const months: AvalancheMonth[] = [];

  for (let month = 1; month <= maxMonths; month++) {
    let remainingBudget = monthlyBudget;
    const payments: AvalancheMonth["payments"] = [];

    // interés del mes sobre saldo vigente
    for (const d of orderedDebts) {
      const bal = balances.get(d.id)!;
      if (bal <= 0) continue;
      const rate = monthlyRateFromEA(d.interestRateEA);
      balances.set(d.id, bal + bal * rate);
    }

    // pagos extra puntuales de este mes (no salen del presupuesto recurrente)
    for (const ep of extraPayments.filter((e) => e.month === month)) {
      const bal = balances.get(ep.debtId);
      if (bal == null || bal <= 0) continue;
      const pay = Math.min(bal, ep.amount);
      balances.set(ep.debtId, bal - pay);
      const debtInfo = orderedDebts.find((d) => d.id === ep.debtId);
      payments.push({
        debtId: ep.debtId,
        name: debtInfo?.name ?? ep.debtId,
        amount: Math.round(pay),
        remaining: Math.round(bal - pay),
      });
    }

    for (const d of orderedDebts) {
      const bal = balances.get(d.id)!;
      if (bal <= 0 || remainingBudget <= 0) continue;
      const pay = Math.min(bal, remainingBudget);
      balances.set(d.id, bal - pay);
      remainingBudget -= pay;
      payments.push({
        debtId: d.id,
        name: d.name,
        amount: Math.round(pay),
        remaining: Math.round(bal - pay),
      });
    }

    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const totalRemaining = orderedDebts.reduce(
      (s, d) => s + Math.max(balances.get(d.id)!, 0),
      0
    );

    months.push({ month, payments, totalPaid, totalRemaining: Math.round(totalRemaining) });

    if (totalRemaining <= 0) break;
  }

  return months;
}

/**
 * Simulación mes a mes del método avalancha: prioriza la deuda con mayor tasa,
 * desempata por saldo menor (barrido rápido de deudas pequeñas), y aplica todo
 * el presupuesto mensual disponible en ese orden hasta agotar el excedente.
 */
export function simulateAvalanche(
  debts: DebtInput[],
  monthlyBudget: number,
  maxMonths = 60
): AvalancheMonth[] {
  const ordered = orderDebtsByStrategy(debts, "avalanche", monthlyBudget);
  return simulatePayoff(ordered, monthlyBudget, { maxMonths });
}

export function monthsToPayoff(months: AvalancheMonth[]): number {
  return months.length;
}

/**
 * Corre las 3 estrategias de pago sobre el mismo conjunto de deudas y
 * presupuesto, y devuelve el comparativo (fecha de cierre por deuda,
 * interés total, meses totales) para que el llamador marque la de menor
 * interés como recomendada.
 */
export function compareStrategies(
  debts: DebtInput[],
  monthlyBudget: number,
  options?: { extraPayments?: ExtraPayment[] }
): StrategyComparison[] {
  const totalOriginalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const strategies: PayoffStrategy[] = ["avalanche", "snowball", "optimal"];

  return strategies.map((strategy) => {
    const ordered = orderDebtsByStrategy(debts, strategy, monthlyBudget);
    const months = simulatePayoff(ordered, monthlyBudget, options);

    const closedAtMonth: Record<string, number> = {};
    for (const m of months) {
      for (const p of m.payments) {
        if (p.remaining <= 0 && !(p.debtId in closedAtMonth)) {
          closedAtMonth[p.debtId] = m.month;
        }
      }
    }

    const totalPaidSum = months.reduce((s, m) => s + m.totalPaid, 0);
    const totalInterestPaid = Math.max(Math.round(totalPaidSum - totalOriginalBalance), 0);

    return {
      strategy,
      months,
      closedAtMonth,
      totalInterestPaid,
      totalMonths: months.length,
    };
  });
}
