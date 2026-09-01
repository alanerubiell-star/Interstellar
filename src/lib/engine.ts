import { pickCase } from './cases'
import { estadoBackend, pedirNota } from './api'
import type { ClinicalNote, NoteReview, Patient, TranscriptLine } from './types'

export const emptyNote = (): ClinicalNote => ({
  motivo: '',
  padecimientoActual: '',
  exploracionFisica: '',
  signosVitales: { ta: '', fc: '', fr: '', temp: '', sato2: '', peso: '', talla: '' },
  diagnosticos: [],
  plan: [],
  indicaciones: [],
  receta: [],
  pronostico: '',
})

export type EtapaGeneracion =
  | 'transcribiendo'
  | 'estructurando'
  | 'redactando'
  | 'verificando'
  | 'listo'

export const ETAPAS: { id: EtapaGeneracion; label: string }[] = [
  { id: 'transcribiendo', label: 'Preparando la transcripción' },
  { id: 'estructurando',  label: 'Identificando hallazgos clínicos' },
  { id: 'redactando',     label: 'Redactando la nota' },
  { id: 'verificando',    label: 'Verificando dosis y coherencia' },
  { id: 'listo',          label: 'Nota lista' },
]

export interface ResultadoGeneracion {
  note: ClinicalNote
  revision: NoteReview
  /** true cuando no hubo backend y la nota proviene de un guion local. */
  demo: boolean
}

/**
 * ¿Hay un backend de Noa contestando?
 *
 * Se comprueba con /api/health en vez de deducirlo del fallo de la generación:
 * un origen sin Noa detrás responde 404, no un error de red, y esa diferencia
 * decide entre caer a demostración o avisar al médico de un fallo real.
 *
 * El resultado positivo se memoriza; el negativo no, para que levantar el
 * servidor a media sesión funcione sin recargar la app.
 */
let backendConfirmado = false
async function hayBackend(): Promise<boolean> {
  if (backendConfirmado) return true
  const salud = await estadoBackend()
  backendConfirmado = salud?.ok === true
  return backendConfirmado
}

/**
 * Genera la nota clínica a partir de la transcripción.
 *
 * Llama al backend, que la produce con Claude bajo un esquema de salida
 * estructurada. Sin servidor cae a los guiones locales para que la app siga
 * siendo demostrable sin credenciales; con servidor, cualquier error (rechazo,
 * límite, credenciales inválidas) se propaga para que el médico lo vea en vez de
 * recibir en silencio una nota que no corresponde a su consulta.
 */
export async function generateNote(
  motivo: string,
  transcript: TranscriptLine[],
  onEtapa?: (e: EtapaGeneracion) => void,
  paciente?: Patient,
): Promise<ResultadoGeneracion> {
  onEtapa?.('transcribiendo')

  if (!(await hayBackend())) {
    const demo = await notaDemostracion(motivo, transcript)
    onEtapa?.('listo')
    return demo
  }

  // Las etapas intermedias son indicativas: la API entrega la nota completa de
  // una vez, así que marcan avance sin fingir un progreso que no se mide.
  const avance = [
    setTimeout(() => onEtapa?.('estructurando'), 700),
    setTimeout(() => onEtapa?.('redactando'), 2200),
    setTimeout(() => onEtapa?.('verificando'), 6000),
  ]

  try {
    const { note, revision } = await pedirNota(transcript, motivo, paciente)
    onEtapa?.('listo')
    return { note, revision, demo: false }
  } finally {
    avance.forEach(clearTimeout)
  }
}

/** Respaldo sin backend: guiones clínicos locales. */
async function notaDemostracion(
  motivo: string,
  transcript: TranscriptLine[],
): Promise<ResultadoGeneracion> {
  const caso = pickCase(motivo || transcript.map((l) => l.texto).join(' '))
  await new Promise((r) => setTimeout(r, 600))
  return {
    note: {
      ...caso.note,
      motivo: motivo.trim() || caso.note.motivo,
      signosVitales: { ...caso.note.signosVitales },
      diagnosticos: caso.note.diagnosticos.map((d) => ({ ...d })),
      plan: [...caso.note.plan],
      indicaciones: [...caso.note.indicaciones],
      receta: caso.note.receta.map((r) => ({ ...r })),
    },
    revision: {
      confianza: 'media',
      alertas: ['Nota de demostración: no hay servidor de Noa conectado.'],
    },
    demo: true,
  }
}

/** Texto plano de la nota, para copiar al expediente electrónico. */
export function noteToText(note: ClinicalNote, encabezado?: string): string {
  const sv = note.signosVitales
  const svTxt = [
    sv.ta && `TA ${sv.ta} mmHg`,
    sv.fc && `FC ${sv.fc} lpm`,
    sv.fr && `FR ${sv.fr} rpm`,
    sv.temp && `Temp ${sv.temp} °C`,
    sv.sato2 && `SatO₂ ${sv.sato2} %`,
    sv.peso && `Peso ${sv.peso} kg`,
    sv.talla && `Talla ${sv.talla} m`,
  ]
    .filter(Boolean)
    .join(' · ')

  const bloques = [
    encabezado,
    `MOTIVO DE CONSULTA\n${note.motivo}`,
    `PADECIMIENTO ACTUAL\n${note.padecimientoActual}`,
    svTxt && `SIGNOS VITALES\n${svTxt}`,
    note.exploracionFisica && `EXPLORACIÓN FÍSICA\n${note.exploracionFisica}`,
    note.diagnosticos.length &&
      `DIAGNÓSTICOS\n${note.diagnosticos
        .map((d) => `• ${d.texto}${d.cie10 ? ` (CIE-10 ${d.cie10})` : ''}`)
        .join('\n')}`,
    note.plan.length && `PLAN\n${note.plan.map((p) => `• ${p}`).join('\n')}`,
    note.indicaciones.length &&
      `INDICACIONES AL PACIENTE\n${note.indicaciones.map((i) => `• ${i}`).join('\n')}`,
    note.receta.length &&
      `RECETA\n${note.receta
        .map((r) => `• ${r.farmaco} — ${r.dosis}, ${r.via.toLowerCase()}, ${r.frecuencia}, ${r.duracion}`)
        .join('\n')}`,
    note.pronostico && `PRONÓSTICO\n${note.pronostico}`,
  ].filter(Boolean)

  return bloques.join('\n\n')
}
