export const CURRENCIES = ["COP", "USD", "EUR", "MXN"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const CURRENCY_LABEL: Record<CurrencyCode, string> = {
  COP: "COP — Peso colombiano",
  USD: "USD — Dólar estadounidense",
  EUR: "EUR — Euro",
  MXN: "MXN — Peso mexicano",
};

/** Convierte un monto en su moneda original a COP usando la tasa guardada. */
export function toCOP(amount: number, currency: string, rateToCOP?: number | null): number {
  if (currency === "COP") return amount;
  return amount * (rateToCOP ?? 1);
}

/** Inversa de toCOP: convierte un monto en COP a otra moneda usando su tasa. */
export function fromCOP(amountCOP: number, currency: string, rateToCOP?: number | null): number {
  if (currency === "COP") return amountCOP;
  return amountCOP / (rateToCOP ?? 1);
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  COP: "$",
  USD: "US$",
  EUR: "€",
  MXN: "MX$",
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOL[currency] ?? currency;
}
