"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRecurringItem } from "@/lib/actions/recurring";
import { Plus } from "lucide-react";

export function RecurringForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("EXPENSE");
  const [frequency, setFrequency] = useState("MONTHLY");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createRecurringItem({
        name: String(form.get("name")),
        category: String(form.get("category")),
        amount: Number(form.get("amount")),
        type: type as "INCOME" | "EXPENSE",
        frequency: frequency as "MONTHLY" | "BIWEEKLY" | "WEEKLY" | "YEARLY",
        active: true,
      });
      toast.success("Guardado");
      setOpen(false);
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>
          <Plus className="mr-1 h-4 w-4" />
          Nuevo recurrente
        </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo ingreso/gasto recurrente</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required placeholder="Vivienda" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Categoría</Label>
            <Input id="category" name="category" required placeholder="Vivienda" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="amount">Monto (COP)</Label>
            <CurrencyInput id="amount" name="amount" required />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select items={{ INCOME: "Ingreso", EXPENSE: "Gasto" }} value={type} onValueChange={(v) => setType(v ?? "EXPENSE")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Ingreso</SelectItem>
                <SelectItem value="EXPENSE">Gasto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Frecuencia</Label>
            <Select items={{ MONTHLY: "Mensual", BIWEEKLY: "Quincenal", WEEKLY: "Semanal", YEARLY: "Anual" }} value={frequency} onValueChange={(v) => setFrequency(v ?? "MONTHLY")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Mensual</SelectItem>
                <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                <SelectItem value="WEEKLY">Semanal</SelectItem>
                <SelectItem value="YEARLY">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
