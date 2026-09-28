import { iniciales } from '../lib/format'

export function Avatar({ nombre, size = 40 }: { nombre: string; size?: number }) {
  // Tono estable por paciente: mismo nombre, mismo color.
  const tonos = ['#10B2A5', '#3D8BC4', '#7B6FD0', '#C4823D', '#4FAE7A', '#C0607F']
  const h = [...nombre].reduce((a, c) => a + c.charCodeAt(0), 0)
  const color = tonos[h % tonos.length]!
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: '50%',
        background: `${color}1F`, color,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.36, fontWeight: 700, flexShrink: 0, letterSpacing: '.01em',
      }}
    >
      {iniciales(nombre)}
    </span>
  )
}
