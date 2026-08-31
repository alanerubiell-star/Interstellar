import { useMemo } from 'react'
import { AppShell } from '../components/AppShell'
import { useStore } from '../state/store'
import { IconChart, IconClock, IconGrowth } from '../components/Icons'

/** Minutos de escritura manual que Noa evita por nota (referencia del material de marca: -70%). */
const MIN_POR_NOTA = 7
const AHORRO = 0.7

export function Metrics() {
  const { consultations, patients } = useStore()

  const semanas = useMemo(() => {
    const hoy = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const fin = new Date(hoy)
      fin.setDate(hoy.getDate() - i * 7)
      const ini = new Date(fin)
      ini.setDate(fin.getDate() - 6)
      const n = consultations.filter((c) => {
        const f = new Date(c.fecha)
        return f >= ini && f <= fin
      }).length
      return { etiqueta: `S-${i}`, n }
    }).reverse()
  }, [consultations])

  const total = consultations.length
  const firmadas = consultations.filter((c) => c.estado === 'firmada').length
  const borradores = consultations.filter((c) => c.estado === 'borrador').length
  const minutosAhorrados = Math.round(total * MIN_POR_NOTA * AHORRO)
  const duracionMedia = total
    ? Math.round(consultations.reduce((a, c) => a + c.duracionSeg, 0) / total / 60)
    : 0
  const max = Math.max(1, ...semanas.map((s) => s.n))

  return (
    <AppShell titulo="Métricas" subtitulo="Tu práctica en números">
      <div className="page">
        <div className="stats-row">
          <div className="card stat">
            <span className="stat-num mono-num">{total}</span>
            <span className="tiny muted">Consultas totales</span>
          </div>
          <div className="card stat">
            <span className="stat-num mono-num">{patients.length}</span>
            <span className="tiny muted">Pacientes</span>
          </div>
          <div className="card stat">
            <span className="stat-num mono-num teal">{minutosAhorrados}′</span>
            <span className="tiny muted">Tiempo ahorrado</span>
          </div>
          <div className="card stat">
            <span className="stat-num mono-num">{duracionMedia}′</span>
            <span className="tiny muted">Duración media</span>
          </div>
        </div>

        <section className="card nota-sec">
          <h3 className="nota-sec-titulo">
            <IconChart size={15} />
            Consultas por semana
          </h3>
          <div className="barras">
            {semanas.map((s, i) => (
              <div key={i} className="barra-col">
                <div
                  className="barra"
                  style={{ height: `${(s.n / max) * 100}%` }}
                  title={`${s.n} consultas`}
                />
                <span className="tiny muted mono-num">{s.n}</span>
              </div>
            ))}
          </div>
          <p className="tiny muted center" style={{ marginTop: 8 }}>
            Últimas 6 semanas
          </p>
        </section>

        <section className="card nota-sec">
          <h3 className="nota-sec-titulo">
            <IconClock size={15} />
            Estado de las notas
          </h3>
          <div className="stack gap-12">
            <Barra etiqueta="Firmadas" valor={firmadas} total={Math.max(1, total)} color="var(--teal-500)" />
            <Barra etiqueta="Borradores" valor={borradores} total={Math.max(1, total)} color="var(--warn)" />
          </div>
        </section>

        <section className="card aviso">
          <IconGrowth size={18} className="teal" style={{ flexShrink: 0, marginTop: 1 }} />
          <p className="small soft">
            Con Noa has ahorrado aproximadamente <strong className="teal">{minutosAhorrados} minutos</strong> de
            escritura. Consulta más pacientes, con mejores notas, en menos tiempo.
          </p>
        </section>
      </div>
    </AppShell>
  )
}

function Barra({
  etiqueta, valor, total, color,
}: { etiqueta: string; valor: number; total: number; color: string }) {
  const pct = Math.round((valor / total) * 100)
  return (
    <div className="stack gap-6">
      <div className="between">
        <span className="small">{etiqueta}</span>
        <span className="small strong mono-num">{valor} · {pct}%</span>
      </div>
      <div className="pista">
        <span className="relleno" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
