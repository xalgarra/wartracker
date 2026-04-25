;(function initTheme() {
  const saved = localStorage.getItem('wt_theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.body.classList.add('dark')
  }
})()

const { createClient } = supabase
const db = createClient(
  'https://yxmviaviyglyemoyqfws.supabase.co',
  'sb_publishable_P4QRQ6nMPQKvLYvVN_shaQ_8ixoMhPw'
)


let games = []
let factions = []
let units = []
let unitMap = {}
let typeMap = {}
let minisActuales = []
let wishlistActuales = []
let pinturas = []
let miniEnEdicion = null
let paintEnEdicion = null
let tabActual = 'coleccion'
let pendingPhotoFile = null
let pendingPhotoRemove = false
let filtroNombre = ''
let filtroType = ''
let ordenar = 'reciente'
let sortDir = 'desc'

// --- AUTH ---

async function login() {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const { error } = await db.auth.signInWithPassword({ email, password })
  if (error) {
    document.getElementById('error-msg').style.display = 'block'
  } else {
    mostrarApp()
  }
}

async function logout() {
  await db.auth.signOut()
  document.getElementById('app-screen').style.display = 'none'
  document.getElementById('login-screen').style.display = 'block'
}

function toggleDarkMode() {
  const dark = document.body.classList.toggle('dark')
  localStorage.setItem('wt_theme', dark ? 'dark' : 'light')
  const btn = document.getElementById('btn-theme')
  if (btn) btn.textContent = dark ? '☀️' : '🌙'
}

async function mostrarApp() {
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('app-screen').style.display = 'block'
  const btn = document.getElementById('btn-theme')
  if (btn) btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙'
  await inicializar()
}

async function inicializar() {
  const [{ data: gamesData }, { data: factionsData }, { data: unitsData }] = await Promise.all([
    db.from('games').select('*').order('name'),
    db.from('factions').select('*').order('name'),
    db.from('units').select('name, faction, game_slug, points, type')
  ])
  games = gamesData || []
  factions = factionsData || []
  units = unitsData || []
  unitMap = {}
  typeMap = {}
  for (const u of units) {
    const key = `${u.name}|${u.faction}|${u.game_slug}`
    unitMap[key] = u.points
    if (u.type) typeMap[key] = u.type
  }

  document.getElementById('game').innerHTML = games.map(g =>
    `<option value="${g.slug}">${g.name}</option>`
  ).join('')

  document.getElementById('filtro-game').innerHTML =
    '<option value="">Todos los juegos</option>' +
    games.map(g => `<option value="${g.slug}">${g.name}</option>`).join('')

  actualizarFacciones()
  await actualizarFiltroFacciones()
}

// --- MODAL: cascada game → faction → units ---

function actualizarFacciones() {
  const gameSlug = document.getElementById('game').value
  const filtradas = factions.filter(f => f.game_slug === gameSlug)
  document.getElementById('faction').innerHTML = filtradas.map(f =>
    `<option value="${f.name}">${f.name}</option>`
  ).join('')
  actualizarUnidades()
}

async function actualizarUnidades() {
  const faction = document.getElementById('faction').value
  const game = document.getElementById('game').value

  const { data } = await db.from('units').select('name')
    .eq('faction', faction).eq('game_slug', game).order('name')

  document.getElementById('unit-select').innerHTML =
    '<option value="">— Selecciona unidad —</option>' +
    (data || []).map(u => `<option value="${u.name}">${u.name}</option>`).join('') +
    '<option value="__custom__">Otro (personalizado)...</option>'

  onUnitChange()
}

async function onUnitChange() {
  const val = document.getElementById('unit-select').value
  const customInput = document.getElementById('name-custom')

  customInput.style.display = val === '__custom__' ? 'block' : 'none'
  if (val === '__custom__') customInput.focus()

  await actualizarFaccionesExtra(val)
}

async function actualizarFaccionesExtra(unitName, faccionesYaMarcadas = []) {
  const container = document.getElementById('extra-factions-container')
  const primaryFaction = document.getElementById('faction').value

  if (!unitName || unitName === '' || unitName === '__custom__') {
    container.style.display = 'none'
    return
  }

  const { data } = await db.from('units').select('name, faction, game_slug')
    .eq('name', unitName)
    .neq('faction', primaryFaction)

  if (!data || !data.length) {
    container.style.display = 'none'
    return
  }

  const gameName = slug => games.find(g => g.slug === slug)?.name || slug

  container.style.display = 'block'
  container.innerHTML = `
    <div class="extra-factions">
      <div class="extra-factions-label">Esta unidad también está disponible en:</div>
      ${data.map(u => `
        <label class="extra-faction-check">
          <input type="checkbox" value="${u.faction}" data-game="${u.game_slug}"
            ${faccionesYaMarcadas.includes(u.faction) ? 'checked' : ''}>
          ${u.faction} · ${gameName(u.game_slug)}
        </label>
      `).join('')}
    </div>
  `
}

// --- FILTROS Y LISTA ---

