// Parsea la lista de pinturas del usuario y genera un JSON listo para importar.
// Uso: node scripts/import-paints.cjs > import-paints.json
const fs = require('fs')
const path = require('path')

// ── Catálogos ────────────────────────────────────────────────────────────────
// Carga los catálogos compilados desde los archivos generados
function loadCatalog(file, exportName) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8')
  const pattern = exportName
    ? new RegExp(`export const ${exportName} = (\\[[\\s\\S]*?\\n\\])`)
    : /export const \w+ = (\[[\s\S]*?\n\])/
  const match = src.match(pattern)
  if (!match) return []
  // eval solo el array literal, sin imports
  return eval(match[1])  // eslint-disable-line no-eval
}

const CITADEL_CAT = loadCatalog('paint-colors.js', 'CITADEL_CATALOG')
const VALLEJO     = loadCatalog('paint-catalog-vallejo.js')
const AP          = loadCatalog('paint-catalog-army-painter.js')
const AK          = loadCatalog('paint-catalog-ak.js')
const GSW         = loadCatalog('paint-catalog-gsw.js')

// ── Mapeo Vallejo español → inglés (por código) ──────────────────────────────
const VALLEJO_ES_MAP = {
  // Warm Flesh
  '72.003': 'Pale Flesh',       // Carne Pálida
  '72.100': 'Rosy Flesh',       // Carne Rosada
  '72.107': 'Athena Skin',      // Piel de Atenea
  '72.108': 'Succubus Skin',    // Piel de Súcubo
  // Flesh
  '72.098': 'Elfic Flesh',      // Carne Élfica
  '72.099': 'Skin Tone',        // Piel
  '72.004': 'Elf Skin Tone',    // Piel de Elfo
  '72.071': 'Barbarian Skin',   // Piel de Bárbaro
  // Yellow
  '72.109': 'Toxic Yellow',     // Amarillo Tóxico
  '72.005': 'Moon Yellow',      // Amarillo Lunar
  '72.006': 'Sun Yellow',       // Amarillo Soleado
  '72.007': 'Gold Yellow',      // Amarillo Dorado
  // Orange
  '72.110': 'Sunset Orange',    // Naranja Atardecer
  '72.008': 'Orange Fire',      // Naranja Fuego
  '72.009': 'Hot Orange',       // Naranja Tostado
  '72.106': 'Scarlet Blood',    // Sangre Escarlata
  // Magenta
  '72.013': 'Squid Pink',       // Rosa Pulpo
  '72.014': 'Purple',           // Púrpura
  '72.113': 'Deep Magenta',     // Magenta Profundo
  '72.112': 'Evil Red',         // Rojo Maligno
  // Violet
  '72.114': 'Lustful Purple',   // Púrpura Lujurioso
  '72.076': 'Alien Purple',     // Púrpura Alienígena
  '72.015': 'Royal Purple',     // Púrpura Hechicero
  '72.116': 'Midnight Purple',  // Púrpura Medianoche
  // Blue
  '72.118': 'Sunrise Blue',     // Azul Amanecer
  '72.021': 'Magic Blue',       // Azul Mágico
  '72.020': 'Imperial Blue',    // Azul Imperial
  '72.019': 'Night Blue',       // Azul Negro
  // Turquoise
  '72.096': 'Verdigris',        // Verdín
  '72.119': 'Aquamarine',       // Aguamarina
  '72.024': 'Turquoise',         // Halcón Milenario
  '72.120': 'Abyssal Turquoise', // Turquesa Abisal
  // Cold Green
  '72.121': 'Ghost Green',      // Verde Espectral
  '72.025': 'Foul Green',       // Verde Malicioso
  '72.026': 'Jade Green',       // Verde Jade
  '72.027': 'Sick Green',       // Verde Casposo
  // Green
  '72.122': 'Bile Green',       // Verde Bilioso
  '72.032': 'Scorpy Green',     // Verde Escorpena
  '72.123': 'Angel Green',      // Verde Angelical
  '72.028': 'Dark Green',       // Verde Oscuro
  // Black
  '72.001': 'Dead White',       // Blanco Calavera
  '72.049': 'Stonewall Grey',   // Gris Muralla
  '72.155': 'Charcoal',         // Gris Carbón (puede no existir)
  '72.051': 'Black',            // Negro
  // Multipurpose
  '72.011': 'Gory Red',         // Rojo Visceral
  '72.042': 'Parasite Brown',   // Piel de Parásitos
  '72.124': 'Gorgon Brown',     // Marrón Gargona
  '72.045': 'Charred Brown',    // Marrón Carbonizado
}

