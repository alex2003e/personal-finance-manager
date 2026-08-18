"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteAsset, deleteInvestment } from "@/lib/actions/assets";
import { Trash2 } from "lucide-react";

export function DeleteAssetButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  async function onDelete() {
    if (!confirm("¿Eliminar este activo?")) return;
    setLoading(true);
    try {
      await deleteAsset(id);
      toast.success("Eliminado");
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

export function DeleteInvestmentButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  async function onDelete() {
    if (!confirm("¿Eliminar esta inversión?")) return;
    setLoading(true);
    try {
      await deleteInvestment(id);
      toast.success("Eliminado");
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