async function actualizarFiltroFacciones() {
  const gameSlug = document.getElementById('filtro-game').value

  const { data } = await db.from('minis').select('factions').neq('status', 'wishlist')

  let todas = (data || []).flatMap(m => m.factions || [])

  if (gameSlug) {
    const faccionesDelJuego = new Set(factions.filter(f => f.game_slug === gameSlug).map(f => f.name))
    todas = todas.filter(f => faccionesDelJuego.has(f))
  }

  const unicas = [...new Set(todas)].sort()

  document.getElementById('filtro-faction').innerHTML =
    '<option value="">Todas las facciones</option>' +
    unicas.map(f => `<option value="${f}">${f}</option>`).join('')

  cargarMinis()
}

async function cargarMinis() {
  const filtroGame = document.getElementById('filtro-game').value
  const filtroFaction = document.getElementById('filtro-faction').value
  const filtroStatus = document.getElementById('filtro-status').value

  let query = db.from('minis').select('*').order('created_at', { ascending: false })
    .neq('status', 'wishlist')

  if (filtroFaction) {
    query = query.contains('factions', [filtroFaction])
  } else if (filtroGame) {
    const faccionesDelJuego = factions.filter(f => f.game_slug === filtroGame).map(f => f.name)
    query = query.overlaps('factions', faccionesDelJuego)
  }

  if (filtroStatus) query = query.eq('status', filtroStatus)

  const { data, error } = await query
  if (error) { console.error(error); return }

  minisActuales = data || []
  renderLista()
}

function onBusqueda(val) {
  filtroNombre = val
  renderLista()
}

function onFiltroType() {
  filtroType = document.getElementById('filtro-type').value
  renderLista()
}

function onOrdenar(btn) {
  const key = btn.dataset.sort
  if (key === ordenar) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc'
  } else {
    ordenar = key
    sortDir = key === 'reciente' ? 'desc' : 'asc'
  }
  document.querySelectorAll('.sort-btn').forEach(b => {
    const active = b.dataset.sort === ordenar
    b.classList.toggle('active', active)
    b.textContent = active ? `${b.dataset.label} ${sortDir === 'asc' ? '↑' : '↓'}` : b.dataset.label
  })
  renderLista()
}

function onPhotoSelected(input) {
  const file = input.files[0]
  if (!file) return
  pendingPhotoFile = file
  pendingPhotoRemove = false
  const preview = document.getElementById('photo-preview')
  preview.src = URL.createObjectURL(file)
  preview.style.display = 'block'
  document.getElementById('btn-remove-photo').style.display = 'inline-block'
  document.getElementById('photo-btn-text').textContent = 'Cambiar foto'
}

function removePhoto() {
  pendingPhotoFile = null
  pendingPhotoRemove = true
  document.getElementById('photo-preview').style.display = 'none'
  document.getElementById('photo-preview').src = ''
  document.getElementById('photo-input').value = ''
  document.getElementById('btn-remove-photo').style.display = 'none'
  document.getElementById('photo-btn-text').textContent = 'Añadir foto'
}

function resetPhotoModal(photoUrl) {
  pendingPhotoFile = null
  pendingPhotoRemove = false
  const preview = document.getElementById('photo-preview')
  document.getElementById('photo-input').value = ''
  if (photoUrl) {
    preview.src = photoUrl
    preview.style.display = 'block'
    document.getElementById('btn-remove-photo').style.display = 'inline-block'
    document.getElementById('photo-btn-text').textContent = 'Cambiar foto'
  } else {
    preview.style.display = 'none'
    preview.src = ''
    document.getElementById('btn-remove-photo').style.display = 'none'
    document.getElementById('photo-btn-text').textContent = 'Añadir foto'
  }
}

function getTypeForMini(m) {
  for (const faction of (m.factions || [])) {
    const fc = factions.find(f => f.name === faction)
    if (!fc) continue
    const t = typeMap[`${m.name}|${faction}|${fc.game_slug}`]
    if (t) return t
  }
  return null
}

const STATUS_ORDER = { comprada: 0, montada: 1, imprimada: 2, pintando: 3, pintada: 4 }

function renderLista() {
  const busqueda = filtroNombre.trim().toLowerCase()
  let minis = busqueda
    ? minisActuales.filter(m => (m.name || '').toLowerCase().includes(busqueda))
    : minisActuales
  if (filtroType) minis = minis.filter(m => getTypeForMini(m) === filtroType)

  const dir = sortDir === 'asc' ? 1 : -1
  if (ordenar === 'nombre') {
    minis = [...minis].sort((a, b) => dir * (a.name || '').localeCompare(b.name || '', 'es'))
  } else if (ordenar === 'estado') {
    minis = [...minis].sort((a, b) => dir * ((STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)))
  } else if (ordenar === 'juego') {
    minis = [...minis].sort((a, b) => {
      const ga = factions.find(f => (a.factions || []).includes(f.name))?.game_slug || ''
      const gb = factions.find(f => (b.factions || []).includes(f.name))?.game_slug || ''
      return dir * ga.localeCompare(gb)
    })
  } else if (sortDir === 'asc') {
    minis = [...minis].reverse()
  }

  const lista = document.getElementById('lista')
  if (!minis.length) {
    lista.innerHTML = `<div class="empty">${minisActuales.length ? 'Sin resultados para esa búsqueda' : 'No hay minis con estos filtros'}</div>`
    return
  }

  lista.innerHTML = minis.map(renderCard).join('')
}

