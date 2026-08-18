import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCOP, formatPercent, toNumber } from "@/lib/format";
import { simulateAvalanche } from "@/lib/calc/avalanche";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DebtForm } from "./debt-form";
import { EditDebtDialog } from "./edit-debt-dialog";
import { PayDebtDialog } from "./pay-debt-dialog";
import { DeleteDebtButton } from "./delete-debt-button";
import { NewChargeDialog } from "./new-charge-dialog";
import { PayInstallmentButton, DeleteChargeButton } from "./charge-actions";

export default async function DebtsPage() {
  const userId = await requireUserId();

  const [debts, incomeItems, expenseItems, charges, accounts] = await Promise.all([
    prisma.debt.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.recurringItem.findMany({
      where: { userId, type: "INCOME", active: true, frequency: "MONTHLY" },
    }),
    prisma.recurringItem.findMany({
      where: { userId, type: "EXPENSE", active: true, frequency: "MONTHLY" },
    }),
    prisma.cardCharge.findMany({ where: { userId }, orderBy: { purchaseDate: "desc" } }),
    prisma.account.findMany({ where: { userId }, select: { id: true, name: true } }),
  ]);

  const activeDebts = debts.filter((d) => !d.closedAt && Number(d.balance) > 0);
  const totalIncome = incomeItems.reduce((s, i) => s + toNumber(i.amount), 0);
  const totalExpenses = expenseItems.reduce((s, e) => s + toNumber(e.amount), 0);
  const monthlyBudgetForDebt = Math.max(totalIncome - totalExpenses, 0);

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

  // Capacidad de endeudamiento agregada (solo tarjetas con cupo definido)
  const cardsWithLimit = debts.filter((d) => d.type === "CARD" && d.creditLimit != null);
  const totalLimit = cardsWithLimit.reduce((s, d) => s + toNumber(d.creditLimit!), 0);
  const totalUsed = cardsWithLimit.reduce((s, d) => s + toNumber(d.balance), 0);
  const utilizationPct = totalLimit > 0 ? Math.min((totalUsed / totalLimit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Deudas</h1>
          <p className="text-muted-foreground">
            Estrategia avalancha: paga primero la tasa más alta.
          </p>
        </div>
        <DebtForm />
      </div>

      {cardsWithLimit.length > 0 && (
        <Card className={utilizationPct > 50 ? "border-destructive/50" : utilizationPct > 30 ? "border-amber-500/50" : "border-green-500/50"}>
          <CardHeader>
            <CardTitle>Capacidad de endeudamiento (tarjetas)</CardTitle>
            <CardDescription>
              Cupo usado {formatCOP(totalUsed)} de {formatCOP(totalLimit)} disponible en tarjetas
              de crédito ({cardsWithLimit.length}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={utilizationPct} />
            <p className="text-sm">
              {utilizationPct.toFixed(0)}% utilizado · cupo disponible:{" "}
              {formatCOP(totalLimit - totalUsed)}
            </p>
            <p className="text-xs text-muted-foreground">
              {utilizationPct > 50
                ? "⚠️ Por encima del 50% del cupo total — esto suele bajar tu score crediticio y deja poco margen para imprevistos."
                : utilizationPct > 30
                ? "Estás por encima del 30% recomendado para mantener buen score crediticio."
                : "✅ Buen nivel de utilización (menos del 30% del cupo)."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {debts.map((d) => {
          const balance = toNumber(d.balance);
          const closed = !!d.closedAt || balance <= 0;
          const limit = d.creditLimit != null ? toNumber(d.creditLimit) : null;
          const pct = limit && limit > 0 ? Math.min((balance / limit) * 100, 100) : null;
          const debtCharges = charges.filter((c) => c.debtId === d.id);

          return (
            <Card key={d.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{d.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant={closed ? "secondary" : "default"}>
                      {closed ? "✅ Pagada" : "⏳ Pendiente"}
                    </Badge>
                    <EditDebtDialog
                      debt={{
                        id: d.id,
                        name: d.name,
                        creditor: d.creditor,
                        balance,
                        interestRateEA: toNumber(d.interestRateEA),
                        minPayment: toNumber(d.minPayment),
                        creditLimit: limit,
                        type: d.type,
                      }}
                    />
                  </div>
                </div>
                <CardDescription>{d.creditor}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-semibold">{formatCOP(balance)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPercent(toNumber(d.interestRateEA))} EA · mínimo{" "}
                    {formatCOP(toNumber(d.minPayment))}
                  </p>
                </div>

                {limit != null && (
                  <div className="space-y-1">
                    <Progress value={pct ?? 0} />
                    <p className="text-xs text-muted-foreground">
                      Cupo: {formatCOP(limit)} · disponible {formatCOP(Math.max(limit - balance, 0))} (
                      {(pct ?? 0).toFixed(0)}% usado)
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {!closed && (
                    <PayDebtDialog
                      debtId={d.id}
                      debtName={d.name}
                      balance={balance}
                      accounts={accounts}
                    />
                  )}
                  <DeleteDebtButton id={d.id} />
                </div>

                {d.type === "CARD" && (
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        Compras ({debtCharges.filter((c) => toNumber(c.remainingBalance) > 0).length} activas)
                      </p>
                      <NewChargeDialog debtId={d.id} defaultRateEA={toNumber(d.interestRateEA)} />
                    </div>
                    <div className="space-y-2">
                      {debtCharges.map((c) => {
                        const remaining = toNumber(c.remainingBalance);
                        const paidOff = remaining <= 0;
                        return (
                          <div
                            key={c.id}
                            className={`rounded-md border p-2 text-sm ${paidOff ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{c.description}</span>
                              <span>{formatCOP(toNumber(c.monthlyPayment))}/mes</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {c.category} · cuota {c.installmentsPaid}/{c.installmentsCount} ·
                              saldo restante {formatCOP(remaining)}
                            </p>
                            <div className="mt-1 flex gap-2">
                              {!paidOff && <PayInstallmentButton chargeId={c.id} />}
                              {c.installmentsPaid === 0 && <DeleteChargeButton id={c.id} />}
                            </div>
                          </div>
                        );
                      })}
                      {debtCharges.length === 0 && (
                        <p className="text-xs text-muted-foreground">Sin compras registradas.</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {debts.length === 0 && (
          <p className="text-muted-foreground">
            Aún no tienes deudas registradas. Agrega una o impórtalas desde el Excel en{" "}
            <a href="/onboarding" className="underline">
              onboarding
            </a>
            .
          </p>
        )}
      </div>

      {simulation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Simulador de avalancha</CardTitle>
            <CardDescription>
              Con un presupuesto mensual de {formatCOP(monthlyBudgetForDebt)} (ingresos
              recurrentes − gastos fijos recurrentes), así se ven los próximos meses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {simulation.map((m) => (
              <div key={m.month} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  Mes {m.month} — pagado {formatCOP(m.totalPaid)} · saldo restante{" "}
                  {formatCOP(m.totalRemaining)}
                </p>
                <ul className="mt-1 text-muted-foreground">
                  {m.payments
                    .filter((p) => p.amount > 0)
                    .map((p) => (
                      <li key={p.debtId}>
                        {p.name}: {formatCOP(p.amount)} → saldo {formatCOP(p.remaining)}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
