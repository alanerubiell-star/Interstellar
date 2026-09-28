import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { useStore } from '../state/store'
import { edad } from '../lib/format'
import { IconAlert, IconChevronRight, IconPlus, IconSearch, IconUsers } from '../components/Icons'
import type { Sexo } from '../lib/types'

export function Patients() {
  const { patients, consultationsOf, addPatient } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [alta, setAlta] = useState(false)

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    const orden = [...patients].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    if (!t) return orden
    return orden.filter(
      (p) => p.nombre.toLowerCase().includes(t) || p.expediente.toLowerCase().includes(t),
    )
  }, [patients, q])

  return (
    <AppShell
      titulo="Pacientes"
      subtitulo={`${patients.length} registrados`}
      acciones={
        <button className="btn btn-sm btn-primary" onClick={() => setAlta(true)}>
          <IconPlus size={15} />
          <span className="hide-mobile-inline">Nuevo</span>
        </button>
      }
    >
      <div className="page">
        <label className="search">
          <IconSearch size={17} className="muted" />
          <input
            className="search-input"
            placeholder="Buscar por nombre o expediente"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar pacientes"
          />
        </label>

        {filtrados.length === 0 ? (
          <div className="card empty">
            <span className="empty-icon"><IconUsers size={24} /></span>
            <h3>Sin pacientes</h3>
            <p className="small">
              {q ? 'Ningún paciente coincide con la búsqueda.' : 'Da de alta a tu primer paciente.'}
            </p>
          </div>
        ) : (
          <div className="stack gap-10">
            {filtrados.map((p) => {
              const n = consultationsOf(p.id).length
              return (
                <Link key={p.id} to={`/pacientes/${p.id}`} className="card cons-card">
                  <Avatar nombre={p.nombre} size={42} />
                  <div className="grow stack gap-4">
                    <div className="row gap-8 wrap">
                      <span className="strong truncate">{p.nombre}</span>
                      {p.alergias.length > 0 && (
                        <span className="chip chip-amber">
                          <IconAlert size={12} />
                          Alergias
                        </span>
                      )}
                    </div>
                    <span className="tiny muted">
                      {edad(p.fechaNacimiento)} años ·{' '}
                      {p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : 'Otro'} ·{' '}
                      {p.expediente}
                    </span>
                    <span className="tiny muted">
                      {n === 0 ? 'Sin consultas' : n === 1 ? '1 consulta' : `${n} consultas`}
                    </span>
                  </div>
                  <IconChevronRight size={18} className="muted" style={{ flexShrink: 0 }} />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {alta && (
        <AltaPaciente
          onCerrar={() => setAlta(false)}
          onGuardar={(datos) => {
            const p = addPatient(datos)
            setAlta(false)
            nav(`/pacientes/${p.id}`)
          }}
          siguienteFolio={`EXP-${String(patients.length + 1).padStart(4, '0')}`}
        />
      )}
    </AppShell>
  )
}

function AltaPaciente({
  onCerrar,
  onGuardar,
  siguienteFolio,
}: {
  onCerrar: () => void
  onGuardar: (p: {
    nombre: string; fechaNacimiento: string; sexo: Sexo; telefono?: string
    email?: string; expediente: string; alergias: string[]; antecedentes: string[]
  }) => void
  siguienteFolio: string
}) {
  const [nombre, setNombre] = useState('')
  const [fechaNacimiento, setFecha] = useState('')
  const [sexo, setSexo] = useState<Sexo>('F')
  const [telefono, setTelefono] = useState('')
  const [alergias, setAlergias] = useState('')

  const valido = nombre.trim().length > 2 && fechaNacimiento !== ''

  return (
    <div className="modal-fondo" onClick={onCerrar} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 style={{ fontSize: 18 }}>Nuevo paciente</h2>

        <div className="field">
          <span className="label">Nombre completo</span>
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
        </div>

        <div className="row gap-10">
          <div className="field grow">
            <span className="label">Fecha de nacimiento</span>
            <input
              className="input" type="date" value={fechaNacimiento}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="field" style={{ width: 116 }}>
            <span className="label">Sexo</span>
            <select className="select" value={sexo} onChange={(e) => setSexo(e.target.value as Sexo)}>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
              <option value="X">Otro</option>
            </select>
          </div>
        </div>

        <div className="field">
          <span className="label">Teléfono (opcional)</span>
          <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>

        <div className="field">
          <span className="label">Alergias (separadas por coma)</span>
          <input
            className="input" value={alergias} placeholder="Penicilina, sulfas…"
            onChange={(e) => setAlergias(e.target.value)}
          />
        </div>

        <div className="row gap-10" style={{ marginTop: 4 }}>
          <button className="btn btn-ghost grow" onClick={onCerrar}>Cancelar</button>
          <button
            className="btn btn-primary grow"
            disabled={!valido}
            onClick={() =>
              onGuardar({
                nombre: nombre.trim(),
                fechaNacimiento,
                sexo,
                telefono: telefono.trim() || undefined,
                expediente: siguienteFolio,
                alergias: alergias.split(',').map((a) => a.trim()).filter(Boolean),
                antecedentes: [],
              })
            }
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
