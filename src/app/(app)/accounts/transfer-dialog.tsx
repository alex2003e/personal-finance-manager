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
import { transferBetweenAccounts } from "@/lib/actions/accounts";
import { ArrowRightLeft } from "lucide-react";

export function TransferDialog({
  accounts,
}: {
  accounts: { id: string; name: string; balance: number }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState<string | undefined>(accounts[0]?.id);
  const [to, setTo] = useState<string | undefined>(accounts[1]?.id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!from || !to) return;
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await transferBetweenAccounts({
        fromAccountId: from,
        toAccountId: to,
        amount: Number(form.get("amount")),
        date: new Date(String(form.get("date"))),
        notes: String(form.get("notes") || ""),
      });
      toast.success("Transferencia registrada");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo transferir");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">
          <ArrowRightLeft className="mr-1 h-4 w-4" />
          Transferir
        </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir entre cuentas</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Desde</Label>
            <Select items={Object.fromEntries(accounts.map((a) => [a.id, a.name]))} value={from} onValueChange={(v) => setFrom(v ?? undefined)}>
              <SelectTrigger className="w-full">
                <SelectValue />
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
          <div className="space-y-1">
            <Label>Hacia</Label>
            <Select items={Object.fromEntries(accounts.map((a) => [a.id, a.name]))} value={to} onValueChange={(v) => setTo(v ?? undefined)}>
              <SelectTrigger className="w-full">
                <SelectValue />
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
          <div className="space-y-1">
            <Label htmlFor="amount">Monto (COP)</Label>
            <CurrencyInput id="amount" name="amount" required />
          </div>
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
            {loading ? "Guardando..." : "Transferir"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
