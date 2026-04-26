# WarTracker — Resumen del proyecto

## Qué es

App web personal para gestionar una colección de miniaturas de Warhammer (40K y Age of Sigmar).
Permite llevar un registro de qué tienes, en qué estado de pintura están, cuántos puntos tienes por facción, qué quieres comprar (wishlist) y qué pinturas tienes en el taller.

Accesible desde móvil y PC, con login personal, datos en la nube y modo oscuro.

- **App en producción**: https://xalgarra.github.io/wartracker
- **Repositorio**: https://github.com/xalgarra/wartracker
- **Supabase**: https://yxmviaviyglyemoyqfws.supabase.co

---

## Funcionalidades implementadas

### Autenticación
- Login con email y contraseña (Supabase Auth).
- Sesión persistente: no pide login en cada visita.
- Botón de cerrar sesión en el header.

### Dashboard / Inicio (pestaña por defecto)
- **Vista hero**: muestra la mini más avanzada en pintura (prioridad: pintando > imprimada > montada > comprada) con foto de fondo, nombre, facción y pts. Botón para abrir el modal de edición.
- **Cambio rápido de estado**: pastillas directamente en el hero para cambiar el status sin abrir el modal.
- **Resumen comprimido**: 4 métricas en una fila — modelos totales, pintados, % completado, pts totales.
- **Por juego**: barra de progreso de pts pintados/totales por sistema de juego. Las minis cross-game cuentan en ambos sistemas con los pts correspondientes de cada uno.
- **En cola**: las 3 minis más avanzadas después del hero (estados pintando/imprimada/montada).
- **Backlog**: número de modelos pendientes + barra segmentada por estado con leyenda.
- **Últimas añadidas**: las 3 minis más recientes.
- Se refresca automáticamente al guardar o eliminar una mini.

### Colección de minis
- Añadir una mini con: nombre (selector con autocompletado del catálogo), juego, una o varias facciones, cantidad, número de modelos por unidad, estado de pintura y notas.
- **Multi-facción**: una mini puede pertenecer a varias facciones a la vez (p.ej. daemons de Tzeentch que están en Thousand Sons y en Disciples of Tzeentch). Se guarda como array en BD.
- **Puntos automáticos**: al seleccionar el nombre de la unidad se rellena automáticamente los puntos desde el catálogo. Se muestra en la tarjeta por juego.
- **Foto de la mini**: se puede adjuntar una foto desde el dispositivo o tomar una con la cámara. La imagen se comprime en cliente (Canvas API, JPEG, máx. 1200px, calidad 0.82) antes de subirse a Supabase Storage.
- Editar y eliminar cualquier mini existente.
- **Estados de pintura**: Comprada → Montada → Imprimada → Pintando → Pintada.
- **Cambio rápido de estado**: clic en el badge de estado de una tarjeta abre un picker flotante sin entrar al modal.

### Filtros y búsqueda (colección)
- Filtro por juego (40K / AoS).
- Filtro por facción (se actualiza según el juego seleccionado).
- Filtro por estado de pintura.
- Filtro por tipo de unidad (personaje, infantería, élite, vehículo…).
- Búsqueda por nombre (filtrado en cliente, sin llamadas a BD).
- Ordenar por: fecha de creación, nombre, estado (ascendente/descendente).

### Estadísticas (pestaña Stats)
- Resumen global: total de modelos, pintados, % pintado.
- Desglose por juego y por facción:
  - Número de entradas y modelos totales/pintados.
  - Puntos totales y puntos pintados.
  - Barra de progreso de pintura (ponderada por número de modelos).
  - Lista de minis con estado y puntos, ordenadas por estado.

### Wishlist
- Lista separada de minis con estado `wishlist` (no aparecen en la colección ni en stats).
- Muestra nombre, juego, facción, notas y puntos si el nombre coincide con una unidad del catálogo.

### Inventario de pinturas
- Registrar pinturas con: marca, nombre, tipo (base/shade/layer/contrast…), color (picker hex), cantidad en taller, y si hay stock.
- **Autocompletado del catálogo Citadel**: al escribir el nombre rellena automáticamente el color hex y el tipo desde el catálogo local (`js/paint-colors.js`).
- **Búsqueda rápida por catálogo**: barra de búsqueda que muestra sugerencias del catálogo Citadel. Si ya tienes la pintura, la marca como "✓ tengo"; si no, la añade con un clic.
- Filtros: por tipo, por stock (tengo/sin stock) y búsqueda por nombre o marca.
- Botón para buscar el color en Google si no está en el catálogo.

### Cámara / identificación con IA
- Overlay de cámara para apuntar a un pote de pintura.
- Captura la imagen y la envía a Gemini 2.5 Flash (via Supabase Edge Function) que devuelve marca, nombre, tipo y color hex del pote.
- Se puede usar desde el catálogo de búsqueda (para añadir directamente) o desde el modal de edición de pintura.

