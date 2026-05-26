# Handoff: Ideas (lista "para algún día")

## Overview

Añadir a WarTracker una nueva sección **"Ideas"** que vive en la columna derecha vacía del Home (la del header "PLAN DE LA SEMANA" que hoy queda en blanco). Es una lista de cosas que el usuario quiere hacer en algún momento — **no proyectos activos** — con composer en línea, categorías opcionales, vínculo opcional a una mini, reordenable manualmente y "promovible" a sesión o proyecto.

Vista de referencia visual: abre `prototype/WarTracker Redesign.html` en un navegador y ve a la **sección 07 · Ideas** al final del canvas. Hay 6 artboards (desktop wireframe + 5 mocks de mobile).

---

## About the Design Files

Los archivos en `prototype/` son un **prototipo React + Babel** que sirve como referencia visual y de comportamiento — **no son código de producción para copiar literalmente**. La tarea es **recrear la funcionalidad en el codebase real de WarTracker** (Vite + JS vanilla con módulos ES, Supabase, event delegation, sin frameworks UI).

La carpeta `code_skeleton/` tiene un esqueleto en JS vanilla siguiendo las convenciones del proyecto (`state.js`, `db.js`, `mostrarError`, `data-action`). Está listo para cablear con Supabase y montar desde `home.js`.

## Fidelity

**Hi-fi.** Los colores, tipografía, espaciados, radios y transiciones son los finales. Mantener fiel al prototipo en lo visual; en lo técnico, seguir patrones de WarTracker.

---

## Stack & convenciones del proyecto (resumen — viene de `CLAUDE.md`)

- **Vite · JS vanilla** (módulos ES, sin framework).
- **Estado global** en objeto `state` (`state.js`). Sin reactividad: mutar `state` y re-renderizar a mano.
- **Event delegation**: `data-action` en HTML + `e.target.closest()` en el listener. **Sin `window.*`.**
- **Errores**: `mostrarError()` (toast). **Nunca `alert()`.**
- **Modales**: patrón de `mini-modal.js` / `paint-modal.js` / `recipe-modal.js`.
- **SQL**: crear archivo en `sql/NN_*.sql`. **El usuario lo ejecuta manualmente en Supabase.** No ejecutar SQL desde el código de la app.
- **Cambios mínimos y directos**. No refactorizar lo que no se pide. No crear abstracciones nuevas.

---

## Archivos del paquete

```
design_handoff_ideas/
├─ README.md                        ← este archivo (la spec completa)
├─ sql/
│  └─ 12_hobby_ideas.sql            ← migración: tabla + RLS + trigger
├─ code_skeleton/
│  ├─ ideas.js                      ← módulo principal (esqueleto vanilla)
│  ├─ idea-modal.js                 ← modal de acciones (esqueleto vanilla)
│  └─ ideas.css                     ← estilos finales (listos)
└─ prototype/                       ← prototipo React de referencia visual
   ├─ WarTracker Redesign.html      ← abre esto para ver los mocks
   ├─ ideas.jsx                     ← componente React de referencia
   ├─ screens.jsx                   ← HoyScreen integrando IdeasWidget
   ├─ PrototypeApp.jsx              ← state hook-up (CRUD + sheets)
   └─ ... (resto de la canvas)
```

---

## Modelo de datos

### Tabla nueva: `hobby_ideas`

Ver `sql/12_hobby_ideas.sql` para el script completo. Resumen:

| columna                  | tipo        | notas                                                          |
| ------------------------ | ----------- | -------------------------------------------------------------- |
| `id`                     | uuid        | PK, default `gen_random_uuid()`                                |
| `user_id`                | uuid        | FK `auth.users(id)` ON DELETE CASCADE                          |
| `text`                   | text        | NOT NULL, length entre 1 y 500                                 |
| `category`               | text        | NULL ó uno de: `tecnica`, `mini`, `compra`, `lista`, `otros`   |
| `mini_id`                | uuid        | FK `minis(id)` ON DELETE SET NULL (no borra la idea)           |
| `order_index`            | integer     | NOT NULL, default 0. Más bajo = más arriba                     |
| `status`                 | text        | `open` (default), `promoted`, `done`                           |
| `promoted_to_session_id` | uuid        | FK auditoría si se promovió a sesión                           |
| `promoted_to_project_id` | uuid        | FK auditoría si se promovió a proyecto                         |
| `created_at`             | timestamptz | NOT NULL, default `now()`                                      |
| `updated_at`             | timestamptz | NOT NULL, default `now()`, trigger                             |

