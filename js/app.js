const { createClient } = supabase
const db = createClient(
  'https://yxmviaviyglyemoyqfws.supabase.co',
  'sb_publishable_P4QRQ6nMPQKvLYvVN_shaQ_8ixoMhPw'
)

let games = []
let factions = []
let minisActuales = []
let miniEnEdicion = null

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

async function mostrarApp() {
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('app-screen').style.display = 'block'
  await inicializar()
}

async function inicializar() {
  const { data: gamesData } = await db.from('games').select('*').order('name')
  const { data: factionsData } = await db.from('factions').select('*').order('name')
  games = gamesData || []
  factions = factionsData || []

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

  const lista = document.getElementById('lista')
  if (!minisActuales.length) {
    lista.innerHTML = '<div class="empty">No hay minis con estos filtros</div>'
    return
  }

  lista.innerHTML = minisActuales.map(m => {
    const opciones = (m.name || '').split('/').map(o => o.trim()).filter(Boolean)
    const nombreHTML = opciones.length > 1
      ? `<div class="card-name">${opciones[0]}</div>` +
        opciones.slice(1).map(o => `<div class="card-name-alt">${o}</div>`).join('')
      : `<div class="card-name">${m.name}</div>`
    const faccionesHTML = (m.factions || []).length > 1
      ? (m.factions || []).map(f => `<span class="badge badge-faction">${f}</span>`).join(' ')
      : (m.factions || [])[0] || '-'
    const juegosUnicos = [...new Set(
      (m.factions || []).map(f => factions.find(fc => fc.name === f)?.game_slug).filter(Boolean)
    )]
    const gameBadges = juegosUnicos
      .map(slug => `<span class="badge badge-game">${games.find(g => g.slug === slug)?.name || slug}</span>`)
      .join(' ')
    return `
      <div class="card" onclick="abrirEdicion(${m.id})">
        <div class="card-header">
          <div>${nombreHTML}</div>
        </div>
        <div class="card-factions">${faccionesHTML}</div>
        <div class="card-footer">
          ${gameBadges}
          <span class="badge badge-status ${m.status}">${m.status}</span>
          <span class="card-qty">${m.qty} ud.</span>
        </div>
      </div>
    `
  }).join('')
}

// --- MODAL: abrir / cerrar ---

function abrirModal() {
  miniEnEdicion = null
  document.getElementById('modal-title').textContent = 'Añadir miniatura'
  document.getElementById('btn-eliminar').style.display = 'none'
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

  const payload = {
    name,
    factions: minisFactions,
    game,
    qty: parseInt(document.getElementById('qty').value) || 1,
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
