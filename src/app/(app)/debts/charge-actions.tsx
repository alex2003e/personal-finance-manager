"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { payCardInstallment, deleteCardCharge } from "@/lib/actions/card-charges";
import { Trash2 } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("¿Eliminar esta compra?")) return;
    setLoading(true);
    try {
      await deleteCardCharge(id);
      toast.success("Eliminada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="ghost" onClick={onDelete} disabled={loading}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