**Índices:** uno por `(user_id, order_index)` con `WHERE status='open'`, y uno por `mini_id WHERE mini_id IS NOT NULL`.

**RLS:** las 4 políticas estándar (select/insert/update/delete) restringidas a `auth.uid() = user_id`.

**Trigger:** `set_updated_at` antes de cada UPDATE.

### Aprovechamiento del esquema existente

- `mini_id` referencia `minis(id)`, que ya distingue colección vs wishlist con su propio flag. **No hace falta una segunda FK** ni elegir "wishlist o colección" en UI — basta con `state.minis` filtrado.
- `promoted_to_*` son auditoría opcional. Si no quieres registrar la trazabilidad, se pueden omitir en el INSERT y la idea simplemente cambia a `status='promoted'`.

---

## Pantallas / componentes

### 1. Widget en Home (columna derecha) — `prototype/ideas.jsx > IdeasWidget`

Tarjeta con:
- **Header**: pill "IDEAS" a la izquierda, link "Ver todas · N" a la derecha
- **Lista** de las primeras N ideas (recomendado 6 en desktop, 4 en mobile)
- **Composer inline**: input + botón `＋` (siempre visible, también con la lista llena)
- **Overflow link** ("Hay X ideas más → ver todas") si la lista trunca

Cada **fila** muestra:
- Texto principal (13px, weight 500, color `--fg1`, line-height 1.35, text-wrap pretty)
- Meta (opcional, 11px): pill de categoría con punto de color + chip con `⚓ Nombre de mini` (tappable)
- Chevron `›` a la derecha

**Estado vacío**: título "Sin ideas todavía" + subtítulo "Apunta cosas que quieres hacer en algún momento — técnicas, minis, compras.", composer destacado debajo.

### 2. Pantalla completa "Ideas" — `prototype/ideas.jsx > IdeasScreen`

Se abre con el link "Ver todas" o un click en la pill "IDEAS" del widget en desktop.

- **Header**: back button `‹`, título "Ideas", botón `⋯`
- **Composer** ancho completo
- **Filtros**: chips horizontales scrollables. "Todas · N" + un chip por cada categoría con `count > 0`
- **Lista** con cada fila en formato "tarjeta" (borde + padding 12px), drag handle `⋮⋮` a la izquierda
- **Footer**: "Orden manual · arrastra ⋮⋮ para reordenar"

### 3. Modal de acciones sobre una idea — `prototype/ideas.jsx > IdeaActionsSheet`

Bottom sheet (en mobile) / modal centrado (en desktop) con 3 modos internos:

**Modo `view`** (default al abrir):
- Header con `text` de la idea + sub con categoría y/o vínculo
- **5 acciones** en filas tappable de altura ~50px:
  - `✎ Editar` — cambia a modo `edit`
  - `⚓ Vincular a una mini` (o "Cambiar mini vinculada") — modo `link`
  - **Divider** "Convertir en…"
  - `▶ Sesión de hobby` — promueve y cierra
  - `☰ Proyecto activo` — promueve y cierra
  - `🗑 Eliminar` (rojo) — confirma y borra
- Cerrar con backdrop click, ESC o botón ✕ en la esquina

**Modo `edit`**:
- Textarea para el texto (`maxlength=500`, autofocus, 3 filas, resize vertical)
- Selector de categoría: chips con `Ninguna` + los 5 IDs. Activo: bg `--bg` + border `--accent`
- Botón primario "Guardar cambios" + link "Cancelar"

**Modo `link`**:
- Input de búsqueda (filtra `state.minis` por nombre o facción)
- Si la idea ya está vinculada: link rojo "× Quitar vínculo actual"
- Lista de resultados (max-height 50vh, scroll interno): nombre + facción + tag "colección" o "wishlist"
- Click en un resultado → guarda `mini_id` y cierra el modal

### 4. Promociones

