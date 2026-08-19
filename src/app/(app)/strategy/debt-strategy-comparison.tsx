import { compareStrategies, type DebtInput } from "@/lib/calc/avalanche";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/money";
import { EmptyState } from "@/components/empty-state";
import { CreditCard } from "lucide-react";

const STRATEGY_LABEL: Record<string, string> = {
  avalanche: "Avalancha",
  snowball: "Bola de Nieve",
  optimal: "Óptima",
};

const STRATEGY_DESCRIPTION: Record<string, string> = {
  avalanche: "Paga primero la deuda con la tasa de interés más alta.",
  snowball: "Paga primero la deuda con el saldo más bajo (motivación rápida).",
  optimal: "Salda primero 1-2 deudas pequeñas como \"quick win\", luego avalancha con el resto.",
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function DebtStrategyComparison({
  debts,
  monthlyBudget,
}: {
  debts: DebtInput[];
  monthlyBudget: number;
}) {
  if (debts.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="Sin deudas activas"
        description="Cuando tengas una deuda activa registrada, aquí vas a poder comparar Avalancha, Bola de Nieve y una estrategia Óptima lado a lado."
      />
    );
  }

  if (monthlyBudget <= 0) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>No hay excedente para pagar deuda</CardTitle>
          <CardDescription>
            Según tus ingresos y gastos recurrentes activos, no te queda presupuesto libre
            este mes para abonar a tus deudas más allá de las cuotas mínimas. Revisa
            Recurrentes para ajustar ingresos o gastos.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const comparisons = compareStrategies(debts, monthlyBudget);
  const best = comparisons.reduce((min, c) =>
    c.totalInterestPaid < min.totalInterestPaid ? c : min
  );

  const now = new Date();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {comparisons.map((c) => {
        const isRecommended = c.strategy === best.strategy;
        return (
          <Card key={c.strategy} className={isRecommended ? "border-success/50" : undefined}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{STRATEGY_LABEL[c.strategy]}</CardTitle>
                {isRecommended && <Badge className="bg-success text-success-foreground">Recomendada</Badge>}
              </div>
              <CardDescription>{STRATEGY_DESCRIPTION[c.strategy]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Interés total pagado</p>
                <Money value={c.totalInterestPaid} size="lg" tone="negative" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Terminas de pagar en</p>
                <p className="font-mono text-sm font-semibold">
                  {c.totalMonths} {c.totalMonths === 1 ? "mes" : "meses"}
                </p>
              </div>
              {!isRecommended && (
                <p className="text-xs text-muted-foreground">
                  Pagarías <Money value={c.totalInterestPaid - best.totalInterestPaid} size="sm" tone="negative" /> más
                  en intereses que con {STRATEGY_LABEL[best.strategy]}.
                </p>
              )}
              <div className="space-y-1 border-t pt-2">
                {debts.map((d) => {
                  const closedMonth = c.closedAtMonth[d.id];
                  return (
                    <div key={d.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{d.name}</span>
                      <span>
                        {closedMonth
                          ? addMonths(now, closedMonth).toLocaleDateString("es-CO", {
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
