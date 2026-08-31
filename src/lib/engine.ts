import { pickCase } from './cases'
import type { ClinicalNote, TranscriptLine } from './types'

export const emptyNote = (): ClinicalNote => ({
  motivo: '',
  padecimientoActual: '',
  exploracionFisica: '',
  signosVitales: {},
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
  { id: 'transcribiendo', label: 'Transcribiendo el audio' },
  { id: 'estructurando',  label: 'Identificando hallazgos clínicos' },
  { id: 'redactando',     label: 'Redactando la nota' },
  { id: 'verificando',    label: 'Verificando dosis y coherencia' },
  { id: 'listo',          label: 'Nota lista' },
]

/**
 * Genera la nota clínica a partir de la transcripción.
 *
 * En esta versión de demostración la nota proviene de guiones clínicos locales y
 * el progreso se simula por etapas. El punto de integración real es esta función:
 * sustituir el cuerpo por la llamada al backend (transcripción + LLM) conservando
 * la firma y el callback de progreso.
 */
export function generateNote(
  motivo: string,
  transcript: TranscriptLine[],
  onEtapa?: (e: EtapaGeneracion) => void,
): Promise<ClinicalNote> {
  const caso = pickCase(motivo || transcript.map((l) => l.texto).join(' '))

  return new Promise((resolve) => {
    const secuencia: { etapa: EtapaGeneracion; ms: number }[] = [
      { etapa: 'transcribiendo', ms: 600 },
      { etapa: 'estructurando', ms: 900 },
      { etapa: 'redactando', ms: 1100 },
      { etapa: 'verificando', ms: 700 },
    ]
    let acumulado = 0
    for (const paso of secuencia) {
      acumulado += paso.ms
      setTimeout(() => onEtapa?.(paso.etapa), acumulado)
    }
    setTimeout(() => {
      onEtapa?.('listo')
      resolve({
        ...caso.note,
        motivo: motivo.trim() || caso.note.motivo,
        signosVitales: { ...caso.note.signosVitales },
        diagnosticos: caso.note.diagnosticos.map((d) => ({ ...d })),
        plan: [...caso.note.plan],
        indicaciones: [...caso.note.indicaciones],
        receta: caso.note.receta.map((r) => ({ ...r })),
      })
    }, acumulado + 400)
  })
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
    `EXPLORACIÓN FÍSICA\n${note.exploracionFisica}`,
    note.diagnosticos.length &&
      `DIAGNÓSTICOS\n${note.diagnosticos.map((d) => `• ${d.texto} (CIE-10 ${d.cie10})`).join('\n')}`,
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
