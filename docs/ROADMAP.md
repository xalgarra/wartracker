# WarTracker — Roadmap de propuestas

Catálogo de funcionalidades propuestas, organizadas por dominio. Cada una incluye:
- **Por qué**: el problema o ganancia real.
- **Coste**: estimación honesta de horas de trabajo.
- **Valor**: 🟢 alto · 🟡 medio · 🔴 bajo (en el contexto de un solo usuario + pareja consultora).

> Contexto: aplicación monousuario con acceso ocasional de pareja. Stack actual: Vite + JS vanilla + Supabase. Sin reescritura.

---

## A. Quita fricción al uso

### A1. Búsqueda global (Cmd-K / Ctrl-K)
- **Por qué:** con 8 tabs, saltar a "Mephiston Red" o "Pink Horrors" cuesta clicks. Cmd-K abre input flotante, busca en minis + pinturas + recetas + listas, Enter abre el modal correspondiente.
- **Coste:** 4-5h.
- **Valor:** 🟢

### A2. Filtros guardados en Colección
- **Por qué:** reaplicas filtros (juego + facción + estado) cada visita. Guardar 3-4 favoritos como botones rápidos arriba.
- **Coste:** 2-3h. `localStorage`, sin DB.
- **Valor:** 🟡

### A3. Drag & drop para reordenar fotos
- **Por qué:** las galerías dependen de `position`. Hoy se asigna al subir; reordenar requiere borrar y resubir.
- **Coste:** 2h. HTML5 Drag API nativa.
- **Valor:** 🟡

---

## B. Insights con datos existentes

### B1. Timeline de pintado en Home
- **Por qué:** ver "este mes terminé 5 minis · racha de 12 días". Motivacional. Requiere columna `painted_at`.
- **Coste:** 3-4h. Migración SQL + trigger + chart SVG por mes.
- **Valor:** 🟢

### B2. Predicción de pinturas faltantes por proyecto
- **Por qué:** receta vinculada a proyecto → pinturas. Cruce con `paints.in_stock` muestra "te faltan: X, Y, Z".
- **Coste:** 3h. Cero datos nuevos.
- **Valor:** 🟢

### B3. Dashboard de hobby blockers
- **Por qué:** el campo `hobby_blocker` existe pero está enterrado en el modal. Bloque en Home: "Atascado en X minis · razones más comunes: Y, Z".
- **Coste:** 2h.
- **Valor:** 🟡

---

## C. Importer / catálogo

### C1. Soporte .ros (BattleScribe XML)
- **Por qué:** ahora paste de texto. Archivos .ros son XML estructurado → matches mucho más fiables.
- **Coste:** 3-4h. DOMParser + lógica para `<selection>` + agregación.
- **Valor:** 🟡

### C2. Picker manual en matches ambiguos
- **Por qué:** el importer marca como matched lo primero que encaja. Dropdown con candidatos cuando hay múltiples opciones.
- **Coste:** 2h.
- **Valor:** 🟡

### C3. Catálogo extensible desde la UI
- **Por qué:** añadir unidad/facción nueva hoy es SQL. Mini-vista admin para CRUD sobre `units` evita migraciones por errata o suplementos.
- **Coste:** 4-5h.
- **Valor:** 🟡

---

## D. Visual / estética

### D1. Comparativa antes/después en galería de mini
- **Por qué:** las galerías guardan fotos etiquetadas (Sin montar, Montada, En proceso, Terminada). Slider antes/después que cruza dos del mismo mini.
- **Coste:** 3h.
- **Valor:** 🟢 estético, 🟡 funcional.

### D2. Vista de árbol por facción en Colección
- **Por qué:** agrupar por facción con header colapsable + total pts/modelos por grupo.
- **Coste:** 3h.
- **Valor:** 🟡

### D3. Export de lista a imagen/PDF
- **Por qué:** llevar lista a partida sin abrir navegador. PNG/PDF compartible.
- **Coste:** 4-5h.
- **Valor:** 🔴 (BattleScribe / NewRecruit ya lo hacen mejor).

---

## E. Calidad de vida técnica

