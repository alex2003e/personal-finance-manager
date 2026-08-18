import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { toNumber } from "@/lib/format";
import { ProjectionCalculator } from "./projection-calculator";

export default async function ReportsPage() {
  const userId = await requireUserId();

  const [assets, investments, debts] = await Promise.all([
    prisma.asset.findMany({ where: { userId } }),
    prisma.investment.findMany({ where: { userId } }),
    prisma.debt.findMany({ where: { userId } }),
  ]);

  const totalAssets = assets.reduce((s, a) => s + toNumber(a.estimatedValue), 0);
  const totalInvestments = investments.reduce(
    (s, i) => s + toNumber(i.quantity) * toNumber(i.currentPrice),
    0
  );
  const totalDebts = debts.reduce((s, d) => s + toNumber(d.balance), 0);
  const currentNetWorth = totalAssets + totalInvestments - totalDebts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Proyecciones</h1>
        <p className="text-muted-foreground">
          De salir de deudas a construir patrimonio: proyecta cuánto puede crecer tu dinero con
          aportes constantes y rendimiento compuesto.
        </p>
      </div>
      <ProjectionCalculator startingBalance={Math.max(currentNetWorth, 0)} />
    </div>
  );
}
