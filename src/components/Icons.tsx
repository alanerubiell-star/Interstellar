import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

const base = ({ size = 20, ...rest }: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...rest,
})

export const IconMic = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3.5M8.5 21.5h7" />
  </svg>
)

export const IconWave = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 12h1.5M7 7.5v9M11 4v16M15 8.5v7M19 11h2" />
  </svg>
)

export const IconDoc = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 2.5H7.5A1.5 1.5 0 0 0 6 4v16a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 20V6.5z" />
    <path d="M14 2.5V6a.5.5 0 0 0 .5.5H18M9 12h6M9 16h4" />
  </svg>
)

export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
  </svg>
)

export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9.5" cy="8" r="3.2" />
    <path d="M3 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16.5 5.2a3.2 3.2 0 0 1 0 5.9M18 20a6.6 6.6 0 0 0-2-4.7" />
  </svg>
)

export const IconChart = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
)

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 2" />
  </svg>
)

export const IconClipboard = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 4.5H7.5A1.5 1.5 0 0 0 6 6v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 20V6a1.5 1.5 0 0 0-1.5-1.5H15" />
    <rect x="9" y="2.5" width="6" height="4" rx="1.2" />
    <path d="M9.5 11.5h5M9.5 15.5h3" />
  </svg>
)

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2.5 20 6v5.5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6z" />
    <path d="M9.5 12.2l1.9 1.9 3.6-3.9" />
  </svg>
)

export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="4.5" y="10" width="15" height="11" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.5" />
  </svg>
)

export const IconPuzzle = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 3.5a2 2 0 0 1 4 0V5h3.5A1.5 1.5 0 0 1 19 6.5V10h1.5a2 2 0 0 1 0 4H19v3.5a1.5 1.5 0 0 1-1.5 1.5H14v-1.5a2 2 0 1 0-4 0V19H6.5A1.5 1.5 0 0 1 5 17.5V14H3.5a2 2 0 0 1 0-4H5V6.5A1.5 1.5 0 0 1 6.5 5H10z" />
  </svg>
)

export const IconDevices = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 17H3.5A1.5 1.5 0 0 1 2 15.5V6a1.5 1.5 0 0 1 1.5-1.5H18A1.5 1.5 0 0 1 19.5 6v1.5" />
    <path d="M2 20h10" />
    <rect x="15" y="10" width="7" height="10" rx="1.6" />
  </svg>
)

export const IconGrowth = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 20h18" />
    <path d="M6 20v-5M11 20V9M16 20v-8" />
    <path d="M14.5 4.5H20V10" />
    <path d="M20 4.5 12.5 12l-3-3L5 13.5" />
  </svg>
)

export const IconHeart = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20.2S3.8 15.4 3.8 9.6A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 8.2 2.7c0 5.8-8.2 10.6-8.2 10.6z" />
  </svg>
)

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
  </svg>
)

export const IconCheckCircle = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.2 12.3 11 15l5-5.6" />
  </svg>
)

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
)

export const IconChevronLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
)

export const IconChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 5l7 7-7 7" />
  </svg>
)

export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5.5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v1" />
  </svg>
)

export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4 17.5v1.5A1.5 1.5 0 0 0 5.5 20.5h13a1.5 1.5 0 0 0 1.5-1.5v-1.5" />
  </svg>
)

export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M6.5 6.5 7.4 20a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3l.9-13.5" />
  </svg>
)

export const IconSettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 14.5a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-2.6 1.1v.3a1.8 1.8 0 1 1-3.6 0v-.2a1.5 1.5 0 0 0-2.7-1.1l-.1.1a1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0-1.1-2.6h-.3a1.8 1.8 0 0 1 0-3.6h.2A1.5 1.5 0 0 0 5.5 7.7l-.1-.1A1.8 1.8 0 1 1 8 5l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .9-1.4v-.3a1.8 1.8 0 0 1 3.6 0v.2a1.5 1.5 0 0 0 2.6 1.1l.1-.1A1.8 1.8 0 1 1 19.7 7.5l-.1.1a1.5 1.5 0 0 0-.3 1.7v.1a1.5 1.5 0 0 0 1.4.9h.3a1.8 1.8 0 0 1 0 3.6h-.2a1.5 1.5 0 0 0-1.4.9z" />
  </svg>
)

export const IconStop = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />
  </svg>
)

export const IconPause = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <rect x="7" y="5.5" width="3.6" height="13" rx="1.6" />
    <rect x="13.4" y="5.5" width="3.6" height="13" rx="1.6" />
  </svg>
)

export const IconPlay = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M8 5.6a1 1 0 0 1 1.5-.87l9 6.4a1 1 0 0 1 0 1.74l-9 6.4A1 1 0 0 1 8 18.4z" />
  </svg>
)

export const IconSpark = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v4M12 17v4M4.5 12h4M15.5 12h4M6.7 6.7l2.8 2.8M14.5 14.5l2.8 2.8M17.3 6.7l-2.8 2.8M9.5 14.5l-2.8 2.8" />
  </svg>
)

export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.8 21.2 19.5H2.8z" />
    <path d="M12 9.5v4M12 16.6h.01" />
  </svg>
)

export const IconPill = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.6" y="8.6" width="18.8" height="6.8" rx="3.4" transform="rotate(-45 12 12)" />
    <path d="M8.4 8.4 15.6 15.6" />
  </svg>
)

export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4.5h4A1.5 1.5 0 0 1 19.5 6v12a1.5 1.5 0 0 1-1.5 1.5h-4" />
    <path d="M10 8l-4 4 4 4M6 12h9" />
  </svg>
)
