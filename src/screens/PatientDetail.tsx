import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { ConsultationCard } from '../components/ConsultationCard'
import { useStore } from '../state/store'
import { edad, fechaCorta } from '../lib/format'
import { IconAlert, IconMic, IconWave } from '../components/Icons'

export function PatientDetail() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const { patientById, consultationsOf } = useStore()
  const paciente = patientById(id)

  if (!paciente) {
    return (
      <AppShell titulo="Paciente" volverA="/pacientes">
        <div className="card empty">
          <h3>No encontramos este paciente</h3>
          <button className="btn btn-ghost" onClick={() => nav('/pacientes')}>
            Volver a pacientes
          </button>
        </div>
      </AppShell>
    )
  }

  const consultas = consultationsOf(paciente.id)

  return (
    <AppShell
      titulo={paciente.nombre}
      subtitulo={`Exp. ${paciente.expediente}`}
      volverA="/pacientes"
      acciones={
        <button
          className="btn btn-sm btn-primary"
          onClick={() => nav(`/consulta/nueva?paciente=${paciente.id}`)}
        >
          <IconMic size={15} />
          <span className="hide-mobile-inline">Consulta</span>
        </button>
      }
    >
      <div className="page">
        <div className="card nota-head">
          <Avatar nombre={paciente.nombre} size={54} />
          <div className="grow stack gap-6">
            <span className="strong" style={{ fontSize: 17 }}>{paciente.nombre}</span>
            <span className="tiny muted">
              {edad(paciente.fechaNacimiento)} años ·{' '}
              {paciente.sexo === 'F' ? 'Femenino' : paciente.sexo === 'M' ? 'Masculino' : 'Otro'} ·
              Nac. {fechaCorta(paciente.fechaNacimiento)}
            </span>
            {paciente.telefono && <span className="tiny muted">Tel. {paciente.telefono}</span>}
            {paciente.email && <span className="tiny muted">{paciente.email}</span>}
          </div>
        </div>

        <section className="card nota-sec">
          <h3 className="nota-sec-titulo">
            <IconAlert size={15} />
            Alergias
          </h3>
          {paciente.alergias.length === 0 ? (
            <p className="small muted">Sin alergias registradas.</p>
          ) : (
            <div className="row gap-8 wrap">
              {paciente.alergias.map((a) => (
                <span key={a} className="chip chip-amber">{a}</span>
              ))}
            </div>
          )}
        </section>

        <section className="card nota-sec">
          <h3 className="nota-sec-titulo">Antecedentes</h3>
          {paciente.antecedentes.length === 0 ? (
            <p className="small muted">Sin antecedentes registrados.</p>
          ) : (
            <ul className="lista-lectura">
              {paciente.antecedentes.map((a) => (
                <li key={a} className="small">{a}</li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="section-title">
            <h2>Historial de consultas</h2>
            <span className="tiny muted">{consultas.length}</span>
          </div>

          {consultas.length === 0 ? (
            <div className="card empty">
              <span className="empty-icon"><IconWave size={24} /></span>
              <h3>Sin consultas registradas</h3>
              <button
                className="btn btn-primary"
                onClick={() => nav(`/consulta/nueva?paciente=${paciente.id}`)}
              >
                <IconMic size={16} />
                Grabar consulta
              </button>
            </div>
          ) : (
            <div className="stack gap-10">
              {consultas.map((c) => (
                <ConsultationCard key={c.id} consulta={c} paciente={paciente} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
