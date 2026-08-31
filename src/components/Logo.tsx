export function NoaMark({ size = 28, color = 'var(--teal-500)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <g fill={color}>
        <rect x="20.5" y="4" width="7" height="40" rx="3.5" />
        <rect x="20.5" y="4" width="7" height="40" rx="3.5" transform="rotate(60 24 24)" />
        <rect x="20.5" y="4" width="7" height="40" rx="3.5" transform="rotate(120 24 24)" />
      </g>
    </svg>
  )
}

export function NoaLogo({ size = 26 }: { size?: number }) {
  return (
    <span className="row gap-8" aria-label="Noa Notes">
      <NoaMark size={size + 4} />
      <span style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1 }}>
        <span style={{ color: 'var(--navy-700)' }}>noa</span>
        <span style={{ color: 'var(--teal-500)', fontWeight: 500 }}> notes</span>
      </span>
    </span>
  )
}
