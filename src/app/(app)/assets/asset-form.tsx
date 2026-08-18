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
import { createAsset } from "@/lib/actions/assets";
import { Plus } from "lucide-react";

export function AssetForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("VEHICLE");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createAsset({
        name: String(form.get("name")),
        type: type as "VEHICLE" | "PROPERTY" | "INVESTMENT" | "OTHER",
        estimatedValue: Number(form.get("estimatedValue")),
        notes: String(form.get("notes") || ""),
      });
      toast.success("Activo agregado");
      setOpen(false);
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Nuevo activo
        </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo activo</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required placeholder="Moto de trabajo" />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v ?? "VEHICLE")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VEHICLE">Vehículo</SelectItem>
                <SelectItem value="PROPERTY">Propiedad</SelectItem>
                <SelectItem value="INVESTMENT">Inversión</SelectItem>
                <SelectItem value="OTHER">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="estimatedValue">Valor estimado (COP)</Label>
            <Input id="estimatedValue" name="estimatedValue" type="number" step="0.01" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" name="notes" placeholder="Opcional" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
