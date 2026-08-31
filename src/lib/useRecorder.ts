import { useCallback, useEffect, useRef, useState } from 'react'

export type EstadoMic = 'inactivo' | 'solicitando' | 'grabando' | 'pausado' | 'sin-permiso'

interface Recorder {
  estado: EstadoMic
  segundos: number
  nivel: number          // 0..1, amplitud instantánea para la onda
  usandoMicReal: boolean
  iniciar: () => Promise<void>
  pausar: () => void
  reanudar: () => void
  detener: () => void
}

/**
 * Captura de micrófono con medición de nivel en tiempo real (Web Audio).
 * Si el navegador niega el permiso o no hay dispositivo, la sesión continúa con
 * un nivel simulado para que la consulta pueda documentarse igual.
 */
export function useRecorder(): Recorder {
  const [estado, setEstado] = useState<EstadoMic>('inactivo')
  const [segundos, setSegundos] = useState(0)
  const [nivel, setNivel] = useState(0)
  const [usandoMicReal, setUsandoMicReal] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const tickRef = useRef<number | null>(null)
  const bufRef = useRef<Uint8Array<ArrayBuffer> | null>(null)

  const limpiar = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    if (tickRef.current !== null) clearInterval(tickRef.current)
    rafRef.current = null
    tickRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    void ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
    analyserRef.current = null
  }, [])

  useEffect(() => limpiar, [limpiar])

  const medir = useCallback(() => {
    const analyser = analyserRef.current
    const buf = bufRef.current
    if (analyser && buf) {
      analyser.getByteTimeDomainData(buf)
      let suma = 0
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i]! - 128) / 128
        suma += v * v
      }
      const rms = Math.sqrt(suma / buf.length)
      setNivel((prev) => prev * 0.6 + Math.min(1, rms * 3.4) * 0.4)
    } else {
      // nivel simulado: dos senoidales desfasadas dan una cadencia de habla creíble
      const t = performance.now() / 1000
      const s = (Math.sin(t * 5.1) + Math.sin(t * 2.3) + Math.sin(t * 11.7) * 0.5) / 2.5
      setNivel(Math.max(0.06, Math.abs(s) * 0.8))
    }
    rafRef.current = requestAnimationFrame(medir)
  }, [])

  const arrancarRelojes = useCallback(() => {
    if (tickRef.current === null) {
      tickRef.current = window.setInterval(() => setSegundos((s) => s + 1), 1000)
    }
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(medir)
  }, [medir])

  const iniciar = useCallback(async () => {
    setEstado('solicitando')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      streamRef.current = stream
      const Ctx: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      src.connect(analyser)
      ctxRef.current = ctx
      analyserRef.current = analyser
      bufRef.current = new Uint8Array(new ArrayBuffer(analyser.fftSize))
      setUsandoMicReal(true)
    } catch {
      setUsandoMicReal(false)
    }
    setEstado('grabando')
    arrancarRelojes()
  }, [arrancarRelojes])

  const pausar = useCallback(() => {
    setEstado('pausado')
    if (tickRef.current !== null) clearInterval(tickRef.current)
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    tickRef.current = null
    rafRef.current = null
    setNivel(0)
  }, [])

  const reanudar = useCallback(() => {
    setEstado('grabando')
    arrancarRelojes()
  }, [arrancarRelojes])

  const detener = useCallback(() => {
    setEstado('inactivo')
    limpiar()
    setNivel(0)
  }, [limpiar])

  return { estado, segundos, nivel, usandoMicReal, iniciar, pausar, reanudar, detener }
}
