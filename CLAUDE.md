@AGENTS.md

# Memoria del proyecto

Este repo mantiene `PROJECT_CONTEXT.md` en la raíz como memoria persistente entre sesiones.

- **Leer `PROJECT_CONTEXT.md` al inicio de cualquier tarea nueva sobre este repo** antes de
  explorar el código, para recuperar contexto sin tener que re-derivarlo.
- **Actualizar `PROJECT_CONTEXT.md`** cada vez que: se complete un hito del plan, se tome una
  decisión de arquitectura no obvia, se descubra un "gotcha" (versión, puerto, configuración
  especial), o se acerque el límite de contexto de la conversación actual — en ese último caso,
  antes de que la conversación se compacte o se corte, volcar a este archivo cualquier estado
  relevante en curso (qué se estaba haciendo, qué falta, decisiones pendientes) para que la
  siguiente sesión pueda continuar sin depender del historial de chat.
- No dupliques aquí lo que ya vive en el código (estructura de carpetas, convenciones) — eso se
  deriva leyendo el repo. `PROJECT_CONTEXT.md` es para lo que NO es obvio desde el código: datos
  reales del usuario usados para verificación, estado de avance del plan, decisiones y su porqué.
- El plan completo original del proyecto vive en `/home/arayo/.claude/plans/sequential-tinkering-octopus.md` — referenciarlo, no copiarlo entero.
