export function formatCOP(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPercent(value: number | string, digits = 2): string {
  const n = typeof value === "string" ? Number(value) : value;
  return `${n.toFixed(digits)}%`;
}

export function toNumber(value: unknown): number {
  return typeof value === "object" && value !== null && "toNumber" in value
    ? (value as { toNumber: () => number }).toNumber()
    : Number(value);
}
