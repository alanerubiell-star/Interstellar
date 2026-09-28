export function edad(fechaNacimiento: string): number {
  const n = new Date(fechaNacimiento)
  const hoy = new Date()
  let a = hoy.getFullYear() - n.getFullYear()
  const m = hoy.getMonth() - n.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) a--
  return a
}

export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

export const mmss = (seg: number): string =>
  `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, '0')}`

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function fechaCorta(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

/** "Hoy · 14:30", "Ayer · 09:15", "martes 12 mar · 11:00" */
export function fechaRelativa(iso: string): string {
  const d = new Date(iso)
  const hoy = new Date()
  const dias = Math.round(
    (new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86400000,
  )
  if (dias === 0) return `Hoy · ${hora(iso)}`
  if (dias === 1) return `Ayer · ${hora(iso)}`
  if (dias < 7) return `${DIAS[d.getDay()]} · ${hora(iso)}`
  return `${fechaCorta(iso)} · ${hora(iso)}`
}

export function imc(peso?: string, talla?: string): string | null {
  const p = parseFloat(peso ?? '')
  const t = parseFloat(talla ?? '')
  if (!p || !t) return null
  return (p / (t * t)).toFixed(1)
}
