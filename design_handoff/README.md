# Handoff: WarTracker · Rediseño visual completo

## Visión general

Este paquete contiene el **rediseño visual completo de WarTracker** (la app que tienes en `xalgarra.github.io/wartracker`). Se entregan **dos direcciones de diseño finalistas**: **A — Minimal refinado** y **C — Oscuro atmosférico**. Ambas cubren las mismas 6 pantallas: Login, Colección (mobile + desktop), Stats (mobile + desktop), Wishlist, Pinturas (mobile + desktop) y modal "Añadir minis" (mobile + desktop). El comportamiento, datos y arquitectura de la app **no cambian** — esto es solo capa visual.

> El usuario debe decidir cuál de las dos quiere implementar (o coger elementos de ambas). Si te lo pide específicamente, sigue su decisión. Si no, **pregúntale primero** y haz un par de slices de cada una para que pueda comparar antes de comprometerse.

## Sobre los archivos de este bundle

Los archivos en `source/` son **referencias de diseño escritas en HTML + React vía Babel inline**. **No son código de producción para copiar tal cual**: son prototipos que muestran la apariencia y el comportamiento deseados.

La tarea es **recrear estos diseños en el código real de WarTracker** — usando React/Vue/lo que sea que use ya el repo, su sistema de componentes existente, sus librerías, y sus convenciones. Si el usuario aún no ha elegido stack para esta versión, escoge la opción más sensata para el proyecto y aplica los diseños allí.

Lo que SÍ debes copiar literalmente:

- **Tokens de color** (oklch values exactos)
- **Tipografías y tamaños** (Inter / Space Grotesk / JetBrains Mono, weights y sizes)
- **Estructura de cada pantalla** (qué elementos, en qué orden, con qué jerarquía)
- **Estados de las minis** (5 estados con sus colores específicos)
- **Comportamiento de filtros, sort, tabs** (descrito abajo)

Lo que NO debes copiar literalmente:

- El sistema `<DCArtboard>` / design canvas (es solo la maqueta del prototipo, no parte de la app)
- `data.js` (son datos de muestra; usa los datos reales del backend / store de la app)
- Los wrappers `Phone` y `Desktop` con bezel (eran solo para presentar, la app real es responsive)

## Fidelidad

**High-fidelity (pixel-perfect).** Colores, tipografías, espaciados, radios y border-styles están todos definidos con valores exactos en las hojas de estilo de cada variante. Reprodúcelos tal cual.

## Variantes — qué son

### A · Minimal refinado (`source/var-a.jsx`)

- **Filosofía**: pulir lo que ya tiene WarTracker hoy. Es la opción segura, evolutiva.
- **Tipografía**: Inter (sans) para todo, JetBrains Mono solo para datos numéricos pequeños.
- **Paleta**: fondo `#fafaf8` (gris cálido casi blanco), texto `#1a1a1c`, separadores `#ececea`. Acento monocromo (negro como acción primaria).
- **Cards**: fondo blanco, border `1px solid #ececea`, `border-radius: 12px`. Sin sombras.
- **Diferenciación de juego**: tags pequeños con tinte rojizo (40K) o turquesa (AoS).
- **Personalidad**: limpio, neutral, profesional. Como Linear o Notion.

### C · Oscuro atmosférico (`source/var-c.jsx`)

- **Filosofía**: dirección con más carácter, evoca la mesa de juego, sensación táctica.
- **Tipografía**: Space Grotesk para texto, JetBrains Mono para todo lo numérico/táctico (muy presente).
- **Paleta**: fondo `#14110d` (casi negro con tinte cálido), texto `#e8e4dc`, acento ámbar/brasa `oklch(0.65 0.15 60)`. Verde para "pintada" (valor logrado): `oklch(0.65 0.16 145)`.
- **Cards**: filas tipo "registro de operaciones" en lugar de cards — separadores horizontales, no bordes redondeados envolventes.
- **Diferenciación de juego**: pills con fondo tintado más saturado (rojo/turquesa).
- **Personalidad**: terminal de operaciones, brief táctico. Densidad de datos alta.

Las dos variantes comparten **estructura, contenido y flujos**. Solo cambia la capa visual.

