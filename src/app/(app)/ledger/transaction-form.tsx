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
import { createTransaction } from "@/lib/actions/transactions";
import { Plus } from "lucide-react";

const EXPENSE_CATEGORIES = [
  "Vivienda",
  "Servicios",
  "Transporte",
  "Seguros y suscripciones",
  "Comida",
  "Ropa",
  "Imprevistos",
  "Otros",
];

const INCOME_CATEGORIES = [
  "Salario",
  "Ingreso variable",
  "Arriendo recibido",
  "Otros ingresos",
];

const SAVINGS_CATEGORIES = ["Ahorro", "Fondo de emergencia", "Meta"];

const FIXED_CATEGORY_BY_TYPE: Record<string, string> = {
  DEBT_PAYMENT: "Pago tarjeta",
  TRANSFER: "Transferencia",
};

export function TransactionForm({
  debts,
  accounts = [],
  defaultDate,
}: {
  debts: { id: string; name: string; balance: number }[];
  accounts?: { id: string; name: string }[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("EXPENSE");
  const [debtId, setDebtId] = useState<string | undefined>(undefined);
  const [accountId, setAccountId] = useState<string | undefined>(accounts[0]?.id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createTransaction({
        date: new Date(String(form.get("date"))),
        amount: Number(form.get("amount")),
        type: type as "INCOME" | "EXPENSE" | "DEBT_PAYMENT" | "TRANSFER" | "SAVINGS",
        category: String(form.get("category")),
        notes: String(form.get("notes") || ""),
        debtId: type === "DEBT_PAYMENT" ? debtId : undefined,
        accountId,
      });
      toast.success("Movimiento registrado");
      setOpen(false);
    } catch {
      toast.error("No se pudo registrar el movimiento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>
          <Plus className="mr-1 h-4 w-4" />
          Nuevo movimiento
        </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date(defaultDate).toISOString().slice(0, 10)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select items={{ INCOME: "Ingreso", EXPENSE: "Gasto", DEBT_PAYMENT: "Pago de deuda", SAVINGS: "Ahorro", TRANSFER: "Transferencia" }} value={type} onValueChange={(v) => setType(v ?? "EXPENSE")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Ingreso</SelectItem>
                <SelectItem value="EXPENSE">Gasto</SelectItem>
                <SelectItem value="DEBT_PAYMENT">Pago de deuda</SelectItem>
                <SelectItem value="SAVINGS">Ahorro</SelectItem>
                <SelectItem value="TRANSFER">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "DEBT_PAYMENT" && (
            <div className="space-y-1">
              <Label>Deuda</Label>
              <Select items={Object.fromEntries(debts.map((d) => [d.id, d.name]))} value={debtId} onValueChange={(v) => setDebtId(v ?? undefined)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una deuda" />
                </SelectTrigger>
                <SelectContent>
                  {debts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {accounts.length > 0 && (
            <div className="space-y-1">
              <Label>Cuenta</Label>
              <Select items={Object.fromEntries(accounts.map((a) => [a.id, a.name]))} value={accountId} onValueChange={(v) => setAccountId(v ?? undefined)}>
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
          {FIXED_CATEGORY_BY_TYPE[type] ? (
            <input type="hidden" name="category" value={FIXED_CATEGORY_BY_TYPE[type]} />
          ) : (
            <div className="space-y-1">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                name="category"
                list="categories"
                required
                key={type}
                placeholder={type === "INCOME" ? "Ej: Salario" : "Ej: Comida"}
              />
              <datalist id="categories">
                {(type === "INCOME"
                  ? INCOME_CATEGORIES
                  : type === "SAVINGS"
                  ? SAVINGS_CATEGORIES
                  : EXPENSE_CATEGORIES
                ).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="amount">Monto (COP)</Label>
            <CurrencyInput id="amount" name="amount" required />
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
