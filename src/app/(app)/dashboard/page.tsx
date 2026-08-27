import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCOP, toNumber } from "@/lib/format";
import { toCOP } from "@/lib/currency";
import { simulateAvalanche, monthsToPayoff } from "@/lib/calc/avalanche";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/money";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [debts, incomeItems, expenseItems, assets, investments, monthTransactions, goals, accounts] =
    await Promise.all([
      prisma.debt.findMany({ where: { userId } }),
      prisma.recurringItem.findMany({
        where: { userId, type: "INCOME", active: true, frequency: "MONTHLY" },
      }),
      prisma.recurringItem.findMany({
        where: { userId, type: "EXPENSE", active: true, frequency: "MONTHLY" },
      }),
      prisma.asset.findMany({ where: { userId } }),
      prisma.investment.findMany({ where: { userId } }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.account.findMany({ where: { userId } }),
    ]);

  const debtCOP = (d: (typeof debts)[number], amount: number) =>
    toCOP(amount, d.currency, d.exchangeRateToCOP ? toNumber(d.exchangeRateToCOP) : null);
  const accountCOP = (a: (typeof accounts)[number], amount: number) =>
    toCOP(amount, a.currency, a.exchangeRateToCOP ? toNumber(a.exchangeRateToCOP) : null);

  const activeDebts = debts.filter((d) => !d.closedAt && Number(d.balance) > 0);
  const totalDebt = activeDebts.reduce((s, d) => s + debtCOP(d, toNumber(d.balance)), 0);

  const totalIncome = incomeItems.reduce((s, i) => s + toNumber(i.amount), 0);
  const totalExpenses = expenseItems.reduce((s, e) => s + toNumber(e.amount), 0);
  const monthlyBudgetForDebt = Math.max(totalIncome - totalExpenses, 0);
  const freeCashFlow = monthlyBudgetForDebt;

  const simulation =
    activeDebts.length > 0 && monthlyBudgetForDebt > 0
      ? simulateAvalanche(
          activeDebts.map((d) => ({
            id: d.id,
            name: d.name,
            balance: debtCOP(d, toNumber(d.balance)),
            interestRateEA: toNumber(d.interestRateEA),
            minPayment: debtCOP(d, toNumber(d.minPayment)),
          })),
          monthlyBudgetForDebt
        )
      : [];
  const monthsLeft = simulation.length > 0 ? monthsToPayoff(simulation) : 0;

  const totalAssets = assets.reduce((s, a) => s + toNumber(a.estimatedValue), 0);
  const totalInvestments = investments.reduce(
    (s, i) => s + toNumber(i.quantity) * toNumber(i.currentPrice),
    0
  );
  const totalLiquidity = accounts.reduce((s, a) => s + accountCOP(a, toNumber(a.balance)), 0);
  const allDebtBalance = debts.reduce((s, d) => s + debtCOP(d, toNumber(d.balance)), 0);
  const netWorth = totalAssets + totalInvestments + totalLiquidity - allDebtBalance;

  const monthSpent = monthTransactions
    .filter((t) => t.type !== "INCOME" && t.type !== "CARD_CHARGE")
    .reduce((s, t) => s + toNumber(t.amount), 0);
  const cuadraDiff = totalIncome - monthSpent;
  const cuadra = cuadraDiff >= 0;

  const cardsWithLimit = debts.filter((d) => d.type === "CARD" && d.creditLimit != null);
  const totalLimit = cardsWithLimit.reduce((s, d) => s + debtCOP(d, toNumber(d.creditLimit!)), 0);
  const totalUsed = cardsWithLimit.reduce((s, d) => s + debtCOP(d, toNumber(d.balance)), 0);
  const utilizationPct = totalLimit > 0 ? Math.min((totalUsed / totalLimit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general de tus finanzas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href="/api/export?format=xlsx" />}
          >
            Exportar Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href="/api/export?format=pdf" />}
          >
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Flujo de caja libre / mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Money value={freeCashFlow} size="xl" tone={freeCashFlow >= 0 ? "positive" : "negative"} />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deuda total activa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Money value={totalDebt} size="xl" tone={totalDebt > 0 ? "negative" : "positive"} />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meses para saldar deudas
            </CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-3xl font-semibold tabular-nums">
            {totalDebt <= 0 ? (
              <span className="text-success">✅ Libre</span>
            ) : (
              monthsLeft || "—"
            )}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patrimonio neto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Money value={netWorth} size="xl" tone={netWorth >= 0 ? "positive" : "negative"} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Liquidez total (cuentas)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Money value={totalLiquidity} size="lg" />
            <Link href="/accounts">
              <Button variant="outline" size="sm">
                Ver cuentas
              </Button>
            </Link>
          </CardContent>
        </Card>

        {cardsWithLimit.length > 0 && (
          <Card
            className={
              utilizationPct > 50
                ? "border-destructive/50"
                : utilizationPct > 30
                ? "border-warning/50"
                : "border-success/50"
            }
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Capacidad de endeudamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={utilizationPct} />
              <p className="text-sm">
                <Money value={totalUsed} size="sm" /> de <Money value={totalLimit} size="sm" /> (
                {utilizationPct.toFixed(0)}% usado)
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={cuadra ? "border-success/50" : "border-destructive/50"}>
          <CardHeader>
            <CardTitle>Cuadre del mes actual</CardTitle>
            <CardDescription>
              Ingreso esperado <Money value={totalIncome} size="sm" tone="neutral" /> vs. gastado{" "}
              <Money value={monthSpent} size="sm" tone="neutral" />
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-lg font-medium">
              {cuadra ? "✅ Cuadra" : "⚠️ Revisar"}
              <Money value={cuadraDiff} size="lg" tone={cuadra ? "positive" : "negative"} />
            </p>
            <Link href="/ledger">
              <Button variant="outline" size="sm">
                Ver movimientos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metas activas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {goals.slice(0, 3).map((g) => {
              const target = toNumber(g.targetAmount);
              const current = toNumber(g.currentAmount);
              const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
              return (
                <div key={g.id} className="flex items-center justify-between text-sm">
                  <span>
                    {g.name}: {pct.toFixed(0)}%
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {formatCOP(current)} / {formatCOP(target)}
                  </span>
                </div>
              );
            })}
            {goals.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sin metas todavía.{" "}
                <Link href="/goals" className="underline">
                  Crear una
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {activeDebts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deudas activas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeDebts.map((d) => (
              <div key={d.id} className="flex justify-between text-sm">
                <span>{d.name}</span>
                <Money value={toNumber(d.balance)} size="sm" tone="negative" />
              </div>
            ))}
            <Link href="/debts">
              <Button variant="outline" size="sm" className="mt-2">
                Ver estrategia de pago
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
