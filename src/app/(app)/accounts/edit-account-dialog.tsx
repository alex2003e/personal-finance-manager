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
import { updateAccount } from "@/lib/actions/accounts";
import { Pencil } from "lucide-react";

export function EditAccountDialog({
  account,
}: {
  account: {
    id: string;
    name: string;
    bank: string | null;
    type: "SAVINGS" | "CHECKING" | "CASH";
    balance: number;
    currency: string;
    exchangeRateToCOP: number | null;
    interestRateEA: number | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState(account.currency);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await updateAccount(account.id, {
        name: String(form.get("name")),
        bank: String(form.get("bank") || ""),
        type: account.type,
        balance: Number(form.get("balance") || 0),
        currency,
        exchangeRateToCOP:
          currency !== "COP" ? Number(form.get("exchangeRateToCOP")) : undefined,
        interestRateEA:
          account.type !== "CASH" && form.get("interestRateEA")
            ? Number(form.get("interestRateEA"))
            : undefined,
      });
      toast.success("Cuenta actualizada");
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
          <DialogTitle>Editar {account.name}</DialogTitle>
        </DialogHeader>
        <form
          key={`${account.id}-${account.balance}-${account.interestRateEA}-${account.exchangeRateToCOP}`}
          onSubmit={onSubmit}
          className="space-y-3"
        >
          <div className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required defaultValue={account.name} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bank">Banco</Label>
            <Input id="bank" name="bank" defaultValue={account.bank ?? ""} />
          </div>
          <CurrencyFields
            currency={currency}
            onCurrencyChange={setCurrency}
            defaultRate={account.exchangeRateToCOP ?? undefined}
          />
          <div className="space-y-1">
            <Label htmlFor="balance">Saldo actual ({currency})</Label>
            <CurrencyInput
              id="balance"
              name="balance"
              currency={currencySymbol(currency)}
              defaultValue={account.balance}
            />
          </div>
          {account.type !== "CASH" && (
            <div className="space-y-1">
              <Label htmlFor="interestRateEA">Tasa EA que paga la cuenta (%, opcional)</Label>
              <Input
                id="interestRateEA"
                name="interestRateEA"
                type="number"
                step="0.0001"
                defaultValue={account.interestRateEA ?? undefined}
                placeholder="Ej: 4.5"
              />
              <p className="text-xs text-muted-foreground">
                Déjalo vacío si no genera rendimientos. Se usa para proyectar tus ahorros.
              </p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
