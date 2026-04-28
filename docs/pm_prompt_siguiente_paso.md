# Product Manager Brief — "Siguiente paso recomendado"

## Contexto

Estamos implementando una feature llamada **"Siguiente paso recomendado"** en WarTracker, una app web personal para coleccionistas de miniaturas Warhammer.

El usuario:
- No pinta a diario
- Tiene una colección limitada
- No le gustan las sub-assemblies pero las usa cuando hay zonas de difícil acceso
- Quiere que la app le sugiera el próximo paso de hobby más realista y de menor fricción

Ya tenemos un spec técnico detallado. El engineering lead ha revisado el spec y tiene preguntas abiertas que necesitan decisión de producto antes de implementar.

---

## Contexto técnico relevante (para entender las preguntas)

Los campos nuevos que se añaden a la tabla `minis`:

- `hobby_blocker` — por qué está parada la mini (assembly, priming, hard_to_reach, motivation, decision)
- `assembly_risk` — riesgo de sub-assembly (low, medium, high). "High" significa que montar todo antes de pintar deja zonas inaccesibles, por lo que el usuario usa sub-assembly (pinta partes por separado antes de ensamblar del todo)
- `next_step` — override manual del siguiente paso

El motor de recomendaciones tiene esta jerarquía de prioridades:
1. Override manual (`next_step`)
2. Assembly risk alto → "Revisa el montaje antes de pegar"
3. Proyecto activo con minis pendientes → "Avanza el proyecto"
4. Mini casi terminada (≥70% progreso) → "Termínala"
5. Mini imprimada o en pintura → "Continúa"
6. Mini comprada → "Monta"

---

## Preguntas abiertas que necesitan decisión de producto

### Q1 — Alcance de la recomendación "Revisar montaje"

**Contexto técnico**: el spec actual recomienda "Revisar montaje" a cualquier mini con `assembly_risk = "high"` que no esté en status "pintada". Esto incluiría minis que ya están en proceso de pintura (`status = "pintando"`).

**La duda**: si una mini ya está en fase `pintando`, ¿tiene sentido seguir recordando que "revises el montaje"? En teoría, si ya estás pintando, ya decidiste tu approach de sub-assembly.

**Propuesta del engineering lead**: restringir esta recomendación a `status in ("comprada", "montada")` únicamente, ya que en imprimada/pintando ya está comprometido el flujo.

**Pregunta para PM**: ¿La recomendación de "revisar montaje" debe mantenerse activa hasta que la mini esté pintada del todo, o cortarla antes? ¿En qué punto el usuario ya no necesita este recordatorio?

---

### Q2 — Ubicación visual en el Home

**Contexto**: el Home ya tiene una sección de "Proyectos activos" en la parte superior (tarjetas interactivas que el usuario gestiona) seguida de un dashboard de estadísticas pasivas.

**Propuesta del engineering lead**: colocar las recomendaciones **entre** los proyectos activos y el dashboard de stats, no antes de los proyectos. Argumento: los proyectos los creó el usuario con intención explícita; las recomendaciones son asistencia del sistema. Proyectos primero, asistencia después, stats al fondo.

**Pregunta para PM**: ¿Las recomendaciones deben ir encima de todo (antes de proyectos) o entre proyectos y stats? ¿Qué jerarquía cognitiva quieres comunicar: "el sistema te ayuda primero" vs "tus proyectos mandan"?

---

### Q3 — El campo `next_step` en el modal: ¿ahora o en v2?

**Contexto**: el modal de edición de mini añadiría tres campos nuevos agrupados en "Plan de hobby": blocker, assembly risk, y next_step (override manual).

`next_step` es el más técnico y confuso para el usuario medio: es un dropdown que sobreescribe la lógica automática del motor. Requiere que el usuario entienda cómo funciona el motor para usarlo correctamente.

**Propuesta del engineering lead**: lanzar en v1 solo con `hobby_blocker` y `assembly_risk` (más intuitivos). El campo `next_step` se añade en v2 cuando el usuario ya entiende cómo funciona el sistema de recomendaciones.

**Pregunta para PM**: ¿Incluimos el override manual `next_step` en el modal desde el primer lanzamiento, o lo reservamos para una segunda iteración?

---

### Q4 — ¿Las recomendaciones conviven con proyectos activos o son alternativas?

**Contexto**: si el usuario tiene 2 proyectos activos, el motor también puede generar recomendaciones sobre esas mismas minis (por ejemplo, "Termina X" si X está al 80% y también pertenece a un proyecto).

**Posibilidad A**: las recomendaciones pueden incluir minis que ya están en proyectos (máxima cobertura, puede haber duplicación visual con las tarjetas de proyectos).

**Posibilidad B**: las recomendaciones excluyen minis que ya están en proyectos activos (evita ruido, el proyecto ya actúa como "siguiente paso" para esas minis).

**Pregunta para PM**: ¿El sistema de recomendaciones debe ser completamente independiente de los proyectos, o debe complementarlos sin repetirlos?

---

## Resumen de decisiones necesarias

| # | Pregunta | Opciones | Impacto |
|---|----------|----------|---------|
| Q1 | ¿Hasta qué status aplica "revisar montaje"? | Solo comprada/montada vs. hasta pintando | Ruido vs. utilidad para usuarios con sub-assembly |
| Q2 | ¿Dónde van las recomendaciones en el Home? | Top de todo vs. entre proyectos y stats | Jerarquía de información y primeras impresiones |
| Q3 | ¿`next_step` en modal ahora o en v2? | V1 completo vs. V1 simplificado | Complejidad del modal vs. funcionalidad completa |
| Q4 | ¿Recomendaciones solapan con proyectos? | Independientes vs. excluyen minis en proyectos | Cobertura vs. ruido visual |
