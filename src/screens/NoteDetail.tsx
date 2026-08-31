import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { EstadoChip } from '../components/EstadoChip'
import { EditableList } from '../components/EditableList'
import { AutoTextarea } from '../components/AutoTextarea'
import { useStore } from '../state/store'
import { noteToText } from '../lib/engine'
import { edad, fechaRelativa, imc, mmss } from '../lib/format'
import type { ClinicalNote } from '../lib/types'
import {
  IconAlert, IconCheck, IconCheckCircle, IconCopy, IconDownload, IconPill, IconPlus,
  IconSpark, IconTrash,
} from '../components/Icons'

const CAMPOS_VITALES: { k: keyof ClinicalNote['signosVitales']; label: string; unidad: string }[] = [
  { k: 'ta', label: 'TA', unidad: 'mmHg' },
  { k: 'fc', label: 'FC', unidad: 'lpm' },
  { k: 'fr', label: 'FR', unidad: 'rpm' },
  { k: 'temp', label: 'Temp', unidad: '°C' },
  { k: 'sato2', label: 'SatO₂', unidad: '%' },
  { k: 'peso', label: 'Peso', unidad: 'kg' },
  { k: 'talla', label: 'Talla', unidad: 'm' },
]

export function NoteDetail() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { consultationById, patientById, updateConsultation, deleteConsultation, doctor } = useStore()

  const consulta = consultationById(id)
  const [tab, setTab] = useState<'nota' | 'transcripcion'>('nota')
  const [copiado, setCopiado] = useState(false)
  const esNueva = params.get('nueva') === '1'

  const paciente = consulta ? patientById(consulta.patientId) : undefined
  const bloqueado = consulta?.estado === 'firmada'

  const encabezado = useMemo(() => {
    if (!consulta) return ''
    return [
      `NOTA DE CONSULTA — ${new Date(consulta.fecha).toLocaleString('es-MX')}`,
      paciente
        ? `Paciente: ${paciente.nombre} · ${edad(paciente.fechaNacimiento)} años · Exp. ${paciente.expediente}`
        : 'Paciente: sin asignar',
      `Médico: ${doctor.nombre} · ${doctor.especialidad} · Céd. Prof. ${doctor.cedula}`,
    ].join('\n')
  }, [consulta, paciente, doctor])

  if (!consulta) {
    return (
      <AppShell titulo="Consulta" volverA="/">
        <div className="card empty">
          <h3>No encontramos esta consulta</h3>
          <button className="btn btn-ghost" onClick={() => nav('/')}>Volver a consultas</button>
        </div>
      </AppShell>
    )
  }

  const note = consulta.note
  const set = (cambios: Partial<ClinicalNote>) =>
    updateConsultation(consulta.id, { note: { ...note, ...cambios } })

  const copiar = async () => {
    const texto = noteToText(note, encabezado)
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      // Sin permiso de portapapeles: selección manual como respaldo.
      const ta = document.createElement('textarea')
      ta.value = texto
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2200)
  }

  const descargar = () => {
    const blob = new Blob([noteToText(note, encabezado)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nota-${paciente?.expediente ?? 'consulta'}-${consulta.fecha.slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const firmar = () =>
    updateConsultation(consulta.id, {
      estado: 'firmada',
      firmadaPor: doctor.nombre,
      firmadaEn: new Date().toISOString(),
    })

  const eliminar = () => {
    if (confirm('¿Eliminar esta consulta y su nota? Esta acción no se puede deshacer.')) {
      deleteConsultation(consulta.id)
      nav('/')
    }
  }

  const bmi = imc(note.signosVitales.peso, note.signosVitales.talla)

  return (
    <AppShell
      titulo="Nota clínica"
      subtitulo={fechaRelativa(consulta.fecha)}
      volverA="/"
      acciones={
        <>
          <button className="btn btn-sm btn-ghost" onClick={copiar}>
            {copiado ? <IconCheck size={15} /> : <IconCopy size={15} />}
            <span className="hide-mobile-inline">{copiado ? 'Copiado' : 'Copiar'}</span>
          </button>
          {!bloqueado && (
            <button className="btn btn-sm btn-primary" onClick={firmar}>
              <IconCheck size={15} />
              Firmar
            </button>
          )}
        </>
      }
    >
      <div className="page">
        {esNueva && (
          <div className="card aviso">
            <IconCheckCircle size={18} className="teal" style={{ flexShrink: 0, marginTop: 1 }} />
            <p className="small soft">
              <strong className="teal">Nota generada automáticamente.</strong> Revísala y edita lo
              que necesites antes de firmar. Tú tienes la última palabra.
            </p>
          </div>
        )}

        {/* --- cabecera del paciente --- */}
        <div className="card nota-head">
          <Avatar nombre={paciente?.nombre ?? 'Sin asignar'} size={46} />
          <div className="grow stack gap-4">
            <div className="row gap-8 wrap">
              <span className="strong">{paciente?.nombre ?? 'Paciente sin asignar'}</span>
              <EstadoChip estado={consulta.estado} />
            </div>
            {paciente && (
              <span className="tiny muted">
                {edad(paciente.fechaNacimiento)} años ·{' '}
                {paciente.sexo === 'F' ? 'Femenino' : paciente.sexo === 'M' ? 'Masculino' : 'Otro'} ·{' '}
                Exp. {paciente.expediente}
              </span>
            )}
            <span className="tiny muted">Duración de la consulta: {mmss(consulta.duracionSeg)}</span>
            {paciente && paciente.alergias.length > 0 && (
              <span className="chip chip-amber" style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                <IconAlert size={13} />
                Alergias: {paciente.alergias.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* --- pestañas --- */}
        <div className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'nota'}
            className={tab === 'nota' ? 'tabs-item activo' : 'tabs-item'}
            onClick={() => setTab('nota')}
          >
            Nota
          </button>
          <button
            role="tab"
            aria-selected={tab === 'transcripcion'}
            className={tab === 'transcripcion' ? 'tabs-item activo' : 'tabs-item'}
            onClick={() => setTab('transcripcion')}
          >
            Transcripción
          </button>
        </div>

        {tab === 'transcripcion' ? (
          <div className="card nota-sec">
            <div className="stack gap-10">
              {consulta.transcript.map((l, i) => (
                <p key={i} className={`linea ${l.hablante}`}>
                  <span className="tiny strong linea-quien">
                    {l.hablante === 'medico' ? 'Médico' : 'Paciente'}
                  </span>
                  <span className="small">{l.texto}</span>
                </p>
              ))}
            </div>
            <p className="tiny muted" style={{ marginTop: 14 }}>
              El audio de esta consulta no se conserva. La transcripción se guarda como respaldo
              de la nota.
            </p>
          </div>
        ) : (
          <>
            <Seccion titulo="Motivo de consulta">
              <Texto valor={note.motivo} onChange={(v) => set({ motivo: v })} bloqueado={bloqueado} filas={2} />
            </Seccion>

            <Seccion titulo="Padecimiento actual">
              <Texto
                valor={note.padecimientoActual}
                onChange={(v) => set({ padecimientoActual: v })}
                bloqueado={bloqueado}
                filas={6}
              />
            </Seccion>

            <Seccion titulo="Signos vitales">
              <div className="vitales">
                {CAMPOS_VITALES.map(({ k, label, unidad }) => (
                  <label key={k} className="vital">
                    <span className="tiny muted">{label}</span>
                    {bloqueado ? (
                      <span className="strong mono-num">{note.signosVitales[k] || '—'}</span>
                    ) : (
                      <input
                        className="vital-input mono-num"
                        value={note.signosVitales[k] ?? ''}
                        onChange={(e) =>
                          set({ signosVitales: { ...note.signosVitales, [k]: e.target.value } })
                        }
                        aria-label={label}
                      />
                    )}
                    <span className="tiny muted">{unidad}</span>
                  </label>
                ))}
                {bmi && (
                  <div className="vital">
                    <span className="tiny muted">IMC</span>
                    <span className="strong mono-num">{bmi}</span>
                    <span className="tiny muted">kg/m²</span>
                  </div>
                )}
              </div>
            </Seccion>

            <Seccion titulo="Exploración física">
              <Texto
                valor={note.exploracionFisica}
                onChange={(v) => set({ exploracionFisica: v })}
                bloqueado={bloqueado}
                filas={6}
              />
            </Seccion>

            <Seccion titulo="Diagnósticos">
              <div className="stack gap-8">
                {note.diagnosticos.map((d, i) => (
                  <div key={i} className="dx">
                    {bloqueado ? (
                      <>
                        <span className="chip chip-slate mono-num">{d.cie10}</span>
                        <span className="small grow">{d.texto}</span>
                      </>
                    ) : (
                      <>
                        <input
                          className="input dx-cie mono-num"
                          value={d.cie10}
                          placeholder="CIE-10"
                          onChange={(e) =>
                            set({
                              diagnosticos: note.diagnosticos.map((x, j) =>
                                j === i ? { ...x, cie10: e.target.value } : x,
                              ),
                            })
                          }
                        />
                        <input
                          className="input grow"
                          value={d.texto}
                          placeholder="Diagnóstico"
                          onChange={(e) =>
                            set({
                              diagnosticos: note.diagnosticos.map((x, j) =>
                                j === i ? { ...x, texto: e.target.value } : x,
                              ),
                            })
                          }
                        />
                        <button
                          className="icon-btn icon-btn-sm"
                          style={{ marginTop: 0 }}
                          onClick={() =>
                            set({ diagnosticos: note.diagnosticos.filter((_, j) => j !== i) })
                          }
                          aria-label="Quitar diagnóstico"
                        >
                          <IconTrash size={15} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {!bloqueado && (
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() =>
                      set({ diagnosticos: [...note.diagnosticos, { cie10: '', texto: '' }] })
                    }
                  >
                    <IconPlus size={15} />
                    Agregar diagnóstico
                  </button>
                )}
              </div>
            </Seccion>

            <Seccion titulo="Plan">
              <EditableList
                items={note.plan}
                onChange={(plan) => set({ plan })}
                bloqueado={bloqueado}
                etiquetaAgregar="Agregar al plan"
              />
            </Seccion>

            <Seccion titulo="Indicaciones al paciente">
              <EditableList
                items={note.indicaciones}
                onChange={(indicaciones) => set({ indicaciones })}
                bloqueado={bloqueado}
                etiquetaAgregar="Agregar indicación"
              />
            </Seccion>

            <Seccion titulo="Receta" icono={<IconPill size={16} />}>
              <div className="stack gap-10">
                {note.receta.length === 0 && (
                  <p className="small muted">Sin medicamentos indicados.</p>
                )}
                {note.receta.map((r, i) => (
                  <div key={i} className="receta">
                    <div className="row gap-8 between">
                      <span className="strong small">{r.farmaco}</span>
                      {!bloqueado && (
                        <button
                          className="icon-btn icon-btn-sm"
                          style={{ marginTop: 0 }}
                          onClick={() => set({ receta: note.receta.filter((_, j) => j !== i) })}
                          aria-label="Quitar medicamento"
                        >
                          <IconTrash size={15} />
                        </button>
                      )}
                    </div>
                    <span className="tiny soft">
                      {r.dosis} · {r.via} · {r.frecuencia} · {r.duracion}
                    </span>
                  </div>
                ))}
              </div>
            </Seccion>

            <Seccion titulo="Pronóstico">
              <Texto
                valor={note.pronostico}
                onChange={(v) => set({ pronostico: v })}
                bloqueado={bloqueado}
                filas={2}
              />
            </Seccion>

            {/* --- firma / acciones --- */}
            <div className="card nota-firma">
              {bloqueado ? (
                <div className="row gap-10">
                  <span className="firma-ok">
                    <IconCheckCircle size={19} />
                  </span>
                  <div className="stack">
                    <span className="small strong">Nota firmada por {consulta.firmadaPor}</span>
                    <span className="tiny muted">
                      {consulta.firmadaEn && fechaRelativa(consulta.firmadaEn)} · Céd. Prof.{' '}
                      {doctor.cedula}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="small soft">
                    Al firmar, la nota queda como versión final del expediente y ya no podrá
                    editarse.
                  </p>
                  <button className="btn btn-primary" onClick={firmar}>
                    <IconCheck size={16} />
                    Firmar nota
                  </button>
                </>
              )}
            </div>

            <div className="row gap-8 wrap nota-acciones">
              <button className="btn btn-sm btn-outline" onClick={copiar}>
                {copiado ? <IconCheck size={15} /> : <IconCopy size={15} />}
                {copiado ? 'Copiado al portapapeles' : 'Copiar al expediente'}
              </button>
              <button className="btn btn-sm btn-outline" onClick={descargar}>
                <IconDownload size={15} />
                Descargar
              </button>
              {paciente && (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => nav(`/pacientes/${paciente.id}`)}
                >
                  <IconSpark size={15} />
                  Ver historial
                </button>
              )}
              <button className="btn btn-sm btn-danger" onClick={eliminar}>
                <IconTrash size={15} />
                Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

function Seccion({
  titulo,
  icono,
  children,
}: {
  titulo: string
  icono?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="card nota-sec">
      <h3 className="nota-sec-titulo">
        {icono}
        {titulo}
      </h3>
      {children}
    </section>
  )
}

function Texto({
  valor,
  onChange,
  bloqueado,
  filas,
}: {
  valor: string
  onChange: (v: string) => void
  bloqueado: boolean
  filas: number
}) {
  if (bloqueado) return <p className="small nota-parrafo">{valor || '—'}</p>
  return <AutoTextarea valor={valor} onChange={onChange} minAlto={filas > 2 ? 76 : 46} />
}
