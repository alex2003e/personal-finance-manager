"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteGoal } from "@/lib/actions/goals";

export function DeleteGoalButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      title="Eliminar meta"
      description="Esta acción no se puede deshacer. Se perderá también el historial de abonos."
      onConfirm={() => deleteGoal(id)}
    />
  );
}
