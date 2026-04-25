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
let miniEnEdicion = null
let filtroNombre = ''
let filtroType = ''

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

  const { data } = await db.from('minis').select('factions')

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

function getTypeForMini(m) {
  for (const faction of (m.factions || [])) {
    const fc = factions.find(f => f.name === faction)
    if (!fc) continue
    const t = typeMap[`${m.name}|${faction}|${fc.game_slug}`]
    if (t) return t
  }
  return null
}

function renderLista() {
  const busqueda = filtroNombre.trim().toLowerCase()
  let minis = busqueda
    ? minisActuales.filter(m => (m.name || '').toLowerCase().includes(busqueda))
    : minisActuales
  if (filtroType) minis = minis.filter(m => getTypeForMini(m) === filtroType)

  const lista = document.getElementById('lista')
  if (!minis.length) {
    lista.innerHTML = `<div class="empty">${minisActuales.length ? 'Sin resultados para esa búsqueda' : 'No hay minis con estos filtros'}</div>`
    return
  }

  lista.innerHTML = minis.map(m => {
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
    const ptsHTML = gamePtsList.length
      ? `<span class="card-pts">${gamePtsList.join(' · ')}</span>` : ''
    const modelsStr = m.models ? ` · ${m.models * m.qty} mod.` : ''
    const unitType = getTypeForMini(m)
    const typeBadge = unitType ? `<span class="badge badge-type">${unitType}</span>` : ''
    return `
      <div class="card" onclick="abrirEdicion(${m.id})">
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
    `
  }).join('')
}

// --- TABS ---

function cambiarTab(tab) {
  document.getElementById('vista-coleccion').style.display = tab === 'coleccion' ? 'block' : 'none'
  document.getElementById('vista-stats').style.display = tab === 'stats' ? 'block' : 'none'
  document.getElementById('tab-coleccion').classList.toggle('active', tab === 'coleccion')
  document.getElementById('tab-stats').classList.toggle('active', tab === 'stats')
  if (tab === 'stats') cargarStats()
}

// --- ESTADÍSTICAS ---

async function cargarStats() {
  const container = document.getElementById('stats-content')
  container.innerHTML = '<div class="stats-empty">Cargando...</div>'

  const { data: minis, error } = await db.from('minis').select('name, factions, status, qty, models')
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
        ${armies.map(a => {
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
            <div class="stats-army">
              <div class="stats-army-header" onclick="toggleArmy(this)">
                <div class="stats-army-name">${a.faction}</div>
                <span class="stats-chevron">›</span>
              </div>
              <div class="stats-row">
                <span>${totalEntradas} entrada${totalEntradas !== 1 ? 's' : ''} · ${a.modelos} modelo${a.modelos !== 1 ? 's' : ''} · ${a.modelosPintados} pintado${a.modelosPintados !== 1 ? 's' : ''}</span>
                ${a.points ? `<span><span class="stats-pts">${a.points.toLocaleString()} pts</span>${a.pointsPainted ? ` · <span class="stats-pts-painted">${a.pointsPainted.toLocaleString()} pintados</span>` : ''}</span>` : ''}
              </div>
              <div class="progress-bar">${segs}</div>
              <div class="stats-legend">${legend}</div>
              <div class="stats-army-minis">${miniRows}</div>
            </div>
          `
        }).join('')}
      </div>
    `
  }).join('')
}

function toggleArmy(header) {
  const army = header.closest('.stats-army')
  const minisDiv = army.querySelector('.stats-army-minis')
  const chevron = header.querySelector('.stats-chevron')
  const open = army.classList.toggle('expanded')
  minisDiv.style.display = open ? 'block' : 'none'
  chevron.style.transform = open ? 'rotate(90deg)' : ''
}

// --- MODAL: abrir / cerrar ---

async function abrirModal() {
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

  document.getElementById('modal-bg').classList.add('open')
}

async function abrirEdicion(id) {
  const mini = minisActuales.find(m => m.id === id)
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
  if (miniEnEdicion) {
    ;({ error } = await db.from('minis').update(payload).eq('id', miniEnEdicion.id))
  } else {
    ;({ error } = await db.from('minis').insert(payload))
  }

  if (error) { alert('Error: ' + error.message); return }

  localStorage.setItem('wt_lastGame', document.getElementById('game').value)
  localStorage.setItem('wt_lastFaction', document.getElementById('faction').value)
  cerrarModal()
  await actualizarFiltroFacciones()
}

async function eliminarMini() {
  if (!miniEnEdicion) return
  if (!confirm(`¿Eliminar "${miniEnEdicion.name}"?`)) return

  const { error } = await db.from('minis').delete().eq('id', miniEnEdicion.id)
  if (error) { alert('Error: ' + error.message); return }

  cerrarModal()
  await actualizarFiltroFacciones()
}

// --- INIT ---

db.auth.getSession().then(({ data: { session } }) => {
  if (session) mostrarApp()
})
