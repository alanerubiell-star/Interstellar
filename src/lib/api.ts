import type { NoteResponse } from './noteSchema'
import type { Patient, TranscriptLine } from './types'
import { edad } from './format'

/**
 * En desarrollo Vite hace proxy de /api al servidor; en la app empaquetada
 * (Electron, Capacitor, PWA) el origen es file:// o el dominio de la app, así que
 * la URL del backend se inyecta en build con VITE_NOA_API.
 */
const BASE = (import.meta.env.VITE_NOA_API ?? '').replace(/\/$/, '')
const url = (ruta: string) => `${BASE}${ruta}`

export class ErrorApi extends Error {
  constructor(
    readonly codigo: string,
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje)
  }
}

export interface EstadoBackend {
  ok: boolean
  modelo: string
  credenciales: boolean
}

/** Sondeo corto: si no hay backend, la app sigue en modo demostración. */
export async function estadoBackend(timeoutMs = 2500): Promise<EstadoBackend | null> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const r = await fetch(url('/api/health'), { signal: ctl.signal })
    if (!r.ok) return null
    return (await r.json()) as EstadoBackend
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

export async function pedirNota(
  transcript: TranscriptLine[],
  motivo: string,
  paciente?: Patient,
): Promise<NoteResponse> {
  let r: Response
  try {
    r = await fetch(url('/api/note'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motivo,
        transcript,
        paciente: paciente
          ? {
              edad: edad(paciente.fechaNacimiento),
              sexo: paciente.sexo,
              alergias: paciente.alergias,
              antecedentes: paciente.antecedentes,
            }
          : undefined,
      }),
    })
  } catch {
    throw new ErrorApi('sin_conexion', 0, 'No se pudo contactar al servidor de Noa.')
  }

  if (!r.ok) {
    const cuerpo = (await r.json().catch(() => null)) as
      | { error?: string; mensaje?: string }
      | null
    throw new ErrorApi(
      cuerpo?.error ?? 'desconocido',
      r.status,
      cuerpo?.mensaje ?? 'No se pudo generar la nota.',
    )
  }

  return (await r.json()) as NoteResponse
}
