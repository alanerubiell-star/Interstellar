import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { NoaLogo, NoaMark } from './Logo'
import { Avatar } from './Avatar'
import { useStore } from '../state/store'
import {
  IconChart, IconChevronLeft, IconMic, IconSettings, IconUsers, IconWave,
} from './Icons'

interface NavItem {
  to: string
  label: string
  icon: (p: { size?: number }) => ReactNode
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/',          label: 'Consultas', icon: IconWave,     end: true },
  { to: '/pacientes', label: 'Pacientes', icon: IconUsers },
  { to: '/metricas',  label: 'Métricas',  icon: IconChart },
  { to: '/ajustes',   label: 'Ajustes',   icon: IconSettings },
]

/**
 * Marco responsivo único: riel lateral en escritorio (>=900px) y barra inferior
 * en móvil. La misma jerarquía de navegación en ambos, sin rutas duplicadas.
 */
export function AppShell({
  children,
  titulo,
  subtitulo,
  volverA,
  acciones,
}: {
  children: ReactNode
  titulo?: string
  subtitulo?: string
  volverA?: string
  acciones?: ReactNode
}) {
  const { doctor } = useStore()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const enGrabacion = pathname.startsWith('/consulta/nueva')

  return (
    <div className="shell">
      {/* ---- riel lateral (escritorio) ---- */}
      <aside className="rail">
        <div className="rail-logo">
          <NoaLogo size={22} />
        </div>

        <button className="btn btn-primary rail-cta" onClick={() => nav('/consulta/nueva')}>
          <IconMic size={17} />
          Nueva consulta
        </button>

        <nav className="rail-nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="rail-link">
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="rail-foot">
          <NavLink to="/ajustes" className="rail-doctor">
            <Avatar nombre={doctor.nombre} size={34} />
            <span className="grow" style={{ lineHeight: 1.25 }}>
              <span className="small strong truncate" style={{ display: 'block' }}>
                {doctor.nombre}
              </span>
              <span className="tiny muted truncate" style={{ display: 'block' }}>
                {doctor.especialidad}
              </span>
            </span>
          </NavLink>
          <p className="tiny muted rail-legal">
            Una solución de <strong>Doctoralia</strong>
          </p>
        </div>
      </aside>

      {/* ---- columna de contenido ---- */}
      <div className="main">
        <header className="topbar">
          {volverA ? (
            <button className="icon-btn" onClick={() => nav(volverA)} aria-label="Volver">
              <IconChevronLeft size={22} />
            </button>
          ) : (
            <span className="topbar-mark">
              <NoaMark size={26} />
            </span>
          )}

          <div className="grow" style={{ minWidth: 0 }}>
            {titulo && <h1 className="topbar-title truncate">{titulo}</h1>}
            {subtitulo && <p className="tiny muted truncate">{subtitulo}</p>}
          </div>

          {acciones && <div className="row gap-8">{acciones}</div>}
        </header>

        <main className="content scroll-y">{children}</main>
      </div>

      {/* ---- barra inferior (móvil) ---- */}
      {!enGrabacion && (
        <nav className="tabbar" aria-label="Navegación principal">
          {NAV.slice(0, 2).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="tab">
              <Icon size={21} />
              <span className="tiny">{label}</span>
            </NavLink>
          ))}

          <button className="tab-fab" onClick={() => nav('/consulta/nueva')} aria-label="Nueva consulta">
            <IconMic size={23} />
          </button>

          {NAV.slice(2).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="tab">
              <Icon size={21} />
              <span className="tiny">{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
