import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCOP, toNumber } from "@/lib/format";
import { monthsUntil, computeFixedQuota } from "@/lib/calc/goal-quota";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/money";
import { ArrowLeft, Target } from "lucide-react";
import { AddContributionDialog } from "./add-contribution-dialog";
import { DeleteContributionButton } from "./delete-contribution-button";

const TYPE_LABEL: Record<string, string> = {
  EMERGENCY_FUND: "Fondo de emergencia",
  DEBT_FREE: "Libre de deudas",
  NET_WORTH: "Patrimonio neto",
  CUSTOM: "Personalizada",
};

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const goal = await prisma.goal.findFirst({
    where: { id, userId },
    include: { contributions: { orderBy: { date: "desc" } } },
  });
  if (!goal) notFound();

  const target = toNumber(goal.targetAmount);
  const current = toNumber(goal.currentAmount);
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = Math.max(target - current, 0);

  const months = goal.targetMonths ?? (goal.targetDate ? monthsUntil(goal.targetDate) : null);
  const fixedQuota = months ? computeFixedQuota(target, current, months) : null;

  return (
    <div className="space-y-6">
      <Link
        href="/goals"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a metas
      </Link>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Target className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{goal.name}</h1>
          <p className="text-muted-foreground">{TYPE_LABEL[goal.type]}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Progreso</CardTitle>
            <CardDescription>
              <Money value={current} size="sm" tone="positive" /> de{" "}
              <Money value={target} size="sm" /> ({pct.toFixed(0)}%)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={pct} />
            <p className="text-sm text-muted-foreground">
              Falta <Money value={remaining} size="sm" tone={remaining > 0 ? "negative" : "positive"} /> para
              completar la meta.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuota fija sugerida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {fixedQuota != null ? (
              <>
                <Money value={fixedQuota} size="lg" tone="positive" />
                <p className="text-xs text-muted-foreground">
                  por mes durante {months} {months === 1 ? "mes" : "meses"}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Define una fecha objetivo o un plazo en meses (editando la meta) para calcular
                cuánto ahorrar cada mes.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Abonos</CardTitle>
            <CardDescription>Historial de aportes a esta meta.</CardDescription>
          </div>
          <AddContributionDialog goalId={goal.id} />
        </CardHeader>
        <CardContent className="space-y-2">
          {goal.contributions.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{c.date.toLocaleDateString("es-CO")}</p>
                {c.notes && <p className="text-muted-foreground">{c.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Money value={toNumber(c.amount)} size="sm" tone="positive" />
                <DeleteContributionButton id={c.id} />
              </div>
            </div>
          ))}
          {goal.contributions.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin abonos todavía. Registra el primero para empezar a ver tu progreso.
            </p>
          )}
        </CardContent>
      </Card>

      <Link href="/goals">
        <Button variant="outline" size="sm">
          Volver
        </Button>
      </Link>
    </div>
  );
}
