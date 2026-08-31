import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { useStore } from '../state/store'
import { IconLock, IconPuzzle, IconSettings, IconShield, IconSpark, IconTrash } from '../components/Icons'
import type { Preferencias } from '../lib/types'

export function Settings() {
  const { doctor, setDoctor, preferencias, setPreferencias, restablecerDemo } = useStore()
  const nav = useNavigate()

  const set = <K extends keyof Preferencias>(k: K, v: Preferencias[K]) =>
    setPreferencias({ ...preferencias, [k]: v })

  return (
    <AppShell titulo="Ajustes">
      <div className="page" style={{ maxWidth: 720 }}>
        <div className="card nota-head">
          <Avatar nombre={doctor.nombre} size={50} />
          <div className="grow stack gap-4">
            <span className="strong">{doctor.nombre}</span>
            <span className="tiny muted">{doctor.especialidad}</span>
            <span className="tiny muted">Céd. Prof. {doctor.cedula}</span>
          </div>
        </div>

        <section className="card nota-sec">
          <h3 className="nota-sec-titulo">Perfil profesional</h3>
          <div className="stack gap-12">
            <Campo
              etiqueta="Nombre" valor={doctor.nombre}
              onChange={(v) => setDoctor({ ...doctor, nombre: v })}
            />
            <Campo
              etiqueta="Especialidad" valor={doctor.especialidad}
              onChange={(v) => setDoctor({ ...doctor, especialidad: v })}
            />
            <Campo
              etiqueta="Cédula profesional" valor={doctor.cedula}
              onChange={(v) => setDoctor({ ...doctor, cedula: v })}
            />
            <Campo
              etiqueta="Institución" valor={doctor.institucion}
              onChange={(v) => setDoctor({ ...doctor, institucion: v })}
            />
            <Campo
              etiqueta="Consultorio" valor={doctor.consultorio}
              onChange={(v) => setDoctor({ ...doctor, consultorio: v })}
            />
          </div>
        </section>

        <section className="card nota-sec">
          <h3 className="nota-sec-titulo">
            <IconSpark size={15} />
            Generación de notas
          </h3>
          <div className="stack gap-14">
            <div className="field">
              <span className="label">Estilo de redacción</span>
              <select
                className="select"
                value={preferencias.estiloNota}
                onChange={(e) => set('estiloNota', e.target.value as Preferencias['estiloNota'])}
              >
                <option value="soap">Estructurada (SOAP / NOM-004)</option>
                <option value="narrativa">Narrativa</option>
                <option value="concisa">Concisa</option>
              </select>
            </div>

            <Interruptor
              titulo="Incluir receta en la nota"
              detalle="Genera la sección de medicamentos con dosis, vía y duración."
              activo={preferencias.incluirReceta}
              onChange={(v) => set('incluirReceta', v)}
            />
            <Interruptor
              titulo="Firmar automáticamente"
              detalle="No recomendado: revisa siempre la nota antes de firmarla."
              activo={preferencias.autoFirmar}
              onChange={(v) => set('autoFirmar', v)}
            />
          </div>
        </section>

        <section className="card nota-sec">
          <h3 className="nota-sec-titulo">
            <IconShield size={15} />
            Privacidad y seguridad
          </h3>
          <div className="stack gap-14">
            <Interruptor
              titulo="Conservar el audio de la consulta"
              detalle="Desactivado, el audio se descarta en cuanto se genera la nota."
              activo={preferencias.retenerAudio}
              onChange={(v) => set('retenerAudio', v)}
            />
            <div className="row gap-10 aviso" style={{ borderRadius: 'var(--r-md)' }}>
              <IconLock size={17} className="teal" style={{ flexShrink: 0, marginTop: 1 }} />
              <p className="small soft">
                Los datos de esta versión se guardan únicamente en este dispositivo. Antes de usar
                Noa con pacientes reales debe conectarse al backend con cifrado en tránsito y en
                reposo, y completarse el aviso de privacidad conforme a la LFPDPPP.
              </p>
            </div>
          </div>
        </section>

        <section className="card nota-sec">
          <h3 className="nota-sec-titulo">
            <IconPuzzle size={15} />
            Integraciones
          </h3>
          <div className="stack gap-10">
            {[
              ['Expediente electrónico', 'Copiar la nota al expediente con un clic', true],
              ['Doctoralia', 'Agenda y datos del paciente', true],
              ['Exportar a PDF', 'Nota firmada lista para imprimir', false],
            ].map(([titulo, detalle, listo]) => (
              <div key={titulo as string} className="between integ">
                <div className="stack gap-2">
                  <span className="small strong">{titulo}</span>
                  <span className="tiny muted">{detalle}</span>
                </div>
                <span className={`chip ${listo ? 'chip-teal' : 'chip-slate'}`}>
                  {listo ? 'Disponible' : 'Próximamente'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card nota-sec">
          <h3 className="nota-sec-titulo">
            <IconSettings size={15} />
            Datos de la aplicación
          </h3>
          <div className="row gap-8 wrap">
            <button className="btn btn-sm btn-outline" onClick={() => nav('/bienvenida')}>
              Ver la presentación
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                if (confirm('¿Restablecer la app a los datos de demostración?')) restablecerDemo()
              }}
            >
              <IconTrash size={15} />
              Restablecer datos
            </button>
          </div>
        </section>

        <p className="tiny muted center" style={{ paddingBottom: 8 }}>
          Noa Notes · versión 0.1.0 — Una solución de <strong>Doctoralia</strong>
        </p>
      </div>
    </AppShell>
  )
}

function Campo({
  etiqueta, valor, onChange,
}: { etiqueta: string; valor: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span className="label">{etiqueta}</span>
      <input className="input" value={valor} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function Interruptor({
  titulo, detalle, activo, onChange,
}: { titulo: string; detalle: string; activo: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="between gap-12">
      <div className="stack gap-2 grow">
        <span className="small strong">{titulo}</span>
        <span className="tiny muted">{detalle}</span>
      </div>
      <button
        role="switch"
        aria-checked={activo}
        aria-label={titulo}
        className={activo ? 'switch on' : 'switch'}
        onClick={() => onChange(!activo)}
      >
        <span className="switch-perilla" />
      </button>
    </div>
  )
}
