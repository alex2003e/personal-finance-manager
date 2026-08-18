# Contexto del proyecto — Finanzas

> Este archivo es la memoria persistente del proyecto entre sesiones/conversaciones.
> Debe actualizarse cada vez que se completa un hito importante o se toma una decisión
> relevante, y debe leerse al inicio de cualquier sesión nueva sobre este repo.

## Qué es esto

App web de gestión financiera personal para el usuario (Colombia / COP), construida para
reemplazar el Excel `Plan_Cierre_Tarjetas.xlsx`. Objetivo: llevar el control financiero sin
límite de meses, y crecer desde salir de deudas hoy hasta gestión de patrimonio/inversiones
a futuro.

Plan original completo: `/home/arayo/.claude/plans/sequential-tinkering-octopus.md`

## Stack

- Next.js 15 (App Router) + TypeScript, src/ dir
- Tailwind CSS + shadcn/ui + Recharts
- PostgreSQL vía Prisma ORM **v7** (generator `prisma-client`, salida en `src/generated/prisma`,
  requiere driver adapter `@prisma/adapter-pg` — ver `prisma.config.ts` y `src/lib/prisma.ts`)
- Auth.js (NextAuth v5) Credentials + bcryptjs
- Zod + react-hook-form
- exceljs para importar el Excel original como seed
- Docker Compose: servicio `db` (Postgres, puerto host **5433** porque 5432 ya estaba ocupado
  localmente) + servicio `app`

## Datos financieros reales del usuario (snapshot 2026-08-18, para seed/verificación)

- Ingreso fijo neto: 4.500.000 COP/mes; ingreso variable promedio: 600.000 COP/mes
- Gastos fijos: Vivienda 1.600.000, Servicios 339.600, Confama 775.054, Transporte 50.000,
  Seguros 259.200, Otros fijos 100.000, Imprevistos 100.000
- Deudas: Bancolombia 1 (455.640, 29,6152% EA, mín 164.806), Bancolombia 2 (3.127,51,
  29,6152% EA), Tarjeta Nu (3.018.357, 29,2% EA, mín 1.100.000) → total tarjetas ≈ 3.477.125
- Préstamo Confama (inversión en 2 motos): saldo 21.403.854, 21,26% EA, cuota 775.054/mes
  (~37 meses restantes sin abonos extra)
- Flujo de caja libre calculado ≈ 599.040 COP/mes
- Activos: 2 motos, valor total 13.400.000 COP

## Estado de avance

- [x] Excel de transición entregado (`Plan_Cierre_Tarjetas.xlsx`) — 3 hojas de mes con
      quincenas, cuadre automático, hoja Deudas y Gastos Fijos.
- [x] Plan aprobado para la app (ver plan file arriba).
- [x] Scaffold Next.js + Tailwind + TS creado en la raíz del repo.
- [x] Dependencias instaladas (Prisma 7, NextAuth, exceljs, shadcn deps, Recharts, etc.)
- [x] `prisma/schema.prisma` con todos los modelos (User, Debt, RecurringItem, Transaction,
      Asset, Investment, Goal, NetWorthSnapshot).
- [x] Docker Compose (Postgres en 5433) + Dockerfile multi-stage (`output: "standalone"`).
- [x] Primera migración de Prisma aplicada (`20260818142853_init`).
- [x] Auth (login/registro con NextAuth v5 Credentials + bcrypt) + layout base con nav lateral.
- [x] Importador de Excel → seed real (`src/lib/actions/import-excel.ts`, usa exceljs; ojo con
      el gotcha de la tabla "Cuotas de Tarjetas" — ver abajo).
- [x] Módulo Deudas (CRUD + simulador avalancha en `src/lib/calc/avalanche.ts`).
- [x] Módulo Recurrentes (ingresos/gastos con frecuencia y desglose quincenal).
- [x] Ledger + lógica de cuadre quincenal (`/ledger`, navegable por mes).
- [x] Dashboard (flujo libre, deuda total, meses para saldar, patrimonio neto, cuadre del mes).
- [x] Activos, Inversiones (`/assets`), Metas con progreso (`/goals`), Proyecciones de interés
      compuesto con gráfica Recharts (`/reports`).
- [x] Verificado end-to-end con la skill `browser-automation`: registro → importar Excel →
      dashboard → todas las páginas, sin errores de consola, todo en español. Los números
      coinciden con los calculados a mano en la conversación (flujo libre 1.876.146, deuda
      total tarjetas 3.477.125, deudas pagadas en 2 meses con el presupuesto disponible).

## Cómo correrlo

```bash
docker compose up -d db          # Postgres en localhost:5433
npx prisma migrate dev           # si hay cambios de schema pendientes
npm run dev                      # http://localhost:3000
```

Producción/VPS: `docker compose up -d` (levanta `db` + `app`, la app corre `prisma migrate
deploy` automáticamente al iniciar, ver `Dockerfile`).

## Decisiones/gotchas importantes

- Prisma 7 rompe compatibilidad: no se usa `url` en el datasource del schema, sino
  `prisma.config.ts` + un driver adapter (`PrismaPg`) en la instanciación del cliente.
- El puerto 5432 local ya estaba tomado por otro Postgres del sistema → se usa 5433 en el
  host (mapeado a 5432 dentro del contenedor). `DATABASE_URL` en `.env` ya refleja esto.