Cuando el usuario pulsa "Convertir en sesión":
1. Abrir el modal de sesión que ya existe (`session-modal.js`), prellenado con `idea.text` en el campo de notas/etiqueta
2. Al guardar la sesión correctamente, hacer `UPDATE hobby_ideas SET status='promoted', promoted_to_session_id=<id>`
3. La idea desaparece de la lista (filter `status='open'`)

Lo mismo para proyecto con `project-modal.js`.

Si el usuario cierra el modal de sesión/proyecto sin guardar, **no marcar la idea como promovida** — debe seguir visible.

---

## Comportamiento e interacciones

### Composer
- **Enter** envía
- Disabled si `text.trim().length === 0`
- Tras enviar: input vacío, foco vuelve al input, scroll al top de la lista
- Optimistic: la idea aparece arriba inmediatamente con un id temporal `tmp-...`; en éxito se sustituye por la fila real; en error se quita y se llama `mostrarError`

### Reorder
- En la pantalla completa, cada fila es `draggable="true"`
- Implementación sugerida: **HTML5 drag&drop nativo**, sin SortableJS — no merece la pena la dependencia
- Al `dragend`, calcular el nuevo orden de ids visibles y llamar a `reorderIdeas(orderIds)` (`ideas.js`)
- La función hace UPSERT con `[{id, order_index}, …]` en una sola query

### Vínculo a mini
- Click en el chip `⚓ Nombre` de una idea **abre el modal de la mini** (`mini-modal.js`), no el modal de la idea
- En el módulo `ideas.js` el handler ya separa: si el click cae sobre `[data-action="ideas-open-mini"]`, no abre el modal de acciones

### Filtros (pantalla completa)
- Filtro activo se guarda en `state.ideasFilter`. Cambiar de tab Home y volver mantiene el filtro
- Si el filtro deja la lista vacía, mostrar empty-state inline con CTA "cambia el filtro"

### Persistencia de orden
- `order_index` se reasigna SIEMPRE empezando en 0 al reordenar (no incrementar desde el último, para evitar drift)
- En `createIdea`, asignar `order_index = min(actuales) - 1` para que las nuevas vayan arriba

---

## Layout responsive

### Mobile (default, <900px)
- Home apila las secciones verticalmente
- El widget de Ideas va **bajo "Acciones rápidas"** (que ya existen: iniciar sesión, sin imprimar, sin stock)
- Pantalla completa ocupa todo el viewport

### Desktop (≥900px)
- Home pasa a grid 2 columnas:
  - Izquierda (1.4fr): hero "Continuar pintando" + acciones rápidas + stats + sessions/pending
  - Derecha (1fr): **widget de Ideas**
- El widget de Ideas usa `position: sticky; top: 16px; max-height: calc(100vh - 80px); overflow-y: auto;`
- Pantalla completa de Ideas: se renderiza inline en el grid, ocupando ambas columnas (preferiblemente como ruta `home/ideas` si tienes router, o un overlay)

CSS de la media query ya escrito en `code_skeleton/ideas.css` al final.

---

## Estado global (state.js)

Añadir a `state`:
```js
state.ideas = [];           // array de ideas, ordenado por order_index asc
state.ideasFilter = 'todas'; // 'todas' | id de categoría
```

Cargar al inicio (`init.js`, junto al resto de cargas iniciales):
```js
import { loadIdeas } from './ideas.js';
await loadIdeas();
```

---

## Cableado en `home.js`

1. Añadir el contenedor de la columna derecha en el HTML del Home:
   ```html
   <aside class="home-sidebar">
     <div data-home-ideas></div>
   </aside>
   ```
2. En `renderHome()`:
   ```js
   import { mountIdeas } from './ideas.js';
   mountIdeas(document.querySelector('[data-home-ideas]'));
   ```
3. El header "PLAN DE LA SEMANA" del HTML actual se **elimina** — lo reemplaza el header "IDEAS" interno del widget.
4. **Opcional**: renombrar el header de "Plan de la semana" de las acciones rápidas (las que SÍ tienen contenido) a "Acciones rápidas" — coherencia con el rediseño.

---

## Diseño visual (tokens)

Si tu CSS ya define `--bg`, `--surface`, `--border`, `--fg1..4`, `--accent`, `--subtle`, `--card-radius` — todo encaja. Si alguno falta, mapéalo al equivalente.

### Categorías (color por hue, oklch L=0.70 C=0.13)

