# Feature Specification: Predicciones y Estrategia

**Feature Branch**: `001-predicciones-estrategia`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Módulo 'Predicciones y Estrategia': nueva sección que use los datos ya registrados (Debt, Account, RecurringItem, Transaction, Goal, Asset, Investment) para generar recomendaciones: predicción de flujo de caja, comparador de estrategias de deuda (avalancha/bola de nieve/óptima), simulador what-if, vista consolidada de metas, presupuesto sugerido 50/30/20, y score de salud financiera proyectado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comparar estrategias de pago de deudas (Priority: P1)

Como usuario con varias deudas activas, quiero ver lado a lado cuánto pagaría en intereses
y cuándo terminaría de pagar cada deuda con el método Avalancha, Bola de Nieve, y una
estrategia "Óptima" sugerida, para elegir con cuál seguir con confianza en vez de adivinar.

**Why this priority**: Es el dolor más agudo del usuario (salir de deudas) y el que más
dinero real puede ahorrarle; además reutiliza casi por completo el motor de avalancha ya
construido, por lo que es la historia de mayor valor por menor esfuerzo.

**Independent Test**: Con al menos 2 deudas activas registradas, se puede entrar a la
nueva sección, ver las 3 estrategias calculadas, y verificar que la de menor interés
total quede marcada como recomendada — sin depender de ninguna otra historia de este spec.

**Acceptance Scenarios**:

1. **Given** el usuario tiene 3 deudas activas con tasas y saldos distintos, **When**
   abre la sección de comparación de estrategias, **Then** ve 3 tarjetas (Avalancha, Bola
   de Nieve, Óptima) cada una con: fecha estimada de cierre de cada deuda, total de
   intereses pagados, y el ahorro en pesos frente a la peor de las 3.
2. **Given** las 3 estrategias fueron calculadas, **When** el usuario mira el resultado,
   **Then** la estrategia con menor interés total aparece visualmente marcada como
   recomendada, sin impedirle elegir otra.
3. **Given** el usuario no tiene deudas activas, **When** entra a la sección, **Then** ve
   un estado vacío invitándolo a registrar una deuda, sin cálculos ni tarjetas vacías.

---

### User Story 2 - Ver el flujo de caja proyectado y detectar riesgos de liquidez (Priority: P2)

Como usuario, quiero ver si en los próximos 3, 6 o 12 meses voy a tener meses donde gasto
más de lo que gano, para poder anticiparme antes de que pase.

**Why this priority**: Previene problemas reales (sobregiro, atrasos de pago) antes de que
ocurran; depende solo de datos ya existentes (recurrentes + cuotas mínimas de deuda), no
de que el usuario haya elegido una estrategia todavía.

**Independent Test**: Con ingresos y gastos recurrentes registrados, se puede ver la
proyección mes a mes a 3/6/12 meses y confirmar que un mes donde el gasto proyectado
supera el ingreso proyectado se marca visualmente como déficit, de forma independiente a
cualquier otra historia.

**Acceptance Scenarios**:

1. **Given** el usuario tiene ingresos y gastos recurrentes activos, **When** elige el
   horizonte de 6 meses, **Then** ve un desglose mes a mes de ingreso proyectado, gasto
   proyectado (incluyendo cuotas mínimas de deuda) y el saldo neto de cada mes.
2. **Given** dos o más meses consecutivos proyectan déficit, **When** el usuario ve el
   panel, **Then** aparece una alerta explícita señalando cuáles meses y por qué.
3. **Given** todos los meses proyectan superávit, **When** el usuario ve el panel, **Then**
   no aparece ninguna alerta de riesgo.

---

### User Story 3 - Simular "qué pasaría si" antes de decidir (Priority: P3)

Como usuario, quiero probar escenarios hipotéticos (un pago extra a una deuda, ganar más,
gastar menos) y ver de inmediato cómo cambia el tiempo para salir de deudas, antes de
comprometerme a hacerlo de verdad.

**Why this priority**: Da valor exploratorio importante pero depende conceptualmente de
que ya exista el comparador de estrategias (US1) sobre el cual simular variaciones.

**Independent Test**: Con al menos una deuda activa, se puede ajustar un pago extra
hipotético o un cambio de ingreso/gasto y ver el nuevo total de meses e intereses
recalculado en pantalla sin recargar la página ni guardar nada en la base de datos.

**Acceptance Scenarios**:

