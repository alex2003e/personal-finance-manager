"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteAsset, deleteInvestment } from "@/lib/actions/assets";

export function DeleteAssetButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      title="Eliminar activo"
      description="Esta acción no se puede deshacer."
      onConfirm={() => deleteAsset(id)}
    />
  );
}

export function DeleteInvestmentButton({ id }: { id: string }) {
  return (
    <ConfirmDeleteButton
      title="Eliminar inversión"
      description="Esta acción no se puede deshacer."
      onConfirm={() => deleteInvestment(id)}
    />
  );
}
