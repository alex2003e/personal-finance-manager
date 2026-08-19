import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { toNumber } from "@/lib/format";
import { toCOP } from "@/lib/currency";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, TrendingUp, Sliders, Target, PieChart, HeartPulse } from "lucide-react";
import { DebtStrategyComparison } from "./debt-strategy-comparison";
import { CashflowPanel } from "./cashflow-panel";
import { WhatIfSimulator } from "./whatif-simulator";
import { GoalsOverview } from "./goals-overview";
import { Budget503020Panel } from "./budget-503020-panel";
import { HealthScorePanel } from "./health-score-panel";

export default async function StrategyPage() {
  const userId = await requireUserId();

  const [debts, accounts, incomeItems, expenseItems, goals] = await Promise.all([
    prisma.debt.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.account.findMany({ where: { userId } }),
    prisma.recurringItem.findMany({
      where: { userId, type: "INCOME", active: true, frequency: "MONTHLY" },
    }),
    prisma.recurringItem.findMany({
      where: { userId, type: "EXPENSE", active: true, frequency: "MONTHLY" },
    }),
    prisma.goal.findMany({
      where: { userId },
      include: { contributions: { orderBy: { date: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Misma definición que ya usan /dashboard y /debts (solo recurrentes con
  // frecuencia MONTHLY), para que las cifras de este módulo coincidan con
  // las que ya ve el usuario en esas páginas (SC-004 del spec).
  const totalIncome = incomeItems.reduce((s, i) => s + toNumber(i.amount), 0);
  const totalExpenses = expenseItems.reduce((s, e) => s + toNumber(e.amount), 0);

  const debtCOP = (d: (typeof debts)[number]) =>
    toCOP(toNumber(d.balance), d.currency, d.exchangeRateToCOP ? toNumber(d.exchangeRateToCOP) : null);
  const debtMinPaymentCOP = (d: (typeof debts)[number]) =>
    toCOP(toNumber(d.minPayment), d.currency, d.exchangeRateToCOP ? toNumber(d.exchangeRateToCOP) : null);

  const activeDebts = debts
    .filter((d) => !d.closedAt && toNumber(d.balance) > 0)
    .map((d) => ({
      id: d.id,
      name: d.name,
      balance: debtCOP(d),
      interestRateEA: toNumber(d.interestRateEA),
      minPayment: debtMinPaymentCOP(d),
    }));

  const totalMinPayments = activeDebts.reduce((s, d) => s + d.minPayment, 0);
  const totalDebtBalance = activeDebts.reduce((s, d) => s + d.balance, 0);
  const monthlyBudgetForDebt = Math.max(totalIncome - totalExpenses, 0);

  const accountCOP = (a: (typeof accounts)[number]) =>
    toCOP(toNumber(a.balance), a.currency, a.exchangeRateToCOP ? toNumber(a.exchangeRateToCOP) : null);
  const totalLiquidity = accounts.reduce((s, a) => s + accountCOP(a), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Estrategia</h1>
        <p className="text-muted-foreground">
          Predicciones y recomendaciones a partir de lo que ya tienes registrado — nada de
          esto cambia tus datos, es solo para ayudarte a decidir.
        </p>
      </div>

      <Tabs defaultValue="debts">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="debts">
            <Scale className="mr-1 h-4 w-4" />
            Deudas
          </TabsTrigger>
          <TabsTrigger value="cashflow">
            <TrendingUp className="mr-1 h-4 w-4" />
            Flujo de caja
          </TabsTrigger>
          <TabsTrigger value="whatif">
            <Sliders className="mr-1 h-4 w-4" />
            Simulador
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="mr-1 h-4 w-4" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="budget">
            <PieChart className="mr-1 h-4 w-4" />
            Presupuesto
          </TabsTrigger>
          <TabsTrigger value="health">
            <HeartPulse className="mr-1 h-4 w-4" />
            Salud financiera
          </TabsTrigger>
        </TabsList>

        <TabsContent value="debts" className="mt-4">
          <DebtStrategyComparison debts={activeDebts} monthlyBudget={monthlyBudgetForDebt} />
        </TabsContent>

        <TabsContent value="cashflow" className="mt-4">
          <CashflowPanel
            monthlyIncome={totalIncome}
            monthlyExpense={totalExpenses + totalMinPayments}
          />
        </TabsContent>

        <TabsContent value="whatif" className="mt-4">
          <WhatIfSimulator
            debts={activeDebts}
            monthlyIncome={totalIncome}
            monthlyExpense={totalExpenses}
            monthlyBudget={monthlyBudgetForDebt}
          />
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <GoalsOverview
            goals={goals.map((g) => ({
              id: g.id,
              name: g.name,
              targetAmount: toNumber(g.targetAmount),
              currentAmount: toNumber(g.currentAmount),
              contributions: g.contributions.map((c) => ({
                date: c.date,
                amount: toNumber(c.amount),
              })),
            }))}
            monthlyBudgetForDebt={monthlyBudgetForDebt}
          />
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          <Budget503020Panel
            totalMonthlyIncome={totalIncome}
            expenseItems={expenseItems.map((e) => ({
              name: e.name,
              category: e.category,
              monthlyAmount: toNumber(e.amount),
            }))}
            monthlySavingsAmount={goals.reduce(
              (s, g) =>
                s +
                g.contributions
                  .filter((c) => {
                    const now = new Date();
                    return (
                      c.date.getFullYear() === now.getFullYear() &&
                      c.date.getMonth() === now.getMonth()
                    );
                  })
                  .reduce((s2, c) => s2 + toNumber(c.amount), 0),
              0
            )}
          />
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <HealthScorePanel
            totalDebtBalance={totalDebtBalance}
            monthlyIncome={totalIncome}
            monthlyExpense={totalExpenses + totalMinPayments}
            liquidBalance={totalLiquidity}
            debts={activeDebts}
            monthlyBudgetForDebt={monthlyBudgetForDebt}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