1. **Given** el usuario está viendo su plan de pago actual, **When** indica un pago extra
   puntual a una deuda específica en un mes elegido, **Then** ve el nuevo plan recalculado
   con el ahorro en meses e intereses frente al escenario sin el pago extra.
2. **Given** el usuario está simulando, **When** ajusta el ingreso o el gasto mensual con
   un porcentaje, **Then** el flujo de caja disponible para deuda se recalcula y el plan de
   pago se actualiza en consecuencia.
3. **Given** el usuario cierra o resetea el simulador, **When** vuelve a entrar, **Then**
   no queda ningún rastro del escenario simulado — nunca se guardó como dato real.

---

### User Story 4 - Ver todas las metas consolidadas con su fecha realista (Priority: P4)

Como usuario con varias metas activas, quiero ver en un solo lugar cuándo voy a cumplir
cada una al ritmo de abonos que llevo hasta ahora (no solo la cuota fija sugerida), y
cuánto presupuesto me queda libre después de deudas y metas.

**Why this priority**: Complementa lo que ya existe por meta individual con una vista
agregada; útil pero de menor urgencia que salir de deudas o detectar déficit.

**Independent Test**: Con 2+ metas activas y al menos un abono registrado en alguna, se
puede ver la lista consolidada con fecha estimada de cumplimiento al ritmo actual,
independientemente de si el usuario usó el comparador de estrategias o el simulador.

**Acceptance Scenarios**:

1. **Given** el usuario tiene metas activas con abonos registrados, **When** abre la vista
   consolidada, **Then** ve cada meta con su progreso, su ritmo promedio de abono, y la
   fecha estimada de cumplimiento a ese ritmo.
2. **Given** una meta no tiene abonos suficientes para estimar un ritmo, **When** se
   muestra en la lista, **Then** indica que aún no hay datos suficientes para proyectar
   una fecha, en vez de mostrar un cálculo engañoso.
3. **Given** el presupuesto disponible mensual y las metas activas, **When** el usuario ve
   la vista consolidada, **Then** ve cuánto de ese presupuesto quedaría libre después de
   cubrir los abonos sugeridos a las metas.

---

### User Story 5 - Ver un presupuesto 50/30/20 sugerido frente al real (Priority: P5)

Como usuario, quiero ver cómo se compara mi distribución de gastos actual contra la regla
50/30/20 (necesidades/deseos/ahorro), para saber en qué categorías podría ajustar.

**Why this priority**: Es informativo y educativo pero no bloquea ninguna decisión urgente;
depende de tener gastos recurrentes clasificables por categoría.

**Independent Test**: Con gastos recurrentes clasificados por categoría, se puede ver el
desglose sugerido 50/30/20 junto a la distribución real, de forma independiente a
cualquier otra historia.

**Acceptance Scenarios**:

1. **Given** el usuario tiene ingresos y gastos recurrentes con categoría, **When** abre
   la vista de presupuesto sugerido, **Then** ve tres franjas (necesidades, deseos,
   ahorro) con el monto sugerido según ingreso total y el monto real actual de cada una.
2. **Given** una categoría real excede su franja sugerida, **When** el usuario ve el
   resultado, **Then** esa categoría queda señalada como candidata a recortar.

---

### User Story 6 - Ver el score de salud financiera proyectado (Priority: P6)

Como usuario, quiero un número simple (0-100) que resuma qué tan sana está mi situación
financiera hoy y cómo mejoraría en 6 meses si sigo la estrategia de deuda elegida, para
tener una sola cifra que siga en el tiempo.

**Why this priority**: Es un resumen derivado de todo lo demás (deuda, ahorro, liquidez);
tiene más sentido una vez existen las demás piezas, y es el menos accionable por sí solo.

**Independent Test**: Con datos de deuda, ingresos/gastos y liquidez ya registrados, se
puede ver el score actual y el proyectado a 6 meses, de forma independiente a si el
usuario interactuó con el simulador o el comparador.

**Acceptance Scenarios**:

1. **Given** el usuario tiene deudas, cuentas y recurrentes registrados, **When** abre el
   score de salud financiera, **Then** ve un número de 0 a 100 hoy y otro proyectado a 6
   meses, con los tres componentes que lo forman explicados en términos simples.
2. **Given** el usuario no tiene ninguna deuda activa y tiene ahorro positivo, **When** ve
   su score, **Then** el número refleja una situación saludable (score alto), no un
   promedio artificialmente bajo por falta de datos.

