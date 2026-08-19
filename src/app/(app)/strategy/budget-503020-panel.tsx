import { compute503020 } from "@/lib/calc/budget-503020";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/money";
import { EmptyState } from "@/components/empty-state";
import { PieChart } from "lucide-react";

const BUCKET_LABEL: Record<string, string> = {
  needs: "Necesidades (50%)",
  wants: "Deseos (30%)",
  savings: "Ahorro (20%)",
};

export function Budget503020Panel({
  totalMonthlyIncome,
  expenseItems,
  monthlySavingsAmount,
}: {
  totalMonthlyIncome: number;
  expenseItems: { name: string; category: string; monthlyAmount: number }[];
  monthlySavingsAmount: number;
}) {
  if (totalMonthlyIncome <= 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="Sin ingreso recurrente registrado"
        description="Agrega tu ingreso mensual en Recurrentes para ver la comparación contra la regla 50/30/20."
      />
    );
  }

  const buckets = compute503020(totalMonthlyIncome, expenseItems, monthlySavingsAmount);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {buckets.map((b) => {
        const pct = b.suggestedAmount > 0 ? Math.min((b.actualAmount / b.suggestedAmount) * 100, 100) : 0;
        return (
          <Card key={b.bucket} className={b.overBudget ? "border-warning/50" : undefined}>
            <CardHeader>
              <CardTitle className="text-base">{BUCKET_LABEL[b.bucket]}</CardTitle>
              <CardDescription>
                Sugerido: <Money value={b.suggestedAmount} size="sm" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={pct} />
              <p className="text-sm">
                Real: <Money value={b.actualAmount} size="sm" tone={b.overBudget ? "negative" : "positive"} />
              </p>
              {b.overBudget && (
                <p className="text-xs text-warning">Estás por encima de lo sugerido en esta franja.</p>
              )}
              {b.items.length > 0 && (
                <ul className="space-y-1 border-t pt-2 text-xs text-muted-foreground">
                  {b.items.map((item) => (
                    <li key={item.name} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>{Math.round(item.amount).toLocaleString("es-CO")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
