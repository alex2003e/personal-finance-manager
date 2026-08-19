import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCOP, toNumber } from "@/lib/format";
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
import { EmptyState } from "@/components/empty-state";
import { Repeat } from "lucide-react";
import { RecurringForm } from "./recurring-form";
import { RecurringRowActions } from "./recurring-row-actions";

const FREQ_LABEL: Record<string, string> = {
  MONTHLY: "Mensual",
  BIWEEKLY: "Quincenal",
  WEEKLY: "Semanal",
  YEARLY: "Anual",
};

export default async function RecurringPage() {
  const userId = await requireUserId();
  const items = await prisma.recurringItem.findMany({
    where: { userId },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });

  const income = items.filter((i) => i.type === "INCOME");
  const expenses = items.filter((i) => i.type === "EXPENSE");

  const monthlyEquivalent = (amount: number, freq: string) => {
    switch (freq) {
      case "BIWEEKLY":
        return amount * 2;
      case "WEEKLY":
        return amount * 4.333;
      case "YEARLY":
        return amount / 12;
      default:
        return amount;
    }
  };

  const totalIncome = income
    .filter((i) => i.active)
    .reduce((s, i) => s + monthlyEquivalent(toNumber(i.amount), i.frequency), 0);
  const totalExpenses = expenses
    .filter((e) => e.active)
    .reduce((s, e) => s + monthlyEquivalent(toNumber(e.amount), e.frequency), 0);

  function Section({
    title,
    rows,
  }: {
    title: string;
    rows: typeof items;
  }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title={`Sin ${title.toLowerCase()} todavía`}
              description="Regístralos para que el dashboard y el simulador de deudas calculen bien tu presupuesto disponible."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Guardar Q1</TableHead>
                  <TableHead>Guardar Q2</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const amount = toNumber(r.amount);
                  const q1 = Math.round(amount / 2);
                  const q2 = amount - q1;
                  return (
                    <TableRow key={r.id} className={r.active ? "" : "opacity-50"}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>{FREQ_LABEL[r.frequency]}</TableCell>
                      <TableCell>{formatCOP(amount)}</TableCell>
                      <TableCell>{formatCOP(q1)}</TableCell>
                      <TableCell>{formatCOP(q2)}</TableCell>
                      <TableCell>
                        <RecurringRowActions id={r.id} active={r.active} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ingresos y gastos recurrentes</h1>
          <p className="text-muted-foreground">
            Ingreso mensual: {formatCOP(totalIncome)} · Gastos fijos: {formatCOP(totalExpenses)} ·
            Disponible: {formatCOP(totalIncome - totalExpenses)}
          </p>
        </div>
        <RecurringForm />
      </div>

      <Section title="Ingresos" rows={income} />
      <Section title="Gastos fijos" rows={expenses} />
    </div>
  );
}