### Edge Cases

- ¿Qué pasa si el usuario no tiene ningún recurrente de ingreso registrado? El flujo de
  caja proyectado, el score y el presupuesto 50/30/20 deben indicar que falta información
  en vez de mostrar un cálculo con ingreso cero como si fuera válido.
- ¿Qué pasa si el presupuesto disponible mensual es negativo (gastos recurrentes >
  ingresos)? El comparador de estrategias y el simulador deben mostrarlo explícitamente
  como "no hay excedente para pagar deuda" en vez de simular pagos negativos o infinitos.
- ¿Qué pasa si una deuda tiene tasa de interés 0%? Las tres estrategias deben seguir
  funcionando (esa deuda no genera interés, solo amortiza).
- ¿Qué pasa si todas las deudas están en moneda distinta a COP? Todo cálculo agregado y de
  simulación debe operar sobre los montos ya convertidos a COP.
- ¿Qué pasa si el usuario simula un pago extra mayor al presupuesto disponible ese mes?
  El simulador debe advertirlo en vez de aceptarlo silenciosamente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST calcular y mostrar, para las deudas activas del usuario, tres
  estrategias de pago (Avalancha, Bola de Nieve, Óptima) con fecha estimada de cierre por
  deuda, interés total pagado por estrategia, y ahorro comparativo frente a la peor opción.
- **FR-002**: El sistema MUST marcar visualmente la estrategia de menor interés total como
  recomendada por defecto, permitiendo al usuario ver y comparar las otras dos sin
  restricción.
- **FR-003**: El sistema MUST proyectar el flujo de caja mensual (ingreso recurrente menos
  gasto recurrente menos cuotas mínimas de deuda) a 3, 6 y 12 meses, seleccionable por el
  usuario.
- **FR-004**: El sistema MUST marcar visualmente cada mes proyectado como superávit o
  déficit, y MUST mostrar una alerta explícita cuando existan 2 o más meses consecutivos en
  déficit.
- **FR-005**: El sistema MUST permitir simular, sin persistir ningún cambio, el efecto de
  un pago extra puntual a una deuda específica en un mes elegido sobre el plan de pago
  vigente.
- **FR-006**: El sistema MUST permitir simular, sin persistir ningún cambio, el efecto de
  un cambio porcentual en el ingreso mensual o en el gasto fijo mensual sobre el plan de
  pago y el flujo de caja disponible.
- **FR-007**: El sistema MUST mostrar, para cada simulación, la comparación explícita
  contra el escenario base (meses e intereses actuales vs. simulados).
- **FR-008**: El sistema MUST mostrar una vista consolidada de todas las metas activas con:
  progreso actual, ritmo de abono estimado a partir del historial, y fecha proyectada de
  cumplimiento a ese ritmo.
- **FR-009**: El sistema MUST indicar cuando una meta no tiene suficiente historial de
  abonos para proyectar una fecha, en vez de mostrar una proyección poco confiable.
- **FR-010**: El sistema MUST mostrar cuánto presupuesto mensual disponible queda después
  de cubrir las cuotas mínimas de deuda y los abonos sugeridos a metas activas.
- **FR-011**: El sistema MUST calcular y mostrar una distribución de presupuesto sugerida
  bajo la regla 50/30/20 (necesidades/deseos/ahorro) a partir del ingreso recurrente total,
  comparada con la distribución real de gastos recurrentes por categoría.
- **FR-012**: El sistema MUST señalar qué categorías de gasto real exceden su franja
  sugerida en la comparación 50/30/20.
- **FR-013**: El sistema MUST calcular un score de salud financiera de 0 a 100, combinando
  como mínimo: relación deuda/ingreso, tasa de ahorro, y meses de cobertura de liquidez de
  emergencia.
- **FR-014**: El sistema MUST mostrar el score actual y una proyección del mismo score a 6
  meses, asumiendo que el usuario sigue la estrategia de deuda que tenga marcada como
  elegida (o la recomendada, si no ha elegido ninguna).
- **FR-015**: El sistema MUST mostrar un estado vacío accionable (no un cálculo vacío o en
  cero engañoso) en cualquier vista de este módulo cuando falten los datos mínimos
  necesarios para ese cálculo (por ejemplo, sin deudas activas, sin ingresos recurrentes).
