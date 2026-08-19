import { computeHealthScore, projectHealthScore6Months } from "@/lib/calc/health-score";
import { compareStrategies, type DebtInput } from "@/lib/calc/avalanche";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

function scoreTone(score: number) {
  if (score >= 70) return "text-success";
  if (score >= 40) return "text-warning";
  return "text-destructive";
}

function ScoreComponent({ label, value, explanation }: { label: string; value: number; explanation: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className={cn("font-mono font-semibold", scoreTone(value))}>{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{explanation}</p>
    </div>
  );
}

export function HealthScorePanel({
  totalDebtBalance,
  monthlyIncome,
  monthlyExpense,
  liquidBalance,
  debts,
  monthlyBudgetForDebt,
}: {
  totalDebtBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  liquidBalance: number;
  debts: DebtInput[];
  monthlyBudgetForDebt: number;
}) {
  const current = computeHealthScore({
    totalDebtBalance,
    monthlyIncome,
    monthlyExpense,
    liquidBalance,
  });

  if (!current) {
    return (
      <EmptyState
        icon={HeartPulse}
        title="Sin ingreso recurrente registrado"
        description="Necesitamos tu ingreso mensual (en Recurrentes) para calcular tu score de salud financiera."
      />
    );
  }

  let monthSixDebtBalance = totalDebtBalance;
  if (debts.length > 0 && monthlyBudgetForDebt > 0) {
    const comparisons = compareStrategies(debts, monthlyBudgetForDebt);
    const recommended = comparisons.reduce((min, c) => (c.totalInterestPaid < min.totalInterestPaid ? c : min));
    const monthSix = recommended.months[5] ?? recommended.months[recommended.months.length - 1];
    monthSixDebtBalance = monthSix ? monthSix.totalRemaining : 0;
  }

  const projected = projectHealthScore6Months(
    { totalDebtBalance, monthlyIncome, monthlyExpense, liquidBalance },
    monthSixDebtBalance
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Hoy</CardTitle>
          <CardDescription>Tu score de salud financiera actual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={cn("font-mono text-5xl font-bold", scoreTone(current.score))}>{current.score}</p>
          <div className="space-y-3 border-t pt-3">
            <ScoreComponent
              label="Deuda vs. ingreso"
              value={current.debtToIncomeComponent}
              explanation="Qué tan grande es tu deuda comparada con lo que ganas cada mes."
            />
            <ScoreComponent
              label="Tasa de ahorro"
              value={current.savingsRateComponent}
              explanation="Qué tanto de tu ingreso te queda libre después de tus gastos."
            />
            <ScoreComponent
              label="Cobertura de emergencia"
              value={current.emergencyCoverageComponent}
              explanation="Cuántos meses de gastos podrías cubrir con tu liquidez actual."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>En 6 meses</CardTitle>
          <CardDescription>
            Si sigues la estrategia de pago recomendada en la pestaña Deudas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {projected ? (
            <>
              <p className={cn("font-mono text-5xl font-bold", scoreTone(projected.score))}>
                {projected.score}
              </p>
              <p className="text-sm text-muted-foreground">
                {projected.score > current.score
                  ? `Mejora ${projected.score - current.score} puntos si mantienes el ritmo.`
                  : projected.score < current.score
                  ? "Podría bajar si no ajustas tu presupuesto disponible."
                  : "Se mantiene estable."}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No se pudo proyectar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
