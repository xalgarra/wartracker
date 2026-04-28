# WarTracker — Inventario de funcionalidades

> Documento generado para análisis de producto. Describe el estado actual completo de la app.
> Stack: Vite · Vanilla JS (ES modules) · Supabase (PostgreSQL + Auth + Storage) · GitHub Pages

---

## Contexto de producto

WarTracker es una app web mobile-first para coleccionistas de miniaturas de wargames (actualmente Warhammer 40K y Age of Sigmar). Permite gestionar la colección de miniaturas, el inventario de pinturas, proyectos de pintura activos y una wishlist. Está pensada para uso personal (un usuario por cuenta Supabase).

---

## Sistema de autenticación

- Login con email + contraseña (Supabase Auth)
- Sesión persistente (se restaura en recarga)
- Logout
- Pantalla de login con estética terminal/hacker ("wartracker.ops")
- Mensaje de error en credenciales incorrectas
- Soporte dark mode desde el primer render (sin flash)

---

## Navegación

- **6 tabs**: Inicio, Colección, Estadísticas, Wishlist, Pinturas, Listas
- Tabs en barra horizontal con scroll horizontal y gradiente visual en el borde derecho
- Tab activo resaltado visualmente
- Cada tab carga datos al activarse (lazy loading)
- FAB (+) contextual: abre modal de mini o de pintura según el tab activo
- Header fijo con logo, estado online, botones de tema, exportar y cerrar sesión

---

## Tab: Inicio (Home)

### Proyectos activos
- Tarjetas de proyectos activos (clicables → abre modal de edición)
- Cada tarjeta muestra:
  - Foto de portada del proyecto (si existe)
  - Nombre del proyecto
  - Porcentaje de progreso medio de pintado (calculado sobre las minis del proyecto)
  - Barra de progreso visual
  - Chips de minis asignadas con su % individual
  - Swatches de color de las pinturas asignadas
  - Mensaje de ayuda si no hay minis ("toca para editar")
- Hover effect en las tarjetas (borde y fondo morado)
- Formulario inline para crear nuevo proyecto (input de nombre + botón Crear)
- Al crear, abre directamente el modal de edición del proyecto nuevo

### Dashboard de colección
- **Resumen global**: total de modelos, modelos pintados, % completado, puntos totales
- **Por juego**: barra de progreso por juego con puntos pintados / totales (AoS, 40K)
- **En proceso**: últimas 3 minis con status activo (pintando / imprimada / montada), con miniatura, estado y facción
- **Pendiente**: recuento de modelos sin pintar + barra segmentada por estado con leyenda
- **Últimas añadidas**: las 3 minis más recientes en la colección

### Historial de proyectos completados
- Lista de hasta 10 proyectos completados ordenados por fecha
- Cada fila: miniatura de foto (o placeholder), nombre, nº de minis, fecha de completado
- Badge verde "✓" en cada entrada

---

## Tab: Colección

### Filtros
- **Juego**: dropdown (todos los juegos / AoS / 40K / ...)
- **Facción**: dropdown que se actualiza según el juego seleccionado, muestra solo facciones con minis
- **Estado**: dropdown con todos los estados de pintado
- **Tipo de unidad**: dropdown dinámico (solo muestra tipos presentes en la colección filtrada)
- **Búsqueda por nombre**: input de texto con filtrado en tiempo real (client-side)

### Ordenación
- Botones: Reciente ↓ (por defecto), Nombre, Estado, Juego
- Toggle asc/desc al pulsar el mismo botón
- Label del botón activo muestra la dirección (↑ / ↓)

### Tarjeta de mini
- Miniatura de foto (si existe)
- Nombre de la unidad (soporte para nombres alternativos con `/`)
- Facciones (puede pertenecer a varias)
- Badges de juego (AoS / 40K), tipo de unidad, estado de pintado
- Puntos por juego (calculados desde el catálogo de unidades)
- Cantidad de unidades y modelos totales
- Badge de estado clicable → abre quick-picker de estado

### Quick-picker de estado
- Popup flotante al pulsar el badge de estado de una tarjeta
- Lista todos los estados con punto de color
- Resalta el estado actual
- Se cierra al seleccionar, al hacer clic fuera, o con Escape
- Actualiza la tarjeta en tiempo real sin recargar la lista