## Tipografías

```
Inter — 400, 500, 600, 700              (variante A)
Space Grotesk — 400, 500, 600           (variante C)
JetBrains Mono — 400, 500               (ambas, para datos numéricos)
```

Cárgalas vía Google Fonts o autohospedadas — como prefiera el repo.

## Pantallas y comportamiento

### 1. Login

**Propósito**: entrada a la app. Solo email + password + botón "Entrar".

**Layout**: una columna centrada, max-width ~360px, padding 48px arriba.

**Elementos**:
- Logo / wordmark "WarTracker" + dot rojo (A) o glyph circular ámbar (C)
- Título "WarTracker" + subtítulo corto
- Input email + input password
- Botón "Entrar" (full width)

### 2. Colección (mobile + desktop)

**Propósito**: vista principal — lista de minis con filtros y sort. Es donde el usuario pasa la mayoría del tiempo.

**Layout mobile**: lista vertical, una mini por fila.
**Layout desktop**: grid 2 columnas, contenido limitado a ~920px centrado.

**Header pegajoso**:
- Logo a la izquierda
- Iconos de acción a la derecha (notificaciones, salir, etc.)

**Tabs** (debajo del header, también pegajosos): `Colección · Estadísticas · Wishlist · Pinturas`. La activa está subrayada (A) o con pill ámbar (C).

**Barra de filtros**: chips horizontales scrolleables — `All`, `40K`, `AoS`, `Pintada`, `Pendiente` — más un input de búsqueda. Al pulsar un chip se filtra; al pulsar el activo se desactiva.

**Barra de ordenación** (importante — esto es funcionalidad existente que se ha mantenido):
- Texto "Ordenar:" seguido de pills clickables: `Reciente`, `Nombre`, `Estado`, `Juego`.
- La pill activa muestra dirección con flecha: `↓` (desc) o `↑` (asc).
- **Al clicar la pill activa**, alterna asc ↔ desc.
- **Al clicar otra**, se activa con dirección por defecto (Reciente → desc, resto → asc).
- Estado React: `{ sort: 'reciente'|'nombre'|'estado'|'juego', dir: 'asc'|'desc' }`.

**Lista de minis** — cada fila contiene:
- Foto cuadrada (placeholder si no hay)
- Nombre principal + alias entre comillas en cursiva si existe
- Línea de meta: tag de juego (40K/AoS), tag de tipo (`monstruo`, `caballería`, `infantería`, etc.), facción(es) en texto secundario
- A la derecha: status pill con uno de los 5 estados, abajo `1 ud · 1 mod` y puntos
- Click en la fila → abre el modal de detalle de mini

**FAB** (mobile only) abajo a la derecha: `+` para añadir mini.

### 3. Estadísticas (mobile + desktop)

**Propósito**: resumen del progreso de pintado. Mucha densidad de información.

**Resumen superior** (3 columnas):
- Modelos totales · Modelos pintados · % pintado (en verde/acento)

**Por cada juego (40K, AoS)**:
- Card con header: pill del juego + nombre del ejército + total `pts totales · pts pintados`
- Por cada facción dentro del juego:
  - **Componente desplegable** (`<details>`): summary muestra nombre de facción, meta (`X entradas · Y modelos · Z pintados`) y puntos. Chevron rota al abrir.
  - Al abrir muestra:
    - Barra apilada por estado (5 segmentos coloreados con anchos proporcionales a puntos por estado)
    - Leyenda con dots de color y conteo: `2 comprada · 2 montada · 1 pintando · 1 pintada`
    - Lista detallada de cada mini con nombre, modelos, puntos y status pill

**Layout desktop**: grid 2 columnas para los game cards, summary ocupa todo el ancho.

### 4. Wishlist (solo mobile en el prototipo, desktop sigue mismo patrón)

**Propósito**: minis que el usuario quiere comprar pero aún no posee.

**Layout**: cards con foto, nombre, tienda donde la quiere comprar, precio estimado, prioridad (alta/media/baja indicada visualmente).

### 5. Pinturas (mobile + desktop)

**Propósito**: inventario de pinturas que tiene el usuario, con info de tipo y marca.

