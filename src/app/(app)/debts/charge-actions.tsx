"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { payCardInstallment, deleteCardCharge } from "@/lib/actions/card-charges";

export function PayInstallmentButton({ chargeId }: { chargeId: string }) {
  const [loading, setLoading] = useState(false);

  async function onPay() {
    setLoading(true);
    try {
      await payCardInstallment({ chargeId });
      toast.success("Cuota pagada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar el pago");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={onPay} disabled={loading}>
      Pagar cuota
    </Button>
  );
}

export function DeleteChargeButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      title="Eliminar compra"
      description="Esta acción no se puede deshacer."
      onConfirm={() => deleteCardCharge(id)}
    />
  );
}
