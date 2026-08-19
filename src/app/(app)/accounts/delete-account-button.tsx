"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteAccount } from "@/lib/actions/accounts";

export function DeleteAccountButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      title="Eliminar cuenta"
      description="Esta acción no se puede deshacer."
      onConfirm={() => deleteAccount(id)}
      iconOnly={false}
    />
  );
}
