import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { ConsultationCard } from '../components/ConsultationCard'
import { useStore } from '../state/store'
import { IconMic, IconSearch, IconWave } from '../components/Icons'
import { mmss } from '../lib/format'

const esHoy = (iso: string): boolean => {
  const d = new Date(iso)
  const h = new Date()
  return (
    d.getDate() === h.getDate() &&
    d.getMonth() === h.getMonth() &&
    d.getFullYear() === h.getFullYear()
  )
}

export function Home() {
  const { consultations, patientById, doctor } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')

  const ordenadas = useMemo(
    () => [...consultations].sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha)),
    [consultations],
  )

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return ordenadas
    return ordenadas.filter((c) => {
      const p = patientById(c.patientId)
      return (
        c.motivo.toLowerCase().includes(t) ||
        (p?.nombre.toLowerCase().includes(t) ?? false) ||
        (p?.expediente.toLowerCase().includes(t) ?? false)
      )
    })
  }, [ordenadas, q, patientById])

  const deHoy = filtradas.filter((c) => esHoy(c.fecha))
  const previas = filtradas.filter((c) => !esHoy(c.fecha))

  const consultasHoy = ordenadas.filter((c) => esHoy(c.fecha))
  const segundosHoy = consultasHoy.reduce((a, c) => a + c.duracionSeg, 0)
  const borradores = ordenadas.filter((c) => c.estado === 'borrador').length
  // Referencia del material de marca: ~70% menos tiempo de escritura por nota.
  const minutosAhorrados = Math.round((consultasHoy.length * 7 * 0.7))

  const saludo = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  })()

  const soloApellido = doctor.nombre.replace(/^(Dra?\.|Dr\.)\s*/, '').split(' ')[0]

  return (
    <AppShell
      titulo="Consultas"
      subtitulo={`${saludo}, ${soloApellido}`}
      acciones={
        <button className="btn btn-primary btn-sm hide-mobile" onClick={() => nav('/consulta/nueva')}>
          <IconMic size={16} />
          Nueva consulta
        </button>
      }
    >
      <div className="page">
        <section className="stats-row">
          <div className="card stat">
            <span className="stat-num mono-num">{consultasHoy.length}</span>
            <span className="tiny muted">Consultas hoy</span>
          </div>
          <div className="card stat">
            <span className="stat-num mono-num">{mmss(segundosHoy)}</span>
            <span className="tiny muted">Tiempo grabado</span>
          </div>
          <div className="card stat">
            <span className="stat-num mono-num teal">{minutosAhorrados}′</span>
            <span className="tiny muted">Tiempo ahorrado</span>
          </div>
          <div className="card stat">
            <span className="stat-num mono-num">{borradores}</span>
            <span className="tiny muted">Por firmar</span>
          </div>
        </section>

        <label className="search">
          <IconSearch size={17} className="muted" />
          <input
            className="search-input"
            placeholder="Buscar por paciente, motivo o expediente"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar consultas"
          />
          {q && (
            <button className="tiny teal strong" onClick={() => setQ('')}>
              Limpiar
            </button>
          )}
        </label>

        {filtradas.length === 0 && (
          <div className="card empty">
            <span className="empty-icon">
              <IconWave size={24} />
            </span>
            <h3>{q ? 'Sin resultados' : 'Aún no hay consultas'}</h3>
            <p className="small">
              {q
                ? 'Prueba con otro nombre o motivo de consulta.'
                : 'Graba tu primera consulta y Noa escribirá la nota por ti.'}
            </p>
            {!q && (
              <button className="btn btn-primary" onClick={() => nav('/consulta/nueva')}>
                <IconMic size={16} />
                Grabar consulta
              </button>
            )}
          </div>
        )}

        {deHoy.length > 0 && (
          <section>
            <div className="section-title">
              <h2>Hoy</h2>
              <span className="tiny muted">{deHoy.length}</span>
            </div>
            <div className="stack gap-10">
              {deHoy.map((c) => (
                <ConsultationCard key={c.id} consulta={c} paciente={patientById(c.patientId)} />
              ))}
            </div>
          </section>
        )}

        {previas.length > 0 && (
          <section>
            <div className="section-title">
              <h2>Anteriores</h2>
              <span className="tiny muted">{previas.length}</span>
            </div>
            <div className="stack gap-10">
              {previas.map((c) => (
                <ConsultationCard key={c.id} consulta={c} paciente={patientById(c.patientId)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}
