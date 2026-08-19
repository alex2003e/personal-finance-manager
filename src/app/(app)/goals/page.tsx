import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { toNumber } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/money";
import { EmptyState } from "@/components/empty-state";
import { Target, ChevronRight } from "lucide-react";
import { GoalForm } from "./goal-form";
import { DeleteGoalButton } from "./delete-goal-button";

const TYPE_LABEL: Record<string, string> = {
  EMERGENCY_FUND: "Fondo de emergencia",
  DEBT_FREE: "Libre de deudas",
  NET_WORTH: "Patrimonio neto",
  CUSTOM: "Personalizada",
};

export default async function GoalsPage() {
  const userId = await requireUserId();
  const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Metas</h1>
          <p className="text-muted-foreground">
            Fondo de emergencia, deuda cero, patrimonio objetivo — lo que te importe medir.
          </p>
        </div>
        <GoalForm />
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Aún no tienes metas"
          description="Crea tu primera meta — fondo de emergencia, deuda cero, o lo que quieras alcanzar — y te ayudamos a calcular cuánto ahorrar cada mes."
          action={<GoalForm />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const target = toNumber(g.targetAmount);
            const current = toNumber(g.currentAmount);
            const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            return (
              <Card key={g.id} className="group relative">
                <Link href={`/goals/${g.id}`} className="absolute inset-0 z-0" aria-label={g.name} />
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-1.5">
                      {g.name}
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="relative z-10">
                      <DeleteGoalButton id={g.id} />
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{TYPE_LABEL[g.type]}</p>
                  <Progress value={pct} />
                  <p className="text-sm">
                    <Money value={current} size="sm" tone="positive" /> de{" "}
                    <Money value={target} size="sm" /> ({pct.toFixed(0)}%)
                  </p>
                  {g.targetDate && (
                    <p className="text-xs text-muted-foreground">
                      Meta: {g.targetDate.toLocaleDateString("es-CO")}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