function renderCard(m) {
  const opciones = (m.name || '').split('/').map(o => o.trim()).filter(Boolean)
  const nombreHTML = opciones.length > 1
    ? `<div class="card-name">${opciones[0]}</div>` +
      opciones.slice(1).map(o => `<div class="card-name-alt">${o}</div>`).join('')
    : `<div class="card-name">${m.name}</div>`
  const faccionesText = (m.factions || []).join(' · ') || '-'
  const juegosUnicos = [...new Set(
    (m.factions || []).map(f => factions.find(fc => fc.name === f)?.game_slug).filter(Boolean)
  )]
  const gameAcronym = { aos: 'AoS', '40k': '40K' }
  const gameBadges = juegosUnicos
    .map(slug => `<span class="badge badge-game-${slug}">${gameAcronym[slug] || slug}</span>`)
    .join(' ')
  const gamePtsList = juegosUnicos.map(slug => {
    const fac = (m.factions || []).find(f => factions.find(x => x.name === f && x.game_slug === slug))
    const pts = fac ? unitMap[`${m.name}|${fac}|${slug}`] : null
    return pts ? `${(pts * m.qty).toLocaleString()} ${gameAcronym[slug] || slug}` : null
  }).filter(Boolean)
  const modelsStr = m.models ? ` · ${m.models * m.qty} mod.` : ''
  const unitType = getTypeForMini(m)
  const typeBadge = unitType ? `<span class="badge badge-type">${unitType}</span>` : ''
  const thumbHTML = m.photo_url ? `<img class="card-thumb" src="${m.photo_url}" alt="">` : ''
  return `
    <div class="card" onclick="abrirEdicion(${m.id})">
      ${thumbHTML}
      <div class="card-body">
        <div class="card-header">
          <div>${nombreHTML}</div>
        </div>
        <div class="card-factions">${faccionesText}</div>
        <div class="card-footer">
          <div class="card-footer-left">
            ${gameBadges}
            ${typeBadge}
            <span class="badge badge-status ${m.status}">${m.status}</span>
          </div>
          <div class="card-footer-right">
            ${gamePtsList.map(p => `<span class="card-pts-line">${p}</span>`).join('')}
            <span class="card-qty">${m.qty} ud.${modelsStr}</span>
          </div>
        </div>
      </div>
    </div>
  `
}

async function cargarWishlist() {
  const { data, error } = await db.from('minis').select('*')
    .eq('status', 'wishlist').order('name', { ascending: true })
  if (error) { console.error(error); return }
  wishlistActuales = data || []
  renderWishlist()
}

function renderWishlist() {
  const lista = document.getElementById('lista-wishlist')
  if (!wishlistActuales.length) {
    lista.innerHTML = '<div class="empty">La wishlist está vacía — pulsa + para añadir</div>'
    return
  }
  const gameAcronym = { aos: 'AoS', '40k': '40K' }
  lista.innerHTML = wishlistActuales.map(mini => {
    const juegosUnicos = [...new Set(
      (mini.factions || []).map(f => factions.find(fc => fc.name === f)?.game_slug).filter(Boolean)
    )]
    const gameStr = juegosUnicos.map(s => gameAcronym[s] || s.toUpperCase()).join(' · ')
    const factionsStr = (mini.factions || []).join(' · ')
    const meta = [gameStr, factionsStr, mini.notes].filter(Boolean).join(' · ')
    const pts = juegosUnicos.reduce((found, slug) => {
      if (found) return found
      const fac = (mini.factions || []).find(f => factions.find(x => x.name === f && x.game_slug === slug))
      const p = fac ? unitMap[`${mini.name}|${fac}|${slug}`] : null
      return p ? p * mini.qty : null
    }, null)
    return `
      <div class="wish-item" onclick="abrirEdicion(${mini.id})">
        <div>
          <div class="wish-name">${mini.name}</div>
          <div class="wish-meta">${meta}</div>
        </div>
        ${pts ? `<span class="wish-pts">${pts.toLocaleString()} pts</span>` : ''}
      </div>
    `
  }).join('')
}

// --- PINTURAS ---

async function cargarPinturas() {
  const { data, error } = await db.from('paints').select('*').order('brand').order('name')
  if (error) { console.error(error); return }
  pinturas = data || []
  filtrarYRenderPinturas()
}

function filtrarYRenderPinturas() {
  const busqueda = (document.getElementById('busqueda-paint')?.value || '').trim().toLowerCase()
  const tipo = document.getElementById('filtro-paint-type')?.value || ''
  const stock = document.getElementById('filtro-paint-stock')?.value || ''

  let filtered = pinturas
  if (busqueda) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(busqueda) || p.brand.toLowerCase().includes(busqueda)
  )
  if (tipo) filtered = filtered.filter(p => p.type === tipo)
  if (stock === '1') filtered = filtered.filter(p => p.in_stock)
  if (stock === '0') filtered = filtered.filter(p => !p.in_stock)

  const lista = document.getElementById('lista-pinturas')
  if (!filtered.length) {
    lista.innerHTML = `<div class="empty">${pinturas.length ? 'Sin resultados' : 'No hay pinturas registradas — pulsa + para añadir'}</div>`
    return
  }
  lista.innerHTML = filtered.map(p => {
    const swatch = p.color_hex
      ? `<div class="paint-swatch" style="background:${p.color_hex}"></div>`
      : `<div class="paint-swatch paint-swatch-none"></div>`
    const stockBadge = p.in_stock ? '' : '<span class="badge badge-sin-stock">Sin stock</span>'
    return `
      <div class="paint-item" onclick="abrirEdicionPintura(${p.id})">
        ${swatch}
        <div class="paint-info">
          <span class="paint-name">${p.name}</span>
          <span class="paint-brand">${p.brand}</span>
        </div>
        <div class="paint-tags">
          <span class="badge-paint-type">${p.type}</span>
          ${stockBadge}
        </div>
      </div>
    `
  }).join('')
}

