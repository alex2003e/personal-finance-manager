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
import { createCardCharge } from "@/lib/actions/card-charges";
import { computeMonthlyPayment } from "@/lib/calc/installments";
import { formatCOP } from "@/lib/format";
import { Plus } from "lucide-react";

export function NewChargeDialog({
  debtId,
  defaultRateEA,
}: {
  debtId: string;
  defaultRateEA: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [installments, setInstallments] = useState(1);
  const [rate, setRate] = useState(defaultRateEA);

  const preview = amount > 0 && installments > 0 ? computeMonthlyPayment(amount, rate, installments) : 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createCardCharge({
        debtId,
        description: String(form.get("description")),
        category: String(form.get("category")),
        purchaseDate: new Date(String(form.get("purchaseDate"))),
        amount,
        installments,
        interestRateEA: rate,
      });
      toast.success("Compra registrada");
      setOpen(false);
      setAmount(0);
      setInstallments(1);
    } catch {
      toast.error("No se pudo registrar la compra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          Nueva compra
        </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva compra con tarjeta</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" name="description" required placeholder="Tenis nuevos" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Categoría</Label>
            <Input id="category" name="category" required placeholder="Ropa" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="purchaseDate">Fecha</Label>
            <Input
              id="purchaseDate"
              name="purchaseDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="amount">Monto (COP)</Label>
            <CurrencyInput id="amount" name="amount" required onValueChange={setAmount} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="installments">Número de cuotas</Label>
            <Input
              id="installments"
              name="installments"
              type="number"
              min={1}
              required
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="interestRateEA">Tasa EA de esta compra (%)</Label>
            <Input
              id="interestRateEA"
              name="interestRateEA"
              type="number"
              step="0.0001"
              required
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Usa 0 si es una promoción &quot;sin interés&quot;.
            </p>
          </div>
          {preview > 0 && (
            <p className="rounded-md border p-2 text-sm">
              Cuota mensual estimada: <span className="font-semibold">{formatCOP(preview)}</span>
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Registrar compra"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
