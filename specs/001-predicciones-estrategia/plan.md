# Implementation Plan: Predicciones y Estrategia

**Branch**: `001-predicciones-estrategia` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-predicciones-estrategia/spec.md`

## Summary

Nueva sección `/strategy` (link "Estrategia" en el nav) con 6 vistas en pestañas que
generan recomendaciones a partir de datos ya registrados: comparador Avalancha/Bola de
Nieve/Óptima, flujo de caja proyectado con alertas de déficit, simulador what-if en
memoria, vista consolidada de metas, presupuesto 50/30/20, y score de salud financiera
proyectado a 6 meses. Todo se calcula extendiendo los motores puros existentes en
`src/lib/calc/` (principalmente generalizando `avalanche.ts` para aceptar distintos
órdenes de pago en vez de asumir siempre avalancha), sin nuevas dependencias ni tablas
más allá de lo estrictamente necesario. El módulo es de solo lectura sobre los datos: no
persiste deudas, cuentas, metas ni recurrentes nuevos.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 15 (App Router), React 19

**Primary Dependencies**: Prisma 7 (Postgres), NextAuth v5, Zod, Recharts, Tailwind/shadcn
(Base UI) — todas ya en el proyecto, no se agrega ninguna dependencia nueva.

**Storage**: PostgreSQL vía Prisma. No se agregan modelos nuevos para este feature (ver
Data Model) — todo se deriva en memoria de `Debt`, `Account`, `RecurringItem`,
`GoalContribution`, `Goal` ya existentes.

**Testing**: Sin framework de test automatizado en el proyecto todavía (se valida con
`npm run build` + QA real en navegador vía la skill `browser-automation`, por Principio
VI de la constitución). Los motores nuevos en `src/lib/calc/` se escriben como funciones
puras para quedar test-ready si se agrega un runner más adelante.

**Target Platform**: Web (mismo despliegue Docker/VPS ya existente del proyecto).

**Project Type**: Web app monolítica Next.js (Server Components + Server Actions), ya
establecida — este feature no cambia la arquitectura, se integra en ella.

**Performance Goals**: Cada vista debe renderizar con datos de un usuario típico
(≤20 deudas, ≤12 recurrentes, ≤10 metas) en menos de 300ms de cálculo server-side; el
simulador what-if debe recalcular en el cliente en <50ms por ajuste (percibido como
instantáneo, sin llamada al servidor — todo el cálculo corre en memoria del navegador
sobre datos ya cargados).

**Constraints**: Todas las cifras agregadas deben coincidir con las ya mostradas en
Dashboard/Deudas/Cuentas/Metas para los mismos datos (SC-004) — esto se logra
reutilizando literalmente las mismas funciones de conversión (`toCOP`) y, donde aplique,
los mismos motores (`avalanche.ts`, `goal-quota.ts`).

**Scale/Scope**: Un solo usuario por sesión (ya es el modelo de toda la app); sin
requisitos de escala adicionales.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento |
|---|---|
| I. Reutilizar el motor de cálculo | PASA — se generaliza `avalanche.ts` en vez de duplicarlo; flujo de caja, presupuesto 50/30/20, score y proyección de metas son motores nuevos porque no existía ninguno equivalente, viven en `src/lib/calc/`. |
| II. Español/COP, multi-moneda explícito | PASA — todo copy en español; todo cálculo agregado consume montos ya convertidos a COP vía `toCOP()` antes de entrar a los motores. |
| III. Server Actions para mutaciones | PASA — este módulo es de solo lectura; no se agregan Server Actions nuevas (ver Assumptions del spec: no persiste nada). |
| IV. Server Components por defecto | PASA — la página `/strategy` y sus 6 sub-vistas obtienen datos server-side; solo el simulador what-if (US3) es Client Component porque necesita estado interactivo en memoria. |
| V. Sin nuevas dependencias de gráficos | PASA — el gráfico de cascada de flujo de caja y cualquier otro chart se construyen con Recharts (BarChart apilado con valores positivos/negativos simula waterfall; no se agrega una librería de waterfall dedicada). |
| VI. Verificación real | PASA — plan incluye build limpio + QA en navegador de las 6 vistas con datos y en estado vacío antes de cerrar cada historia. |
| VII. Convertir siempre antes de agregar | PASA — mismo mecanismo que II, aplicado también a tasas (uso de `monthlyRateFromEA` ya existente, no se reinventa). |

Sin violaciones. No se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-predicciones-estrategia/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/             # Phase 1 output (firmas de los motores de cálculo)
└── tasks.md              # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/lib/calc/
├── avalanche.ts          # EXTENDER: generalizar orden de pago + pagos extra puntuales
├── cashflow.ts            # NUEVO: proyección de flujo de caja + detección de déficit
├── goals-projection.ts    # NUEVO: ritmo de abono estimado + fecha proyectada por meta
├── budget-503020.ts       # NUEVO: clasificación necesidades/deseos + regla 50/30/20
├── health-score.ts        # NUEVO: score 0-100 actual y proyectado a 6 meses
├── goal-quota.ts          # SIN CAMBIOS (se reutiliza tal cual)
└── projections.ts         # SIN CAMBIOS (se reutiliza tal cual si hace falta)

src/app/(app)/strategy/
├── page.tsx                        # Server Component: fetch de datos, arma props, Tabs shell
├── debt-strategy-comparison.tsx    # US1 — Server Component (cálculo puro, sin interactividad)
├── cashflow-panel.tsx              # US2 — Server Component + Recharts (waterfall-like)
├── whatif-simulator.tsx            # US3 — Client Component (única parte interactiva)
├── goals-overview.tsx              # US4 — Server Component
├── budget-503020-panel.tsx         # US5 — Server Component
└── health-score-panel.tsx          # US6 — Server Component

src/components/nav.tsx              # AGREGAR entrada "Estrategia" → /strategy
src/middleware.ts                   # AGREGAR "/strategy" a PROTECTED_PREFIXES
```

**Structure Decision**: Ruta nueva de nivel superior `/strategy` (no una pestaña más
dentro de `/reports`, que ya tiene 5 pestañas de proyección de patrimonio — mezclar ahí
las 6 vistas de este módulo lo sobrecargaría). Cada una de las 6 user stories es un
componente independiente importado por `page.tsx` dentro de un `Tabs` de shadcn, igual al
patrón ya usado en `/reports`. Solo el simulador what-if es Client Component; el resto
son Server Components que reciben datos ya calculados server-side, consistente con el
Principio IV.

## Complexity Tracking

*Sin violaciones — sección no aplica.*
