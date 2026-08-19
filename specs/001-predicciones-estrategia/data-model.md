# Data Model: Predicciones y Estrategia

Este feature **no agrega modelos de Prisma**. Todas las entidades de esta sección son
tipos TypeScript calculados en memoria a partir de datos ya persistidos
(`Debt`, `Account`, `RecurringItem`, `Goal`, `GoalContribution`).

## Entidades calculadas (no persistidas)

### `DebtStrategyPlan` (extiende el `AvalancheMonth[]` ya existente)

Resultado de simular un orden de pago sobre las deudas activas.

| Campo | Tipo | Descripción |
|---|---|---|
| `strategy` | `"avalanche" \| "snowball" \| "optimal"` | Qué criterio de orden se usó |
| `months` | `AvalancheMonth[]` | Igual estructura que ya produce `simulateAvalanche` |
| `closedAtMonth` | `Record<debtId, number>` | Mes (1-based) en que cada deuda llegó a saldo 0 |
| `totalInterestPaid` | `number` | Derivado (Decisión 3 de research.md) |
| `totalMonths` | `number` | `months.length` |

### `CashFlowMonth`

| Campo | Tipo | Descripción |
|---|---|---|
| `month` | `number` | 1-based, relativo a hoy |
| `income` | `number` | Ingreso recurrente mensual (constante, ver Decisión 4) |
| `expense` | `number` | Gasto recurrente mensual + cuotas mínimas de deuda activa |
| `net` | `number` | `income − expense` |
| `isDeficit` | `boolean` | `net < 0` |

### `DeficitAlert`

| Campo | Tipo | Descripción |
|---|---|---|
| `startMonth` | `number` | Primer mes de la racha de déficit |
| `endMonth` | `number` | Último mes de la racha |
| `monthsCount` | `number` | `endMonth − startMonth + 1`, siempre ≥ 2 |

### `WhatIfScenario` (solo en memoria del cliente, nunca persistido)

| Campo | Tipo | Descripción |
|---|---|---|
| `extraPayment` | `{ debtId: string; month: number; amount: number } \| null` | Pago extra puntual |
| `incomeChangePercent` | `number` | Por defecto 0 |
| `expenseChangePercent` | `number` | Por defecto 0 |

### `GoalProjection`

| Campo | Tipo | Descripción |
|---|---|---|
| `goalId` | `string` | |
| `monthlyRate` | `number \| null` | `null` si no hay datos suficientes (Decisión 5) |
| `estimatedCompletionDate` | `Date \| null` | |
| `hasEnoughData` | `boolean` | `monthlyRate !== null` |

### `BudgetBucket` (uno por cada franja 50/30/20)

| Campo | Tipo | Descripción |
|---|---|---|
| `bucket` | `"needs" \| "wants" \| "savings"` | |
| `suggestedAmount` | `number` | % del ingreso total (50/30/20 respectivamente) |
| `actualAmount` | `number` | Suma real de recurrentes clasificados en ese balde |
| `overBudget` | `boolean` | `actualAmount > suggestedAmount` (solo aplica a needs/wants) |
| `items` | `{ name: string; category: string; amount: number }[]` | Para needs/wants |

### `HealthScoreResult`

| Campo | Tipo | Descripción |
|---|---|---|
| `score` | `number` | 0-100, entero |
| `debtToIncomeComponent` | `number` | 0-100 |
| `savingsRateComponent` | `number` | 0-100 |
| `emergencyCoverageComponent` | `number` | 0-100 |
| `projectedScore6Months` | `number \| null` | `null` si faltan datos mínimos (sin ingreso recurrente) |

## Relación con entidades existentes (sin cambios)

`Debt`, `Account`, `RecurringItem`, `Goal`, `GoalContribution` se leen tal cual están hoy
en `prisma/schema.prisma`. Ningún campo nuevo, ninguna migración.
