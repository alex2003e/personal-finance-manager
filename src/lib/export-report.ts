import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { toCOP } from "@/lib/currency";
import { simulateAvalanche, monthsToPayoff, type DebtInput } from "@/lib/calc/avalanche";

export interface ReportData {
  generatedAt: Date;
  totalIncome: number;
  totalExpenses: number;
  monthlyBudgetForDebt: number;
  totalDebt: number;
  totalAssets: number;
  totalInvestments: number;
  totalLiquidity: number;
  netWorth: number;
  activeDebts: DebtInput[];
  planMonths: ReturnType<typeof simulateAvalanche>;
  monthsToClose: number;
}

/** Reúne los mismos datos que ya muestra /dashboard, para reusarlos en las exportaciones. */
export async function buildReportData(userId: string): Promise<ReportData> {
  const [debts, incomeItems, expenseItems, assets, investments, accounts] = await Promise.all([
    prisma.debt.findMany({ where: { userId } }),
    prisma.recurringItem.findMany({
      where: { userId, type: "INCOME", active: true, frequency: "MONTHLY" },
    }),
    prisma.recurringItem.findMany({
      where: { userId, type: "EXPENSE", active: true, frequency: "MONTHLY" },
    }),
    prisma.asset.findMany({ where: { userId } }),
    prisma.investment.findMany({ where: { userId } }),
    prisma.account.findMany({ where: { userId } }),
  ]);

  const debtCOP = (d: (typeof debts)[number], amount: number) =>
    toCOP(amount, d.currency, d.exchangeRateToCOP ? toNumber(d.exchangeRateToCOP) : null);
  const accountCOP = (a: (typeof accounts)[number], amount: number) =>
    toCOP(amount, a.currency, a.exchangeRateToCOP ? toNumber(a.exchangeRateToCOP) : null);

  const activeDebtsRaw = debts.filter((d) => !d.closedAt && toNumber(d.balance) > 0);
  const activeDebts: DebtInput[] = activeDebtsRaw.map((d) => ({
    id: d.id,
    name: d.name,
    balance: debtCOP(d, toNumber(d.balance)),
    interestRateEA: toNumber(d.interestRateEA),
    minPayment: debtCOP(d, toNumber(d.minPayment)),
  }));

  const totalIncome = incomeItems.reduce((s, i) => s + toNumber(i.amount), 0);
  const totalExpenses = expenseItems.reduce((s, e) => s + toNumber(e.amount), 0);
  const monthlyBudgetForDebt = Math.max(totalIncome - totalExpenses, 0);

  const planMonths =
    activeDebts.length > 0 && monthlyBudgetForDebt > 0
      ? simulateAvalanche(activeDebts, monthlyBudgetForDebt)
      : [];
  const monthsToClose = planMonths.length > 0 ? monthsToPayoff(planMonths) : 0;

  const totalDebt = activeDebts.reduce((s, d) => s + d.balance, 0);
  const totalAssets = assets.reduce((s, a) => s + toNumber(a.estimatedValue), 0);
  const totalInvestments = investments.reduce(
    (s, i) => s + toNumber(i.quantity) * toNumber(i.currentPrice),
    0
  );
  const totalLiquidity = accounts.reduce((s, a) => s + accountCOP(a, toNumber(a.balance)), 0);
  const allDebtBalance = debts.reduce((s, d) => s + debtCOP(d, toNumber(d.balance)), 0);
  const netWorth = totalAssets + totalInvestments + totalLiquidity - allDebtBalance;

  return {
    generatedAt: new Date(),
    totalIncome,
    totalExpenses,
    monthlyBudgetForDebt,
    totalDebt,
    totalAssets,
    totalInvestments,
    totalLiquidity,
    netWorth,
    activeDebts,
    planMonths,
    monthsToClose,
  };
}