---

## Tab: Estadísticas

- **Resumen global**: total modelos, modelos pintados, % pintado
- **Agrupado por juego** y luego por facción
- Para cada juego: total de puntos, puntos pintados
- Para cada facción (desplegable `<details>`):
  - Primera facción abierta por defecto
  - Nombre, nº de entradas, modelos totales, modelos pintados
  - Puntos totales y pintados
  - Barra de progreso segmentada por estado (colores por estado)
  - Leyenda de estados con recuento
  - Lista completa de minis de la facción ordenada por estado + nombre, con pts, cantidad y modelos

---

## Tab: Wishlist

- Lista de minis con status "wishlist" separada de la colección principal
- Ordenadas alfabéticamente por nombre
- Cada ítem: nombre, facción, juego, notas, puntos si están en el catálogo
- Clicable para abrir el modal de edición (se puede mover a colección cambiando el estado)
- Vacío con mensaje de ayuda

---

## Tab: Pinturas

### Catálogo Citadel (búsqueda y quick-add)
- Input de búsqueda contra el catálogo interno de ~347 pinturas Citadel
- Resultados aparecen como dropdown al escribir (mín. 2 caracteres)
- Cada resultado: swatch de color, nombre, tipo de pintura
- Pinturas ya en el inventario muestran "×N +1" (N = cantidad actual) con fondo verde
- Quick-add: si no la tienes, la añade; si la tienes, suma +1 a la cantidad
- Botón de cámara para escáner de potes (ver sección Cámara)

### Inventario personal de pinturas
- Lista de todas las pinturas del usuario
- Cada ítem: swatch de color (o placeholder), nombre, marca, tipo, cantidad (si >1), badge "Sin stock"
- Clicable para abrir el modal de edición

### Filtros
- **Tipo**: dropdown con checkboxes múltiples (base / layer / shade / dry / contrast / technical / air / spray / texture / primer). El botón muestra los tipos seleccionados o "N tipos"
- **Stock**: dropdown radio (Todas / En stock / Sin stock)
- **Búsqueda**: por nombre o marca, en tiempo real

### Ordenación
- Nombre (por defecto, alfabético)
- Color (por tono HSL 0°–360°; sin color → al final)

---

## Modal: Añadir / Editar mini

- Foto: upload desde archivo, preview, cambiar, eliminar. Compresión client-side (JPEG, máx 1200px, calidad 0.82)
- Juego → Facción → Unidad (cascada de selects)
- Nombre personalizado (si la unidad lo permite)
- Facciones adicionales (una mini puede pertenecer a múltiples facciones / juegos)
- Cantidad (cajas o lotes)
- Modelos por unidad (opcional, para calcular el total de modelos de la caja)
- Estado (comprada / montada / imprimada / pintando / pintada / wishlist)
- Notas libres
- Botones: Cancelar, Guardar, Eliminar (solo en edición)
- Detección de la unidad en el catálogo para autocompletar datos

---

## Modal: Añadir / Editar pintura

- Marca (input con datalist de marcas conocidas + marcas del usuario)
- Nombre (input con datalist de nombres del catálogo Citadel filtrado por marca)
- Tipo (select con todos los tipos)
- Checkbox "Definir color" → abre color picker + botón de búsqueda en Google
- Cantidad de potes
- Checkbox "En stock"
- Botón de cámara para escanear el pote
- Validación anti-duplicado (misma marca + nombre + tipo)
- Botones: Cancelar, Guardar, Eliminar (solo en edición)

---

## Modal: Proyectos

### Abrir / crear
- Al crear un proyecto desde home, se abre el modal automáticamente
- Al pulsar una tarjeta de proyecto existente, se abre en modo edición

### Contenido del modal
- Foto del proyecto: upload, preview, cambiar, eliminar (Supabase Storage bucket `project-photos`)
- Nombre del proyecto (input de texto)
- **Minis**: lista de minis asignadas con campo de % pintado editable (0–100) que se guarda en tiempo real
- **Pinturas**: lista de pinturas asignadas con swatch de color, nombre, marca
- Búsqueda de minis para añadir: excluye minis ya en cualquier proyecto activo y minis con status "pintada"
- Búsqueda de pinturas para añadir: excluye pinturas ya en el proyecto
- Los resultados de búsqueda muestran facción y marca respectivamente
- Añadir / eliminar minis y pinturas sin recargar la página (recarga solo el modal)
- Botón **Completar ✓**: marca todas las minis del proyecto como "pintada" y cierra el proyecto (pasa a historial)
- Botón **Eliminar**: elimina el proyecto (con confirmación)
- Guardar: guarda nombre y foto
- Al cerrar, recarga el home