| id        | label    | hue | uso visual                          |
| --------- | -------- | --- | ----------------------------------- |
| `tecnica` | Técnica  | 220 | cyan — técnicas de pintura          |
| `mini`    | Mini     | 305 | púrpura — una mini concreta         |
| `compra`  | Compra   | 70  | ámbar — pintura/caja a comprar      |
| `lista`   | Lista    | 15  | rosa — listas de ejército           |
| `otros`   | Otros    | 280 | lavanda — mesa, organización…       |

Se usan solo en el "punto" (7×7px) del chip y en los filtros.

### Tipografía
- Texto idea: 13px / 500 / line-height 1.35 / `--fg1`
- Meta (categoría, vínculo): 11px / 500 / `--fg3`
- Header widget "IDEAS": 11px / 600 / uppercase / letter-spacing 0.08em / `--fg2`
- Empty-state title: 13px / 600 / `--fg2`

### Radii
- Tarjeta widget: `--card-radius` (14px)
- Composer / filtros / acciones: 10px / 999px / 12px
- Modal: 16px superior, 0 inferior (sheet)

---

## Edge cases a manejar

1. **Idea con `mini_id` apuntando a una mini borrada** → el FK es `ON DELETE SET NULL`, así que `mini_id` se vuelve `null`. En el widget, no se muestra chip. No requiere acción especial.
2. **Texto muy largo** (límite 500 chars en DB) → el textarea ya lo respeta. En el widget se ve completo (text-wrap pretty); si llegan a ser muy largas, no truncar — son ideas, conviene leerlas enteras.
3. **Lista vacía** → empty state con CTA composer destacado, ningún botón "Ver todas" hasta que haya al menos 1.
4. **Conexión perdida** → todas las mutaciones son optimistas. Si la query falla, se revierte el state local y se llama `mostrarError`.
5. **Reorder en mobile** → el drag&drop nativo es difícil con dedo. **Aceptable**: dejar el reorder solo accesible desde la pantalla completa, donde hay handles `⋮⋮` claros. En lista compacta del widget no permitir drag.
6. **Idea promovida que el user revierte** → fuera de scope inicial. Se podría añadir un toggle "Ver promovidas/archivadas" en la pantalla completa.

---

## Testing (Vitest)

Funciones puras a testear (mock de `db.js` con `vi.mock('../db.js', () => ({ db: {} }))`):
- `catLabel(id)` / `catColor(id)` — devuelven null para id desconocido
- Ordenamiento: `state.ideas` queda ordenado tras `reorderIdeas([...])`
- Optimistic create: si la DB falla, el id temporal `tmp-*` desaparece de `state.ideas`

---

## Orden recomendado de implementación

1. **DB**: ejecutar `sql/12_hobby_ideas.sql` en Supabase. Verificar RLS con un INSERT desde la app.
2. **`ideas.js`**: cablear `loadIdeas`, `createIdea` (con composer mínimo), `mountIdeas` en `home.js`. **Punto de control: ya se ven y se crean ideas en el widget.**
3. **`ideas.css`**: incluir el CSS. Verificar mobile y desktop.
4. **`idea-modal.js`**: cablear modo `view` con `Editar` y `Eliminar`. **Punto de control: CRUD básico cerrado.**
5. **Vínculo a mini**: implementar modo `link` del modal y el chip clickeable.
6. **Pantalla completa**: añadir filtros y drag&drop nativo.
7. **Promociones**: cablear con `session-modal.js` y `project-modal.js` (último porque depende de modificaciones en esos módulos).

---

## Lo que NO está en este handoff y conviene confirmar con el usuario antes

- **Promoción "Mover a wishlist"**: lo descartamos porque la wishlist ya es un flag de `minis`. Si quieres una idea-categoría compra que se convierta automáticamente en entrada de wishlist, hay que decidir cómo se mapea texto libre → fila estructurada de mini. Mi sugerencia: NO automatizar, dejar que el usuario haga la wishlist por separado.
- **Ideas archivadas (`status='done'`)**: la columna existe en el SQL pero no hay UI para "marcar como hecha sin promover". Si interesa, añadir un sexto botón en el modal.
- **Notificaciones / recordatorios**: nada de fechas ni avisos. Si surge, requiere nueva columna `remind_at` y un job.
