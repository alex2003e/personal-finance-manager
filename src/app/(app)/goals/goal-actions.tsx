"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGoalProgress, deleteGoal } from "@/lib/actions/goals";
import { Trash2, Pencil } from "lucide-react";

export function GoalActions({ id, currentAmount }: { id: string; currentAmount: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentAmount);
  const [loading, setLoading] = useState(false);

  async function onSave() {
    setLoading(true);
    try {
      await updateGoalProgress(id, value);
      setEditing(false);
    } catch {
      toast.error("No se pudo actualizar");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!confirm("¿Eliminar esta meta?")) return;
    setLoading(true);
    try {
      await deleteGoal(id);
      toast.success("Eliminada");
    } catch {
      toast.error("No se pudo eliminar");
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          className="h-8 w-28"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
        <Button size="sm" onClick={onSave} disabled={loading}>
          OK
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDelete} disabled={loading}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