---

## Cámara (escáner de potes)

- Accesible desde el tab de pinturas (botón 📷) y desde el modal de pintura (botón 📷)
- Abre overlay con feed de la cámara del dispositivo
- Guía de encuadre visual
- Botón de captura: toma una foto y la envía a la API de identificación
- Mientras procesa: spinner "Identificando…"
- Resultado: swatch con el color detectado, nombre y tipo de la pintura
- Opciones: Reintentar (vuelve a la cámara) o Añadir (añade al inventario)

---

## Exportación

- Botón en el header: descarga un JSON con toda la colección y pinturas
- Formato: `{ wartracker_export: "1.0", exported_at, minis: [...], paints: [...] }`
- Nombre de archivo con fecha: `wartracker-YYYY-MM-DD.json`
- Toast de éxito con el recuento exportado

---

## Dark mode

- Toggle con botón 🌙 en el header
- Persiste en `localStorage` como `wt_theme`
- Respeta `prefers-color-scheme` del sistema si no hay preferencia guardada
- Aplicado antes del render para evitar flash (script inline en `<head>`)

---

## Sistema de notificaciones (Toast)

- Toasts de error (rojo) y éxito (verde)
- Aparecen en la esquina, se desvanecen automáticamente
- No bloquean la UI

---

## Base de datos (Supabase / PostgreSQL)

### Tablas principales
| Tabla | Descripción |
|-------|-------------|
| `minis` | Colección del usuario. Campos: id, name, factions (array), status, qty, models, photo_url, notes, paint_progress, created_at |
| `paints` | Inventario de pinturas. Campos: id, brand, name, type, color_hex, quantity, in_stock |
| `units` | Catálogo de unidades (lookup). Campos: name, faction, game_slug, points, type |
| `factions` | Catálogo de facciones. Campos: name, game_slug |
| `games` | Catálogo de juegos. Campos: slug, name |
| `projects` | Proyectos de pintura. Campos: id, name, photo_url, status (activo/completado), completed_at, created_at |
| `project_minis` | Relación proyecto ↔ mini. Campos: id, project_id, mini_id, notes |
| `project_paints` | Relación proyecto ↔ pintura. Campos: id, project_id, paint_id |

### Storage
| Bucket | Uso |
|--------|-----|
| `mini-photos` | Fotos de miniaturas (4 policies: read público, write autenticado) |
| `project-photos` | Fotos de proyectos (4 policies: read público, write autenticado) |

### RLS
- Todas las tablas con Row Level Security activo
- Cada usuario solo ve y modifica sus propios datos

---

## Catálogo de pinturas Citadel (interno)

- ~347 pinturas hardcodeadas en `js/paint-colors.js`
- Campos por entrada: `name`, `type`, `hex` (color hexadecimal, opcional)
- Tipos cubiertos: base, layer, shade, dry, contrast, technical, texture, spray, air, primer
- Usado para: búsqueda de catálogo, quick-add, sugerencias de nombre en el modal, cámara

---

## Vistas que necesitan capturas

Para completar este documento con screenshots, captura manualmente las siguientes vistas (F12 → toggle device toolbar para mobile):

1. **Login** — pantalla inicial
2. **Home / Inicio** — con proyectos, dashboard y historial
3. **Colección** — lista de tarjetas con filtros y sort bar
4. **Modal mini** — abierto en modo edición con foto
5. **Estadísticas** — con un ejército expandido
6. **Wishlist** — con items
7. **Pinturas** — con catálogo dropdown abierto
8. **Pinturas** — con filtro de tipo abierto
9. **Modal pintura** — abierto
10. **Modal proyecto** — abierto con minis y pinturas
11. **Quick-picker de estado** — popup flotante sobre una tarjeta
12. **Home dark mode** — mismo que home pero en tema oscuro
