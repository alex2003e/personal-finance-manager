<!--
Sync Impact Report
Version change: (none) → 1.0.0
List of modified principles: N/A (initial ratification)
Added sections: Core Principles (I-VII), Technology & Architecture Constraints,
  Development Workflow, Governance
Removed sections: none
Follow-up TODOs: none
-->

# Finanzas Constitution

## Core Principles

### I. Reutilizar el motor de cálculo, no duplicarlo
Toda lógica financiera (amortización, avalancha/snowball, depreciación/valorización,
cuotas de metas, proyecciones de interés compuesto) MUST vivir en `src/lib/calc/*` como
funciones puras y testeables, independientes de React/Next.js. Un feature nuevo que
necesite un cálculo ya cubierto por un motor existente (`avalanche.ts`, `projections.ts`,
`depreciation.ts`, `goal-quota.ts`, `installments.ts`) MUST reutilizarlo o extenderlo — no
reimplementar la fórmula en un componente o server action. Un cálculo genuinamente nuevo
se agrega como módulo nuevo en `src/lib/calc/`, nunca inline.
**Rationale**: la app ya tuvo bugs de inconsistencia (cifras distintas en Dashboard vs.
Deudas) cuando el mismo cálculo vivía en dos lugares; centralizarlo es la única forma de
que una corrección se propague a toda la app.

### II. Español y COP por defecto, multi-moneda explícito
Toda la UI, copy, mensajes de error y nombres de categoría MUST estar en español
(Colombia). COP es la moneda implícita en toda cifra sin unidad. Cualquier suma agregada
de saldos de `Debt`/`Account` en monedas distintas MUST pasar por `toCOP()`
(`src/lib/currency.ts`) antes de sumarse — nunca sumar montos de monedas distintas
directamente.
**Rationale**: mezclar monedas sin convertir ya causó una discrepancia real en las
métricas del dashboard antes de introducir `toCOP()`.

### III. Server Actions, no API routes, para mutaciones
Las mutaciones de datos MUST implementarse como Server Actions en `src/lib/actions/*.ts`
con validación Zod al inicio de cada función exportada. Las API routes (`src/app/api/*`)
se reservan exclusivamente para lo que Server Actions no puede resolver (NextAuth,
webhooks externos). Toda Server Action que cambie datos usados en otra página MUST
llamar `revalidatePath()` sobre esas rutas.
**Rationale**: mantiene un único patrón de mutación en todo el código, ya adoptado en
`debts.ts`, `accounts.ts`, `goals.ts`, `card-charges.ts`, `transactions.ts`.

### IV. Server Components por defecto
Las páginas y componentes MUST ser Server Components salvo que necesiten estado,
efectos o manejadores de evento — en ese caso, y solo en ese caso, se marcan
`"use client"`. Un componente cliente MUST recibir del servidor solo datos serializables
(nunca funciones ni componentes de ícono sin resolver; ver el bug de RSC ya corregido en
`category-projection.tsx`, que ahora resuelve íconos por clave de texto en vez de recibir
el componente).
**Rationale**: rendimiento (menos JS al cliente) y para evitar la clase de bug de
serialización RSC que ya se presentó una vez en este proyecto.

### V. Sin nuevas dependencias de gráficos
Toda visualización de datos MUST usar Recharts, ya integrado. No se agregan librerías de
charting adicionales sin discutirlo explícitamente primero.
**Rationale**: evitar fragmentación de dependencias y estilos de gráfico inconsistentes
entre páginas.

### VI. Verificación real antes de dar por terminado un feature
Ningún feature se considera completo solo porque compila o pasa el chequeo de tipos.
Antes de reportarlo como terminado MUST: (1) `npm run build` limpio, (2) recorrido real
en navegador de los flujos principales (crear/editar/eliminar, casos vacíos, casos con
datos) usando la skill `browser-automation`, revisando la consola por errores. Si el
feature modifica el schema de Prisma, el proceso de `next dev` MUST reiniciarse antes de
verificar (el cliente cacheado en `globalThis` no se refresca solo).
**Rationale**: varios bugs reales (ícono RSC, doble conteo de compras a crédito como
gasto en efectivo, warning de campo no controlado) solo se detectaron con QA real en
navegador, nunca con el build o los tipos.

### VII. Convertir siempre antes de agregar
Cualquier suma de montos para un total (dashboard, capacidad de endeudamiento, patrimonio
neto, proyecciones) MUST operar sobre el valor ya convertido a COP y, cuando aplique,
usando la tasa efectiva (mensual derivada de la EA) correcta — nunca sumar tasas
anuales directamente ni mezclar saldos nominales de distintas monedas.
**Rationale**: consistente con el Principio II; se enuncia aparte porque aplica también a
tasas de interés/rendimiento, no solo a montos.

## Technology & Architecture Constraints

Stack fijo del proyecto: Next.js 15 (App Router) + TypeScript + Prisma 7/PostgreSQL +
NextAuth v5 (Credentials) + Tailwind CSS + shadcn/ui (Base UI) + Recharts + next-themes.
Un cambio de stack (framework, ORM, librería de auth) requiere discusión explícita, no se
introduce como efecto secundario de un feature. Los componentes `Select` de shadcn/Base UI
MUST recibir el prop `items` (mapa valor→etiqueta) para que el valor mostrado no quede en
el value crudo sin traducir.

## Development Workflow

Todo feature no trivial sigue el flujo Spec Kit: `/speckit-specify` → `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement`. Los artefactos (`spec.md`, `plan.md`, `tasks.md`)
viven en `specs/<NNN>-<slug>/` y se versionan en el repo. El progreso y las decisiones no
obvias del proyecto se registran también en `PROJECT_CONTEXT.md` en la raíz, que se lee al
inicio de cualquier sesión nueva sobre este repo (ver `CLAUDE.md`).

## Governance

Esta constitución tiene precedencia sobre cualquier convención implícita del código
existente. Una enmienda requiere: (1) justificar el cambio, (2) actualizar el número de
versión según semver (MAJOR = principio eliminado/redefinido de forma incompatible, MINOR
= principio agregado o expandido materialmente, PATCH = aclaración de redacción), (3)
registrar el cambio en el Sync Impact Report al inicio de este archivo. `/speckit-plan`
MUST verificar que el plan no viole ningún principio antes de proceder a `/speckit-tasks`.

**Version**: 1.0.0 | **Ratified**: 2026-08-19 | **Last Amended**: 2026-08-19
