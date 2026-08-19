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
import { createInvestment } from "@/lib/actions/assets";
import { Plus } from "lucide-react";

export function InvestmentForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("FUND");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createInvestment({
        name: String(form.get("name")),
        type: type as "STOCK" | "ETF" | "CRYPTO" | "FUND" | "REAL_ESTATE" | "OTHER",
        quantity: Number(form.get("quantity")),
        avgCost: Number(form.get("avgCost")),
        currentPrice: Number(form.get("currentPrice")),
      });
      toast.success("Inversión agregada");
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
          Nueva inversión
        </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva inversión</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required placeholder="Fondo indexado S&P 500" />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select
              items={{
                STOCK: "Acción",
                ETF: "ETF",
                CRYPTO: "Cripto",
                FUND: "Fondo",
                REAL_ESTATE: "Inmobiliario",
                OTHER: "Otro",
              }}
              value={type}
              onValueChange={(v) => setType(v ?? "FUND")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STOCK">Acción</SelectItem>
                <SelectItem value="ETF">ETF</SelectItem>
                <SelectItem value="CRYPTO">Cripto</SelectItem>
                <SelectItem value="FUND">Fondo</SelectItem>
                <SelectItem value="REAL_ESTATE">Inmobiliario</SelectItem>
                <SelectItem value="OTHER">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="quantity">Cantidad</Label>
            <Input id="quantity" name="quantity" type="number" step="0.000001" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="avgCost">Costo promedio (COP)</Label>
            <Input id="avgCost" name="avgCost" type="number" step="0.01" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="currentPrice">Precio actual (COP)</Label>
            <Input id="currentPrice" name="currentPrice" type="number" step="0.01" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
