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
import { CurrencyFields } from "@/components/currency-fields";
import { currencySymbol } from "@/lib/currency";
import { updateDebt } from "@/lib/actions/debts";
import { Pencil } from "lucide-react";

export function EditDebtDialog({
  debt,
}: {
  debt: {
    id: string;
    name: string;
    creditor: string;
    balance: number;
    interestRateEA: number;
    minPayment: number;
    creditLimit: number | null;
    currency: string;
    exchangeRateToCOP: number | null;
    type: "CARD" | "LOAN";
  };
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState(debt.currency);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await updateDebt(debt.id, {
        name: String(form.get("name")),
        creditor: String(form.get("creditor")),
        balance: Number(form.get("balance")),
        interestRateEA: Number(form.get("interestRateEA")),
        minPayment: Number(form.get("minPayment")),
        creditLimit:
          debt.type === "CARD" && form.get("creditLimit")
            ? Number(form.get("creditLimit"))
            : undefined,
        currency,
        exchangeRateToCOP:
          currency !== "COP" ? Number(form.get("exchangeRateToCOP")) : undefined,
        type: debt.type,
      });
      toast.success("Deuda actualizada");
      setOpen(false);
    } catch {
      toast.error("No se pudo actualizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost">
          <Pencil className="h-4 w-4" />
        </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {debt.name}</DialogTitle>
        </DialogHeader>
        <form
          key={`${debt.id}-${debt.balance}-${debt.minPayment}-${debt.creditLimit}-${debt.interestRateEA}-${debt.exchangeRateToCOP}`}
          onSubmit={onSubmit}
          className="space-y-3"
        >
          <div className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required defaultValue={debt.name} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="creditor">Acreedor</Label>
            <Input id="creditor" name="creditor" required defaultValue={debt.creditor} />
          </div>
          <CurrencyFields
            currency={currency}
            onCurrencyChange={setCurrency}
            defaultRate={debt.exchangeRateToCOP ?? undefined}
          />
          <div className="space-y-1">
            <Label htmlFor="balance">Saldo actual ({currency})</Label>
            <CurrencyInput
              id="balance"
              name="balance"
              currency={currencySymbol(currency)}
              required
              defaultValue={debt.balance}
            />
          </div>
          {debt.type === "CARD" && (
            <div className="space-y-1">
              <Label htmlFor="creditLimit">Cupo total de la tarjeta ({currency})</Label>
              <CurrencyInput
                id="creditLimit"
                name="creditLimit"
                currency={currencySymbol(currency)}
                defaultValue={debt.creditLimit ?? undefined}
              />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="interestRateEA">Tasa EA (%)</Label>
            <Input
              id="interestRateEA"
              name="interestRateEA"
              type="number"
              step="0.0001"
              required
              defaultValue={debt.interestRateEA}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="minPayment">Cuota mínima ({currency})</Label>
            <CurrencyInput
              id="minPayment"
              name="minPayment"
              currency={currencySymbol(currency)}
              required
              defaultValue={debt.minPayment}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
