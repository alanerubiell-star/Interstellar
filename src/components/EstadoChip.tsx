import type { EstadoConsulta } from '../lib/types'

const MAPA: Record<EstadoConsulta, { clase: string; texto: string }> = {
  grabando:   { clase: 'chip-amber', texto: 'Grabando' },
  procesando: { clase: 'chip-slate', texto: 'Procesando' },
  borrador:   { clase: 'chip-amber', texto: 'Borrador' },
  firmada:    { clase: 'chip-teal',  texto: 'Firmada' },
}

export function EstadoChip({ estado }: { estado: EstadoConsulta }) {
  const { clase, texto } = MAPA[estado]
  return (
    <span className={`chip ${clase}`} style={{ flexShrink: 0 }}>
      <span className="badge-dot" />
      {texto}
    </span>
  )
}
