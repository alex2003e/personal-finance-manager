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
import { CurrencyFields } from "@/components/currency-fields";
import { createAccount } from "@/lib/actions/accounts";
import { Plus } from "lucide-react";

const TYPE_ITEMS = { SAVINGS: "Ahorros", CHECKING: "Corriente", CASH: "Efectivo" };

export function AccountForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("SAVINGS");
  const [currency, setCurrency] = useState("COP");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createAccount({
        name: String(form.get("name")),
        bank: String(form.get("bank") || ""),
        type: type as "SAVINGS" | "CHECKING" | "CASH",
        balance: Number(form.get("balance") || 0),
        currency,
        exchangeRateToCOP:
          currency !== "COP" ? Number(form.get("exchangeRateToCOP")) : undefined,
      });
      toast.success("Cuenta agregada");
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
          Nueva cuenta
        </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required placeholder="Cuenta de ahorros" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bank">Banco</Label>
            <Input id="bank" name="bank" placeholder="Bancolombia" />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select items={TYPE_ITEMS} value={type} onValueChange={(v) => setType(v ?? "SAVINGS")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SAVINGS">Ahorros</SelectItem>
                <SelectItem value="CHECKING">Corriente</SelectItem>
                <SelectItem value="CASH">Efectivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CurrencyFields currency={currency} onCurrencyChange={setCurrency} />
          <div className="space-y-1">
            <Label htmlFor="balance">Saldo actual ({currency})</Label>
            <Input id="balance" name="balance" type="number" step="0.01" defaultValue={0} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
