"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteDebt } from "@/lib/actions/debts";
import { Trash2 } from "lucide-react";

export function DeleteDebtButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("¿Eliminar esta deuda? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      await deleteDebt(id);
      toast.success("Deuda eliminada");
    } catch {
      toast.error("No se pudo eliminar");
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
