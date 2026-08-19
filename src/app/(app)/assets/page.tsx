import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCOP, toNumber } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { Car, TrendingUp } from "lucide-react";
import { AssetForm } from "./asset-form";
import { InvestmentForm } from "./investment-form";
import { DeleteAssetButton, DeleteInvestmentButton } from "./delete-buttons";

const ASSET_TYPE_LABEL: Record<string, string> = {
  VEHICLE: "Vehículo",
  PROPERTY: "Propiedad",
  INVESTMENT: "Inversión",
  OTHER: "Otro",
};

const INV_TYPE_LABEL: Record<string, string> = {
  STOCK: "Acción",
  ETF: "ETF",
  CRYPTO: "Cripto",
  FUND: "Fondo",
  REAL_ESTATE: "Inmobiliario",
  OTHER: "Otro",
};

export default async function AssetsPage() {
  const userId = await requireUserId();
  const [assets, investments] = await Promise.all([
    prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.investment.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);

  const totalAssets = assets.reduce((s, a) => s + toNumber(a.estimatedValue), 0);
  const totalInvestments = investments.reduce(
    (s, i) => s + toNumber(i.quantity) * toNumber(i.currentPrice),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activos e Inversiones</h1>
        <p className="text-muted-foreground">
          Activos: {formatCOP(totalAssets)} · Inversiones: {formatCOP(totalInvestments)} · Total:{" "}
          {formatCOP(totalAssets + totalInvestments)}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activos (vehículos, propiedades, etc.)</CardTitle>
          <AssetForm />
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <EmptyState
              icon={Car}
              title="Sin activos registrados"
              description="Agrega tus motos, vehículos o propiedades para incluirlos en tu patrimonio neto y ver su proyección de valor."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor estimado</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{ASSET_TYPE_LABEL[a.type]}</TableCell>
                    <TableCell>{formatCOP(toNumber(a.estimatedValue))}</TableCell>
                    <TableCell className="text-muted-foreground">{a.notes}</TableCell>
                    <TableCell>
                      <DeleteAssetButton id={a.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inversiones</CardTitle>
          <InvestmentForm />
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Sin inversiones registradas"
              description="Agrega fondos, acciones o cripto para verlas proyectadas en la pestaña Inversiones de Proyecciones."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Costo prom.</TableHead>
                  <TableHead>Precio actual</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell>{INV_TYPE_LABEL[i.type]}</TableCell>
                    <TableCell>{toNumber(i.quantity)}</TableCell>
                    <TableCell>{formatCOP(toNumber(i.avgCost))}</TableCell>
                    <TableCell>{formatCOP(toNumber(i.currentPrice))}</TableCell>
                    <TableCell>{formatCOP(toNumber(i.quantity) * toNumber(i.currentPrice))}</TableCell>
                    <TableCell>
                      <DeleteInvestmentButton id={i.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