### E1. Backup automático semanal
- **Por qué:** botón export ya existe. Programar uno automático que guarde JSON en bucket "wartracker-backups" cada N días, retención 4 últimos.
- **Coste:** 2-3h. Edge function programada.
- **Valor:** 🟡 (Supabase ya hace backups daily; redundante).

### E2. Vista de papelera (soft delete)
- **Por qué:** hoy `delete()` es físico. Campo `deleted_at` + filtro permite recuperar borrados de últimos 30 días.
- **Coste:** 4h. Migración + queries + UI.
- **Valor:** 🟡

---

## F. Otras

### F1. "Plan de hoy"
- Botón en Home que sugiere 1-2 acciones concretas según estado: "Hoy: termina la base de los Boyz · luego empieza el wash de los Stormcast". Más opinionado que las recomendaciones actuales.
- **Coste:** 3-4h.
- **Valor:** 🟡

### F2. Wishlist con coste estimado
- Campo `estimated_price` → suma total visible. Útil cuando la pareja pregunta "¿cuánto vale esto?".
- **Coste:** 2h.
- **Valor:** 🟡

### F3. Atajos de teclado globales
- 1-8 para tabs, "/" focus búsqueda, "n" nueva mini, Esc cierra modales.
- **Coste:** 2h.
- **Valor:** 🔴 si solo móvil. 🟡 si desktop. A1 cubre el 80% del valor.

### F4. "Lo que falta para esta lista"
- Dada una lista, mostrar % pintado y qué unidades concretas te faltan para tener mesa-ready.
- **Coste:** 1-2h. Datos ya existen.
- **Valor:** 🟢 si juegas en torneos.

---

## P. Soporte al pintor — herramientas mientras pintas

Esta categoría parte de la pregunta: *"tengo una mini delante, ¿cómo me ayuda la app?"*. Va de tomar decisiones de color/técnica más rápido y reusar lo que ya sabes funciona.

### P1. Buscador de pintura por color (color picker → tu rack)
- **Por qué:** "quiero un naranja entre estos dos rojos". Picker hex/HSL → ordena tus pinturas por distancia cromática (Lab Δ E o HSL euclidiano). Devuelve top 5 con swatches.
- **Datos:** ya existen (`paints.color_hex`).
- **Coste:** 3h.
- **Valor:** 🟢

### P2. Modo "estoy pintando ahora"
- **Por qué:** pantalla focal a tamaño completo con la receta vinculada al proyecto. Cada paso con checkbox, foto de referencia, swatches de la pintura. Botón "siguiente paso". Al marcar el último, te invita a registrar sesión + actualizar progreso.
- **Coste:** 5-6h.
- **Valor:** 🟢 transformador si pintas con el móvil al lado.
- **Bonus:** timer integrado para washes ("deja secar 20 min").

### P3. Sustituto cuando se acaba una pintura
- **Por qué:** estás pintando y descubres que `Mephiston Red` está vacío (`in_stock=false`). La app sugiere la pintura más cercana de tu rack que sí tienes, con % de similitud y warning "puede afectar al tono final".
- **Coste:** 2h. Reutiliza la métrica de P1.
- **Valor:** 🟢

### P4. Recetas filtrables por pintura usada
- **Por qué:** "¿qué he pintado antes con Khorne Red?". Filtro en Recetas por una pintura concreta → ves todas las recetas que la usan + en qué proyectos. Reaprovecha esquemas.
- **Coste:** 1.5h. Solo UI.
- **Valor:** 🟢

### P5. Mezclas custom guardables
- **Por qué:** "Mephiston Red + Abaddon Black 70/30 para sombras de armadura". Hoy se pierde en notas o memoria. Una tabla `paint_mixes` con: nombre, ingredientes (paint_id + ratio), color resultado (hex aproximado), notas. Aparecen como "pinturas virtuales" en recetas.
- **Coste:** 4-5h. Migración + UI + integración con recetas.
- **Valor:** 🟢 si pintas a alto detalle.

### P6. Equivalencias entre marcas (Citadel ↔ Vallejo ↔ AP)
- **Por qué:** "tengo este Vallejo, ¿qué Citadel se parece?" Cruce por hex en `paints` (todas marcas, las tuyas) + opcional catálogo externo de equivalencias conocidas.
- **Coste:** 2-3h con datos propios. Más si añades catálogo externo curado.
- **Valor:** 🟡 si juegas con varias marcas.

