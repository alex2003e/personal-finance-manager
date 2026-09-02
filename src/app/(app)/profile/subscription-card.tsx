"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createCheckoutSession, createPortalSession } from "@/lib/actions/subscription";

type Status = "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | null;

const STATUS_LABEL: Record<NonNullable<Status>, string> = {
  ACTIVE: "Activa",
  TRIALING: "En prueba",
  PAST_DUE: "Pago pendiente",
  CANCELED: "Cancelada",
  INCOMPLETE: "Incompleta",
};

const PLAN_LABEL: Record<string, string> = {
  monthly: "Plan mensual",
  yearly: "Plan anual",
};

export function SubscriptionCard({
  status,
  plan,
  currentPeriodEnd,
}: {
  status: Status;
  plan: string | null;
  currentPeriodEnd: string | null;
}) {
  const [loading, setLoading] = useState<"monthly" | "yearly" | "portal" | null>(null);

  const isActive = status === "ACTIVE" || status === "TRIALING";

  async function goToCheckout(interval: "monthly" | "yearly") {
    setLoading(interval);
    try {
      const url = await createCheckoutSession({ interval });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar el pago");
      setLoading(null);
    }
  }

  async function goToPortal() {
    setLoading("portal");
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo abrir la gestión de suscripción");
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Suscripción</CardTitle>
          {status && (
            <Badge variant={isActive ? "default" : "outline"}>{STATUS_LABEL[status]}</Badge>
          )}
        </div>
        <CardDescription>
          {isActive
            ? "Gestiona tu método de pago, ve tus facturas o cancela desde el portal seguro de Stripe."
            : "Desbloquea Estrategia, exportar reportes e importar movimientos bancarios sin límite."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isActive ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{plan ? PLAN_LABEL[plan] ?? plan : "Plan activo"}</span>
              {currentPeriodEnd && (
                <span className="text-muted-foreground">
                  · Renueva el{" "}
                  {new Date(currentPeriodEnd).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={goToPortal} disabled={loading === "portal"}>
              <CreditCard className="h-4 w-4" />
              {loading === "portal" ? "Abriendo..." : "Gestionar suscripción y tarjeta"}
            </Button>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => goToCheckout("monthly")} disabled={loading === "monthly"}>
              {loading === "monthly" ? "Redirigiendo..." : "Suscribirme mensual"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToCheckout("yearly")}
              disabled={loading === "yearly"}
            >
              {loading === "yearly" ? "Redirigiendo..." : "Suscribirme anual"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
