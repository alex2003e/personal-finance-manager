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
import { CurrencyFields } from "@/components/currency-fields";
import { currencySymbol } from "@/lib/currency";
import { createDebt } from "@/lib/actions/debts";
import { Plus } from "lucide-react";

const TYPE_ITEMS = { CARD: "Tarjeta de crédito", LOAN: "Préstamo" };

export function DebtForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("CARD");
  const [currency, setCurrency] = useState("COP");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createDebt({
        name: String(form.get("name")),
        creditor: String(form.get("creditor")),
        balance: Number(form.get("balance")),
        interestRateEA: Number(form.get("interestRateEA")),
        minPayment: Number(form.get("minPayment")),
        creditLimit:
          type === "CARD" && form.get("creditLimit")
            ? Number(form.get("creditLimit"))
            : undefined,
        currency,
        exchangeRateToCOP:
          currency !== "COP" ? Number(form.get("exchangeRateToCOP")) : undefined,
        type: type as "CARD" | "LOAN",
      });
      toast.success("Deuda agregada");
      setOpen(false);
    } catch {
      toast.error("No se pudo guardar la deuda");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>
          <Plus className="mr-1 h-4 w-4" />
          Nueva deuda
        </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva deuda</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select items={TYPE_ITEMS} value={type} onValueChange={(v) => setType(v ?? "CARD")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CARD">Tarjeta de crédito</SelectItem>
                <SelectItem value="LOAN">Préstamo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required placeholder="Tarjeta Nu" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="creditor">Acreedor</Label>
            <Input id="creditor" name="creditor" required placeholder="Nu Colombia" />
          </div>
          <CurrencyFields currency={currency} onCurrencyChange={setCurrency} />
          <div className="space-y-1">
            <Label htmlFor="balance">Saldo actual ({currency})</Label>
            <CurrencyInput id="balance" name="balance" currency={currencySymbol(currency)} required />
          </div>
          {type === "CARD" && (
            <div className="space-y-1">
              <Label htmlFor="creditLimit">Cupo total de la tarjeta ({currency})</Label>
              <CurrencyInput id="creditLimit" name="creditLimit" currency={currencySymbol(currency)} />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="interestRateEA">Tasa EA (%)</Label>
            <Input id="interestRateEA" name="interestRateEA" type="number" step="0.0001" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="minPayment">Cuota mínima ({currency})</Label>
            <CurrencyInput id="minPayment" name="minPayment" currency={currencySymbol(currency)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
