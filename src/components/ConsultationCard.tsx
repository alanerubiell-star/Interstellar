import { Link } from 'react-router-dom'
import { Avatar } from './Avatar'
import { fechaRelativa, mmss } from '../lib/format'
import type { Consultation, Patient } from '../lib/types'
import { IconChevronRight, IconClock } from './Icons'
import { EstadoChip } from './EstadoChip'

export function ConsultationCard({
  consulta,
  paciente,
}: {
  consulta: Consultation
  paciente?: Patient
}) {
  return (
    <Link to={`/consulta/${consulta.id}`} className="card cons-card">
      <Avatar nombre={paciente?.nombre ?? 'Sin asignar'} size={42} />

      <div className="grow stack gap-4">
        <div className="row gap-8">
          <span className="strong truncate">{paciente?.nombre ?? 'Paciente sin asignar'}</span>
          <EstadoChip estado={consulta.estado} />
        </div>
        <span className="small soft truncate">{consulta.motivo}</span>
        <span className="tiny muted row gap-6">
          {fechaRelativa(consulta.fecha)}
          <span aria-hidden="true">·</span>
          <IconClock size={12} />
          {mmss(consulta.duracionSeg)}
        </span>
      </div>

      <IconChevronRight size={18} className="muted" style={{ flexShrink: 0 }} />
    </Link>
  )
}