function abrirModalPintura() {
  paintEnEdicion = null
  document.getElementById('modal-paint-title').textContent = 'Añadir pintura'
  document.getElementById('btn-eliminar-paint').style.display = 'none'
  document.getElementById('paint-brand').value = ''
  document.getElementById('paint-name').value = ''
  document.getElementById('paint-type').value = 'base'
  document.getElementById('paint-has-color').checked = false
  document.getElementById('paint-color-hex').style.display = 'none'
  document.getElementById('paint-color-hex').value = '#aaaaaa'
  document.getElementById('paint-in-stock').checked = true
  document.getElementById('modal-paint-bg').classList.add('open')
}

function abrirEdicionPintura(id) {
  const paint = pinturas.find(p => p.id === id)
  if (!paint) return
  paintEnEdicion = paint
  document.getElementById('modal-paint-title').textContent = 'Editar pintura'
  document.getElementById('btn-eliminar-paint').style.display = 'block'
  document.getElementById('paint-brand').value = paint.brand
  document.getElementById('paint-name').value = paint.name
  document.getElementById('paint-type').value = paint.type
  const hasColor = !!paint.color_hex
  document.getElementById('paint-has-color').checked = hasColor
  document.getElementById('paint-color-hex').style.display = hasColor ? 'inline-block' : 'none'
  if (hasColor) document.getElementById('paint-color-hex').value = paint.color_hex
  document.getElementById('paint-in-stock').checked = paint.in_stock
  document.getElementById('modal-paint-bg').classList.add('open')
}

function cerrarModalPintura() {
  paintEnEdicion = null
  document.getElementById('modal-paint-bg').classList.remove('open')
}

function cerrarModalPinturaFondo(e) {
  if (e.target.id === 'modal-paint-bg') cerrarModalPintura()
}

function toggleColorPicker(cb) {
  document.getElementById('paint-color-hex').style.display = cb.checked ? 'inline-block' : 'none'
}

function onPaintBrandInput() {
  const brand = document.getElementById('paint-brand').value.trim()
  const datalist = document.getElementById('paint-names-list')
  if (brand === 'Citadel' || !brand) {
    datalist.innerHTML = CITADEL_CATALOG.map(p => `<option value="${p.name}">`).join('')
  } else {
    const colors = PAINT_COLORS[brand]
    datalist.innerHTML = colors ? Object.keys(colors).map(n => `<option value="${n}">`).join('') : ''
  }
  onPaintNameInput()
}

function onPaintNameInput() {
  const brand = document.getElementById('paint-brand').value.trim()
  const name  = document.getElementById('paint-name').value.trim()
  if (!name) return
  const entry = brand === 'Citadel' || !brand
    ? CITADEL_CATALOG.find(p => p.name.toLowerCase() === name.toLowerCase())
    : null
  if (entry) {
    if (entry.hex) {
      document.getElementById('paint-has-color').checked = true
      document.getElementById('paint-color-hex').style.display = 'inline-block'
      document.getElementById('paint-color-hex').value = entry.hex
    }
    if (entry.type) document.getElementById('paint-type').value = entry.type
  } else {
    const hex = PAINT_COLORS[brand]?.[name]
    if (hex) {
      document.getElementById('paint-has-color').checked = true
      document.getElementById('paint-color-hex').style.display = 'inline-block'
      document.getElementById('paint-color-hex').value = hex
    }
  }
}

function buscarColorExterno() {
  const brand = document.getElementById('paint-brand').value.trim()
  const name  = document.getElementById('paint-name').value.trim()
  const q = encodeURIComponent(`${brand} ${name} paint hex color`)
  window.open(`https://www.google.com/search?q=${q}`, '_blank')
}

// --- CATALOG SEARCH (quick-add desde catálogo Citadel) ---

