"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleRecurringItem, deleteRecurringItem } from "@/lib/actions/recurring";
import { Trash2, Pause, Play } from "lucide-react";

export function RecurringRowActions({ id, active }: { id: string; active: boolean }) {
  const [loading, setLoading] = useState(false);

  async function onToggle() {
    setLoading(true);
    try {
      await toggleRecurringItem(id, !active);
    } catch {
      toast.error("No se pudo actualizar");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!confirm("¿Eliminar este registro?")) return;
    setLoading(true);
    try {
      await deleteRecurringItem(id);
      toast.success("Eliminado");
    } catch {
      toast.error("No se pudo eliminar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="ghost" onClick={onToggle} disabled={loading}>
        {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button size="sm" variant="ghost" onClick={onDelete} disabled={loading}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
