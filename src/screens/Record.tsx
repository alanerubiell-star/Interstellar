import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { Waveform } from '../components/Waveform'
import { useRecorder } from '../lib/useRecorder'
import { useStore } from '../state/store'
import { pickCase } from '../lib/cases'
import { ETAPAS, emptyNote, generateNote, type EtapaGeneracion } from '../lib/engine'
import { mmss } from '../lib/format'
import type { TranscriptLine } from '../lib/types'
import {
  IconAlert, IconCheck, IconMic, IconPause, IconPlay, IconSpark, IconStop, IconUser,
} from '../components/Icons'

type Fase = 'preparar' | 'grabando' | 'procesando'

export function Record() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { patients, addConsultation, updateConsultation } = useStore()

  const [fase, setFase] = useState<Fase>('preparar')
  const [pacienteId, setPacienteId] = useState(params.get('paciente') ?? '')
  const [motivo, setMotivo] = useState('')
  const [etapa, setEtapa] = useState<EtapaGeneracion>('transcribiendo')

  const rec = useRecorder()
  const guion = useMemo(() => pickCase(motivo), [motivo])
  const consultaIdRef = useRef<string | null>(null)

  // La transcripción se revela conforme avanza el cronómetro de la grabación.
  const lineas: TranscriptLine[] = useMemo(
    () => guion.transcript.filter((l) => l.t <= rec.segundos),
    [guion, rec.segundos],
  )

  const finTranscript = useRef<HTMLDivElement>(null)
  useEffect(() => {
    finTranscript.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [lineas.length])

  const paciente = patients.find((p) => p.id === pacienteId)

  const comenzar = async () => {
    setFase('grabando')
    await rec.iniciar()
  }

  const terminar = async () => {
    rec.detener()
    setFase('procesando')

    const consulta = addConsultation({
      patientId: pacienteId,
      fecha: new Date().toISOString(),
      duracionSeg: rec.segundos,
      estado: 'procesando',
      motivo: motivo.trim() || guion.motivo,
      transcript: guion.transcript.filter((l) => l.t <= rec.segundos),
      note: emptyNote(),
    })
    consultaIdRef.current = consulta.id

    const note = await generateNote(motivo, consulta.transcript, setEtapa)
    updateConsultation(consulta.id, { note, estado: 'borrador' })
    nav(`/consulta/${consulta.id}?nueva=1`, { replace: true })
  }

  const cancelar = () => {
    rec.detener()
    nav('/')
  }

  /* ---------------- preparar ---------------- */
  if (fase === 'preparar') {
    return (
      <AppShell titulo="Nueva consulta" volverA="/">
        <div className="page" style={{ maxWidth: 620 }}>
          <div className="card" style={{ padding: 18 }}>
            <div className="stack gap-16">
              <div className="field">
                <span className="label">Paciente</span>
                <select
                  className="select"
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                >
                  <option value="">Sin asignar (elegir después)</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} · {p.expediente}
                    </option>
                  ))}
                </select>
              </div>

              {paciente && (
                <div className="row gap-10 pac-preview">
                  <Avatar nombre={paciente.nombre} size={38} />
                  <div className="grow stack gap-2">
                    <span className="small strong truncate">{paciente.nombre}</span>
                    <span className="tiny muted truncate">
                      {paciente.alergias.length
                        ? `Alergias: ${paciente.alergias.join(', ')}`
                        : 'Sin alergias registradas'}
                    </span>
                  </div>
                  {paciente.alergias.length > 0 && (
                    <span className="chip chip-amber">
                      <IconAlert size={13} />
                      Alergias
                    </span>
                  )}
                </div>
              )}

              <div className="field">
                <span className="label">Motivo de consulta (opcional)</span>
                <input
                  className="input"
                  placeholder="Ej. dolor de garganta, control de presión…"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
                <span className="tiny muted">
                  Ayuda a Noa a orientar la nota. Puedes dejarlo vacío.
                </span>
              </div>
            </div>
          </div>

          <div className="card aviso">
            <IconMic size={18} className="teal" style={{ flexShrink: 0, marginTop: 1 }} />
            <p className="small soft">
              Informa al paciente que la consulta será asistida por Noa y obtén su
              consentimiento antes de grabar. El audio no se conserva una vez generada la nota.
            </p>
          </div>

          <button className="btn btn-primary btn-block" onClick={comenzar}>
            <IconMic size={18} />
            Comenzar a escuchar
          </button>
        </div>
      </AppShell>
    )
  }

  /* ---------------- procesando ---------------- */
  if (fase === 'procesando') {
    const idx = ETAPAS.findIndex((e) => e.id === etapa)
    return (
      <AppShell titulo="Generando nota">
        <div className="page proc">
          <span className="proc-orb">
            <IconSpark size={30} />
          </span>
          <h2 className="center">Noa está escribiendo la nota</h2>
          <p className="small muted center">Esto toma unos segundos.</p>

          <ul className="proc-steps">
            {ETAPAS.map((e, i) => (
              <li key={e.id} className={i < idx ? 'hecho' : i === idx ? 'activo' : ''}>
                <span className="proc-dot">{i < idx ? <IconCheck size={13} /> : i + 1}</span>
                <span className="small">{e.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </AppShell>
    )
  }

  /* ---------------- grabando ---------------- */
  const pausado = rec.estado === 'pausado'

  return (
    <div className="rec">
      <header className="rec-head">
        <button className="btn btn-sm btn-ghost" onClick={cancelar}>
          Cancelar
        </button>
        <span className="chip chip-teal">
          <span className={pausado ? 'badge-dot' : 'badge-dot pulso'} />
          {pausado ? 'En pausa' : 'Escuchando consulta…'}
        </span>
        <span style={{ width: 74 }} />
      </header>

      <div className="rec-meta">
        {paciente ? (
          <div className="row gap-10">
            <Avatar nombre={paciente.nombre} size={36} />
            <div className="stack">
              <span className="small strong">{paciente.nombre}</span>
              <span className="tiny muted">{paciente.expediente}</span>
            </div>
          </div>
        ) : (
          <div className="row gap-10 muted">
            <span className="rec-anon">
              <IconUser size={18} />
            </span>
            <span className="small">Paciente sin asignar</span>
          </div>
        )}
        <span className="rec-timer mono-num">{mmss(rec.segundos)}</span>
      </div>

      <Waveform nivel={rec.nivel} activo={!pausado} alto={54} barras={40} />

      {!rec.usandoMicReal && (
        <p className="tiny muted center rec-nomic">
          <IconAlert size={12} /> Sin acceso al micrófono: la sesión continúa en modo demostración.
        </p>
      )}

      <div className="rec-transcript scroll-y">
        {lineas.length === 0 ? (
          <p className="small muted center" style={{ padding: '28px 12px' }}>
            La transcripción aparecerá aquí conforme hablen.
          </p>
        ) : (
          lineas.map((l, i) => (
            <p key={i} className={`linea ${l.hablante}`}>
              <span className="tiny strong linea-quien">
                {l.hablante === 'medico' ? 'Médico' : 'Paciente'}
              </span>
              <span className="small">{l.texto}</span>
            </p>
          ))
        )}
        <div ref={finTranscript} />
      </div>

      <footer className="rec-foot">
        <button
          className="btn btn-outline rec-btn-sec"
          onClick={pausado ? rec.reanudar : rec.pausar}
        >
          {pausado ? <IconPlay size={16} /> : <IconPause size={16} />}
          {pausado ? 'Reanudar' : 'Pausar'}
        </button>

        <button className="rec-stop" onClick={terminar} aria-label="Terminar consulta">
          <IconStop size={26} />
        </button>

        <span className="rec-btn-sec tiny muted center">
          Termina para
          <br />
          generar la nota
        </span>
      </footer>
    </div>
  )
}