- **FR-016**: Todo cálculo agregado de este módulo que involucre montos en distintas
  monedas MUST operar sobre los valores ya convertidos a la moneda base del usuario.

### Key Entities

- **EstrategiaDeuda**: Resultado calculado (no persistido) de aplicar un método de
  ordenamiento de pago (avalancha, bola de nieve, óptima) sobre el conjunto de deudas
  activas y el presupuesto disponible; incluye el plan mes a mes, fecha de cierre por
  deuda, e interés total.
- **EscenarioSimulado**: Conjunto de parámetros hipotéticos (pago extra, % de cambio en
  ingreso/gasto) que el usuario ajusta en memoria para comparar contra el escenario base;
  no se persiste en la base de datos.
- **ProyeccionFlujoCaja**: Serie mensual calculada de ingreso, gasto y saldo neto
  proyectados a partir de los ingresos/gastos recurrentes activos y las cuotas de deuda.
- **ScoreSalud**: Valor calculado 0-100 con sus componentes (ratio deuda/ingreso, tasa de
  ahorro, cobertura de emergencia) para el momento actual y proyectado a 6 meses.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario con deudas activas puede identificar cuál estrategia de pago le
  conviene y cuánto ahorraría en intereses en menos de 30 segundos desde que entra a la
  sección, sin tener que hacer ningún cálculo manual.
- **SC-002**: Un usuario puede detectar si tiene un mes de déficit proyectado en los
  próximos 12 meses con un solo vistazo al panel de flujo de caja, sin necesidad de sumar
  cifras por su cuenta.
- **SC-003**: Un usuario puede probar al menos 3 escenarios hipotéticos distintos en el
  simulador en menos de 2 minutos, viendo el resultado recalculado de inmediato en cada
  ajuste (percibido como instantáneo, sin recargar la página).
- **SC-004**: El 100% de las cifras agregadas mostradas en este módulo (totales, sumas
  entre monedas, promedios) coinciden con las mismas cifras ya mostradas en Dashboard,
  Deudas, Cuentas y Metas para los mismos datos — no debe haber discrepancias entre
  secciones.
- **SC-005**: Un usuario sin datos suficientes en alguna de las seis vistas del módulo ve
  siempre una explicación clara de qué le falta registrar, nunca una pantalla en blanco o
  un cálculo con ceros sin explicación.

## Assumptions

- La moneda base de comparación y de todos los cálculos agregados de este módulo es COP,
  consistente con el resto de la app (`toCOP()`).
- El "gasto fijo mensual" usado en flujo de caja, presupuesto 50/30/20 y score de salud es
  la suma de `RecurringItem` de tipo EXPENSE activos con frecuencia normalizada a mensual
  (ya existe lógica de equivalencia mensual en la página de Recurrentes que se puede
  reutilizar).
- El "presupuesto disponible para deuda" es ingreso recurrente mensual menos gasto
  recurrente mensual menos cuotas mínimas de deuda — la misma definición que ya usa hoy el
  simulador de avalancha en la sección Deudas.
- La estrategia "Óptima" es una heurística simple (priorizar como "quick win" las 1-2
  deudas más pequeñas si se saldan en 2 meses o menos, luego avalancha por tasa para el
  resto), no un optimizador combinatorio exacto — se documenta así en el copy para no
  prometer una optimización matemática que no existe.
- El ritmo de abono de una meta para proyectar su fecha se estima con el promedio de los
  abonos registrados hasta ahora (si hay al menos 2); con 0 o 1 abono se considera
  "sin datos suficientes" en vez de proyectar.
- La clasificación necesidades/deseos para la regla 50/30/20 usa un mapeo fijo por
  categoría conocida de la app (vivienda, servicios, transporte, seguros → necesidades;
  comida por fuera, ropa, entretenimiento, imprevistos y categorías no reconocidas →
  deseos); el ahorro (20%) se compara contra abonos a metas + ahorro registrado, no contra
  una categoría de gasto.
- Este módulo es de solo lectura sobre los datos existentes: ninguna de sus seis vistas
  modifica deudas, cuentas, metas ni recurrentes directamente (salvo, opcionalmente, que el
  usuario marque cuál estrategia de deuda queda como "elegida" para que el score la use en
  su proyección a 6 meses).
- No se requiere autenticación ni permisos adicionales a los que ya exige el resto de la
  app (usuario autenticado, datos filtrados por `userId`).