// ── Lookup helpers ────────────────────────────────────────────────────────────
function lookupExact(catalog, name) {
  return catalog.find(p => p.name.toLowerCase() === name.toLowerCase())
}
function lookupFuzzy(catalog, name) {
  const n = name.toLowerCase()
  return catalog.find(p => p.name.toLowerCase().includes(n))
}

// ── Parser de la lista ────────────────────────────────────────────────────────
const raw = `Citadel
Abaddon Black
Administratum Grey
Aethermatic Blue
Agrax Earthshade
Agrellan Earth
Ahriman Blue
Apothecary White
Ardcoat
Astrogranite
Athonian Camoshade
Averland Sunset
Baharroth Blue
Balthasar Gold
Barak-Nar Burgundy
Blood Angels Red
Blood for the Blood God
Bugman's Glow
Caledor Sky
Carroburg Crimson
Celestra Grey
Coelia Greenshade
Contrast Medium
Corax White
Darkoath Flesh
Dawnstone
Doomfire Magenta
Dorn Yellow
Druchii Violet
Emperor's Children
Fenrisian Grey
Fire Dragon Bright
Frostheart
Fuegan Orange
Fulgrim Pink
Gauss Blaster Green
Genestealer Purple
Gorthor Brown
Guilliman Flesh
Hashut Copper
Hexwraith Flame
Incubi Darkness
Ionrach Skin
Ironbreaker
Ironjawz Yellow
Iyanden Yellow
Kabalite Green
Kantor Blue
Karak Stone
Khorne Red
Kislev Flesh
Kroxigor Scales
Lahmian Medium
Leadbelcher
Liberator Gold
Lugganath Orange
Macragge Blue
Magmadroth Flame
Martian Ironcrust
Mechanicus Standard Grey
Mephiston Red
Mournfang Brown
Necron Compound
Nihilakh Oxide
Nuln Oil
Pallid Wych Flesh
Pink Horror
Rakarth Flesh
Reikland Fleshshade
Retributor Armour
Rhinox Hide
Runelord Brass
Ryza Rust
Screamer Pink
Seraphim Sepia
Sigvald Burgundy
Skeleton Horde
Sotek Green
Soulblight Grey
Steel Legion Drab
Stirland Mud
Stormfiend
Stormhost Silver
Striking Scorpion Green
Sybarite Green
Sycorax Bronze
Targor Rageshade
Temple Guard Blue
Tesseract Glow
Thousand Sons Blue
Ulthuan Grey
Ultramarine Blue
Valhallan Blizzard
Volupus Pink
Waaagh! Flesh
Warpstone Glow
Waystone Green
White Scar
Wraith Bone

vallejo
BSL Warm Flesh
72.003 Carne Pálida
72.100 Carne Rosada
72.107 Piel de Atenea
72.108 Piel de Súcubo
BSL Flesh
72.098 Carne Élfica
72.099 Piel
72.004 Piel de Elfo
72.071 Piel de Bárbaro
BSL Yellow
72.109 Amarillo Tóxico
72.005 Amarillo Lunar
72.006 Amarillo Soleado
72.007 Amarillo Dorado
BSL Orange
72.110 Naranja Atardecer
72.008 Naranja Fuego
72.009 Naranja Tostado
72.106 Sangre Escarlata
BSL Magenta
72.013 Rosa Pulpo
72.014 Púrpura
72.113 Magenta Profundo
72.112 Rojo Maligno
BSL Violet
72.114 Púrpura Lujurioso
72.076 Púrpura Alienígena
72.015 Púrpura Hechicero
72.116 Púrpura Medianoche
BSL Blue
72.118 Azul Amanecer
72.021 Azul Mágico
72.020 Azul Imperial
72.019 Azul Negro
BSL Turquoise
72.096 Verdín
72.119 Aguamarina
72.024 Halcón Milenario
72.120 Turquesa Abisal
BSL Cold Green
72.121 Verde Espectral
72.025 Verde Malicioso
72.026 Verde Jade
72.027 Verde Casposo
BSL Green
72.122 Verde Bilioso
72.032 Verde Escorpena
72.123 Verde Angelical
72.028 Verde Oscuro
BSL Black
72.001 Blanco Calavera
72.049 Gris Muralla
72.155 Gris Carbón
72.051 Negro
BSL Multipurpose
72.011 Rojo Visceral
72.042 Piel de Parásitos
72.124 Marrón Gargona
72.045 Marrón Carbonizado

ak
AK11204 Emerald Metallic Green
AK11198 Burnt Tin
AK11206 Pearl
AK11200 Astral Beryllium
AK11095 dirty red
AK11026 tenebrous grey
AK11081 fluorescent Orange
AK11043 dirty yellow
AK16044 fluor yellow
AK16047 mahogani
AK11263 frost effect
AK676 moss deposits
AK12102 panel liner black
AK11267 Bronze
AK11268 axidizing agent

Army Painter
Purple Triad: Broodmother Purple, Alien Purple, Coven Purple
Red Triad: Encarmine Red, Pure Red, Archangel Red
Brown Triad: Magnolia Brown, Oak Brown, Cypress Brown
Blue/Turquoise Triad: Ocean Depths, Hydra Turquoise, Fantasmal Blue
Green Triad: Unforgiven Green, Angel Green, Exile Green
Greedy Gold, Gemstone
Highlord Blue
Murder Scene
Zealot Yellow
Gauss Green Fluorescent
Twilight sky
Plasma coil glow
power node glow

green stuff
1705 Fluorescent rose
1776 Fluorescent turquose
1707 Fluorescent blue
1701 Fluorescent yellow
1704 Fluorescent red
1702 Fluorescent orange-yellow
1703 Fluorescent Orange
1700 Fluorescent lime
1760 Fluorescent White
1706 Fluorescent violet
1559 celestial azure
1555 toxic purple
1552 cobalt blue
1554 storm surge green`