### Exportar colección (backup JSON)
- Botón `↓` en el header descarga un JSON con todas las minis y pinturas del usuario.
- Formato: `{ wartracker_export, exported_at, minis: [...], paints: [...] }`.
- Muestra toast de confirmación con el número de registros exportados.

### Notificaciones (toasts)
- Sistema centralizado de notificaciones tipo toast en esquina inferior.
- Dos variantes: error (rojo) y éxito (verde), con animación de entrada/salida.
- Reemplaza todos los `alert()` anteriores.

### Dark mode
- Tema claro/oscuro con un botón en el header.
- La preferencia se guarda en `localStorage` y persiste entre sesiones.
- En la primera visita respeta la preferencia del sistema operativo (`prefers-color-scheme`).
- Sin parpadeo al cargar (script inline que aplica el tema antes de pintar la página).

---

## Stack técnico

| Capa | Herramienta | Para qué |
|------|-------------|----------|
| Build tool | **Vite 8** | Servidor de desarrollo con HMR, empaquetado para producción |
| Frontend | **HTML + CSS + JS vanilla** | Sin framework. ES Modules nativos. |
| Base de datos | **Supabase (PostgreSQL)** | Datos persistentes en la nube, gratuito |
| Autenticación | **Supabase Auth** | Login email/contraseña, sesión JWT |
| Almacenamiento | **Supabase Storage** | Fotos de minis |
| IA | **Gemini 2.5 Flash** | OCR de potes de pintura (via Edge Function) |
| Edge Function | **Supabase Edge Function** | Proxy seguro a Gemini (para no exponer la API key) |
| Testing | **Vitest** | Tests unitarios de funciones puras |
| Hosting | **GitHub Pages** | Gratuito, despliega automáticamente |
| CI/CD | **GitHub Actions** | Build + deploy automático en cada push a `master` |
| Editor | **VS Code** | `Ctrl+Shift+B` lanza `npm run dev` |

---

## Arquitectura del código

### Módulos (`src/`)

```
src/
  main.js        → Entry point: registra todos los event listeners con
                   event delegation, arranca la sesión de Supabase.
  db.js          → Instancia única del cliente Supabase.
  state.js       → Estado global compartido (objeto mutable único, alternativa
                   simple a un store reactivo). tabActual: 'home' por defecto.
  constants.js   → Listas estáticas: estados, tipos de pintura, tipos de unidad,
                   marcas de pinturas.
  auth.js        → login, logout, toggleDarkMode, mostrarApp.
  init.js        → inicializar (carga games/factions/units en paralelo),
                   cambiarTab (gestiona todas las pestañas incluyendo home).
  home.js        → Dashboard "Inicio": cargarHome, hero, resumen, por juego,
                   cola, backlog, últimas añadidas. Refresca tras guardar/borrar.
  minis.js       → cargarMinis, renderLista, filtros, ordenación,
                   cambiarStatusRapido, calcularPtsPorJuego.
  mini-modal.js  → Modal de añadir/editar mini: abrir, cerrar, guardar,
                   eliminar, foto (con compresión Canvas API).
  stats.js       → cargarStats, calcularGlobales (export para tests).
  wishlist.js    → cargarWishlist, renderWishlist.
  paints.js      → cargarPinturas, filtros, búsqueda catálogo Citadel, quickAdd.
  paint-modal.js → Modal CRUD de pinturas (separado de paints.js para evitar
                   imports circulares).
  camera.js      → Overlay de cámara, captura, llamada a Edge Function,
                   confirmación del resultado.
  export.js      → exportarJSON: descarga backup con minis y pinturas.
  toast.js       → mostrarToast, mostrarError, mostrarExito.

  __tests__/
    stats.test.js  → 8 tests para calcularGlobales
    minis.test.js  → 16 tests para getTypeForMini, calcularPtsPorJuego, filtros
    home.test.js   → 10 tests para pickHero, modelsFor
```

### Patrón de estado compartido

No hay framework reactivo. Todos los módulos importan el mismo objeto `state` de `state.js`. Cuando un módulo modifica `state.algo`, el siguiente render lo leerá actualizado.

### Event delegation (sin window.*)

El HTML renderizado dinámicamente usa atributos `data-action` y `data-mini-id`. Un único listener por contenedor (`#lista`, `#lista-wishlist`, etc.) captura los clics y delega con `e.target.closest('[data-action]')`. Esto sustituye el patrón anterior de `window.funcion = funcion`.

### Catálogo de unidades

Tabla `units` en Supabase con `(name, faction, game_slug, points, type)`. Al arrancar se carga todo en `state.unitMap` como lookup `name|faction|game_slug → points`. Esto permite mostrar puntos instantáneamente sin queries adicionales.

### Cross-game (unidades compartidas)

Los daemons de Tzeentch existen en AoS (Disciples of Tzeentch) y en 40K (Thousand Sons) con el mismo nombre exacto. Al añadir una mini de ese tipo aparece un checkbox para marcar que también pertenece a la otra facción/juego.

