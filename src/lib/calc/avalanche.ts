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

/** Tasa mensual equivalente a partir de una tasa efectiva anual. */
export function monthlyRateFromEA(eaPercent: number): number {
  return Math.pow(1 + eaPercent / 100, 1 / 12) - 1;
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
  const balances = new Map(debts.map((d) => [d.id, d.balance]));
  const order = [...debts].sort((a, b) => {
    if (b.interestRateEA !== a.interestRateEA) return b.interestRateEA - a.interestRateEA;
    return a.balance - b.balance;
  });

  const months: AvalancheMonth[] = [];

  for (let month = 1; month <= maxMonths; month++) {
    let remainingBudget = monthlyBudget;
    const payments: AvalancheMonth["payments"] = [];

    // interés del mes sobre saldo vigente
    for (const d of order) {
      const bal = balances.get(d.id)!;
      if (bal <= 0) continue;
      const rate = monthlyRateFromEA(d.interestRateEA);
      balances.set(d.id, bal + bal * rate);
    }

    for (const d of order) {
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
    const totalRemaining = order.reduce((s, d) => s + Math.max(balances.get(d.id)!, 0), 0);

    months.push({ month, payments, totalPaid, totalRemaining: Math.round(totalRemaining) });

    if (totalRemaining <= 0) break;
  }

  return months;
}

export function monthsToPayoff(months: AvalancheMonth[]): number {
  return months.length;
}
