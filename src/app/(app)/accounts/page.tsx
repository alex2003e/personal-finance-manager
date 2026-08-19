import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { toNumber } from "@/lib/format";
import { toCOP } from "@/lib/currency";
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
import { Landmark } from "lucide-react";
import { AccountForm } from "./account-form";
import { TransferDialog } from "./transfer-dialog";
import { DeleteAccountButton } from "./delete-account-button";

const TYPE_LABEL: Record<string, string> = {
  SAVINGS: "Ahorros",
  CHECKING: "Corriente",
  CASH: "Efectivo",
};

export default async function AccountsPage() {
  const userId = await requireUserId();
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const totalLiquidity = accounts.reduce(
    (s, a) => s + toCOP(toNumber(a.balance), a.currency, a.exchangeRateToCOP ? toNumber(a.exchangeRateToCOP) : null),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cuentas</h1>
          <p className="text-muted-foreground">
            Ahorros, corriente y efectivo — de aquí entran tus pagos y salen tus retiros. Liquidez
            total: <Money value={totalLiquidity} size="sm" tone="positive" className="align-middle" />
          </p>
        </div>
        <div className="flex gap-2">
          {accounts.length >= 2 && (
            <TransferDialog
              accounts={accounts.map((a) => ({ id: a.id, name: a.name, balance: toNumber(a.balance) }))}
            />
          )}
          <AccountForm />
        </div>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Aún no tienes cuentas registradas"
          description="Agrega tu cuenta de ahorros o corriente donde te depositan tus ingresos, para poder registrar de dónde sale cada pago."
          action={<AccountForm />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {accounts.map((a) => {
            const balance = toNumber(a.balance);
            const cop = toCOP(balance, a.currency, a.exchangeRateToCOP ? toNumber(a.exchangeRateToCOP) : null);
            return (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{a.name}</CardTitle>
                    <Badge variant="secondary">{TYPE_LABEL[a.type]}</Badge>
                  </div>
                  <CardDescription>{a.bank}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Money value={balance} size="xl" tone="positive" className="block" />
                  {a.currency !== "COP" && (
                    <p className="text-xs text-muted-foreground">
                      {a.currency} · ≈ {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(cop)}
                    </p>
                  )}
                  <DeleteAccountButton id={a.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
