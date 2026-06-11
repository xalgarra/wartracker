// Genera catálogos JS a partir de los xlsx en docs/
// Uso: node scripts/generate-paint-catalogs.cjs
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

const DOCS = path.join(__dirname, '..', 'docs')
const OUT = path.join(__dirname, '..', 'src')

const TYPE_MAP = {
  'Opaque': 'base',
  'Extra Opaque': 'base',
  'Transparent': 'base',
  'Metallic': 'base',
  'Ink': 'shade',
  'Wash': 'shade',
  'Shade': 'shade',
  'Spray': 'spray',
}

// normaliza hex: descarta alpha (#RRGGBBAA → #RRGGBB) y pasa a minúsculas
function normHex(h) {
  if (!h) return null
  const m = String(h).match(/^#([0-9a-fA-F]{6,8})$/)
  if (!m) return null
  return ('#' + m[1].slice(0, 6)).toLowerCase()
}

function readSheet(file, cols = { name: 1, hex: 2, type: 3 }) {
  const wb = XLSX.readFile(path.join(DOCS, file))
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
  const out = []
  const seen = new Set()
  for (const row of data.slice(1)) {
    const name = row[cols.name]
    if (!name || typeof name !== 'string') continue
    const hex = normHex(row[cols.hex])
    const rawType = row[cols.type]
    const type = TYPE_MAP[rawType] || 'base'
    const key = name.toLowerCase() + '|' + type
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ name: name.trim(), hex, type })
  }
  return out
}

function pad(s, n) { return s + ' '.repeat(Math.max(0, n - s.length)) }

function serialize(arr) {
  const maxName = Math.max(...arr.map(p => p.name.length)) + 2
  return arr.map(p => {
    const n = `'${p.name.replace(/'/g, "\\'")}',`
    const namePart = `name: ${pad(n, maxName + 1)}`
    const hexPart = p.hex ? `hex: '${p.hex}', ` : ''
    return `  { ${namePart}${hexPart}type: '${p.type}' },`
  }).join('\n')
}

function writeCatalog(filename, exportName, comment, paints) {
  const content = `// ${comment}\nexport const ${exportName} = [\n${serialize(paints)}\n]\n`
  fs.writeFileSync(path.join(OUT, filename), content)
  console.log(`✓ ${filename} → ${paints.length} pinturas`)
}

// AK Interactive: 3rd Gen + AFV + AIR + Figures combinadas
const ak3g = readSheet('AK_Interactive_3rd_Generation_Acrylics_v0.xlsx')
const akAfv = readSheet('AK_Iinteractive_3GA_AFV_v1.xlsx')
const akAir = readSheet('AK_Interactive_3GA_AIR_v0.xlsx').map(p => ({ ...p, type: 'air' }))
const akFig = readSheet('Ak_Interactive_3GA_Figures_v0.xlsx')
const akAll = []
const akSeen = new Set()
for (const p of [...ak3g, ...akAfv, ...akAir, ...akFig]) {
  const k = p.name.toLowerCase() + '|' + p.type
  if (akSeen.has(k)) continue
  akSeen.add(k)
  akAll.push(p)
}
writeCatalog('paint-catalog-ak.js', 'AK_3RD_GENERATION',
  'AK Interactive 3rd Generation (3GA + AFV + AIR + Figures) — generado desde docs/*.xlsx',
  akAll)

// Reaper MSP: Core + Bones Ultra + Pathfinder
const mspCore = readSheet('MSP_Core_Colors_v1.xlsx')
const mspBones = readSheet('MSP_Bones_Ultra_Colors_v1.xlsx')
const mspPath = readSheet('MSP_Pathfinder_v1.xlsx')
const mspAll = []
const mspSeen = new Set()
for (const p of [...mspCore, ...mspBones, ...mspPath]) {
  const k = p.name.toLowerCase() + '|' + p.type
  if (mspSeen.has(k)) continue
  mspSeen.add(k)
  mspAll.push(p)
}
writeCatalog('paint-catalog-reaper.js', 'REAPER_MSP',
  'Reaper Master Series Paint (Core + Bones Ultra + Pathfinder)', mspAll)

// Scale75: Fantasy + Scale Color
const sc75a = readSheet('Scale75_Fantasy_and_Game_v0.xlsx')
const sc75b = readSheet('Scale75_Scale_Color_v0.xlsx')
const sc75All = []
const sc75Seen = new Set()
for (const p of [...sc75a, ...sc75b]) {
  const k = p.name.toLowerCase() + '|' + p.type
  if (sc75Seen.has(k)) continue
  sc75Seen.add(k)
  sc75All.push(p)
}
writeCatalog('paint-catalog-scale75.js', 'SCALE75',
  'Scale75 (Fantasy & Game + Scale Color)', sc75All)

// Monument Hobbies ProAcryl: orden de cols distinto
writeCatalog('paint-catalog-proacryl.js', 'PROACRYL',
  'Monument Hobbies Pro Acryl',
  readSheet('Monument_Hobbies_ProAcryl_v0.xlsx', { name: 2, hex: 3, type: 1 }))

// Privateer Press Formula P3
writeCatalog('paint-catalog-p3.js', 'FORMULA_P3',
  'Privateer Press Formula P3',
  readSheet('Privateer_Press_Formula_P3_v0.xlsx'))

// Wargames Foundry
writeCatalog('paint-catalog-foundry.js', 'WARGAMES_FOUNDRY',
  'Wargames Foundry',
  readSheet('Wargames_Foundry_v0.xlsx'))
