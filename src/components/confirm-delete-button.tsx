"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Botón de eliminar con confirmación propia de la app (en vez del
 * `confirm()` nativo del navegador, que se ve como un error del sistema).
 */
export function ConfirmDeleteButton({
  title,
  description,
  onConfirm,
  successMessage = "Eliminado",
  errorMessage = "No se pudo eliminar",
  size = "sm",
  iconOnly = true,
  label = "Eliminar",
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
  size?: "sm" | "default";
  iconOnly?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      toast.success(successMessage);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button size={size} variant="ghost" className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            {!iconOnly && label}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
