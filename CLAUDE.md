# WarTracker — Contexto de proyecto

## Stack
Vite · JS vanilla (ES modules, sin framework) · Supabase (PostgreSQL + Auth + Storage) · GitHub Pages + Actions · Vitest

Producción: https://xalgarra.github.io/wartracker

---

## Arquitectura

- Estado global: objeto `state` en `state.js`, compartido entre módulos. Sin reactividad.
- Flujo: cargar datos → modificar `state` → re-render manual.
- Event delegation: `data-action` + `e.target.closest()`. Sin `window.*`.
- Tabs: home → colección → stats → wishlist → pinturas. Cada vista carga al activarse.

### Módulos clave
- `main.js` → listeners globales
- `init.js` → inicialización + tabs
- `home.js` → dashboard
- `minis.js` / `mini-modal.js`
- `paints.js` / `paint-modal.js`
- `stats.js` · `wishlist.js`
- `camera.js` · `export.js` · `toast.js`

---

## Base de datos

- `units` → catálogo (lookup en `state.unitMap`)
- `minis` → colección (multi-facción con `factions[]`)
- `paints` → inventario
- RLS activo en todas las tablas

### Lógica clave
- `unitMap[name|faction|game] → points`
- Cross-game: `ptsPerGame()` suma por juego evitando duplicados (`seen`)

### SQL
- Nunca ejecutar directamente
- Crear archivo `sql/NN_nombre.sql`
- El usuario lo ejecuta en Supabase

---

## Reglas de desarrollo

- Cambios mínimos, directos y seguros
- No refactorizar sin pedirlo
- No abstracciones innecesarias
- Mantener JS simple (sin frameworks ni patrones complejos)
- No tocar archivos no mencionados
- Respuestas cortas

### Errores y UX
- Usar `mostrarError()` (toast), nunca `alert()`
- Mantener comportamiento actual salvo que se indique lo contrario

### Testing
- Vitest solo para funciones puras
- Mock de `db.js` con:
  `vi.mock('../db.js', () => ({ db: {} }))`

### Fotos
- Compresión en cliente (Canvas API, JPEG, máx 1200px, calidad 0.82)

---

## Comportamiento esperado (Senior Engineer)

- Priorizar simplicidad y mantenibilidad
- Evitar sobreingeniería
- Proponer mejoras si son claras (UX, lógica, datos)
- Detectar posibles bugs o edge cases
- Explicar decisiones de forma simple
- Cuestionar soluciones si hay una alternativa mejor

---

## Contexto del usuario

El usuario actúa como:
- Product owner
- Diseñador (UX/UI)
- Desarrollador

Adaptar respuestas a:
- Explicaciones claras y prácticas
- Mejoras de producto cuando aporten valor
- Evitar complejidad innecesaria

---

## Nota

Si falta contexto, preguntar antes de asumir.
No inferir comportamiento fuera del código proporcionado.