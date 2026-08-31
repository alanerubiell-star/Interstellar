import { useEffect, useRef } from 'react'

/**
 * Onda de audio en vivo: cada muestra entra por la derecha y desplaza el
 * historial, igual que un monitor de grabación.
 */
export function Waveform({
  nivel,
  activo,
  barras = 44,
  alto = 56,
  color = 'var(--teal-500)',
}: {
  nivel: number
  activo: boolean
  barras?: number
  alto?: number
  color?: string
}) {
  const hist = useRef<number[]>(Array(barras).fill(0.05))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activo) return
    hist.current = [...hist.current.slice(1), Math.max(0.05, nivel)]
    const nodos = ref.current?.children
    if (!nodos) return
    for (let i = 0; i < nodos.length; i++) {
      const el = nodos[i] as HTMLElement
      el.style.height = `${Math.round(hist.current[i]! * alto) + 3}px`
    }
  }, [nivel, activo, alto])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 3, height: alto + 6,
      }}
    >
      {Array.from({ length: barras }, (_, i) => (
        <span
          key={i}
          style={{
            width: 3, height: 4, borderRadius: 3,
            background: color,
            opacity: activo ? 0.55 + (i / barras) * 0.45 : 0.22,
            transition: 'height .09s linear, opacity .3s ease',
          }}
        />
      ))}
    </div>
  )
}
