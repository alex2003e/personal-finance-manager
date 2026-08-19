"use client";

import { useMemo, useState } from "react";
import { projectCashFlow, detectDeficitStreaks } from "@/lib/calc/cashflow";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { formatCOP } from "@/lib/format";
import { TrendingUp, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function CashflowPanel({
  monthlyIncome,
  monthlyExpense,
}: {
  monthlyIncome: number;
  monthlyExpense: number;
}) {
  const [horizon, setHorizon] = useState<"3" | "6" | "12">("6");

  const points = useMemo(
    () => projectCashFlow(monthlyIncome, monthlyExpense, Number(horizon)),
    [monthlyIncome, monthlyExpense, horizon]
  );
  const alerts = useMemo(() => detectDeficitStreaks(points), [points]);

  if (monthlyIncome <= 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Sin ingresos recurrentes registrados"
        description="Agrega tu ingreso mensual en Recurrentes para ver la proyección de flujo de caja."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Proyección lineal basada en tus recurrentes actuales — asume que el ingreso y el
          gasto se mantienen iguales cada mes.
        </p>
        <Tabs value={horizon} onValueChange={(v) => setHorizon(v as "3" | "6" | "12")}>
          <TabsList>
            <TabsTrigger value="3">3 meses</TabsTrigger>
            <TabsTrigger value="6">6 meses</TabsTrigger>
            <TabsTrigger value="12">12 meses</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {alerts.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-base">Riesgo de liquidez</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {alerts.map((a, i) => (
              <p key={i} className="text-sm">
                Del mes {a.startMonth} al {a.endMonth} ({a.monthsCount} meses seguidos) tus
                gastos proyectados superan tu ingreso.
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ingreso vs. gasto proyectado</CardTitle>
          <CardDescription>
            Ingreso mensual: {formatCOP(monthlyIncome)} · Gasto mensual (incluye cuotas
            mínimas de deuda): {formatCOP(monthlyExpense)}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tickFormatter={(m) => `Mes ${m}`} />
              <YAxis tickFormatter={(v) => formatCOP(v)} width={100} />
              <Tooltip
                formatter={(value) => formatCOP(Number(value ?? 0))}
                labelFormatter={(m) => `Mes ${m}`}
              />
              <Bar dataKey="net" name="Saldo neto del mes" radius={[4, 4, 0, 0]}>
                {points.map((p, i) => (
                  <Cell key={i} fill={p.isDeficit ? "var(--destructive)" : "var(--success)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
