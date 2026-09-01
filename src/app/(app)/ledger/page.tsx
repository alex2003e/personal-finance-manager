import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCOP, toNumber } from "@/lib/format";
import { toCOP, currencySymbol } from "@/lib/currency";
import { monthLabel } from "@/lib/quincena";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TransactionForm } from "./transaction-form";
import { DeleteTransactionButton } from "./delete-transaction-button";

const TYPE_LABEL: Record<string, string> = {
  INCOME: "Ingreso",
  EXPENSE: "Gasto",
  DEBT_PAYMENT: "Pago deuda",
  CARD_CHARGE: "Compra con tarjeta",
  TRANSFER: "Transferencia",
  SAVINGS: "Ahorro",
};

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const prevMonth = new Date(year, month - 2, 1);
  const nextMonth = new Date(year, month, 1);

  const [transactions, debts, incomeItems, expenseItems, accounts] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
      include: { debt: true, account: true },
    }),
    prisma.debt.findMany({ where: { userId } }),
    prisma.recurringItem.findMany({
      where: { userId, type: "INCOME", active: true, frequency: "MONTHLY" },
    }),
    prisma.recurringItem.findMany({
      where: { userId, type: "EXPENSE", active: true, frequency: "MONTHLY" },
    }),
    prisma.account.findMany({ where: { userId }, select: { id: true, name: true } }),
  ]);

  const expectedIncome = incomeItems.reduce((s, i) => s + toNumber(i.amount), 0);
  const expectedIncomeQ1 = Math.round(expectedIncome / 2);
  const expectedIncomeQ2 = expectedIncome - expectedIncomeQ1;

  const amountCOP = (t: (typeof transactions)[number]) =>
    toCOP(toNumber(t.amount), t.currency, t.exchangeRateToCOP ? toNumber(t.exchangeRateToCOP) : null);

  const q1Spent = transactions
    .filter((t) => t.quincena === "Q1" && t.type !== "INCOME" && t.type !== "CARD_CHARGE")
    .reduce((s, t) => s + amountCOP(t), 0);
  const q2Spent = transactions
    .filter((t) => t.quincena === "Q2" && t.type !== "INCOME" && t.type !== "CARD_CHARGE")
    .reduce((s, t) => s + amountCOP(t), 0);

  const totalSpent = q1Spent + q2Spent;
  const diff = expectedIncome - totalSpent;
  const cuadra = diff >= 0;

  const expectedFixed = expenseItems.reduce((s, e) => s + toNumber(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/ledger?year=${prevMonth.getFullYear()}&month=${prevMonth.getMonth() + 1}`}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="min-w-48 text-center text-2xl font-semibold capitalize">
            {monthLabel(start)}
          </h1>
          <Link href={`/ledger?year=${nextMonth.getFullYear()}&month=${nextMonth.getMonth() + 1}`}>
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <TransactionForm
          debts={debts
            .filter((d) => !d.closedAt)
            .map((d) => ({ id: d.id, name: d.name, balance: toNumber(d.balance) }))}
          cards={debts
            .filter((d) => !d.closedAt && d.type === "CARD")
            .map((d) => ({ id: d.id, name: d.name, interestRateEA: toNumber(d.interestRateEA) }))}
          accounts={accounts}
          defaultDate={start.toISOString()}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingreso esperado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatCOP(expectedIncome)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gastado Q1 / esperado {formatCOP(expectedIncomeQ1)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatCOP(q1Spent)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gastado Q2 / esperado {formatCOP(expectedIncomeQ2)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatCOP(q2Spent)}</CardContent>
        </Card>
        <Card className={cuadra ? "border-success/50" : "border-destructive/50"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ¿Cuadra el mes?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {cuadra ? "✅ Cuadra" : "⚠️ Revisar"} ({formatCOP(diff)})
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Gasto fijo mensual esperado (recurrentes activos): {formatCOP(expectedFixed)}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Quincena</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.date.toLocaleDateString("es-CO")}</TableCell>
                  <TableCell>{t.quincena === "Q1" ? "Quincena 1" : "Quincena 2"}</TableCell>
                  <TableCell>{TYPE_LABEL[t.type]}</TableCell>
                  <TableCell>
                    {t.category}
                    {t.debt ? ` (${t.debt.name})` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.account?.name ?? "—"}</TableCell>
                  <TableCell>
                    {currencySymbol(t.currency)} {new Intl.NumberFormat("es-CO").format(toNumber(t.amount))}
                    {t.currency !== "COP" && (
                      <span className="block text-xs text-muted-foreground">
                        ≈ {formatCOP(amountCOP(t))}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.notes}</TableCell>
                  <TableCell>
                    <DeleteTransactionButton id={t.id} />
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Sin movimientos este mes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
