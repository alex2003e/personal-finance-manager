# Tasks: Predicciones y Estrategia

**Input**: Design documents from `/specs/001-predicciones-estrategia/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/calc-engines.md, quickstart.md

**Tests**: No se generan tareas de test automatizado (el proyecto no tiene runner de
tests todavía — Principio VI de la constitución sustituye tests unitarios por build
limpio + QA real en navegador, incluido como tarea explícita en cada fase).

**Organization**: Una fase por user story (P1→P6), en el orden de prioridad del spec.

## Phase 1: Setup

- [ ] T001 Agregar `/strategy` a `PROTECTED_PREFIXES` en `src/middleware.ts`
- [ ] T002 [P] Agregar entrada de nav "Estrategia" (ícono `Compass` o similar de lucide-react) apuntando a `/strategy` en `src/components/nav.tsx`

## Phase 2: Foundational (bloqueante para todas las historias)

**Propósito**: generalizar el motor de avalancha y crear el shell de la página — sin esto
ninguna user story puede implementarse.

- [ ] T003 Extender `src/lib/calc/avalanche.ts`: agregar tipo `PayoffStrategy`, interfaz `ExtraPayment`, función `orderDebtsByStrategy(debts, strategy, monthlyBudget)` (avalanche = tasa desc; snowball = saldo asc; optimal = quick-wins ≤2 meses por saldo asc primero, luego resto por tasa desc — ver Decisión 2 de `research.md`), función `simulatePayoff(orderedDebts, monthlyBudget, options?)` que generaliza el loop mes a mes actual para aceptar `extraPayments`, y función `compareStrategies(debts, monthlyBudget, options?)` que corre las 3 estrategias y calcula `totalInterestPaid` por estrategia (Decisión 3). Mantener `simulateAvalanche()` existente como wrapper de compatibilidad para no romper `src/app/(app)/debts/page.tsx`. Firmas exactas en `contracts/calc-engines.md`.
- [ ] T004 Crear `src/app/(app)/strategy/page.tsx`: Server Component que hace fetch en paralelo de `Debt`, `Account`, `RecurringItem` (activos), `Goal` con `contributions`, calcula `monthlyBudgetForDebt` (mismo criterio que ya usa `/debts`: ingreso recurrente − gasto recurrente − cuotas mínimas), convierte todo a COP con `toCOP()`, y arma un `Tabs` (shadcn) con 6 `TabsTrigger`/`TabsContent` vacíos como placeholders para las 6 fases siguientes (mismo patrón que `src/app/(app)/reports/page.tsx`)

**Checkpoint**: con T001-T004 hechas, `/strategy` carga, muestra el shell de pestañas, y `avalanche.ts` está listo para usarse en US1 y US3.

## Phase 3: User Story 1 — Comparar estrategias de pago de deudas (P1) 🎯 MVP

**Goal**: mostrar 3 estrategias de pago lado a lado con fecha de cierre por deuda,
interés total, y ahorro comparativo.

**Independent Test**: con 2+ deudas activas de tasas distintas, ver las 3 tarjetas
calculadas y la de menor interés marcada como recomendada; con 0 deudas activas, ver
estado vacío.

- [ ] T005 [US1] Crear `src/app/(app)/strategy/debt-strategy-comparison.tsx` (Server Component): recibe deudas activas + `monthlyBudgetForDebt`, llama `compareStrategies()`, renderiza 3 `Card` (Avalancha / Bola de Nieve / Óptima) con fecha estimada de cierre por deuda (derivar de `closedAtMonth` + fecha actual + N meses), `Money` para interés total, y el ahorro en pesos vs. la peor de las 3
- [ ] T006 [US1] Insignia "Recomendada" (badge `success`) en la tarjeta de menor `totalInterestPaid`; reutilizar `<EmptyState icon={CreditCard} .../>` cuando no haya deudas activas, con acción que enlace a `/debts`
- [ ] T007 [US1] Integrar en la pestaña "Deudas" de `strategy/page.tsx`
- [ ] T008 [US1] `npm run build` limpio + QA en navegador (usuario con deudas y usuario sin deudas) siguiendo Escenario 1 de `quickstart.md`; verificar que el interés total de la estrategia recomendada sea ≤ el de las otras dos (coherencia matemática)

**Checkpoint**: US1 es un MVP demostrable de forma independiente.

## Phase 4: User Story 2 — Flujo de caja proyectado y alertas de déficit (P2)

**Goal**: proyección mensual de ingreso/gasto a 3/6/12 meses con alerta de 2+ meses de
déficit consecutivos.

**Independent Test**: ver la tabla/gráfico mes a mes y confirmar que un mes con gasto >
ingreso se marca como déficit; con 2+ meses seguidos, ver la alerta explícita.

- [ ] T009 [P] [US2] Crear `src/lib/calc/cashflow.ts` con `projectCashFlow(monthlyIncome, monthlyExpense, months)` y `detectDeficitStreaks(points)` según firmas de `contracts/calc-engines.md` (Decisión 4: proyección lineal, sin estacionalidad)
- [ ] T010 [US2] Crear `src/app/(app)/strategy/cashflow-panel.tsx`: selector de horizonte (3/6/12 meses, `Tabs` o `Select`), gráfico Recharts `BarChart` con barras de ingreso/gasto por mes (coloreadas por `success`/`destructive` según superávit/déficit — simula waterfall sin librería nueva, cumple Principio V), y bloque de alerta cuando `detectDeficitStreaks` devuelva resultados
- [ ] T011 [US2] Integrar en la pestaña "Flujo de caja"; estado vacío si no hay ningún `RecurringItem` de ingreso activo
- [ ] T012 [US2] `npm run build` limpio + QA en navegador siguiendo Escenario 2 de `quickstart.md`, incluyendo forzar un déficit temporal para confirmar la alerta

## Phase 5: User Story 3 — Simulador what-if (P3)

**Goal**: simular pago extra puntual y cambios % de ingreso/gasto, todo en memoria del
navegador, viendo el plan recalculado al instante.

**Independent Test**: ajustar un pago extra o un % y ver el nuevo total de meses e
intereses sin recargar la página; al recargar, el simulador vuelve al estado base.

- [ ] T013 [US3] Crear `src/app/(app)/strategy/whatif-simulator.tsx` (Client Component, único de esta feature): recibe deudas activas + presupuesto base ya calculados server-side como props; estado local para `extraPayment` (deuda, mes, monto) y `incomeChangePercent`/`expenseChangePercent`; recalcula `monthlyBudget` ajustado y llama `simulatePayoff` (de `avalanche.ts`, vía `orderDebtsByStrategy` con la estrategia recomendada) en cada cambio con `useMemo`
- [ ] T014 [US3] Mostrar comparación lado a lado: escenario base (meses/intereses actuales) vs. escenario simulado, con la diferencia resaltada en `tone="positive"`/`"negative"` según ahorre o empeore; advertencia si el pago extra ingresado supera el presupuesto disponible ese mes (edge case del spec)
- [ ] T015 [US3] Integrar en la pestaña "Simulador"
- [ ] T016 [US3] `npm run build` limpio + QA en navegador: probar los 3 tipos de ajuste, confirmar recálculo instantáneo (sin request al servidor — verificar en Network que no hay POST), y confirmar que recargar la página resetea el simulador (nada persistido), por Escenario 3 de `quickstart.md`

## Phase 6: User Story 4 — Metas consolidadas con fecha realista (P4)

**Goal**: lista de todas las metas activas con ritmo de abono estimado y fecha proyectada
de cumplimiento, más el presupuesto libre después de deudas y metas.

**Independent Test**: con una meta con 2+ abonos, ver fecha proyectada; con una meta sin
suficiente historial, ver mensaje de "faltan datos" en vez de un cálculo engañoso.

- [ ] T017 [P] [US4] Crear `src/lib/calc/goals-projection.ts` con `estimateGoalCompletion(targetAmount, currentAmount, contributions)` (Decisión 5: ≥2 abonos con separación temporal real, si no `null`)
- [ ] T018 [US4] Crear `src/app/(app)/strategy/goals-overview.tsx`: lista todas las `Goal` activas del usuario con `Progress`, ritmo mensual estimado, fecha proyectada o "Aún no hay suficientes abonos para proyectar" (FR-009), y un resumen de presupuesto libre = `monthlyBudgetForDebt` − suma de cuotas fijas sugeridas de metas activas (reutilizar `computeFixedQuota` de `goal-quota.ts` donde la meta tenga `targetMonths`/`targetDate`)
- [ ] T019 [US4] Integrar en la pestaña "Metas"; estado vacío si no hay metas activas, enlazando a `/goals`
- [ ] T020 [US4] `npm run build` limpio + QA en navegador siguiendo Escenario 4 de `quickstart.md`

## Phase 7: User Story 5 — Presupuesto sugerido 50/30/20 (P5)

**Goal**: comparar la distribución real de gastos recurrentes contra la regla 50/30/20 y
señalar categorías que exceden su franja.

**Independent Test**: ver las 3 franjas con sugerido vs. real, y una categoría sobregirada
marcada visualmente.

- [ ] T021 [P] [US5] Crear `src/lib/calc/budget-503020.ts` con `classifyCategory(category)` (mapa fijo needs/wants, Decisión 6) y `compute503020(totalMonthlyIncome, expenseItems, monthlySavingsAmount)`
- [ ] T022 [US5] Crear `src/app/(app)/strategy/budget-503020-panel.tsx`: 3 tarjetas (Necesidades/Deseos/Ahorro) con `Progress` de real vs. sugerido, lista de categorías del balde "needs"/"wants" que excedan su franja resaltadas en `tone="negative"` o borde `warning`
- [ ] T023 [US5] Integrar en la pestaña "Presupuesto"; estado vacío si no hay recurrentes de gasto activos
- [ ] T024 [US5] `npm run build` limpio + QA en navegador siguiendo Escenario 5 de `quickstart.md`

## Phase 8: User Story 6 — Score de salud financiera proyectado (P6)

**Goal**: score 0-100 hoy y proyectado a 6 meses según la estrategia recomendada.

**Independent Test**: ver el score actual y el proyectado; con deuda cero y ahorro
positivo, confirmar que el score sea alto.

- [ ] T025 [P] [US6] Crear `src/lib/calc/health-score.ts` con `computeHealthScore(input)` y `projectHealthScore6Months(current, monthsSixDebtBalance)` según pesos y fórmulas de la Decisión 7 de `research.md` (40% deuda/ingreso, 35% tasa de ahorro, 25% cobertura de emergencia); retornar `null` si `monthlyIncome <= 0`
- [ ] T026 [US6] Crear `src/app/(app)/strategy/health-score-panel.tsx`: número grande 0-100 hoy (con color según rango: ≥70 `success`, 40-69 `warning`, <40 `destructive`) + número proyectado a 6 meses, tomando el saldo de deuda del mes 6 de la estrategia recomendada (`compareStrategies` de T003 — reutilizar el mismo cálculo de US1, no volver a llamarlo con datos distintos, por SC-004), y los 3 componentes explicados en una frase simple cada uno
- [ ] T027 [US6] Integrar en la pestaña "Salud financiera"; estado vacío/mensaje si `computeHealthScore` retorna `null` por falta de ingreso recurrente
- [ ] T028 [US6] `npm run build` limpio + QA en navegador siguiendo Escenario 6 de `quickstart.md`

## Phase 9: Polish & Cross-Cutting

- [ ] T029 Recorrido completo en navegador de las 6 pestañas de `/strategy` (usuario con datos completos y usuario recién registrado sin datos) sin errores de consola, capturas de pantalla — Principio VI
- [ ] T030 Verificar SC-004: comparar manualmente (o con script de QA) que deuda total, ingreso y gasto mostrados en `/strategy` coincidan exactamente con Dashboard, Deudas y Recurrentes para el mismo usuario de prueba
- [ ] T031 Actualizar `PROJECT_CONTEXT.md` con el estado de esta feature (motores nuevos en `src/lib/calc/`, decisiones de research.md que no sean obvias del código, y el patrón de extensión de `avalanche.ts` para que futuras sesiones lo reutilicen en vez de reinventarlo)
- [ ] T032 Commit + push a `main`, merge y push a `develop` (flujo ya establecido del proyecto con `git-P`)

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)**: bloquean todo lo demás.
- **User Stories (Phase 3-8)**: independientes entre sí una vez completada la Fase 2 —
  se pueden implementar y entregar en cualquier orden, pero el orden P1→P6 del spec es el
  recomendado porque refleja el valor real para el usuario.
  - US6 (Phase 8) reutiliza `compareStrategies()` de la Fase 2/US1 para la proyección a 6
    meses — puede implementarse en paralelo a US2-US5, pero su tarea de integración final
    (T026) requiere que T003 ya exista (ya lo hace, es Foundational).
- **Polish (Phase 9)**: después de todas las historias que se decida entregar en esta
  ronda.

## Parallel Execution Examples

Dentro de la Fase 2, T003 y T004 tocan archivos distintos y pueden ir en paralelo.

Los motores de cálculo nuevos (T009, T017, T021, T025) son independientes entre sí (cada
uno en su propio archivo, sin dependencias cruzadas) y pueden implementarse en paralelo
si se reparte el trabajo, todos después de que la Fase 2 esté lista.

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (US1)**: con eso el usuario ya tiene el comparador de
estrategias funcionando end-to-end, que es el mayor valor con el menor esfuerzo (reutiliza
casi todo `avalanche.ts`). Las fases 4-8 se entregan incrementalmente en el orden de
prioridad del spec; cada una es demostrable por separado sin depender de que las
siguientes existan.
