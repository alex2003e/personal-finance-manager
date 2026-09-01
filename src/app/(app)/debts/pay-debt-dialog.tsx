"use client";

import { useState } from "react";
import { toast } from "sonner";
import { parseLocalDateInput } from "@/lib/date-input";
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
import { payDebt } from "@/lib/actions/debts";
import { formatCOP } from "@/lib/format";

export function PayDebtDialog({
  debtId,
  debtName,
  balance,
  accounts = [],
}: {
  debtId: string;
  debtName: string;
  balance: number;
  accounts?: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | undefined>(accounts[0]?.id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await payDebt({
        debtId,
        amount: Number(form.get("amount")),
        date: parseLocalDateInput(String(form.get("date"))),
        notes: String(form.get("notes") || ""),
        accountId,
      });
      toast.success("Pago registrado");
      setOpen(false);
    } catch {
      toast.error("No se pudo registrar el pago");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline">
          Registrar pago
        </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar {debtName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Saldo actual: {formatCOP(balance)}
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="amount">Monto (COP)</Label>
            <CurrencyInput id="amount" name="amount" defaultValue={balance} required />
          </div>
          {accounts.length > 0 && (
            <div className="space-y-1">
              <Label>Pagar desde</Label>
              <Select
                items={Object.fromEntries(accounts.map((a) => [a.id, a.name]))}
                value={accountId}
                onValueChange={(v) => setAccountId(v ?? undefined)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" name="notes" placeholder="Opcional" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Registrar pago"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
