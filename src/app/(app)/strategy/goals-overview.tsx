import { estimateGoalCompletion } from "@/lib/calc/goals-projection";
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
import { Target } from "lucide-react";

interface GoalWithContributions {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  contributions: { date: Date; amount: number }[];
}

export function GoalsOverview({
  goals,
  monthlyBudgetForDebt,
}: {
  goals: GoalWithContributions[];
  monthlyBudgetForDebt: number;
}) {
  if (goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="Sin metas activas"
        description="Registra una meta en la sección Metas para ver aquí su progreso consolidado y fecha estimada de cumplimiento."
      />
    );
  }

  const totalMonthlyRate = goals.reduce((s, g) => {
    const p = estimateGoalCompletion(g.targetAmount, g.currentAmount, g.contributions);
    return s + (p.monthlyRate ?? 0);
  }, 0);
  const freeAfterGoals = Math.max(monthlyBudgetForDebt - totalMonthlyRate, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Presupuesto libre después de metas</CardTitle>
          <CardDescription>
            Tu presupuesto disponible ({<Money value={monthlyBudgetForDebt} size="sm" />}) menos
            el ritmo actual de abonos a todas tus metas activas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Money value={freeAfterGoals} size="xl" tone={freeAfterGoals > 0 ? "positive" : "negative"} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const projection = estimateGoalCompletion(g.targetAmount, g.currentAmount, g.contributions);
          const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
          return (
            <Card key={g.id}>
              <CardHeader>
                <CardTitle className="text-base">{g.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={pct} />
                <p className="text-sm">
                  <Money value={g.currentAmount} size="sm" tone="positive" /> de{" "}
                  <Money value={g.targetAmount} size="sm" /> ({pct.toFixed(0)}%)
                </p>
                {projection.hasEnoughData ? (
                  <p className="text-xs text-muted-foreground">
                    A tu ritmo actual (~{Math.round(projection.monthlyRate ?? 0).toLocaleString("es-CO")}/mes),
                    la cumplirías en{" "}
                    {projection.estimatedCompletionDate?.toLocaleDateString("es-CO", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Aún no hay suficientes abonos para proyectar una fecha (registra al menos
                    2 abonos separados en el tiempo).
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
