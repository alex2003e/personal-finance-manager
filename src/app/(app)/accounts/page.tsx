import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCOP, toNumber } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const totalLiquidity = accounts.reduce((s, a) => s + toNumber(a.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cuentas</h1>
          <p className="text-muted-foreground">
            Ahorros, corriente y efectivo — de aquí entran tus pagos y salen tus retiros.
            Liquidez total: {formatCOP(totalLiquidity)}
          </p>
        </div>
        <div className="flex gap-2">
          {accounts.length >= 2 && <TransferDialog accounts={accounts.map((a) => ({ id: a.id, name: a.name, balance: toNumber(a.balance) }))} />}
          <AccountForm />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {accounts.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{a.name}</CardTitle>
                <Badge variant="secondary">{TYPE_LABEL[a.type]}</Badge>
              </div>
              <CardDescription>{a.bank}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-semibold">{formatCOP(toNumber(a.balance))}</p>
              <DeleteAccountButton id={a.id} />
            </CardContent>
          </Card>
        ))}
        {accounts.length === 0 && (
          <p className="text-muted-foreground">
            Aún no tienes cuentas registradas. Agrega tu cuenta de ahorros o corriente donde te
            depositan tus ingresos.
          </p>
        )}
      </div>
    </div>
  );
}
