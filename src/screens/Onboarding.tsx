import { useNavigate } from 'react-router-dom'
import { NoaLogo, NoaMark } from '../components/Logo'
import { useStore } from '../state/store'
import {
  IconCheckCircle, IconClipboard, IconClock, IconDevices, IconGrowth,
  IconHeart, IconLock, IconMic, IconPuzzle,
} from '../components/Icons'

const BENEFICIOS = [
  {
    icon: IconClock,
    titulo: 'Ahorra tiempo',
    texto:
      'Reduce hasta 70% el tiempo dedicado a escribir notas y enfócate en lo más importante: tus pacientes.',
  },
  {
    icon: IconClipboard,
    titulo: 'Notas clínicas completas y precisas',
    texto:
      'La IA genera notas estructuradas, claras y clínicamente relevantes con lenguaje médico profesional.',
  },
  {
    icon: IconLock,
    titulo: 'Seguridad y confidencialidad garantizadas',
    texto:
      'Cumplimos con los más altos estándares de seguridad para proteger la información de tus pacientes.',
  },
  {
    icon: IconPuzzle,
    titulo: 'Se integra a tu flujo de trabajo',
    texto:
      'Funciona con tu expediente electrónico y herramientas favoritas. Sin cambiar tu forma de trabajar.',
  },
  {
    icon: IconDevices,
    titulo: 'Disponible donde lo necesites',
    texto:
      'Úsalo en consultorio, en casa o en cualquier lugar. Web y app siempre contigo.',
  },
  {
    icon: IconGrowth,
    titulo: 'Mejora tu productividad y crecimiento',
    texto:
      'Consulta más pacientes, con mejores notas, en menos tiempo. Haz crecer tu práctica.',
  },
]

export function Onboarding() {
  const nav = useNavigate()
  const { completarOnboarding } = useStore()

  const entrar = () => {
    completarOnboarding()
    nav('/')
  }

  return (
    <div className="ob scroll-y">
      <div className="ob-inner">
        <header className="ob-head">
          <NoaLogo size={30} />
        </header>

        <section className="ob-hero">
          <div className="ob-hero-copy">
            <h1 className="ob-h1">
              Menos escritura,
              <br />
              <span className="teal">más tiempo para</span>
              <br />
              <span className="teal">tus pacientes</span>
            </h1>
            <p className="ob-lede">
              Noa Notes es tu asistente de IA que escucha, entiende y escribe tu consulta
              clínicamente perfecta.
            </p>
            <div className="row gap-10 wrap">
              <button className="btn btn-primary" onClick={entrar}>
                <IconMic size={17} />
                Comenzar
              </button>
              <button className="btn btn-outline" onClick={entrar}>
                Ver una nota de ejemplo
              </button>
            </div>
          </div>

          <div className="ob-mock" aria-hidden="true">
            <div className="ob-mock-top">
              <span className="ob-mock-mic">
                <IconMic size={16} />
              </span>
              <span className="small soft">Escuchando consulta…</span>
            </div>
            <div className="ob-mock-body">
              <div className="ob-mock-rail">
                <IconMic size={15} />
                <IconClipboard size={15} />
                <IconHeart size={15} />
              </div>
              <div className="ob-mock-doc">
                <p className="small strong">Nota clínica</p>
                <span className="skeleton-line" style={{ width: '92%' }} />
                <span className="skeleton-line" style={{ width: '78%' }} />
                <span className="skeleton-line" style={{ width: '85%' }} />
                <p className="small strong" style={{ marginTop: 10 }}>Plan</p>
                <span className="skeleton-line" style={{ width: '64%' }} />
                <span className="skeleton-line" style={{ width: '72%' }} />
                <p className="small strong" style={{ marginTop: 10 }}>Indicaciones</p>
                <span className="skeleton-line" style={{ width: '58%' }} />
                <span className="skeleton-line" style={{ width: '66%' }} />
              </div>
            </div>
            <div className="ob-mock-toast">
              <IconCheckCircle size={17} />
              <span className="tiny strong">Nota generada automáticamente</span>
            </div>
          </div>
        </section>

        <section className="ob-benefits">
          <h2 className="ob-h2">Beneficios de Noa Notes</h2>
          <div className="ob-grid">
            {BENEFICIOS.map(({ icon: Icon, titulo, texto }) => (
              <article key={titulo} className="ob-card">
                <span className="ob-card-icon">
                  <Icon size={26} />
                </span>
                <h3 className="ob-card-title">{titulo}</h3>
                <p className="small soft">{texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ob-band">
          <div className="row gap-12">
            <NoaMark size={30} />
            <p className="small">
              <strong>Impulsado por IA. Diseñado para médicos.</strong>
              <br />
              <span className="teal strong">Hecho para ti.</span>
            </p>
          </div>
          <span className="ob-band-sep" />
          <div className="row gap-12">
            <span className="ob-band-heart">
              <IconHeart size={19} />
            </span>
            <p className="small">
              Más conexión. Menos clics.
              <br />
              <span className="teal strong">Ese es el poder de Noa Notes.</span>
            </p>
          </div>
        </section>

        <footer className="ob-foot">
          <button className="btn btn-primary btn-block" onClick={entrar}>
            Entrar a Noa Notes
          </button>
          <p className="tiny muted center">
            noa · Una solución de <strong>Doctoralia</strong>
          </p>
        </footer>
      </div>
    </div>
  )
}