function onCatalogSearch(query) {
  const q = query.trim().toLowerCase()
  const results = document.getElementById('catalog-results')
  if (!q || q.length < 2) { results.style.display = 'none'; results.innerHTML = ''; return }

  const owned = new Set(
    pinturas.filter(p => p.brand === 'Citadel').map(p => p.name.toLowerCase())
  )

  const matches = CITADEL_CATALOG.filter(p => p.name.toLowerCase().includes(q)).slice(0, 12)

  if (!matches.length) {
    results.innerHTML = '<div class="catalog-empty">Sin resultados</div>'
    results.style.display = 'block'
    return
  }

  results.innerHTML = matches.map(p => {
    const isOwned = owned.has(p.name.toLowerCase())
    const swatchClass = p.hex ? '' : ' catalog-swatch-none'
    const swatchStyle = p.hex ? `style="background:${p.hex}"` : ''
    const safeName = p.name.replace(/'/g, "\\'")
    const onclick = isOwned ? '' : `onclick="quickAddPintura('${safeName}','${p.type}','${p.hex || ''}')" `
    return `
      <div class="catalog-result${isOwned ? ' owned' : ''}" ${onclick}>
        <div class="catalog-swatch${swatchClass}" ${swatchStyle}></div>
        <div class="catalog-result-info">
          <span class="catalog-result-name">${p.name}</span>
          <span class="catalog-result-type">${p.type}</span>
        </div>
        ${isOwned
          ? '<span class="catalog-owned-mark">✓ tengo</span>'
          : '<span class="catalog-add-btn">+</span>'}
      </div>
    `
  }).join('')
  results.style.display = 'block'
}

async function quickAddPintura(name, type, hex) {
  const payload = { brand: 'Citadel', name, type, in_stock: true }
  if (hex) payload.color_hex = hex
  const { error } = await db.from('paints').insert(payload)
  if (error) { console.error(error); return }
  document.getElementById('catalog-search').value = ''
  document.getElementById('catalog-results').style.display = 'none'
  await cargarPinturas()
}

document.addEventListener('click', e => {
  if (!e.target.closest('.catalog-search-section')) {
    const r = document.getElementById('catalog-results')
    if (r) r.style.display = 'none'
  }
})

async function guardarPintura() {
  const brand = document.getElementById('paint-brand').value.trim()
  const name = document.getElementById('paint-name').value.trim()
  const type = document.getElementById('paint-type').value
  if (!brand || !name) { alert('Introduce marca y nombre'); return }

  const hasColor = document.getElementById('paint-has-color').checked
  const payload = {
    brand,
    name,
    type,
    color_hex: hasColor ? document.getElementById('paint-color-hex').value : null,
    in_stock: document.getElementById('paint-in-stock').checked
  }

  let error
  if (paintEnEdicion) {
    ;({ error } = await db.from('paints').update(payload).eq('id', paintEnEdicion.id))
  } else {
    ;({ error } = await db.from('paints').insert(payload))
  }
  if (error) { alert('Error: ' + error.message); return }

  cerrarModalPintura()
  await cargarPinturas()
}

async function eliminarPintura() {
  if (!paintEnEdicion) return
  if (!confirm(`¿Eliminar "${paintEnEdicion.name}"?`)) return
  const { error } = await db.from('paints').delete().eq('id', paintEnEdicion.id)
  if (error) { alert('Error: ' + error.message); return }
  cerrarModalPintura()
  await cargarPinturas()
}

// --- TABS ---

function cambiarTab(tab) {
  tabActual = tab
  document.getElementById('vista-coleccion').style.display = tab === 'coleccion' ? 'block' : 'none'
  document.getElementById('vista-stats').style.display    = tab === 'stats'      ? 'block' : 'none'
  document.getElementById('vista-wishlist').style.display = tab === 'wishlist'   ? 'block' : 'none'
  document.getElementById('vista-pinturas').style.display = tab === 'pinturas'   ? 'block' : 'none'
  document.getElementById('tab-coleccion').classList.toggle('active', tab === 'coleccion')
  document.getElementById('tab-stats').classList.toggle('active', tab === 'stats')
  document.getElementById('tab-wishlist').classList.toggle('active', tab === 'wishlist')
  document.getElementById('tab-pinturas').classList.toggle('active', tab === 'pinturas')
  if (tab === 'stats') cargarStats()
  if (tab === 'wishlist') cargarWishlist()
  if (tab === 'pinturas') cargarPinturas()
}

// --- ESTADÍSTICAS ---

async function cargarStats() {
  const container = document.getElementById('stats-content')
  container.innerHTML = '<div class="stats-empty">Cargando...</div>'

  const { data: minis, error } = await db.from('minis').select('name, factions, status, qty, models')
    .neq('status', 'wishlist')
  if (error || !minis) { container.innerHTML = '<div class="stats-empty">Error al cargar datos</div>'; return }

  // Global summary: total models + painted (models field || qty as fallback)
  let gTotalModelos = 0, gModelosPintados = 0
  for (const mini of minis) {
    const modelos = (mini.models != null ? mini.models : 1) * mini.qty
    gTotalModelos += modelos
    if (mini.status === 'pintada') gModelosPintados += modelos
  }
  const pctPintada = gTotalModelos ? Math.round(gModelosPintados / gTotalModelos * 100) : 0

  const factionStats = {}

  for (const mini of minis) {
    for (const faction of (mini.factions || [])) {
      const fc = factions.find(f => f.name === faction)
      if (!fc) continue

      if (!factionStats[faction]) {
        factionStats[faction] = {
          game_slug: fc.game_slug,
          counts: {},
          modelCounts: {},
          qty: 0,
          modelos: 0,
          modelosPintados: 0,
          points: 0,
          pointsPainted: 0,
          minis: []
        }
      }

      const s = factionStats[faction]
      const modelos = (mini.models != null ? mini.models : 1) * mini.qty

      s.counts[mini.status] = (s.counts[mini.status] || 0) + 1
      s.modelCounts[mini.status] = (s.modelCounts[mini.status] || 0) + modelos
      s.qty += mini.qty
      s.modelos += modelos
      if (mini.status === 'pintada') s.modelosPintados += modelos

      const pts = unitMap[`${mini.name}|${faction}|${fc.game_slug}`]
      if (pts) {
        s.points += pts * mini.qty
        if (mini.status === 'pintada') s.pointsPainted += pts * mini.qty
      }
      s.minis.push({ name: mini.name, status: mini.status, qty: mini.qty, models: mini.models || null, pts: pts || null })
    }
  }

  if (!Object.keys(factionStats).length) {
    container.innerHTML = '<div class="stats-empty">Aún no hay minis en la colección</div>'
    return
  }

  const statuses = ['comprada', 'montada', 'imprimada', 'pintando', 'pintada']
  const statusLabel = { comprada: 'Comprada', montada: 'Montada', imprimada: 'Imprimada', pintando: 'Pintando', pintada: 'Pintada' }

  const byGame = {}
  for (const [faction, s] of Object.entries(factionStats)) {
    if (!byGame[s.game_slug]) byGame[s.game_slug] = []
    byGame[s.game_slug].push({ faction, ...s })
  }

  const gameOrder = games.map(g => g.slug)
  const sortedGames = Object.keys(byGame).sort((a, b) => gameOrder.indexOf(a) - gameOrder.indexOf(b))

  const summaryHTML = `
    <div class="stats-summary">
      <div class="stats-summary-item">
        <span class="stats-summary-value">${gTotalModelos.toLocaleString()}</span>
        <span class="stats-summary-label">modelos</span>
      </div>
      <div class="stats-summary-item">
        <span class="stats-summary-value">${gModelosPintados.toLocaleString()}</span>
        <span class="stats-summary-label">pintados</span>
      </div>
      <div class="stats-summary-item">
        <span class="stats-summary-value stats-summary-pct">${pctPintada}%</span>
        <span class="stats-summary-label">pintado</span>
      </div>
    </div>
  `

  container.innerHTML = summaryHTML + sortedGames.map(gameSlug => {
    const gameName = games.find(g => g.slug === gameSlug)?.name || gameSlug
    const armies = byGame[gameSlug].sort((a, b) => a.faction.localeCompare(b.faction))

    const totalPts = armies.reduce((sum, a) => sum + a.points, 0)
    const totalPainted = armies.reduce((sum, a) => sum + a.pointsPainted, 0)

    return `
      <div class="stats-game-section">
        <div class="stats-game-title">
          <span class="badge badge-game-${gameSlug}">${gameName}</span>
          ${totalPts ? `<span class="stats-total">${totalPts.toLocaleString()} pts totales · ${totalPainted.toLocaleString()} pts pintados</span>` : ''}
        </div>
        ${armies.map((a, idx) => {
          const totalEntradas = Object.values(a.counts).reduce((s, v) => s + v, 0)
          const segs = statuses
            .filter(st => a.modelCounts[st])
            .map(st => `<div class="progress-seg ${st}" style="width:${(a.modelCounts[st] / a.modelos * 100).toFixed(1)}%"></div>`)
            .join('')

          const legend = statuses
            .filter(st => a.counts[st])
            .map(st => `<span class="stats-legend-item"><span class="legend-dot ${st}"></span>${a.counts[st]} ${statusLabel[st].toLowerCase()}</span>`)
            .join('')

          const sortedMinis = [...a.minis].sort((x, y) => {
            const si = statuses.indexOf(x.status) - statuses.indexOf(y.status)
            return si !== 0 ? si : x.name.localeCompare(y.name)
          })
          const miniRows = sortedMinis.map(m => `
            <div class="stats-mini-row">
              <span class="stats-mini-name">${m.name}${m.qty > 1 ? ` <span class="stats-mini-qty">×${m.qty}</span>` : ''}${m.models ? ` <span class="stats-mini-qty">(${m.models * m.qty} mod.)</span>` : ''}</span>
              <span class="stats-mini-right">
                ${m.pts ? `<span class="stats-mini-pts">${(m.pts * m.qty).toLocaleString()} pts</span>` : ''}
                <span class="badge badge-status ${m.status}">${statusLabel[m.status]}</span>
              </span>
            </div>
          `).join('')

          return `
            <details class="stats-army"${idx === 0 ? ' open' : ''}>
              <summary>
                <div>
                  <span class="stats-army-name">${a.faction}</span>
                  <span class="stats-army-meta">${totalEntradas} entrada${totalEntradas !== 1 ? 's' : ''} · ${a.modelos} modelo${a.modelos !== 1 ? 's' : ''} · ${a.modelosPintados} pintado${a.modelosPintados !== 1 ? 's' : ''}</span>
                </div>
                <div class="stats-army-summary-right">
                  ${a.points ? `<span class="stats-pts">${a.points.toLocaleString()} pts${a.pointsPainted ? ` · <span class="stats-pts-painted">${a.pointsPainted.toLocaleString()} pint.</span>` : ''}</span>` : ''}
                  <span class="stats-chevron">˅</span>
                </div>
              </summary>
              <div class="progress-bar">${segs}</div>
              <div class="stats-legend">${legend}</div>
              <div class="stats-army-minis">${miniRows}</div>
            </details>
          `
        }).join('')}
      </div>
    `
  }).join('')
}

// --- MODAL: abrir / cerrar ---

async function abrirModal() {
  if (tabActual === 'pinturas') { abrirModalPintura(); return }
  miniEnEdicion = null
  document.getElementById('modal-title').textContent = 'Añadir miniatura'
  document.getElementById('btn-eliminar').style.display = 'none'

  const lastGame = localStorage.getItem('wt_lastGame')
  const lastFaction = localStorage.getItem('wt_lastFaction')
  if (lastGame && games.find(g => g.slug === lastGame)) {
    document.getElementById('game').value = lastGame
    const filtradas = factions.filter(f => f.game_slug === lastGame)
    document.getElementById('faction').innerHTML = filtradas.map(f =>
      `<option value="${f.name}">${f.name}</option>`
    ).join('')
    if (lastFaction && filtradas.find(f => f.name === lastFaction)) {
      document.getElementById('faction').value = lastFaction
    }
    await actualizarUnidades()
  }

  document.getElementById('status').value = 'comprada'
  resetPhotoModal(null)
  document.getElementById('modal-bg').classList.add('open')
}

async function abrirEdicion(id) {
  const mini = minisActuales.find(m => m.id === id) || wishlistActuales.find(m => m.id === id)
  if (!mini) return
  miniEnEdicion = mini

  document.getElementById('game').value = mini.game
  const filtradas = factions.filter(f => f.game_slug === mini.game)
  document.getElementById('faction').innerHTML = filtradas.map(f =>
    `<option value="${f.name}">${f.name}</option>`
  ).join('')
  document.getElementById('faction').value = mini.factions[0] || ''

  const { data: unitsData } = await db.from('units').select('name')
    .eq('faction', mini.factions[0]).eq('game_slug', mini.game).order('name')

  document.getElementById('unit-select').innerHTML =
    '<option value="">— Selecciona unidad —</option>' +
    (unitsData || []).map(u => `<option value="${u.name}">${u.name}</option>`).join('') +
    '<option value="__custom__">Otro (personalizado)...</option>'

  const enCatalogo = (unitsData || []).some(u => u.name === mini.name)
  if (enCatalogo) {
    document.getElementById('unit-select').value = mini.name
    document.getElementById('name-custom').style.display = 'none'
  } else {
    document.getElementById('unit-select').value = '__custom__'
    document.getElementById('name-custom').value = mini.name
    document.getElementById('name-custom').style.display = 'block'
  }

  await actualizarFaccionesExtra(enCatalogo ? mini.name : '__custom__', mini.factions.slice(1))

  document.getElementById('qty').value = mini.qty
  document.getElementById('models').value = mini.models || ''
  document.getElementById('status').value = mini.status
  document.getElementById('notes').value = mini.notes || ''
  resetPhotoModal(mini.photo_url || null)

  document.getElementById('modal-title').textContent = 'Editar miniatura'
  document.getElementById('btn-eliminar').style.display = 'block'
  document.getElementById('modal-bg').classList.add('open')
}

function cerrarModal() {
  miniEnEdicion = null
  document.getElementById('modal-bg').classList.remove('open')
  document.getElementById('modal-title').textContent = 'Añadir miniatura'
  document.getElementById('btn-eliminar').style.display = 'none'
  document.getElementById('unit-select').selectedIndex = 0
  document.getElementById('name-custom').value = ''
  document.getElementById('name-custom').style.display = 'none'
  document.getElementById('extra-factions-container').style.display = 'none'
  document.getElementById('notes').value = ''
  document.getElementById('qty').value = 1
  document.getElementById('models').value = ''
}

function cerrarModalFondo(e) {
  if (e.target.id === 'modal-bg') cerrarModal()
}

// --- GUARDAR / ELIMINAR ---

async function guardarMini() {
  const unitVal = document.getElementById('unit-select').value
  const name = unitVal === '__custom__'
    ? document.getElementById('name-custom').value.trim()
    : unitVal
  if (!name) { alert('Selecciona una unidad'); return }

  const primaryFaction = document.getElementById('faction').value
  const game = document.getElementById('game').value
  const extrasChecked = [...document.querySelectorAll('#extra-factions-container input[type="checkbox"]:checked')]
  const minisFactions = [primaryFaction, ...extrasChecked.map(cb => cb.value)]

  const modelsVal = parseInt(document.getElementById('models').value) || null
  const payload = {
    name,
    factions: minisFactions,
    game,
    qty: parseInt(document.getElementById('qty').value) || 1,
    models: modelsVal,
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value
  }

  let error
  let savedId = miniEnEdicion?.id

  if (miniEnEdicion) {
    ;({ error } = await db.from('minis').update(payload).eq('id', miniEnEdicion.id))
  } else {
    const { data: inserted, error: err } = await db.from('minis').insert(payload).select('id').single()
    error = err
    if (inserted) savedId = inserted.id
  }

  if (error) { alert('Error: ' + error.message); return }

  if (savedId) {
    if (pendingPhotoFile) {
      const ext = pendingPhotoFile.name.split('.').pop().toLowerCase()
      const path = `${savedId}.${ext}`
      await db.storage.from('mini-photos').upload(path, pendingPhotoFile, { upsert: true })
      const { data: { publicUrl } } = db.storage.from('mini-photos').getPublicUrl(path)
      await db.from('minis').update({ photo_url: publicUrl }).eq('id', savedId)
    } else if (pendingPhotoRemove && miniEnEdicion?.photo_url) {
      const path = miniEnEdicion.photo_url.split('/mini-photos/')[1]
      if (path) await db.storage.from('mini-photos').remove([path])
      await db.from('minis').update({ photo_url: null }).eq('id', savedId)
    }
  }

  localStorage.setItem('wt_lastGame', document.getElementById('game').value)
  localStorage.setItem('wt_lastFaction', document.getElementById('faction').value)
  cerrarModal()
  if (tabActual === 'wishlist') { await cargarWishlist() } else { await actualizarFiltroFacciones() }
}

async function eliminarMini() {
  if (!miniEnEdicion) return
  if (!confirm(`¿Eliminar "${miniEnEdicion.name}"?`)) return

  if (miniEnEdicion.photo_url) {
    const path = miniEnEdicion.photo_url.split('/mini-photos/')[1]
    if (path) await db.storage.from('mini-photos').remove([path])
  }
  const { error } = await db.from('minis').delete().eq('id', miniEnEdicion.id)
  if (error) { alert('Error: ' + error.message); return }

  cerrarModal()
  if (tabActual === 'wishlist') { await cargarWishlist() } else { await actualizarFiltroFacciones() }
}

// --- CÁMARA: escanear pote ---

let cameraStream = null
let cameraPendingPaint = null
let cameraContext = 'catalog'

async function abrirCamara(context = 'catalog') {
  cameraContext = context
  const overlay = document.getElementById('camera-overlay')
  overlay.classList.add('open')
  document.getElementById('camera-result').style.display = 'none'
  document.getElementById('camera-scanning').style.display = 'none'

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    document.getElementById('camera-video').srcObject = cameraStream
  } catch (e) {
    alert('No se puede acceder a la cámara: ' + e.message)
    cerrarCamara()
  }
}

