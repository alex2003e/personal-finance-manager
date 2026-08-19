"use client";

import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, CURRENCY_LABEL } from "@/lib/currency";

const CURRENCY_ITEMS = Object.fromEntries(
  CURRENCIES.map((c) => [c, CURRENCY_LABEL[c]])
);

/**
 * Selector de moneda + tasa de cambio a COP (solo se muestra si la moneda
 * elegida no es COP). Pensado para usarse dentro de un <form> nativo: expone
 * los campos `currency` y `exchangeRateToCOP` vía name para FormData.
 */
export function CurrencyFields({
  currency,
  onCurrencyChange,
  defaultRate,
}: {
  currency: string;
  onCurrencyChange: (currency: string) => void;
  defaultRate?: number;
}) {
  return (
    <>
      <div className="space-y-1">
        <Label>Moneda</Label>
        <Select
          items={CURRENCY_ITEMS}
          value={currency}
          onValueChange={(v) => onCurrencyChange(v ?? "COP")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CURRENCY_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {currency !== "COP" && (
        <div className="space-y-1">
          <Label htmlFor="exchangeRateToCOP">
            Tasa de cambio (1 {currency} = ? COP)
          </Label>
          <CurrencyInput
            id="exchangeRateToCOP"
            name="exchangeRateToCOP"
            required
            defaultValue={defaultRate}
            placeholder="Ej: 4.100"
          />
        </div>
      )}
    </>
  );
}
