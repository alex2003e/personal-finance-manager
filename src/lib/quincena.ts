export function quincenaFromDate(date: Date): "Q1" | "Q2" {
  return date.getDate() <= 15 ? "Q1" : "Q2";
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(date);
}
