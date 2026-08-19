"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createGoal } from "@/lib/actions/goals";
import { Plus } from "lucide-react";

const TYPE_ITEMS = {
  EMERGENCY_FUND: "Fondo de emergencia",
  DEBT_FREE: "Libre de deudas",
  NET_WORTH: "Patrimonio neto",
  CUSTOM: "Personalizada",
};

export function GoalForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("EMERGENCY_FUND");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const dateStr = String(form.get("targetDate") || "");
    try {
      await createGoal({
        name: String(form.get("name")),
        type: type as "EMERGENCY_FUND" | "DEBT_FREE" | "NET_WORTH" | "CUSTOM",
        targetAmount: Number(form.get("targetAmount")),
        currentAmount: Number(form.get("currentAmount") || 0),
        targetDate: dateStr ? new Date(dateStr) : undefined,
        targetMonths: form.get("targetMonths") ? Number(form.get("targetMonths")) : undefined,
      });
      toast.success("Meta creada");
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
          Nueva meta
        </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required placeholder="Fondo de emergencia" />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select items={TYPE_ITEMS} value={type} onValueChange={(v) => setType(v ?? "EMERGENCY_FUND")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMERGENCY_FUND">Fondo de emergencia</SelectItem>
                <SelectItem value="DEBT_FREE">Libre de deudas</SelectItem>
                <SelectItem value="NET_WORTH">Patrimonio neto</SelectItem>
                <SelectItem value="CUSTOM">Personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="targetAmount">Monto objetivo (COP)</Label>
            <Input id="targetAmount" name="targetAmount" type="number" step="0.01" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="currentAmount">Monto actual (COP)</Label>
            <Input id="currentAmount" name="currentAmount" type="number" step="0.01" defaultValue={0} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="targetDate">Fecha objetivo (opcional)</Label>
            <Input id="targetDate" name="targetDate" type="date" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="targetMonths">Plazo en meses para la cuota fija (opcional)</Label>
            <Input id="targetMonths" name="targetMonths" type="number" min={1} placeholder="Ej: 12" />
            <p className="text-xs text-muted-foreground">
              Con esto calculamos cuánto ahorrar cada mes para llegar a tiempo.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
