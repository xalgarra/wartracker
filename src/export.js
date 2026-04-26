import { db } from './db.js'
import { mostrarError, mostrarExito } from './toast.js'

export async function exportarJSON() {
  const [{ data: minis, error: e1 }, { data: paints, error: e2 }] = await Promise.all([
    db.from('minis').select('*').order('created_at'),
    db.from('paints').select('*').order('brand').order('name')
  ])

  if (e1 || e2) { mostrarError('Error al exportar datos'); return }

  const payload = {
    wartracker_export: '1.0',
    exported_at: new Date().toISOString(),
    minis: minis || [],
    paints: paints || []
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `wartracker-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  mostrarExito(`${payload.minis.length} minis · ${payload.paints.length} pinturas exportadas`)
}
