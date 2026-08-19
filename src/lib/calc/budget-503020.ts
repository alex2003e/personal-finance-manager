export type BudgetBucketName = "needs" | "wants" | "savings";

const NEEDS_CATEGORIES = new Set([
  "vivienda",
  "servicios",
  "transporte",
  "seguros y suscripciones",
]);

/** Clasifica una categoría de gasto en necesidad o deseo (mapa fijo, ver research.md). */
export function classifyCategory(category: string): "needs" | "wants" {
  return NEEDS_CATEGORIES.has(category.trim().toLowerCase()) ? "needs" : "wants";
}

export interface BudgetBucket {
  bucket: BudgetBucketName;
  suggestedAmount: number;
  actualAmount: number;
  overBudget: boolean;
  items: { name: string; category: string; amount: number }[];
}

/**
 * Regla 50/30/20: 50% necesidades, 30% deseos, 20% ahorro, sobre el ingreso
 * mensual total. Compara contra los gastos recurrentes reales (clasificados
 * por categoría) y el ahorro real (abonos a metas + transacciones de ahorro).
 */
export function compute503020(
  totalMonthlyIncome: number,
  expenseItems: { name: string; category: string; monthlyAmount: number }[],
  monthlySavingsAmount: number
): BudgetBucket[] {
  const needsItems = expenseItems.filter((i) => classifyCategory(i.category) === "needs");
  const wantsItems = expenseItems.filter((i) => classifyCategory(i.category) === "wants");

  const needsActual = needsItems.reduce((s, i) => s + i.monthlyAmount, 0);
  const wantsActual = wantsItems.reduce((s, i) => s + i.monthlyAmount, 0);

  const needsSuggested = totalMonthlyIncome * 0.5;
  const wantsSuggested = totalMonthlyIncome * 0.3;
  const savingsSuggested = totalMonthlyIncome * 0.2;

  return [
    {
      bucket: "needs",
      suggestedAmount: Math.round(needsSuggested),
      actualAmount: Math.round(needsActual),
      overBudget: needsActual > needsSuggested,
      items: needsItems.map((i) => ({ name: i.name, category: i.category, amount: i.monthlyAmount })),
    },
    {
      bucket: "wants",
      suggestedAmount: Math.round(wantsSuggested),
      actualAmount: Math.round(wantsActual),
      overBudget: wantsActual > wantsSuggested,
      items: wantsItems.map((i) => ({ name: i.name, category: i.category, amount: i.monthlyAmount })),
    },
    {
      bucket: "savings",
      suggestedAmount: Math.round(savingsSuggested),
      actualAmount: Math.round(monthlySavingsAmount),
      overBudget: false,
      items: [],
    },
  ];
}
