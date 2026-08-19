"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteDebt } from "@/lib/actions/debts";

export function DeleteDebtButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      title="Eliminar deuda"
      description="Esta acción no se puede deshacer. Se perderá el historial asociado a esta deuda."
      onConfirm={() => deleteDebt(id)}
      successMessage="Deuda eliminada"
    />
  );
}
