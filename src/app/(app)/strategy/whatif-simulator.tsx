"use client";

import { useMemo, useState } from "react";
import {
  orderDebtsByStrategy,
  simulatePayoff,
  type DebtInput,
  type ExtraPayment,
} from "@/lib/calc/avalanche";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Money } from "@/components/money";
import { EmptyState } from "@/components/empty-state";
import { Sliders } from "lucide-react";

export function WhatIfSimulator({
  debts,
  monthlyIncome,
  monthlyExpense,
  monthlyBudget,
}: {
  debts: DebtInput[];
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBudget: number;
}) {
  const [extraDebtId, setExtraDebtId] = useState<string | undefined>(debts[0]?.id);
  const [extraMonth, setExtraMonth] = useState(1);
  const [extraAmount, setExtraAmount] = useState(0);
  const [incomeChangePercent, setIncomeChangePercent] = useState(0);
  const [expenseChangePercent, setExpenseChangePercent] = useState(0);

  const baseOrder = useMemo(() => orderDebtsByStrategy(debts, "avalanche", monthlyBudget), [debts, monthlyBudget]);

  const baseMonths = useMemo(
    () => simulatePayoff(baseOrder, monthlyBudget),
    [baseOrder, monthlyBudget]
  );

  // monthlyBudget ya es (ingreso − gasto recurrente) sin restar cuotas
  // mínimas de deuda aparte — el motor de avalancha reparte todo el
  // presupuesto entre las deudas, las cuotas mínimas no se separan antes
  // (igual que ya hace /debts). Ajustar aquí % sobre income/expense debe
  // dar exactamente `monthlyBudget` cuando ambos % son 0.
  const adjustedIncome = monthlyIncome * (1 + incomeChangePercent / 100);
  const adjustedExpense = monthlyExpense * (1 + expenseChangePercent / 100);
  const adjustedBudget = Math.max(adjustedIncome - adjustedExpense, 0);

  const extraPayments: ExtraPayment[] =
    extraDebtId && extraAmount > 0 ? [{ debtId: extraDebtId, month: extraMonth, amount: extraAmount }] : [];

  const adjustedOrder = useMemo(
    () => orderDebtsByStrategy(debts, "avalanche", adjustedBudget),
    [debts, adjustedBudget]
  );

  const simulatedMonths = useMemo(
    () => simulatePayoff(adjustedOrder, adjustedBudget, { extraPayments }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [adjustedOrder, adjustedBudget, extraDebtId, extraMonth, extraAmount]
  );

  if (debts.length === 0) {
    return (
      <EmptyState
        icon={Sliders}
        title="Sin deudas activas para simular"
        description="El simulador compara escenarios hipotéticos sobre tus deudas activas. Registra una deuda para empezar a probar."
      />
    );
  }

  const baseTotalPaid = baseMonths.reduce((s, m) => s + m.totalPaid, 0);
  const originalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const baseInterest = Math.max(Math.round(baseTotalPaid - originalBalance), 0);

  const simTotalPaid = simulatedMonths.reduce((s, m) => s + m.totalPaid, 0);
  const simInterest = Math.max(Math.round(simTotalPaid - originalBalance), 0);

  const extraExceedsBudget =
    extraAmount > 0 && extraDebtId && extraAmount > monthlyBudget * 3;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Ajusta el escenario</CardTitle>
          <CardDescription>
            Nada de esto se guarda — solo es para explorar &quot;qué pasaría si&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 border-b pb-4">
            <p className="text-sm font-medium">Pago extra puntual</p>
            <div className="space-y-1">
              <Label>Deuda</Label>
              <Select
                items={Object.fromEntries(debts.map((d) => [d.id, d.name]))}
                value={extraDebtId}
                onValueChange={(v) => setExtraDebtId(v ?? undefined)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {debts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="extraMonth">Mes en que lo harías</Label>
              <Input
                id="extraMonth"
                type="number"
                min={1}
                value={extraMonth}
                onChange={(e) => setExtraMonth(Math.max(Number(e.target.value) || 1, 1))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="extraAmount">Monto extra (COP)</Label>
              <CurrencyInput
                id="extraAmount"
                name="extraAmount"
                onValueChange={setExtraAmount}
              />
              {extraExceedsBudget && (
                <p className="text-xs text-warning">
                  Ese monto es bastante alto frente a tu presupuesto mensual disponible —
                  confirma que de verdad lo tengas disponible ese mes.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Cambios de ingreso/gasto</p>
            <div className="space-y-1">
              <Label htmlFor="incomeChange">% de cambio en ingreso mensual</Label>
              <Input
                id="incomeChange"
                type="number"
                value={incomeChangePercent}
                onChange={(e) => setIncomeChangePercent(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expenseChange">% de cambio en gasto fijo mensual</Label>
              <Input
                id="expenseChange"
                type="number"
                value={expenseChangePercent}
                onChange={(e) => setExpenseChangePercent(Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Comparación</CardTitle>
          <CardDescription>Escenario actual vs. escenario simulado (estrategia Avalancha como base)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 rounded-lg border p-4">
              <p className="text-xs font-medium text-muted-foreground">Escenario actual</p>
              <p className="font-mono text-2xl font-semibold">{baseMonths.length} meses</p>
              <Money value={baseInterest} size="sm" tone="negative" />
              <p className="text-xs text-muted-foreground">en intereses totales</p>
            </div>
            <div className="space-y-2 rounded-lg border border-primary/40 p-4">
              <p className="text-xs font-medium text-muted-foreground">Escenario simulado</p>
              <p className="font-mono text-2xl font-semibold">{simulatedMonths.length} meses</p>
              <Money value={simInterest} size="sm" tone="negative" />
              <p className="text-xs text-muted-foreground">en intereses totales</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border p-4 text-sm">
            {simulatedMonths.length <= baseMonths.length ? (
              <p>
                Con este escenario, saldrías de deudas{" "}
                <span className="font-semibold text-success">
                  {baseMonths.length - simulatedMonths.length} meses antes
                </span>{" "}
                y ahorrarías <Money value={Math.max(baseInterest - simInterest, 0)} size="sm" tone="positive" /> en
                intereses.
              </p>
            ) : (
              <p>
                Con este escenario tardarías{" "}
                <span className="font-semibold text-destructive">
                  {simulatedMonths.length - baseMonths.length} meses más
                </span>{" "}
                en salir de deudas.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