**Layout**: lista o grid con muestra de color (chip cuadrado del color real), nombre, marca, tipo (base, layer, shade, contrast, technical, etc.), y posiblemente estado (queda mucho/poco/se acabó).

### 6. Modal añadir mini (mobile bottom-sheet, desktop centrado)

**Propósito**: formulario para añadir una mini nueva a la colección.

**Layout mobile**: bottom sheet — ocupa la parte inferior, sube desde abajo, cierra al hacer pull-down o tap fuera.
**Layout desktop**: modal centrado con backdrop oscuro, max-width ~520px.

**Campos**:
- Slot de foto (4:3, dashed border, "subir foto")
- Nombre
- Alias/apodo (opcional)
- Selector de juego (40K | AoS)
- Selector de facción (depende del juego)
- Selector de tipo (infantería, caballería, monstruo, vehículo, etc.)
- Cantidad de unidades, cantidad de modelos
- Puntos
- Estado inicial (radio de los 5 estados)
- Botones: `Cancelar` (secundario) + `Guardar` (primario)

## Sistema de estados (CRÍTICO)

Las minis tienen 5 estados con un orden y código de color fijos. Respeta este orden — es la progresión natural del hobbista:

| Slug          | Label en UI | Color A (chip)                     | Color C (chip)                                 |
|---------------|-------------|-------------------------------------|-------------------------------------------------|
| `comprada`    | Comprada    | `bg #f3f2ee · text #6a6a64`         | `bg #2a251c · text #a09684`                     |
| `montada`     | Montada     | `bg oklch(0.95 0.04 60) · text oklch(0.45 0.1 60)` | `bg oklch(0.32 0.08 60) · text oklch(0.82 0.13 60)` |
| `imprimada`   | Imprimada   | `bg oklch(0.95 0.03 240) · text oklch(0.45 0.1 240)` | `bg oklch(0.3 0.08 240) · text oklch(0.82 0.12 240)` |
| `pintando`    | Pintando    | `bg oklch(0.94 0.04 305) · text oklch(0.45 0.12 305)` | `bg oklch(0.32 0.1 305) · text oklch(0.84 0.13 305)` |
| `pintada`     | Pintada     | `bg oklch(0.94 0.05 145) · text oklch(0.4 0.13 145)` | `bg oklch(0.42 0.15 145) · text oklch(0.96 0.08 145) + glow box-shadow` |

El estado `pintada` en la variante C tiene un `box-shadow` sutil tipo glow (`0 0 10px oklch(0.5 0.15 145 / 0.35)`) — es intencional, refuerza el "logro".

## Tokens de juego

| Slug   | Nombre       | Short | Color A (tag)                                | Color C (pill)                          |
|--------|--------------|-------|-----------------------------------------------|-----------------------------------------|
| `40k`  | Warhammer 40K| `40K` | `bg oklch(0.95 0.03 30) · text oklch(0.4 0.1 30)`   | `bg oklch(0.28 0.08 30) · text oklch(0.82 0.14 30)` |
| `aos`  | Age of Sigmar| `AoS` | `bg oklch(0.95 0.03 195) · text oklch(0.4 0.08 195)` | `bg oklch(0.26 0.06 195) · text oklch(0.82 0.12 195)` |

Las pills de juego en C **deben tener `white-space: nowrap`** — sin esto se rompen en mobile cuando el nombre es largo.

## Tokens transversales

### Variante A
```
--bg-page:        #fafaf8
--bg-card:        #ffffff
--text-primary:   #1a1a1c
--text-secondary: #555550
--text-muted:     #888884
--border:         #ececea
--border-hover:   #d8d8d4
--accent:         #1a1a1c (monocromo)
--success:        oklch(0.5 0.15 145)

--radius-card:   12px
--radius-input:  10px
--radius-pill:   999px
--radius-tag:    4px
```