// ── Parseo por marca ──────────────────────────────────────────────────────────
const BRAND_HEADERS = {
  'citadel': 'Citadel',
  'vallejo': 'Vallejo',
  'ak': 'AK Interactive',
  'army painter': 'Army Painter',
  'green stuff': 'Green Stuff World',
}

const BSL_HEADERS = new Set(['bsl warm flesh','bsl flesh','bsl yellow','bsl orange','bsl magenta','bsl violet','bsl blue','bsl turquoise','bsl cold green','bsl green','bsl black','bsl multipurpose'])

function parseName(brand, raw) {
  if (brand === 'Vallejo') {
    const m = raw.match(/^(\d{2}\.\d{3})\s+(.+)$/)
    if (m) {
      const code = m[1]
      const engName = VALLEJO_ES_MAP[code]
      return engName || m[2].trim()  // si no tenemos mapeo, usar el nombre español
    }
    return null
  }
  if (brand === 'AK Interactive') {
    const name = raw.replace(/^AK\d+\s*/i, '').trim()
    const AK_FIXES = {
      'mahogani': 'Mahogany Brown',
      'fluor yellow': 'Fluorescent Yellow',
      'panel liner black': 'Black',
    }
    return AK_FIXES[name.toLowerCase()] || name
  }
  if (brand === 'Green Stuff World') {
    return raw.replace(/^\d{4}\s*/, '').trim()
  }
  return raw.trim()
}

