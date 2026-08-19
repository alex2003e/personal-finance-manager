# Research: Predicciones y Estrategia

No hay "NEEDS CLARIFICATION" pendientes del Technical Context (proyecto ya establecido,
stack fijo por constitución). Este documento registra las decisiones técnicas concretas
tomadas para llenar los vacíos de diseño que el spec dejó como Assumptions.

## Decisión 1: Generalizar `simulateAvalanche` en vez de crear un motor paralelo

**Decisión**: Refactorizar `src/lib/calc/avalanche.ts` para separar "cómo se ordenan las
deudas" de "cómo se simula mes a mes". La función interna de simulación acepta un array
de deudas ya ordenado según la estrategia (`order: DebtInput[]`) y, opcionalmente, una
lista de pagos extra puntuales (`extraPayments?: {month, debtId, amount}[]`).
`simulateAvalanche(debts, budget)` se mantiene como wrapper de compatibilidad (ordena por
avalancha internamente) para no romper `/debts` que ya la usa.

**Rationale**: Cumple el Principio I de la constitución. Bola de Nieve y Avalancha son
literalmente el mismo algoritmo de simulación con distinto criterio de orden — separarlo
evita una segunda copia del loop mes a mes (que ya maneja interés compuesto, cierre de
deudas y presupuesto restante).

**Alternativas consideradas**: Escribir `simulateSnowball` como función independiente
(descartada: duplica ~40 líneas de lógica de interés/asignación que ya existen y deben
mantenerse sincronizadas en dos lugares — viola Principio I).

## Decisión 2: Heurística "Óptima" simple, no optimización combinatoria

**Decisión**: La estrategia "Óptima" separa las deudas en dos grupos: (a) las que se
pueden saldar en ≤2 meses pagando solo con el presupuesto disponible (ordenadas por
saldo ascendente — "quick wins"), simuladas primero: (b) el resto, ordenadas por tasa
descendente (avalancha). El orden final es (a) seguido de (b).

**Rationale**: El spec (Assumption) es explícito en que no se promete un optimizador
matemático exacto. Un enfoque de "snowball para los quick wins + avalancha para el resto"
es un patrón conocido y explicable en una frase al usuario, calculable en O(n log n), sin
necesitar programación dinámica ni resolver un problema NP-difícil de asignación óptima
de pagos.

**Alternativas consideradas**: Búsqueda exhaustiva de órdenes (descartada: con >8 deudas
es computacionalmente cara y el beneficio marginal sobre la heurística es mínimo para el
tamaño de datos real de un usuario personal, spec dice explícitamente "no hace falta
optimización combinatoria compleja").

## Decisión 3: Interés total por estrategia se deriva, no se trackea aparte

**Decisión**: `interesTotal = Σ(totalPaid de cada mes) − Σ(saldo original de las deudas)`.
No se modifica la forma de `AvalancheMonth` para agregar un campo de interés por mes.

**Rationale**: Ya es matemáticamente correcto porque `totalPaid` de cada mes es el pago
real (que ya incluye el interés acumulado ese mes antes de amortizar); sumar todos los
pagos y restar el capital original da el interés total pagado, sin tocar la estructura de
datos que ya usa `/debts` hoy.

## Decisión 4: Flujo de caja proyectado es lineal, no estacional

**Decisión**: `projectCashFlow` asume que los `RecurringItem` activos se repiten igual
cada mes (ya convertidos a equivalente mensual con la misma lógica que hoy usa
`/recurring` para mostrar "Ingreso mensual"/"Gastos fijos"). No se modela crecimiento de
ingresos, inflación de gastos, ni estacionalidad.

**Rationale**: Es el modelo más simple que cumple SC-002 (detectar déficit con un
vistazo) sin inventar supuestos de crecimiento que el usuario no pidió ni configuró en
ningún lado de la app. Documentado explícitamente en el copy de la UI ("proyección lineal
basada en tus recurrentes actuales") para no generar falsa precisión.

## Decisión 5: Ritmo de meta requiere ≥2 abonos con separación temporal real

**Decisión**: `estimateGoalCompletion` calcula el ritmo mensual como
`(último abono − primer abono en monto acumulado) / meses transcurridos entre el primero
y el último abono`. Si hay menos de 2 abonos, o el primero y el último son el mismo día
(0 meses transcurridos), retorna `null` (sin proyección).

**Rationale**: Cumple FR-009 y el edge case del spec de no mostrar una fecha "engañosa".
Con 1 solo abono no hay ritmo que estimar; con 2+ abonos separados en el tiempo sí hay una
tasa real observada.

## Decisión 6: Clasificación 50/30/20 por mapa fijo de categoría

**Decisión**: Mapa estático `NEEDS_CATEGORIES` (vivienda, servicios, transporte, seguros y
suscripciones) → necesidades; cualquier otra categoría de gasto (incluida "otros" y
categorías libres que el usuario haya escrito a mano) → deseos. El ahorro (20%) se compara
contra `abonos a metas del mes + transacciones tipo SAVINGS`, no contra una categoría de
gasto (las metas y el ahorro no son un "gasto").

**Rationale**: Reutiliza las mismas categorías ya usadas como sugerencias en el formulario
de Recurrentes (`CATEGORIES` de `recurring-form.tsx`), evitando introducir una taxonomía
paralela.

## Decisión 7: Score de salud — pesos y normalización

**Decisión**: Tres componentes, cada uno normalizado 0-100:
- **Ratio deuda/ingreso** (peso 40%): `100 − min(ratio × 200, 100)` donde ratio =
  deuda total / ingreso mensual (un ratio de 0% → 100 puntos; 50%+ → 0 puntos). Es el
  componente con más peso porque el dolor principal de este usuario es la deuda.
- **Tasa de ahorro** (peso 35%): `min(tasaAhorro / 20% × 100, 100)` — llegar a ahorrar el
  20% del ingreso (la meta clásica de la regla 50/30/20 ya usada en US5) da el máximo.
- **Cobertura de emergencia** (peso 25%): `min(mesesCobertura / 6 × 100, 100)` — 6 meses de
  gasto fijo cubierto en liquidez es el estándar convencional de fondo de emergencia.

Score final = promedio ponderado, redondeado a entero, acotado a [0, 100].

**Rationale**: Pesos y umbrales son supuestos razonables explícitos (no hay estándar único
en la industria); se documentan aquí y en el copy de la UI para que sean auditables y
ajustables, no una "caja negra".

**Alternativas consideradas**: Pesos iguales (33/33/33) — descartado porque para *este*
usuario (y el perfil típico de la app: alguien saliendo de deudas caras) el ratio de deuda
domina el riesgo real más que la cobertura de emergencia.

## Decisión 8: Proyección del score a 6 meses usa la estrategia recomendada, sin persistir selección

**Decisión**: La proyección a 6 meses del score siempre usa el estado de deuda que resulta
de la estrategia con menor interés total (la recomendada por defecto en US1), no una
selección persistida del usuario. No se agrega ninguna columna nueva a `Debt` ni tabla de
preferencia de estrategia.

**Rationale**: El spec permite ambas opciones ("o la recomendada, si no ha elegido
ninguna"); no persistir mantiene el módulo 100% de solo lectura (más simple, sin
migración, sin Server Action nueva) y sigue siendo el comportamiento por defecto explícito
que el spec ya contempla. Si en el futuro se quiere recordar la elección entre sesiones,
es una extensión aislada (una columna + una Server Action), no un rediseño.