### Variante C
```
--bg-page:        #14110d
--bg-elev-1:      #1a160f
--bg-elev-2:      #2a251c
--text-primary:   #e8e4dc
--text-secondary: #c8bfa8
--text-muted:     #a09684
--text-dim:       #7a7060
--text-faded:     #4a4030
--border:         #2a251c
--border-subtle:  #1f1c15
--accent:         oklch(0.65 0.15 60)   /* ámbar brasa */
--success:        oklch(0.65 0.16 145)  /* verde pintada */

--radius-card:   3px            (mucho más cuadrado que A)
--radius-pill:   999px
```

### Espaciado (ambas)
- Header padding: 14px vertical, 16-18px horizontal
- List item padding: 12px
- Section gap: 8-12px
- Modal padding: 24-28px

### Tipografía mobile
- Logo: 14-17px, weight 600-700
- Nombre de mini: 14px, weight 500-600
- Meta secundaria: 11-12px, weight 400
- Datos numéricos (mono): 10-11px

## Datos de muestra

`source/data.js` define la forma de los datos de muestra que usa el prototipo:

```js
{
  games: [{ slug, name, short }],
  factions: [{ name, game }],
  minis: [{
    id, name, alt, game, factions, type,
    qty, models, points, status,
    /* ...campos extra de fotos, fechas, etc. */
  }],
  paints: [...],
  wishlist: [...]
}
```

`source/var-a.jsx` y `source/var-c.jsx` usan `window.WT_DATA` y `window.WT_HELPERS` (helpers tipo `computeStats`, `statusOrder`, `statusLabel`). En la app real, estos vienen del store/backend.

## Responsive

- **Breakpoint mobile**: ≤ 480px (los prototipos están a 420px de ancho)
- **Breakpoint desktop**: ≥ 900px (los prototipos están a 1140px)
- Layouts intermedios: que el grid de cards pase de 1 → 2 columnas alrededor de 720-800px funciona bien.

## Cómo abrir el prototipo localmente

1. Abre `source/WarTracker Redesign.html` en cualquier navegador moderno.
2. No necesita build — usa Babel standalone (los archivos `.jsx` se compilan en el cliente).
3. Verás un canvas con todas las pantallas de A, B (descartada) y C.
4. Click en cualquier artboard para entrar en focus mode (Esc para salir, ←/→ para navegar entre pantallas).

## Decisiones de implementación que conviene preservar

1. **Sticky header + tabs**: ambos quedan pegados al hacer scroll. Tabs justo debajo del header.
2. **Filter chips son toggleables**: clic en uno activo lo desactiva.
3. **Sort bar mantiene asc/desc** (no perder esto — funcionalidad ya existente en la app).
4. **Stats: cada facción es un `<details>` desplegable** — la primera de cada juego abierta por defecto, las demás cerradas. Reduce mucho la altura de la pantalla cuando hay muchas facciones.
5. **Status pills usan los 5 colores fijos** — no añadir más estados sin avisar al usuario.

## Archivos en este bundle

```
design_handoff/
├── README.md                          ← este archivo
├── screenshots/
│   └── overview.png                   ← canvas completo con todas las pantallas
└── source/
    ├── WarTracker Redesign.html       ← prototipo entry point (ábrelo en navegador)
    ├── var-a.jsx                      ← variante A (Minimal refinado) — todo el CSS y componentes
    ├── var-c.jsx                      ← variante C (Oscuro atmosférico) — todo el CSS y componentes
    ├── data.js                        ← datos de muestra y helpers
    └── design-canvas.jsx              ← componente del canvas de presentación (NO copiar a la app)
```

## Próximos pasos sugeridos

1. **Lee `source/var-a.jsx` y `source/var-c.jsx` enteros** — son monolíticos pero todo el sistema (CSS + componentes) está en cada uno, autocontenido. Lee el CSS al principio del archivo: te da el sistema de tokens de un vistazo.
2. **Abre el HTML en navegador** para ver el comportamiento real (hovers, sort toggles, details desplegables).
3. **Pregunta al usuario** qué variante quiere antes de migrar. Si quiere A, puedes ignorar `var-c.jsx`. Si quiere C, ignorar `var-a.jsx`.
4. **Empieza por el sistema de tokens** (colores, fonts, spacing) en el código real, luego un componente compartido (Status Pill, Game Pill), luego pantalla por pantalla en orden: Colección → Stats → Wishlist → Pinturas → Login → Modal.