const results = []
const stats = { matched: 0, noHex: 0, notInCatalog: 0 }
let currentBrand = null

for (const line of raw.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed) continue

  // Detectar header de marca
  const lower = trimmed.toLowerCase()
  const brandKey = Object.keys(BRAND_HEADERS).find(k => lower === k)
  if (brandKey) { currentBrand = BRAND_HEADERS[brandKey]; continue }
  if (BSL_HEADERS.has(lower)) continue  // saltar headers de BSL

  if (!currentBrand) continue

  // Army Painter: triadas (Nombre: A, B, C) o lista con comas
  if (currentBrand === 'Army Painter') {
    const AP_FIXES = { 'fantasmal blue': 'Phantasmal Blue' }
    let names = []
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':')
      names = parts[1].split(',').map(s => s.trim()).filter(Boolean)
    } else {
      names = trimmed.split(',').map(s => s.trim()).filter(Boolean)
    }
    for (let name of names) {
      name = AP_FIXES[name.toLowerCase()] || name
      const catalog = AP
      const entry = lookupExact(catalog, name) || lookupFuzzy(catalog, name)
      results.push({
        brand: 'Army Painter',
        name: entry ? entry.name : name,
        type: entry?.type || 'base',
        color_hex: entry?.hex || null,
        in_stock: true,
        quantity: 1,
        _matched: !!entry,
      })
      if (entry?.hex) stats.matched++
      else if (entry) stats.noHex++
      else stats.notInCatalog++
    }
    continue
  }

  const name = parseName(currentBrand, trimmed)
  if (!name) continue

  let catalog = null
  if (currentBrand === 'Citadel')          catalog = CITADEL_CAT
  else if (currentBrand === 'Vallejo')     catalog = VALLEJO
  else if (currentBrand === 'AK Interactive') catalog = AK
  else if (currentBrand === 'Green Stuff World') catalog = GSW

  const entry = catalog ? (lookupExact(catalog, name) || lookupFuzzy(catalog, name)) : null
  results.push({
    brand: currentBrand,
    name: entry ? entry.name : name,
    type: entry?.type || 'base',
    color_hex: entry?.hex || null,
    in_stock: true,
    quantity: 1,
    _matched: !!entry,
  })
  if (entry?.hex) stats.matched++
  else if (entry) stats.noHex++
  else stats.notInCatalog++
}

// ── Output ────────────────────────────────────────────────────────────────────
const byBrand = {}
for (const r of results) {
  if (!byBrand[r.brand]) byBrand[r.brand] = { matched: [], noHex: [], notFound: [] }
  if (r._matched && r.color_hex) byBrand[r.brand].matched.push(r.name)
  else if (r._matched) byBrand[r.brand].noHex.push(r.name)
  else byBrand[r.brand].notFound.push(r.name)
}

process.stderr.write('\n=== RESUMEN ===\n')
for (const [brand, s] of Object.entries(byBrand)) {
  process.stderr.write(`\n${brand}:\n`)
  process.stderr.write(`  ✓ Con hex: ${s.matched.length}\n`)
  if (s.noHex.length)   process.stderr.write(`  ~ Sin hex: ${s.noHex.join(', ')}\n`)
  if (s.notFound.length) process.stderr.write(`  ✗ No encontrado: ${s.notFound.join(', ')}\n`)
}
process.stderr.write(`\nTotal: ${results.length} pinturas\n`)
process.stderr.write(`Con hex: ${stats.matched} | Sin hex: ${stats.noHex} | Sin catálogo: ${stats.notInCatalog}\n\n`)

// JSON limpio (sin _matched)
const clean = results.map(({ _matched, ...r }) => r)
process.stdout.write(JSON.stringify(clean, null, 2))
