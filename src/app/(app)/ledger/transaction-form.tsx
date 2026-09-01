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
import { createTransaction } from "@/lib/actions/transactions";
import { createCardCharge } from "@/lib/actions/card-charges";
import { parseLocalDateInput } from "@/lib/date-input";
import { computeMonthlyPayment } from "@/lib/calc/installments";
import { formatCOP } from "@/lib/format";
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

const TYPE_ITEMS = {
  INCOME: "Ingreso",
  EXPENSE: "Gasto",
  DEBT_PAYMENT: "Pago de deuda",
  CARD_CHARGE: "Compra con tarjeta",
  SAVINGS: "Ahorro",
  TRANSFER: "Transferencia",
};

export function TransactionForm({
  debts,
  cards = [],
  accounts = [],
  defaultDate,
}: {
  debts: { id: string; name: string; balance: number }[];
  cards?: { id: string; name: string; interestRateEA: number }[];
  accounts?: { id: string; name: string }[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("EXPENSE");
  const [debtId, setDebtId] = useState<string | undefined>(undefined);
  const [accountId, setAccountId] = useState<string | undefined>(accounts[0]?.id);
  const [currency, setCurrency] = useState("COP");

  // Estado propio del flujo "Compra con tarjeta" (reusa el mismo motor que
  // /debts para no duplicar la lógica de cuotas).
  const [cardId, setCardId] = useState<string | undefined>(cards[0]?.id);
  const [chargeAmount, setChargeAmount] = useState(0);
  const [installments, setInstallments] = useState(1);
  const [chargeRate, setChargeRate] = useState(cards[0]?.interestRateEA ?? 0);
  const chargePreview =
    chargeAmount > 0 && installments > 0
      ? computeMonthlyPayment(chargeAmount, chargeRate, installments)
      : 0;

  function onCardChange(id: string | null) {
    setCardId(id ?? undefined);
    const card = cards.find((c) => c.id === id);
    if (card) setChargeRate(card.interestRateEA);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      if (type === "CARD_CHARGE") {
        if (!cardId) throw new Error("Selecciona una tarjeta");
        await createCardCharge({
          debtId: cardId,
          description: String(form.get("description")),
          category: String(form.get("category")),
          purchaseDate: parseLocalDateInput(String(form.get("date"))),
          amount: chargeAmount,
          installments,
          interestRateEA: chargeRate,
        });
      } else {
        await createTransaction({
          date: parseLocalDateInput(String(form.get("date"))),
          amount: Number(form.get("amount")),
          currency,
          exchangeRateToCOP:
            currency !== "COP" ? Number(form.get("exchangeRateToCOP")) : undefined,
          type: type as "INCOME" | "EXPENSE" | "DEBT_PAYMENT" | "TRANSFER" | "SAVINGS",
          category: String(form.get("category")),
          notes: String(form.get("notes") || ""),
          debtId: type === "DEBT_PAYMENT" ? debtId : undefined,
          accountId,
        });
      }
      toast.success(type === "CARD_CHARGE" ? "Compra registrada" : "Movimiento registrado");
      setOpen(false);
      setChargeAmount(0);
      setInstallments(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el movimiento");
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
            <Select items={TYPE_ITEMS} value={type} onValueChange={(v) => setType(v ?? "EXPENSE")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value} disabled={value === "CARD_CHARGE" && cards.length === 0}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "CARD_CHARGE" ? (
            <div key="card-charge-fields" className="space-y-3">
              <div className="space-y-1">
                <Label>Tarjeta</Label>
                <Select
                  items={Object.fromEntries(cards.map((c) => [c.id, c.name]))}
                  value={cardId}
                  onValueChange={onCardChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una tarjeta" />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" name="description" required placeholder="Tenis nuevos" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Categoría</Label>
                <Input id="category" name="category" list="categories" required placeholder="Ropa" />
                <datalist id="categories">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1">
                <Label htmlFor="chargeAmount">Monto (COP)</Label>
                <CurrencyInput
                  id="chargeAmount"
                  name="chargeAmount"
                  required
                  onValueChange={setChargeAmount}
                />
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
                <Label htmlFor="chargeRate">Tasa EA de esta compra (%)</Label>
                <Input
                  id="chargeRate"
                  name="chargeRate"
                  type="number"
                  step="0.0001"
                  required
                  value={chargeRate}
                  onChange={(e) => setChargeRate(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Usa 0 si es una promoción &quot;sin interés&quot;.
                </p>
              </div>
              {chargePreview > 0 && (
                <p className="rounded-md border p-2 text-sm">
                  Cuota mensual estimada: <span className="font-semibold">{formatCOP(chargePreview)}</span>
                </p>
              )}
            </div>
          ) : (
            <div key="general-fields" className="space-y-3">
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
              <CurrencyFields currency={currency} onCurrencyChange={setCurrency} />
              <div className="space-y-1">
                <Label htmlFor="amount">Monto ({currency})</Label>
                <CurrencyInput id="amount" name="amount" currency={currencySymbol(currency)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" name="notes" placeholder="Opcional" />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
