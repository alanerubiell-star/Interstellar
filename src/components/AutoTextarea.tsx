import { useLayoutEffect, useRef } from 'react'

/** Textarea que crece con su contenido: la nota nunca queda con hueco ni recortada. */
export function AutoTextarea({
  valor,
  onChange,
  minAlto = 44,
  placeholder,
  className = 'textarea',
}: {
  valor: string
  onChange: (v: string) => void
  minAlto?: number
  placeholder?: string
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const ajustar = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(minAlto, el.scrollHeight)}px`
  }

  useLayoutEffect(ajustar, [valor, minAlto])

  return (
    <textarea
      ref={ref}
      className={className}
      value={valor}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onInput={ajustar}
      style={{ minHeight: minAlto, overflow: 'hidden', resize: 'none' }}
    />
  )
}
