"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteContribution } from "@/lib/actions/goals";

export function DeleteContributionButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      title="Eliminar abono"
      description="Esto restará el monto del progreso de la meta."
      onConfirm={() => deleteContribution(id)}
    />
  );
}
