"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { toggleRecurringItem, deleteRecurringItem } from "@/lib/actions/recurring";
import { Pause, Play } from "lucide-react";

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

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="ghost" onClick={onToggle} disabled={loading}>
        {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <ConfirmDeleteButton
        title="Eliminar registro"
        description="Esta acción no se puede deshacer."
        onConfirm={() => deleteRecurringItem(id)}
      />
    </div>
  );
}
