import { useCallback, useEffect, useRef, useState } from 'react'
import type { TranscriptLine } from './types'

/* La Web Speech API no está en las librerías estándar de TypeScript. */
interface ResultadoHabla {
  readonly isFinal: boolean
  readonly length: number
  item(i: number): { transcript: string; confidence: number }
  [i: number]: { transcript: string; confidence: number }
}
interface EventoHabla extends Event {
  readonly resultIndex: number
  readonly results: { length: number; item(i: number): ResultadoHabla; [i: number]: ResultadoHabla }
}
interface EventoErrorHabla extends Event {
  readonly error: string
}
interface Reconocedor extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: EventoHabla) => void) | null
  onerror: ((e: EventoErrorHabla) => void) | null
  onend: (() => void) | null
}
type ConstructorReconocedor = new () => Reconocedor

const obtenerConstructor = (): ConstructorReconocedor | null => {
  const w = window as unknown as {
    SpeechRecognition?: ConstructorReconocedor
    webkitSpeechRecognition?: ConstructorReconocedor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const hablaDisponible = (): boolean => obtenerConstructor() !== null

export interface EstadoHabla {
  /** Frases ya confirmadas por el reconocedor. */
  lineas: TranscriptLine[]
  /** Frase en curso, aún no confirmada. */
  parcial: string
  soportado: boolean
  error: string | null
}

/**
 * Transcripción en vivo en el dispositivo con la Web Speech API.
 *
 * No separa hablantes: cada frase se marca como 'desconocido' y el backend deduce
 * quién habla por el contenido. Para diarización real hace falta un STT de
 * servidor (ver `server/transcribe.ts`).
 */
export function useSpeech(activo: boolean, segundos: number): EstadoHabla {
  const [lineas, setLineas] = useState<TranscriptLine[]>([])
  const [parcial, setParcial] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [soportado] = useState(hablaDisponible)

  const recRef = useRef<Reconocedor | null>(null)
  const activoRef = useRef(activo)
  const segundosRef = useRef(segundos)
  activoRef.current = activo
  segundosRef.current = segundos

  const detener = useCallback(() => {
    const rec = recRef.current
    recRef.current = null
    if (!rec) return
    rec.onresult = null
    rec.onerror = null
    rec.onend = null
    try {
      rec.abort()
    } catch {
      /* ya estaba detenido */
    }
  }, [])

  useEffect(() => {
    if (!activo || !soportado) {
      detener()
      setParcial('')
      return
    }

    const Ctor = obtenerConstructor()
    if (!Ctor) return

    const rec = new Ctor()
    rec.lang = 'es-MX'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onresult = (e) => {
      let enCurso = ''
      const nuevas: TranscriptLine[] = []

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]!
        const texto = r[0]!.transcript.trim()
        if (!texto) continue
        if (r.isFinal) {
          nuevas.push({ t: segundosRef.current, hablante: 'desconocido', texto })
        } else {
          enCurso += (enCurso ? ' ' : '') + texto
        }
      }

      if (nuevas.length) setLineas((prev) => [...prev, ...nuevas])
      setParcial(enCurso)
    }

    rec.onerror = (e) => {
      // 'no-speech' y 'aborted' son ruido normal de una consulta con silencios.
      if (e.error === 'no-speech' || e.error === 'aborted') return
      setError(
        e.error === 'not-allowed'
          ? 'Sin permiso de micrófono para transcribir.'
          : `Error de transcripción: ${e.error}`,
      )
    }

    // El reconocedor se detiene solo tras un silencio largo: se reinicia mientras grabe.
    rec.onend = () => {
      if (activoRef.current && recRef.current === rec) {
        try {
          rec.start()
        } catch {
          /* reinicio en carrera con el cierre */
        }
      }
    }

    recRef.current = rec
    try {
      rec.start()
    } catch {
      setError('No se pudo iniciar la transcripción.')
    }

    return detener
  }, [activo, soportado, detener])

  useEffect(() => detener, [detener])

  return { lineas, parcial, soportado, error }
}