### P7. Filter rack visual por tono
- **Por qué:** ya tienes orden por color (`paint-sort.js`). Subirlo de nivel: vista panel tipo paleta con tus pinturas posicionadas en plano HSL (eje X = hue, eje Y = lightness). Click en una zona → filtra a esa familia. Rápidamente ves qué tonos te faltan en el rack.
- **Coste:** 4-5h.
- **Valor:** 🟡 estético-funcional.

### P8. Sugerencia automática de wash/highlight
- **Por qué:** dado un base color (hex), sugerir un wash más oscuro y un highlight más claro de tu rack que mantengan la familia tonal. Plantilla de paso 3-pasos rápida para empezar receta.
- **Coste:** 3h.
- **Valor:** 🟡

### P9. Extractor de paleta desde foto de inspiración
- **Por qué:** subes foto de una mini de Instagram / boxart / arte de fan → algoritmo extrae paleta dominante (5-8 colores) → matches con tu rack. Vital para "quiero pintar como esto".
- **Coste:** 5-6h. Color quantization en cliente (Canvas + algoritmo k-means).
- **Valor:** 🟢

### P10. Galería "mis schemes que funcionaron"
- **Por qué:** filtras tus minis por status='pintada' que tengan galería + receta vinculada → ves un mood board de tus propios trabajos terminados. Click → reutilizar esa receta para el siguiente proyecto.
- **Coste:** 2h. Datos ya existen.
- **Valor:** 🟢

### P11. Esquemas oficiales por facción (referencia externa)
- **Por qué:** para una facción (Stormcast Hammers of Sigmar, Disciples of Tzeentch…), mostrar el esquema oficial GW como guía: foto + pinturas Citadel sugeridas. Curado a mano.
- **Coste:** 6-8h iniciales (curar dataset) + 3h UI. Mantenimiento continuo.
- **Valor:** 🟡 si pintas oficial. 🔴 si pintas custom.

### P12. Color theory helper (harmonías)
- **Por qué:** dado un color → muestra complementario, análogos, triada, split-complementaria. Cada color sugerido con tu pintura más cercana del rack. Útil para diseñar esquemas desde cero.
- **Coste:** 3-4h.
- **Valor:** 🟡

---

## Top picks recomendados

Por valor real / coste / cómo encaja con tu uso:

### Para uso diario / navegación
1. **A1 — Cmd-K búsqueda global** (4-5h, 🟢)
2. **F4 — Lo que falta para esta lista** (1-2h, 🟢)

### Para insights y motivación
3. **B1 — Timeline de pintado** (3-4h, 🟢)
4. **B2 — Predicción de pinturas faltantes** (3h, 🟢)

### Para la mesa de pintar
5. **P1 — Buscador de pintura por color** (3h, 🟢)
6. **P3 — Sustituto cuando se acaba pintura** (2h, 🟢)
7. **P4 — Recetas filtrables por pintura** (1.5h, 🟢)
8. **P10 — Galería "mis schemes que funcionaron"** (2h, 🟢)
9. **P2 — Modo "estoy pintando ahora"** (5-6h, 🟢)

### Visual/aesthetic
10. **D1 — Comparativa antes/después** (3h, 🟢 estético)

### Bundle "pintor" mínimo viable (~9h total)
P1 + P3 + P4 + P10 cubren el 80% del soporte real al pintar y son baratos. P2 lo eleva a otra liga si haces el esfuerzo.

### Bundle "navegación + motivación" (~10h)
A1 + B1 + B2 + F4. La app empieza a sentirse "inteligente".

---

## Lo que **descartaría** explícitamente

- **D3 PDF lista**: BattleScribe / NewRecruit lo hacen mejor.
- **E1 Backup automático**: Supabase ya hace backups daily.
- **E2 Soft delete**: complejidad alta vs beneficio borroso.
- **F3 Atajos teclado**: A1 cubre lo importante.
- **P11 Esquemas oficiales**: alta inversión en curado, valor solo si pintas oficial.
