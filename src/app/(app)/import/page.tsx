import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Landmark } from "lucide-react";
import { ImportBankClient } from "./import-bank-client";

export default async function ImportPage() {
  const userId = await requireUserId();
  const accounts = await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importar movimientos</h1>
        <p className="text-muted-foreground">
          Sube el extracto de tu banco en CSV y registra los movimientos sin escribirlos uno por
          uno.
        </p>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Primero crea una cuenta"
          description="Necesitas al menos una cuenta bancaria registrada para poder importar movimientos a ella."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Subir extracto (CSV)</CardTitle>
            <CardDescription>
              Exporta el extracto de tu banco como CSV y súbelo aquí. Buscamos columnas como
              &quot;Fecha&quot;, &quot;Descripción&quot; y &quot;Valor&quot; (o &quot;Débito&quot;/&quot;Crédito&quot;)
              automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportBankClient
              accounts={accounts.map((a) => ({ id: a.id, name: a.name, bank: a.bank }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
