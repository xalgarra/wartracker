# WarTracker — Contexto del proyecto

## Qué es
App web personal para gestionar una colección de miniaturas de Warhammer (40K y Age of Sigmar). Accesible desde móvil y PC, con login, datos persistentes en la nube y diseño mobile-first.

## Stack
- **Frontend**: HTML + CSS + JavaScript vanilla (un solo archivo `index.html`)
- **Base de datos**: Supabase (PostgreSQL en la nube, gratuito)
- **Auth**: Supabase Auth (email + contraseña)
- **Hosting**: GitHub Pages, rama `release`
- **Editor**: VS Code con Live Server para desarrollo local

## URLs
- **App en producción**: https://xalgarra.github.io/wartracker
- **Repositorio**: https://github.com/xalgarra/wartracker
- **Supabase proyecto**: https://yxmviaviyglyemoyqfws.supabase.co

## Estructura del repositorio
```
wartracker/
  index.html         # Toda la app
  sql/
    01_create_tables.sql
    02_rls_policies.sql
```

## Base de datos

### Tablas
**`games`** — juegos disponibles
| columna | tipo |
|---------|------|
| id | serial PK |
| name | text |
| slug | text UNIQUE |

Datos: `{ name: 'Warhammer 40K', slug: '40k' }`, `{ name: 'Age of Sigmar', slug: 'aos' }`

**`factions`** — facciones por juego
| columna | tipo |
|---------|------|
| id | serial PK |
| name | text |
| game_slug | text FK → games.slug |

Contiene todas las facciones oficiales de 40K y AoS (aprox. 25 por juego).

**`minis`** — colección del usuario
| columna | tipo | notas |
|---------|------|-------|
| id | int8 PK | autoincrement |
| created_at | timestamptz | default now() |
| name | text | nombre de la unidad |
| faction | text | FK lógica → factions.name |
| game | text | FK → games.slug |
| qty | int4 | default 1 |
| status | text | comprada / montada / imprimada / pintada |
| notes | text | notas libres |

### Seguridad
- RLS activado en todas las tablas
- `minis`: solo usuarios autenticados pueden leer y escribir
- `games` y `factions`: solo usuarios autenticados pueden leer
- Un único usuario creado manualmente en Supabase Auth

## Flujo de trabajo Git
- **`master`**: rama de desarrollo
- **`release`**: rama de producción (GitHub Pages despliega desde aquí)

Flujo para publicar:
```bash
# Desarrollar en master
git add .
git commit -m "descripción"
git push

# Publicar
git checkout release
git merge master
git push
git checkout master
```

## Estado actual de la app
- ✅ Login con email/contraseña
- ✅ Sesión persistente (no pide login cada vez)
- ✅ Añadir minis con nombre, juego, facción, cantidad, estado y notas
- ✅ Facciones cargadas desde Supabase, filtradas por juego
- ✅ Lista de minis en tarjetas
- ✅ Filtros por juego, facción y estado
- ✅ Diseño mobile-first, funciona en móvil y PC
- ✅ Modal con botón flotante "+" para añadir
- ✅ Cerrar sesión

## Pendiente (próximos pasos)
- [ ] Editar una mini existente
- [ ] Borrar una mini
- [ ] Estadísticas / resumen de la colección (cuántas pintadas, progreso por facción...)
- [ ] Mejoras de diseño

## Perfil del desarrollador
- Background en Swift (iOS)
- Aprendiendo JavaScript sobre la marcha
- Objetivo: entender el código, no solo copiarlo

## Notas importantes
- Las claves de Supabase están hardcodeadas en `index.html` (la `anon key` es pública por diseño, pero no compartir la `service_role key`)
- Los cambios de estructura en Supabase se hacen manualmente desde el SQL Editor y se guardan en la carpeta `sql/` como historial
- Live Server en VS Code sirve el archivo en `http://127.0.0.1:5500` evitando errores de seguridad de `file://`
