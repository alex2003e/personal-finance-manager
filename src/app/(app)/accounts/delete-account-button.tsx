"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/lib/actions/accounts";
import { Trash2 } from "lucide-react";

export function DeleteAccountButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    setLoading(true);
    try {
      await deleteAccount(id);
      toast.success("Eliminada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="ghost" onClick={onDelete} disabled={loading}>
      <Trash2 className="mr-1 h-4 w-4" />
      Eliminar
    </Button>
  );
}
