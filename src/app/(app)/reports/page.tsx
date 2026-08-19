import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { toNumber } from "@/lib/format";
import { resolveAssetRate } from "@/lib/calc/depreciation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiggyBank, TrendingUp, Car, Building2, Wallet } from "lucide-react";
import { ProjectionCalculator } from "./projection-calculator";
import { CategoryProjection } from "./category-projection";

export default async function ReportsPage() {
  const userId = await requireUserId();

  const [assets, investments, accounts, debts] = await Promise.all([
    prisma.asset.findMany({ where: { userId } }),
    prisma.investment.findMany({ where: { userId } }),
    prisma.account.findMany({ where: { userId } }),
    prisma.debt.findMany({ where: { userId } }),
  ]);

  const totalAssets = assets.reduce((s, a) => s + toNumber(a.estimatedValue), 0);
  const totalInvestments = investments.reduce(
    (s, i) => s + toNumber(i.quantity) * toNumber(i.currentPrice),
    0
  );
  const totalAccounts = accounts.reduce((s, a) => s + toNumber(a.balance), 0);
  const totalDebts = debts.reduce((s, d) => s + toNumber(d.balance), 0);
  const currentNetWorth = totalAssets + totalInvestments + totalAccounts - totalDebts;

  const vehicles = assets
    .filter((a) => a.type === "VEHICLE")
    .map((a) => ({
      id: a.id,
      name: a.name,
      currentValue: toNumber(a.estimatedValue),
      annualRatePercent: resolveAssetRate(a.type, a.annualRatePercent ? toNumber(a.annualRatePercent) : null),
    }));

  const properties = assets
    .filter((a) => a.type === "PROPERTY")
    .map((a) => ({
      id: a.id,
      name: a.name,
      currentValue: toNumber(a.estimatedValue),
      annualRatePercent: resolveAssetRate(a.type, a.annualRatePercent ? toNumber(a.annualRatePercent) : null),
    }));

  const savingsItems = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    currentValue: toNumber(a.balance),
    annualRatePercent: 0,
  }));

  const investmentItems = investments.map((i) => ({
    id: i.id,
    name: i.name,
    currentValue: toNumber(i.quantity) * toNumber(i.currentPrice),
    annualRatePercent: resolveAssetRate("INVESTMENT", null),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Proyecciones</h1>
        <p className="text-muted-foreground">
          De salir de deudas a construir patrimonio: proyecta cada parte de tu dinero por
          separado, con supuestos realistas de valorización y depreciación.
        </p>
      </div>

      <Tabs defaultValue="networth">
        <TabsList>
          <TabsTrigger value="networth">
            <Wallet className="mr-1 h-4 w-4" />
            Patrimonio neto
          </TabsTrigger>
          <TabsTrigger value="savings">
            <PiggyBank className="mr-1 h-4 w-4" />
            Ahorros
          </TabsTrigger>
          <TabsTrigger value="investments">
            <TrendingUp className="mr-1 h-4 w-4" />
            Inversiones
          </TabsTrigger>
          <TabsTrigger value="vehicles">
            <Car className="mr-1 h-4 w-4" />
            Vehículos
          </TabsTrigger>
          <TabsTrigger value="properties">
            <Building2 className="mr-1 h-4 w-4" />
            Bienes inmuebles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="networth" className="mt-4">
          <ProjectionCalculator startingBalance={Math.max(currentNetWorth, 0)} />
        </TabsContent>

        <TabsContent value="savings" className="mt-4">
          <CategoryProjection
            icon="piggyBank"
            title="Ahorros"
            description="Tus cuentas de ahorro/corriente, proyectadas sin rendimiento (la mayoría de cuentas de ahorro en Colombia no generan interés relevante)."
            items={savingsItems}
            emptyLabel="Sin cuentas registradas"
            emptyDescription="Agrega tus cuentas de ahorro en la sección Cuentas para verlas proyectadas aquí."
            lineColor="var(--chart-1)"
          />
        </TabsContent>

        <TabsContent value="investments" className="mt-4">
          <CategoryProjection
            icon="trendingUp"
            title="Inversiones"
            description="Fondos, acciones, cripto — con un rendimiento anual de referencia del 6% (ajústalo editando cada inversión si tienes una expectativa distinta)."
            items={investmentItems}
            emptyLabel="Sin inversiones registradas"
            emptyDescription="Agrega tus inversiones en Activos e Inversiones para proyectarlas aquí."
            lineColor="var(--chart-2)"
          />
        </TabsContent>

        <TabsContent value="vehicles" className="mt-4">
          <CategoryProjection
            icon="car"
            title="Vehículos"
            description="Depreciación en línea recta del 20% anual (vida útil de 5 años según el Estatuto Tributario colombiano — DIAN), salvo que hayas puesto una tasa propia."
            items={vehicles}
            emptyLabel="Sin vehículos registrados"
            emptyDescription="Agrega tus vehículos en Activos e Inversiones (tipo Vehículo) para ver cómo se deprecian."
            lineColor="var(--chart-3)"
          />
        </TabsContent>

        <TabsContent value="properties" className="mt-4">
          <CategoryProjection
            icon="building"
            title="Bienes inmuebles"
            description="Valorización estimada del 4% anual (promedio histórico aproximado del mercado colombiano), salvo que hayas puesto una tasa propia por inmueble."
            items={properties}
            emptyLabel="Sin inmuebles registrados"
            emptyDescription="Agrega tus propiedades en Activos e Inversiones (tipo Propiedad) para ver su valorización proyectada."
            lineColor="var(--chart-4)"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