function cerrarCamara() {
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null }
  document.getElementById('camera-overlay').classList.remove('open')
  cameraPendingPaint = null
}

async function capturarPote() {
  const video = document.getElementById('camera-video')

  if (!video.videoWidth || !video.videoHeight) {
    alert('La cámara aún no está lista. Espera un momento e intenta de nuevo.')
    return
  }

  const MAX_W = 320
  const scale = Math.min(1, MAX_W / video.videoWidth)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

  document.getElementById('camera-scanning').style.display = 'flex'
  document.getElementById('camera-result').style.display = 'none'

  try {
    const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
    const { data, error } = await db.functions.invoke('identify-paint', {
      body: { image: base64, mediaType: 'image/jpeg' }
    })
    if (error) throw error
    const rawName = (data.name || '').trim()

    if (!rawName || rawName === '?') {
      document.getElementById('camera-scanning').style.display = 'none'
      return
    }

    // Buscar en catálogo: exacto → contiene texto → todas palabras presentes → alguna palabra
    const q = rawName.toLowerCase()
    const words = q.split(/\s+/).filter(w => w.length > 2)
    const found = CITADEL_CATALOG.find(p => p.name.toLowerCase() === q)
      || CITADEL_CATALOG.find(p => p.name.toLowerCase().includes(q))
      || CITADEL_CATALOG.find(p => words.length > 0 && words.every(w => p.name.toLowerCase().includes(w)))
      || CITADEL_CATALOG.find(p => words.some(w => p.name.toLowerCase().includes(w)))

    cameraPendingPaint = found || { name: rawName.substring(0, 60), type: 'base', hex: null }

    document.getElementById('camera-result-name').textContent = cameraPendingPaint.name
    document.getElementById('camera-result-type').textContent = cameraPendingPaint.type
    const swatch = document.getElementById('camera-result-swatch')
    swatch.style.background = cameraPendingPaint.hex || 'var(--subtle)'
    swatch.style.border = cameraPendingPaint.hex ? '2px solid rgba(0,0,0,0.1)' : '2px dashed var(--border)'

    document.getElementById('camera-scanning').style.display = 'none'
    document.getElementById('camera-result').style.display = 'block'
  } catch (e) {
    console.error(e)
    alert('Error al identificar: ' + e.message)
    document.getElementById('camera-scanning').style.display = 'none'
  }
}

function reintentarCamara() {
  document.getElementById('camera-result').style.display = 'none'
  cameraPendingPaint = null
}

async function confirmarPoteCamara() {
  if (!cameraPendingPaint) return
  const p = cameraPendingPaint

  if (cameraContext === 'modal') {
    // Rellenar el modal de pintura y dejarlo abierto para que el usuario confirme
    document.getElementById('paint-brand').value = 'Citadel'
    document.getElementById('paint-name').value = p.name
    document.getElementById('paint-type').value = p.type || 'base'
    if (p.hex) {
      const cb = document.getElementById('paint-has-color')
      cb.checked = true
      toggleColorPicker(cb)
      document.getElementById('paint-color-hex').value = p.hex
    }
    cerrarCamara()
    return
  }

  // Contexto 'catalog': guardar directamente
  const payload = { brand: 'Citadel', name: p.name, type: p.type, in_stock: true }
  if (p.hex) payload.color_hex = p.hex
  const { error } = await db.from('paints').insert(payload)
  if (error) { alert('Error: ' + error.message); return }
  cerrarCamara()
  await cargarPinturas()
}

// --- INIT ---

db.auth.getSession().then(({ data: { session } }) => {
  if (session) mostrarApp()
})
