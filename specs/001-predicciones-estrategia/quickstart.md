# Quickstart: validar "Predicciones y Estrategia"

## Prerrequisitos

- `docker compose up -d db` (Postgres local ya configurado del proyecto).
- Migraciones al día: `npx prisma migrate dev` (este feature no agrega migraciones, pero
  confirma que el schema esté sincronizado antes de probar).
- `npm run dev` — **reiniciar el proceso si venías de una sesión anterior** (Principio VI:
  el cliente de Prisma cacheado no se refresca solo con hot-reload tras cambios de schema
  previos de la sesión).

## Escenario 1 — Comparador de estrategias (US1, P1)

1. Inicia sesión con un usuario que tenga **2 o más deudas activas** con tasas y saldos
   distintos (o impórtalas desde `Plan_Cierre_Tarjetas.xlsx` en `/onboarding`).
2. Ve a **Estrategia** en el nav → pestaña "Deudas".
3. Verifica: 3 tarjetas (Avalancha, Bola de Nieve, Óptima), cada una con fecha de cierre
   por deuda, interés total, y ahorro frente a la peor.
4. Verifica que la de menor interés total tenga la insignia de "Recomendada".
5. Con un usuario sin deudas activas, la pestaña debe mostrar un estado vacío, no tarjetas
   en cero.

## Escenario 2 — Flujo de caja y alertas de déficit (US2, P2)

1. En el mismo usuario, ve a la pestaña "Flujo de caja".
2. Cambia el horizonte entre 3/6/12 meses y verifica que la tabla/gráfico se recalcule.
3. Para forzar un déficit de prueba: sube temporalmente un gasto recurrente por encima del
   ingreso total en `/recurring`, vuelve a `/strategy` y confirma que aparece la alerta de
   "2+ meses en déficit" señalando los meses correctos. Revierte el cambio al terminar.

## Escenario 3 — Simulador what-if (US3, P3)

1. Pestaña "Simulador". Ingresa un pago extra a una deuda específica en un mes futuro.
2. Verifica que el nuevo total de meses e intereses se recalcula sin recargar la página.
3. Ajusta el % de cambio en ingreso/gasto y verifica que el presupuesto disponible y el
   plan se actualicen en vivo.
4. Recarga la página completa: el simulador debe volver a su estado base (nada persistido).

## Escenario 4 — Metas consolidadas (US4, P4)

1. Con 2+ metas activas, al menos una con 2+ abonos registrados en `/goals/[id]`.
2. Pestaña "Metas": confirma fecha estimada de cumplimiento para la meta con historial
   suficiente, y el mensaje de "faltan datos" para la que no.

## Escenario 5 — Presupuesto 50/30/20 (US5, P5)

1. Pestaña "Presupuesto": confirma las 3 franjas con sugerido vs. real.
2. Verifica que una categoría que gasta por encima de su franja quede señalada.

## Escenario 6 — Score de salud financiera (US6, P6)

1. Pestaña "Salud financiera": confirma un score 0-100 hoy y otro proyectado a 6 meses.
2. Con un usuario sin deudas y ahorro positivo, confirma que el score hoy sea alto (no
   penalizado por falta de datos en otras áreas).

## Verificación final (Principio VI)

- `npm run build` sin errores.
- QA con `browser-automation`: recorrer las 6 pestañas con datos y en estado vacío, sin
  errores de consola, capturas antes de cerrar el feature.
- Confirmar SC-004: los totales que aparecen en este módulo (deuda total, ingreso, gasto)
  coinciden con los mismos totales en Dashboard/Deudas/Recurrentes para el mismo usuario.
