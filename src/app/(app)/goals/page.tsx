import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCOP, toNumber } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GoalForm } from "./goal-form";
import { GoalActions } from "./goal-actions";

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

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const target = toNumber(g.targetAmount);
          const current = toNumber(g.currentAmount);
          const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
          return (
            <Card key={g.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {g.name}
                  <GoalActions id={g.id} currentAmount={current} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{TYPE_LABEL[g.type]}</p>
                <Progress value={pct} />
                <p className="text-sm">
                  {formatCOP(current)} de {formatCOP(target)} ({pct.toFixed(0)}%)
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
        {goals.length === 0 && (
          <p className="text-muted-foreground">Aún no tienes metas. Crea la primera.</p>
        )}
      </div>
    </div>
  );
}
