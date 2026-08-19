"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { projectNetWorth } from "@/lib/calc/projections";
import { formatCOP } from "@/lib/format";

export function ProjectionCalculator({ startingBalance }: { startingBalance: number }) {
  const [monthly, setMonthly] = useState(500000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(20);

  const points = useMemo(
    () => projectNetWorth(startingBalance, monthly, rate, years),
    [startingBalance, monthly, rate, years]
  );

  const final = points[points.length - 1];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Parámetros</CardTitle>
          <CardDescription>Patrimonio inicial: {formatCOP(startingBalance)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="monthly">Aporte mensual (COP)</Label>
            <CurrencyInput
              id="monthly"
              name="monthly"
              defaultValue={monthly}
              onValueChange={setMonthly}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rate">Rendimiento anual esperado (%)</Label>
            <Input
              id="rate"
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="years">Años</Label>
            <Input
              id="years"
              type="number"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
            />
          </div>
          <div className="rounded-md border p-3 text-sm">
            <p>
              Patrimonio proyectado en {years} años:{" "}
              <span className="font-semibold">{formatCOP(final.balance)}</span>
            </p>
            <p className="text-muted-foreground">
              Aportado: {formatCOP(final.contributed)} · Ganancia por rendimiento:{" "}
              {formatCOP(final.balance - final.contributed)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Evolución del patrimonio</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="year" tickFormatter={(y) => `Año ${y}`} />
              <YAxis tickFormatter={(v) => formatCOP(v)} width={110} />
              <Tooltip
                formatter={(value) => formatCOP(Number(value ?? 0))}
                labelFormatter={(y) => `Año ${y}`}
              />
              <Line type="monotone" dataKey="balance" stroke="var(--primary)" name="Patrimonio" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="contributed" stroke="#94a3b8" name="Aportado" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
