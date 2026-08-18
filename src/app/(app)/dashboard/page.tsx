import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCOP, toNumber } from "@/lib/format";
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

  const activeDebts = debts.filter((d) => !d.closedAt && Number(d.balance) > 0);
  const totalDebt = activeDebts.reduce((s, d) => s + toNumber(d.balance), 0);

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
            balance: toNumber(d.balance),
            interestRateEA: toNumber(d.interestRateEA),
            minPayment: toNumber(d.minPayment),
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
  const allDebtBalance = debts.reduce((s, d) => s + toNumber(d.balance), 0);
  const netWorth = totalAssets + totalInvestments - allDebtBalance;

  const monthSpent = monthTransactions
    .filter((t) => t.type !== "INCOME" && t.type !== "CARD_CHARGE")
    .reduce((s, t) => s + toNumber(t.amount), 0);
  const cuadraDiff = totalIncome - monthSpent;
  const cuadra = cuadraDiff >= 0;

  const totalLiquidity = accounts.reduce((s, a) => s + toNumber(a.balance), 0);

  const cardsWithLimit = debts.filter((d) => d.type === "CARD" && d.creditLimit != null);
  const totalLimit = cardsWithLimit.reduce((s, d) => s + toNumber(d.creditLimit!), 0);
  const totalUsed = cardsWithLimit.reduce((s, d) => s + toNumber(d.balance), 0);
  const utilizationPct = totalLimit > 0 ? Math.min((totalUsed / totalLimit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de tus finanzas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Flujo de caja libre / mes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCOP(freeCashFlow)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deuda total activa
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCOP(totalDebt)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meses para saldar deudas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalDebt <= 0 ? "✅ Ya estás libre" : monthsLeft || "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patrimonio neto
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCOP(netWorth)}</CardContent>
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
            <p className="text-xl font-semibold">{formatCOP(totalLiquidity)}</p>
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
                ? "border-amber-500/50"
                : "border-green-500/50"
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
                {formatCOP(totalUsed)} de {formatCOP(totalLimit)} ({utilizationPct.toFixed(0)}%
                usado)
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={cuadra ? "border-green-500/50" : "border-destructive/50"}>
          <CardHeader>
            <CardTitle>Cuadre del mes actual</CardTitle>
            <CardDescription>
              Ingreso esperado {formatCOP(totalIncome)} vs. gastado {formatCOP(monthSpent)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-xl font-semibold">
              {cuadra ? "✅ Cuadra" : "⚠️ Revisar"} ({formatCOP(cuadraDiff)})
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
                <div key={g.id} className="text-sm">
                  {g.name}: {pct.toFixed(0)}% ({formatCOP(current)} / {formatCOP(target)})
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
                <span>{formatCOP(toNumber(d.balance))}</span>
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
