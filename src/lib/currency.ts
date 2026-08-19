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
