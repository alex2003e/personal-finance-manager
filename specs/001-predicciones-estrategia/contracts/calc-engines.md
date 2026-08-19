# Contratos: motores de cálculo (`src/lib/calc/*`)

Esta app no expone API pública externa; el "contrato" relevante son las firmas de las
funciones puras que consumen los Server Components de `/strategy`. Documentadas aquí para
que `/speckit-tasks` genere tareas verificables contra una firma concreta.

## `src/lib/calc/avalanche.ts` (extendido)

```ts
export type PayoffStrategy = "avalanche" | "snowball" | "optimal";

export interface ExtraPayment {
  debtId: string;
  month: number; // 1-based
  amount: number;
}

/** Determina el orden de pago de las deudas según la estrategia elegida. */
export function orderDebtsByStrategy(
  debts: DebtInput[],
  strategy: PayoffStrategy,
  monthlyBudget: number
): DebtInput[];

/** Generaliza la simulación existente: ahora acepta un orden explícito y pagos extra. */
export function simulatePayoff(
  orderedDebts: DebtInput[],
  monthlyBudget: number,
  options?: { maxMonths?: number; extraPayments?: ExtraPayment[] }
): AvalancheMonth[];

/** Compatibilidad: sigue existiendo, ahora es un wrapper de orderDebtsByStrategy + simulatePayoff. */
export function simulateAvalanche(
  debts: DebtInput[],
  monthlyBudget: number,
  maxMonths?: number
): AvalancheMonth[];

export interface StrategyComparison {
  strategy: PayoffStrategy;
  months: AvalancheMonth[];
  closedAtMonth: Record<string, number>;
  totalInterestPaid: number;
  totalMonths: number;
}

/** Corre las 3 estrategias y devuelve el comparativo, con la de menor interés marcable como recomendada. */
export function compareStrategies(
  debts: DebtInput[],
  monthlyBudget: number,
  options?: { extraPayments?: ExtraPayment[] }
): StrategyComparison[];
```

Precondición: `debts` ya viene con `balance`/`minPayment` convertidos a COP (llamador
responsable, vía `toCOP()`, igual que hoy en `/debts`).
Postcondición: `simulatePayoff` nunca produce un mes con `totalRemaining < 0`; si
`monthlyBudget <= 0` y hay deudas activas, retorna un array vacío (el llamador debe
mostrar el edge case "no hay excedente para pagar deuda", no interpretar `[]` como "ya
pagado").

## `src/lib/calc/cashflow.ts` (nuevo)

```ts
export interface CashFlowMonth {
  month: number;
  income: number;
  expense: number;
  net: number;
  isDeficit: boolean;
}

export interface DeficitAlert {
  startMonth: number;
  endMonth: number;
  monthsCount: number;
}

export function projectCashFlow(
  monthlyIncome: number,
  monthlyExpense: number,
  months: number
): CashFlowMonth[];

/** Solo rachas de 2+ meses consecutivos en déficit, por FR-004. */
export function detectDeficitStreaks(points: CashFlowMonth[]): DeficitAlert[];
```

## `src/lib/calc/goals-projection.ts` (nuevo)

```ts
export interface GoalProjection {
  monthlyRate: number | null;
  estimatedCompletionDate: Date | null;
  hasEnoughData: boolean;
}

export function estimateGoalCompletion(
  targetAmount: number,
  currentAmount: number,
  contributions: { date: Date; amount: number }[]
): GoalProjection;
```

## `src/lib/calc/budget-503020.ts` (nuevo)

```ts
export type BudgetBucketName = "needs" | "wants" | "savings";

export function classifyCategory(category: string): "needs" | "wants";

export interface BudgetBucket {
  bucket: BudgetBucketName;
  suggestedAmount: number;
  actualAmount: number;
  overBudget: boolean;
  items: { name: string; category: string; amount: number }[];
}

export function compute503020(
  totalMonthlyIncome: number,
  expenseItems: { name: string; category: string; monthlyAmount: number }[],
  monthlySavingsAmount: number
): BudgetBucket[];
```

## `src/lib/calc/health-score.ts` (nuevo)

```ts
export interface HealthScoreInput {
  totalDebtBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  liquidBalance: number; // suma de cuentas en COP
}

export interface HealthScoreResult {
  score: number;
  debtToIncomeComponent: number;
  savingsRateComponent: number;
  emergencyCoverageComponent: number;
}

export function computeHealthScore(input: HealthScoreInput): HealthScoreResult | null;
// null si monthlyIncome <= 0 (no hay base para calcular ratios) — ver edge case del spec.

export function projectHealthScore6Months(
  current: HealthScoreInput,
  monthsSixDebtBalance: number // saldo de deuda total al mes 6 según la estrategia recomendada
): HealthScoreResult | null;
```
