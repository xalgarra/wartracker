# WarTracker · Fase 1 — Dashboard / Home · Handoff para Claude Code

## Qué se está implementando

Una **nueva pantalla de inicio** (`Inicio`) que sustituye a `Colección` como vista por defecto al abrir la app.

Objetivo: que el usuario abra WarTracker y piense *"sé cómo voy y sé qué mini puedo tocar ahora"*.

Mira los screenshots en `screenshots/dashboard-mobile.png` y `screenshots/dashboard-desktop.png` para el resultado visual.

## Archivos en este handoff

```
design_handoff/
  README.md                    ← este archivo
  source/
    home.js                    ← módulo nuevo, copiar tal cual a src/home.js
    home.css                   ← estilos nuevos, anexar al final de css/style.css
  screenshots/
    dashboard-mobile.png       ← referencia visual móvil
    dashboard-desktop.png      ← referencia visual desktop
```

## Plan de implementación (en orden)

### 1. Copiar `source/home.js` → `src/home.js`
Listo. Sin cambios. Reutiliza `db`, `state`, `STATUSES`, `STATUS_ORDER`, `abrirEdicion`, `cambiarStatusRapido`, `cambiarTab`. El módulo expone `cargarHome()`.

### 2. Anexar `source/home.css` al final de `css/style.css`
Las clases empiezan todas por `.home-` para no chocar con nada. Reutiliza `.badge`, `.badge-status.*`, `.progress-seg.*`, `.legend-dot.*` que ya tienes.

### 3. Editar `index.html`
Añadir la pestaña Inicio **al principio** y un contenedor de vista. Deja Colección visible pero ya **no es la activa**.

```html
<!-- en .tabs, antes de tab-coleccion -->
<button class="tab active" id="tab-home">Inicio</button>
<button class="tab" id="tab-coleccion">Colección</button>     <!-- quitar 'active' -->
<button class="tab" id="tab-stats">Estadísticas</button>
<button class="tab" id="tab-wishlist">Wishlist</button>
<button class="tab" id="tab-pinturas">Pinturas</button>
```

```html
<!-- nueva vista, justo antes de #vista-coleccion -->
<div id="vista-home">
  <div id="home-content" class="home-container"></div>
</div>

<!-- en #vista-coleccion: añadir style="display:none" -->
<div id="vista-coleccion" style="display:none">
  ...
</div>
```

### 4. Editar `src/state.js`
Cambiar el tab por defecto:
```js
tabActual: 'home',   // antes: 'coleccion'
```

### 5. Editar `src/init.js`
- Importar `cargarHome`:
```js
import { cargarHome } from './home.js'
```
- En `cambiarTab(tab)` añadir las líneas Home:
```js
document.getElementById('vista-home').style.display     = tab === 'home'      ? 'block' : 'none'
document.getElementById('vista-coleccion').style.display = tab === 'coleccion' ? 'block' : 'none'
// ...
document.getElementById('tab-home').classList.toggle('active', tab === 'home')
document.getElementById('tab-coleccion').classList.toggle('active', tab === 'coleccion')
// ...
if (tab === 'home') cargarHome()
```

### 6. Editar `src/main.js`
- Listener de la nueva pestaña:
```js
document.getElementById('tab-home')?.addEventListener('click', () => cambiarTab('home'))
```
- En el bootstrap final, tras `mostrarApp()`, llamar también a `cargarHome()` para que la vista por defecto cargue datos en el primer render. Si `mostrarApp` ya invoca `inicializar()`, basta con asegurar que después se llame a `cargarHome()` (puede ir dentro de `inicializar()` o aquí mismo).

### 7. Refrescar Home tras crear/editar/borrar mini
En `mini-modal.js`, tras `guardarMini()` y `eliminarMini()`, si `state.tabActual === 'home'`, llamar a `cargarHome()`. Mismo patrón que ya hay para refrescar `cargarMinis()` desde Colección.

## Reglas de negocio (Fase 1)

- **Hero** = mini con prioridad `pintando` > `imprimada` > `montada` > `comprada`. Si no hay ninguna, vista vacía con CTA.
- **En cola** = minis con estado `pintando | imprimada | montada` (excluyendo el hero), top 3.
- **Últimas añadidas** = top 3 por `created_at desc`.
- **Resumen general** = sobre minis con `status != 'wishlist'`.
- **Pts por mini** se calculan vía `state.unitMap` (mismo patrón que `stats.js`).

## Lo que NO entra en Fase 1

Objetivos semanales, listas de ejército, IA, calendario, activity log, comparativas históricas. Todo eso queda fuera. El módulo está pensado para ser ampliado en Fases 2+ sin reescribirlo.

## Notas

- Acción "cambiar estado" desde el hero llama a `cambiarStatusRapido()` (ya existente) y refresca el dashboard.
- El hero usa `photo_url` si existe (con fade a la derecha como detalle visual).
- Tema light tiene overrides al final de `home.css`. El hero se mantiene oscuro en ambos temas para no perder peso.
- Sin cambios en SQL: usa la tabla `minis` tal cual.