- `.env` está en `.gitignore` — nunca commitear secretos ni el `NEXTAUTH_SECRET` generado.
- `AGENTS.md` es regenerado automáticamente por `next dev`; las instrucciones propias del
  proyecto van en `CLAUDE.md` y en este archivo, no en `AGENTS.md`.
- shadcn/ui en este proyecto usa **Base UI** (no Radix): `DialogTrigger` usa la prop `render={<Button/>}`
  en vez de `asChild`, y `Select onValueChange` recibe `string | null` (hay que manejar el `null`).
- `middleware.ts` **no debe importar `@/lib/auth` directamente** (ese archivo importa Prisma, que
  no corre en Edge runtime). Existe `src/lib/auth.config.ts` (sin provider Credentials, edge-safe)
  que se usa en el middleware; `src/lib/auth.ts` extiende esa config añadiendo el provider
  Credentials + Prisma, y se usa en el resto de la app (route handlers, server components).
- El importador de Excel (`import-excel.ts`) parsea la hoja "Gastos Fijos" por posición de fila;
  tiene que ignorar la sub-tabla "Cuotas de Tarjetas" (es informativa, ya está cubierta por los
  registros de `Debt`) o duplica esos montos como gastos recurrentes — ya está corregido con un
  flag `inCuotasTarjetas` que se activa al ver ese título y descarta el resto de filas de esa hoja.
- Todo el copy de la UI está en español (revisado con `grep` + QA en navegador); si se agregan
  componentes shadcn nuevos, revisar textos de accesibilidad (`sr-only`) que a veces vienen en inglés.

## Ampliación: Cuentas bancarias + gestión completa de tarjetas de crédito

Agregado a petición del usuario (2026-08-18): quería una sección para tarjetas de crédito
(cupo, gastos hechos con la tarjeta, cuotas, pagos) que alimentara un indicador de "capacidad
de endeudamiento" en el dashboard, y una sección de cuentas de ahorro/corriente de donde
entran los pagos y salen los retiros. Se le avisó que el cálculo de cuotas por compra
individual (diferido a X cuotas con su propio interés) era una función grande aparte —
eligió la versión completa igual.

- **Modelo `Account`** (ahorros/corriente/efectivo, saldo). `Transaction.accountId` mueve el
  saldo: INCOME lo sube, todo lo demás (EXPENSE/DEBT_PAYMENT/SAVINGS/TRANSFER) lo baja.
  `transferBetweenAccounts` mueve saldo entre dos cuentas propias.
- **`Debt.creditLimit`** (opcional, solo tiene sentido para type=CARD).
- **Modelo `CardCharge`**: cada compra con tarjeta tiene su propio plan de amortización
  (monto, cuotas, tasa EA propia — puede ser 0% en promociones), calculado con
  `src/lib/calc/installments.ts` (amortización francesa, reutiliza `monthlyRateFromEA` de
  `avalanche.ts`). Registrar una compra sube `Debt.balance`; pagar una cuota
  (`payCardInstallment`) cobra interés sobre el saldo restante de ESA compra primero y el
  resto abona a capital (igual que el resto de la app), bajando tanto `CardCharge.remainingBalance`
  como `Debt.balance`.
- **Importante**: `TransactionType.CARD_CHARGE` (comprar con tarjeta) NO debe contarse como
  gasto en efectivo en ningún cálculo de flujo/cuadre (dashboard y ledger ya lo excluyen
  explícitamente) — el efectivo solo sale cuando se paga la cuota (`DEBT_PAYMENT`). Si se
  agregan nuevos cálculos de "gasto del período", recordar excluir `CARD_CHARGE`.
- Un `Transaction` con `cardChargeId` no se puede borrar desde el Ledger genérico (rompería el
  estado de la compra) — `deleteTransaction` lo bloquea explícitamente y dirige a gestionarlo
  desde la tarjeta en `/debts`.
- Dashboard: nuevas tarjetas "Liquidez total" (suma de cuentas) y "Capacidad de endeudamiento"
  (cupo usado / cupo total de tarjetas con `creditLimit` definido, con aviso si supera 30%/50%
  de utilización — regla general de score crediticio).
- **Gotcha de dev server**: tras `prisma generate`, si el servidor `next dev` ya estaba
  corriendo, el singleton de `PrismaClient` en `src/lib/prisma.ts` (cacheado en
  `globalThis` a propósito para HMR) queda con el cliente viejo y las tablas nuevas dan
  `undefined`/500. Hay que **reiniciar el proceso de `next dev`** después de migrar el schema,
  no basta con que Next haga hot-reload del código.
- Verificado end-to-end con `browser-automation`: cuenta, tarjeta con cupo, compra a 6 cuotas
  (24% EA) → cuota calculada correcta, pago de cuota descontó interés+capital exactamente
  como el motor de amortización predice, dashboard y ledger reflejan todo correctamente.

## Próximos pasos sugeridos (no bloqueantes)

- Página `/assets`: el importador no trae activos (motos) porque el Excel no tenía esa hoja —
  el usuario puede agregarlos manualmente ahí.
- No hay snapshots históricos de patrimonio neto (`NetWorthSnapshot` existe en el schema pero
  nada lo escribe todavía) — el dashboard calcula el patrimonio neto en vivo, no hay gráfica de
  evolución real todavía (la de `/reports` es solo proyección hacia adelante).
- Sin tests automatizados; validado solo con `npm run build` + QA manual en navegador.
