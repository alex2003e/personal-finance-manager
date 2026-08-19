"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteTransaction } from "@/lib/actions/transactions";

export function DeleteTransactionButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      title="Eliminar movimiento"
      description="Esta acción no se puede deshacer."
      onConfirm={() => deleteTransaction(id)}
    />
  );
}
