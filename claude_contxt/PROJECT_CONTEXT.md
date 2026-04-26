# WarTracker — Contexto de proyecto

**Stack:** Vite + JS vanilla (ES modules, sin framework) · Supabase (PostgreSQL + Auth + Storage) · GitHub Pages + Actions · Vitest

**Producción:** https://xalgarra.github.io/wartracker · Supabase: yxmviaviyglyemoyqfws

---

## Arquitectura

Estado global: objeto `state` en `state.js`, importado por todos los módulos. Sin reactividad.

Event delegation: el HTML dinámico usa `data-action` / `data-mini-id`. Listeners en contenedores estáticos con `e.target.closest('[data-action]')`. Sin `window.*`.

Módulos clave: `main.js` (listeners), `init.js` (cambiarTab + inicializar), `home.js` (dashboard, pestaña por defecto), `minis.js`, `mini-modal.js`, `paints.js`, `paint-modal.js`, `stats.js`, `wishlist.js`, `camera.js`, `export.js`, `toast.js`

Tabs: home → coleccion → stats → wishlist → pinturas. Cada una carga datos al activarse.

---

## Base de datos

- `units(name, faction, game_slug, points, type)` — catálogo. Lookup: `state.unitMap[name|faction|game_slug] → points`
- `minis(name, factions[], status, qty, models, photo_url, created_at)` — colección
- `paints(brand, name, type, color_hex, in_stock, quantity)` — pinturas
- RLS en todas las tablas. `units/factions/games` son read-only.

Cross-game: `factions[]` array. `ptsPerGame()` itera todas las facciones y acumula pts por cada juego con entrada en unitMap (evita doble-conteo con `seen`).

SQL: cambios manuales en Supabase SQL Editor, guardados en `sql/NN_name.sql`.

---

## Reglas de trabajo

- Cambios mínimos. No refactorizar más allá de la tarea.
- No abstracciones prematuras. Tres líneas similares no justifican un helper.
- Sin comentarios salvo que el WHY sea no obvio.
- Errores → `mostrarError()` de `toast.js`. Nunca `alert()`.
- Tests: Vitest, mockear `db.js` con `vi.mock('../db.js', () => ({ db: {} }))`. Solo funciones puras exportadas.
- Fotos: compresión Canvas API en cliente antes de subir (JPEG, 1200px, 0.82).