En el Dashboard, la función `ptsPerGame()` itera todas las facciones de una mini y acumula los pts en **cada juego** en que tiene entrada (con `seen` para evitar contar el mismo juego dos veces). Así una mini cross-game aparece en los totales de ambos sistemas con los pts correctos de cada uno.

---

## Base de datos

### Tablas

**`games`** — juegos disponibles (`40k`, `aos`)

**`factions`** — facciones de cada juego
| columna | tipo |
|---------|------|
| id | serial PK |
| name | text |
| game_slug | text → games.slug |

**`units`** — catálogo de unidades
| columna | tipo | notas |
|---------|------|-------|
| id | serial PK | |
| name | text | nombre de la unidad |
| faction | text | facción a la que pertenece |
| game_slug | text | 40k / aos |
| points | int | puntos (puede ser null) |
| type | text | personaje / infantería / élite / vehículo… |

**`minis`** — colección del usuario
| columna | tipo | notas |
|---------|------|-------|
| id | int8 PK | |
| name | text | nombre de la unidad |
| factions | text[] | array de facciones (multi-facción) |
| game | text | 40k / aos |
| qty | int | cantidad de cajas/kits |
| models | int | modelos por caja (null = 1) |
| status | text | comprada/montada/imprimada/pintando/pintada/wishlist |
| notes | text | notas libres |
| photo_url | text | URL en Supabase Storage |
| user_id | uuid | propietario (RLS) |
| created_at | timestamptz | fecha de creación (auto) |

**`paints`** — inventario de pinturas
| columna | tipo | notas |
|---------|------|-------|
| id | int8 PK | |
| brand | text | Citadel, Vallejo… |
| name | text | nombre del pote |
| type | text | base/shade/layer/contrast… |
| color_hex | text | color del pote (puede ser null) |
| in_stock | boolean | si quedan en el taller |
| quantity | int | número de potes (default 1) |
| user_id | uuid | propietario (RLS) |

### Seguridad (RLS)

Row Level Security activado en todas las tablas. Cada usuario solo ve y puede modificar sus propios datos. `games`, `factions` y `units` son de solo lectura para usuarios autenticados.

---

## Estructura del repositorio

```
wartracker/
  index.html               ← UI completa (sin inline handlers, usa data-action)
  vite.config.js           ← base: '/wartracker/' para GitHub Pages + Vitest config
  package.json             ← scripts: dev, build, test, test:watch
  .env.local               ← VITE_SUPABASE_URL y VITE_SUPABASE_KEY (gitignored)

  src/                     ← módulos JS (ES modules)
    main.js, db.js, state.js, constants.js
    auth.js, init.js
    home.js                ← dashboard (nuevo, pestaña por defecto)
    minis.js, mini-modal.js
    stats.js, wishlist.js
    paints.js, paint-modal.js
    camera.js
    export.js              ← backup JSON
    toast.js               ← notificaciones
    __tests__/             ← Vitest: 34 tests
      stats.test.js, minis.test.js, home.test.js

  css/
    style.css              ← todos los estilos, CSS custom properties

  js/
    paint-colors.js        ← catálogo Citadel offline (~500 pinturas) + PAINT_COLORS

  sql/                     ← migraciones numeradas (historial, ejecutar en Supabase)
    01_create_tables.sql
    03_units_catalog.sql   ← catálogo completo de unidades
    05_units_catalog_fixes.sql
    06_units_points.sql    ← puntos por unidad (MFM v4.2 Abril 2026)
    07–09                  ← correcciones Thousand Sons y cross-game daemons
    10_minis_models.sql    ← columna models
    11_unit_types.sql      ← columna type en units
    12_idoneth_catalog_fixes.sql
    13_dot_catalog_fixes.sql
    14_dedup_idoneth.sql
    15_minis_photo.sql     ← columna photo_url
    16_paints.sql          ← tabla paints
    17_paints_quantity.sql ← columna quantity
    18_diagnostico_pts.sql ← queries de diagnóstico (solo SELECT, no modifica)

  design_handoff/          ← specs de diseño para Claude Code
    README.md, source/home.js, source/home.css, screenshots/

  claude_contxt/
    CONTEXT.md             ← este fichero

  .github/workflows/
    deploy.yml             ← GitHub Actions: npm ci → build → deploy Pages
  .vscode/
    tasks.json             ← Ctrl+Shift+B = npm run dev
```

---

## Flujo de desarrollo

```bash
npm run dev      # servidor local en http://localhost:5173/wartracker/
                 # (o Ctrl+Shift+B en VS Code)

npm test         # ejecuta los 34 tests con Vitest
npm run test:watch  # modo watch para TDD

# Subir cambios → el deploy a GitHub Pages es automático:
git add src/algo.js
git commit -m "descripción"
git push         # GitHub Actions hace el build y despliega
```

Las claves de Supabase van en `.env.local` (no se sube al repo). En GitHub Actions se configuran como Secrets del repositorio (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`).

Los cambios de estructura en BD se hacen manualmente en el SQL Editor de Supabase y se guardan en `sql/` como historial numerado.
