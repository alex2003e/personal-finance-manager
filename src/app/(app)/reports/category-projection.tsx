"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { projectAssetValue } from "@/lib/calc/depreciation";
import { formatCOP, formatPercent } from "@/lib/format";
import { Money } from "@/components/money";
import { EmptyState } from "@/components/empty-state";
import { PiggyBank, TrendingUp, Car, Building2, Wallet } from "lucide-react";

export interface CategoryItem {
  id: string;
  name: string;
  currentValue: number;
  annualRatePercent: number;
}

// Los componentes de ícono (funciones) no se pueden pasar de un Server
// Component a un Client Component vía props — se resuelven aquí a partir
// de una clave de texto en su lugar.
const ICONS = { piggyBank: PiggyBank, trendingUp: TrendingUp, car: Car, building: Building2, wallet: Wallet };
export type CategoryIconKey = keyof typeof ICONS;

export function CategoryProjection({
  icon,
  title,
  description,
  items,
  emptyLabel,
  emptyDescription,
  lineColor = "var(--chart-1)",
}: {
  icon: CategoryIconKey;
  title: string;
  description: string;
  items: CategoryItem[];
  emptyLabel: string;
  emptyDescription: string;
  lineColor?: string;
}) {
  const Icon = ICONS[icon];
  const [years, setYears] = useState(5);
  const months = Math.max(years, 1) * 12;

  const chartData = useMemo(() => {
    if (items.length === 0) return [];
    const perItem = items.map((it) => projectAssetValue(it.currentValue, it.annualRatePercent, months));
    const points = [];
    for (let m = 0; m <= months; m++) {
      const total = perItem.reduce((s, series) => s + (series[m]?.value ?? 0), 0);
      points.push({ month: m, total });
    }
    return points;
  }, [items, months]);

  const currentTotal = items.reduce((s, i) => s + i.currentValue, 0);
  const projectedTotal = chartData[chartData.length - 1]?.total ?? 0;

  if (items.length === 0) {
    return <EmptyState icon={Icon} title={emptyLabel} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor={`${title}-years`}>Horizonte (años)</Label>
            <Input
              id={`${title}-years`}
              type="number"
              min={1}
              max={40}
              value={years}
              onChange={(e) => setYears(Number(e.target.value) || 1)}
            />
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p>
              Valor actual: <Money value={currentTotal} size="sm" />
            </p>
            <p>
              En {years} {years === 1 ? "año" : "años"}:{" "}
              <Money
                value={projectedTotal}
                size="sm"
                tone={projectedTotal >= currentTotal ? "positive" : "negative"}
              />
            </p>
          </div>
          <div className="space-y-1.5">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{it.name}</span>
                <span>
                  {formatCOP(it.currentValue)} · {it.annualRatePercent >= 0 ? "+" : ""}
                  {formatPercent(it.annualRatePercent, 1)}/año
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Evolución proyectada</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="month"
                tickFormatter={(m) => `${Math.round(m / 12)}a`}
                interval={Math.max(Math.floor(months / 6), 1)}
              />
              <YAxis tickFormatter={(v) => formatCOP(v)} width={100} />
              <Tooltip
                formatter={(value) => formatCOP(Number(value ?? 0))}
                labelFormatter={(m) => `Mes ${m}`}
              />
              <Line type="monotone" dataKey="total" stroke={lineColor} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
